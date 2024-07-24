"""
Main web application service. Serves the static frontend as well as
API routes for transcription and alignment.
"""

from dataclasses import dataclass, replace, asdict
from pathlib import Path
import logging
import json
import re
import uuid

from modal import Mount, NetworkFileSystem, asgi_app, Image, Secret
from pydantic import BaseModel

from common import app, Transcription
import common
import formats
from pipeline import pipeline, PipelineProgress
import transcode
import transcribe

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# size of a chunk of media returned
MEDIA_CHUNK_SIZE = 1024 * 1024

# paths
static_path = Path("./frontend/dist").resolve()
remote_path = Path('/assets')

# mount
mount = Mount.from_local_dir(static_path, remote_path=remote_path)

# image
app_image = (
    Image
        .debian_slim(python_version="3.10.8")
        .pip_install("openai")
)


class MediaForm(BaseModel):
    """
    Pydantic class for FastAPI validations
    """

    filename: str
    content_type: str
    size_bytes: int


@app.function(
    mounts=[mount],
    image=app_image,
    network_file_systems=common.nfs,
    container_idle_timeout=300,
    timeout=1800,
    secrets=[
        Secret.from_name("openai-secret"),
    ],
)
@asgi_app()
def web():

    from fastapi import FastAPI, HTTPException, Request, Header, UploadFile, File
    from fastapi.responses import Response, FileResponse, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    web_app = FastAPI()

    def error(status_code: int, msg: str):
        logger.error(msg)
        raise HTTPException(status_code=status_code, detail=msg)

    @web_app.post("/upload")
    async def upload(media: MediaForm):
        transcription_id = str(uuid.uuid4())
        common.db.create(
            Transcription(
                transcription_id=transcription_id,
                path=str(common.MEDIA_PATH / transcription_id),
                upload=common.UploadInfo(
                    filename=media.filename,
                    content_type=media.content_type,
                    size_bytes=media.size_bytes
                )
            )
        )

        return transcription_id

    @web_app.put("/upload/{transcription_id}")
    async def upload_chunk(
        request: Request,
        transcription_id: str,
        content_range: str = Header(None),
        content_type: str = Header(None),
        content_length: int = Header(None)
    ):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')
        path = t.uploaded_file

        # get the current file size
        file_size = 0
        if path.exists():
            file_size = path.stat().st_size

        # is the client asking to resume?
        match = re.match(r'bytes=\*/(\d+)', content_range)
        if match and content_length == 0:
            want,  = map(int, match.groups())
            if want != t.upload.size_bytes:
                error(406, f"invalid resume total: {content_range}")

            return Response(
                status_code=308,
                headers={"Range": f"bytes=0-{file_size - 1}"}
            )

        match = re.match(r'bytes=(\d+)-(\d+)/(\d+)', content_range)
        if not match:
            error(406, f"invalid range header format: {content_range}")

        start, end, total = map(int, match.groups())
        if end - start != content_length - 1:
            error(406, f"inconsistent content length in range: {content_range}")

        if t.upload.size_bytes != total:
            error(406, f"inconsistent size bytes in range: {content_range}")

        if t.upload.content_type != content_type:
            error(400, f"invalid content_type: {content_type}")

        chunk = await request.body()
        if len(chunk) != content_length:
            error(400, f"want chunk size {content_length} but got {len(chunk)}")

        if file_size != start:
            error(400, f"content-range is not contiguous: {content_range}")

        with open(path, "r+b" if start else "wb") as f:
            f.seek(start)
            f.write(chunk)

        if end + 1 == total:
            return Response(status_code=200)
        else:
            return Response(
                status_code=308,
                headers={"Content-Range": f"bytes={start}-{end}"}
            )

    @web_app.get("/transcribe/{transcription_id}")
    async def transcribe(transcription_id: str, language: str = None):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')

        prompt = None
        if t.track and t.track.description:
            gpt = common.whisper_gpt()
            logger.info("calling llm for whisper prompt")
            prompt = gpt.complete(t.track.description)
            logger.info(f"prompt generated: {prompt}")

        def generate():
            try:
                for update in pipeline(transcription_id, language):
                    yield common.dataclass_to_event(update)
            except Exception as e:
                logger.error(e)
                yield PipelineProgress(state="error")

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )

    @web_app.get("/transcription/{transcription_id}")
    async def transcription(transcription_id: str):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')

        content = json.dumps(asdict(t), cls=common.JSONEncoder)
        return Response(
            media_type="application/json",
            content=content.encode('utf-8')
        )


    @web_app.put("/transcription/{transcription_id}/track")
    async def put_track(request: Request, transcription_id: str):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')

        track_dict = await request.json()
        if isinstance(track_dict, str):
            track_dict = json.loads(track_dict)

        t.track = replace(t.track or common.Track(), **track_dict)
        common.db.create(t)

        return 200

    @web_app.get("/export/{transcription_id}")
    async def export(transcription_id: str, format: str):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')

        try:
            content = formats.format(t.transcript, format)
            return Response(
                content=content,
                media_type="text/plain"
            )
        except Exception as e:
            error(404, f'id is still processing: {e}')

    @web_app.get("/media/{transcription_id}")
    def media(
        transcription_id: str,
        range: str = Header(None)
    ):
        t = common.db.select(transcription_id)
        if not t:
            error(404, f'invalid id {transcription_id}')

        path = t.uploaded_file
        content_type = t.content_type or "video/mp4"
        total = path.stat().st_size

        try:
            start, end = range.replace("bytes=", "").split("-")
            start = int(start or 0)
            end = int(end or total - 1)
            assert start >= 0
            assert end < total
        except Exception as e:
            error(416, 'invalid content-range')

        def read():
            with open(path, "rb") as f:
                f.seek(start)
                while (pos := f.tell()) <= end:
                    size = min(MEDIA_CHUNK_SIZE, end - pos + 1)
                    yield f.read(size)

        content_range = f'bytes {start}-{end}/{total}'
        logger.info(f"reading range {content_range}")
        return StreamingResponse(
            read(),
            status_code=206,
            media_type=content_type,
            headers={
                'Accept-Ranges': 'bytes',
                'Content-Length': str(total),
                'Content-Range': content_range
            }
        )

    web_app.mount("/assets", StaticFiles(directory=remote_path / 'assets', html=True))

    @web_app.get("/")
    @web_app.get("/{fallback:path}")
    async def fallback(request: Request):
        return FileResponse(f'{remote_path}/index.html')

    return web_app
