"""
Main web application service. Serves the static frontend as well as
API routes for transcription and alignment.
"""

import logging
from dataclasses import dataclass
from pathlib import Path
import uuid

from modal import Mount, NetworkFileSystem, asgi_app

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

@dataclass
class Transcription:
    filename: str
    content_type: str


@stub.function(
    mounts=[mount],
    network_file_systems=nfs,
    container_idle_timeout=300,
    timeout=600,
)
@asgi_app()
def web():

    from fastapi import FastAPI, HTTPException, Request, Header, UploadFile, File
    from fastapi.responses import Response, FileResponse, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    web_app = FastAPI()
    recogniser = Recogniser()

    @web_app.post("/upload")
    async def upload(file: UploadFile):
        transcription_id = str(uuid.uuid4())
        stub.transcriptions[transcription_id] = Transcription(
            filename=file.filename,
            content_type=file.content_type

        )

        data: bytes = await file.read()
        with open(common.MEDIA_PATH / transcription_id, "wb") as f:
            f.write(data)

        return transcription_id

    @web_app.get("/transcribe/{transcription_id}")
    async def transcribe(transcription_id: str):
        if transcription_id not in stub.transcriptions:
            return HTTPException(status_code=404)

        def generate():
            for update in recogniser.recognise.remote_gen(transcription_id):
               yield common.dataclass_to_event(update)

        return StreamingResponse(
            generate(), media_type="text/event-stream"
        )

    @web_app.get("/media/{transcription_id}")
    def media(
        transcription_id: str,
        range: str = Header(None)
    ):
        if transcription_id not in stub.transcriptions:
            return HTTPException(status_code=404)

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
            logger.error(e)
            raise HTTPException(status_code=416)

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
