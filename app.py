"""
Main web application service. Serves the static frontend as well as
API routes for transcription and alignment.
"""

import json
import logging
from pathlib import Path

from modal import Mount, asgi_app

import transcriber
from common import stub
from transcriber import Recognise

static_path = Path("./frontend/dist").resolve()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@stub.function(
    mounts=[Mount.from_local_dir(static_path, remote_path="/assets")],
    container_idle_timeout=300,
    timeout=600,
)
@asgi_app()
def web():
    from fastapi import FastAPI, Request
    from fastapi.responses import Response, StreamingResponse
    from fastapi.staticfiles import StaticFiles

    web_app = FastAPI()
    transcriber = Recognise()

    @web_app.post("/transcribe")
    async def transcribe(request: Request):
        bytes = await request.body()
        result, np_audio = transcriber.transcribe.remote(bytes)
        transcript = result["text"].strip()
        # alignment = transcriber.align(np_audio, transcript)
        return transcript  #, alignment

    web_app.mount("/", StaticFiles(directory="/assets", html=True))
    return web_app
