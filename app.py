"""
Main web application service. Serves the static frontend as well as
API routes for transcription and alignment.
"""

import logging
from pathlib import Path
import uuid

from modal import Mount, NetworkFileSystem, asgi_app

import common
from common import stub
from recogniser import Recogniser

static_path = Path("./frontend/dist").resolve()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# main storage volume
volume = NetworkFileSystem.persisted("media")

# nfs
nfs = {
    str(common.MEDIA_PATH): volume
}

@stub.function(
    mounts=[Mount.from_local_dir(static_path, remote_path="/assets")],
    network_file_systems=nfs,
    container_idle_timeout=300,
    timeout=600,
)
@asgi_app()
def web():
    from fastapi import FastAPI, Request
    from fastapi.responses import Response, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    web_app = FastAPI()
    recogniser = Recogniser()

    @web_app.post("/upload")
    async def upload(request: Request):
        data: bytes = await request.body()
        transcription_id = str(uuid.uuid4())
        with open(common.MEDIA_PATH / transcription_id, "wb") as f:
            f.write(data)
        return transcription_id

    @web_app.get("/transcribe/{transcription_id}")
    async def transcribe(transcription_id):
        def generate():
            for update in recogniser.recognise.remote_gen(transcription_id):
               yield common.dataclass_to_event(update)

        return StreamingResponse(
            generate(), media_type="text/event-stream"
        )

    web_app.mount("/", StaticFiles(directory="/assets", html=True))
    return web_app
