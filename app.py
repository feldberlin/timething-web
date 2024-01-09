"""
Main web application service. Serves the static frontend as well as
API routes for transcription and alignment.
"""

from dataclasses import dataclass
from pathlib import Path
import logging
import json
import re
import uuid

from modal import Mount, NetworkFileSystem, asgi_app
from pydantic import BaseModel

import common
from common import stub
from recogniser import Recogniser

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# size of a chunk of media returned
MEDIA_CHUNK_SIZE = 1024 * 1024

# main storage volume
volume = NetworkFileSystem.persisted("media")

# nfs
nfs = {
    str(common.MEDIA_PATH): volume
}

# paths
static_path = Path("./frontend/dist").resolve()
remote_path = Path('/assets')

# mount
mount = Mount.from_local_dir(static_path, remote_path=remote_path)


class MediaForm(BaseModel):
    filename: str
    content_type: str
    size_bytes: int


@dataclass
class Transcription:
    filename: str
    content_type: str
    size_bytes: int


@stub.function(
    mounts=[mount],
    network_file_systems=nfs,
    container_idle_timeout=300,
    timeout=600,
)
@asgi_app()
def web():

    from fastapi import FastAPI, HTTPException, Request, Header, UploadFile, File
    from fastapi.responses import Response, FileResponse, JSONResponse, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    web_app = FastAPI()
    recogniser = Recogniser()

    def error(status_code: int, msg: str):
        logger.error(msg)
        raise HTTPException(status_code=status_code, detail=msg)

    @web_app.post("/upload")
    async def upload(media: MediaForm):
        transcription_id = str(uuid.uuid4())
        stub.transcriptions[transcription_id] = Transcription(
            filename=media.filename,
            content_type=media.content_type,
            size_bytes=media.size_bytes
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
        if transcription_id not in stub.transcriptions:
            error(404, f'invalid id {transcription_id}')

        # path is safe after validation. we created the id
        t = stub.transcriptions.get(transcription_id)
        path = common.MEDIA_PATH / transcription_id

        # get the current file size
        file_size = 0
        if path.exists():
            file_size = path.stat().st_size

        # is the client asking to resume?
        match = re.match(r'bytes=\*/(\d+)', content_range)
        if match and content_length == 0:
            want,  = map(int, match.groups())
            if want != t.size_bytes:
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

        if t.size_bytes != total:
            error(406, f"inconsistent size bytes in range: {content_range}")

        if t.content_type != content_type:
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
    async def transcribe(transcription_id: str):
        if transcription_id not in stub.transcriptions:
            error(404, f'invalid id {transcription_id}')

        def generate():
            for update in recogniser.recognise.remote_gen(transcription_id):
               yield common.dataclass_to_event(update)

        return StreamingResponse(
            generate(), media_type="text/event-stream"
        )

    @web_app.get("/transcription/{transcription_id}")
    async def transcription(transcription_id: str):
        if transcription_id not in stub.transcriptions:
            error(404, f'invalid id {transcription_id}')

        # safe after validation. we created the id
        try:
            content = common.db.select(transcription_id)
            logger.info(f"got {content}")
        except Exception as e:
            error(404, f'id is still processing: {e}')
        return JSONResponse(content=content)

    @web_app.get("/media/{transcription_id}")
    def media(
        transcription_id: str,
        range: str = Header(None)
    ):
        if transcription_id not in stub.transcriptions:
            error(404, f'invalid id {transcription_id}')

        path = common.MEDIA_PATH / transcription_id
        content_type = stub.transcriptions[transcription_id].content_type
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

