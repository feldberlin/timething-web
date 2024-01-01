import logging
from pathlib import Path
from dataclasses import asdict
import json

from modal import Stub, Dict

# directory to store media on the volume
MEDIA_PATH = Path("/media")

# fixed language for now
LANGUAGE = "en"

# fixed english whisper model for now
MODEL_NAME = "large-v2"

# stub
stub = Stub(name="timething-web")
stub.transcriptions = Dict.new()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def dataclass_to_event(x):
    data = json.dumps(asdict(x), ensure_ascii=False)
    return f"event: {type(x).__name__}\ndata: {data}\n\n"
