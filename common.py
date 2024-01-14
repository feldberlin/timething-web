from dataclasses import dataclass, asdict
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


@dataclass
class Track:
    title: str = None
    artist: str = None
    album: str = None
    comment: str = None
    date: str = None
    duration: float = None
    path: str = None

    def from_probe(probe):
        tags = probe.get("format", {}).get("tags", {})
        allowed_tags = Track().__dict__.keys()
        tags = {k: v for (k, v) in tags.items() if k in allowed_tags}
        tags["duration"] = float(probe['format']['duration'])
        return Track(**tags)


@dataclass
class Transcription:
    transcription_id: str
    transcript: str
    track: Track


class Store:
    """Keep a data layer here so we can move it out of modal later
    """

    def __init__(self, media_path: Path):
        self.media_path = media_path

    def create(self, t: Transcription):
        if not t.transcription_id:
            raise Exception(f'id not specified')

        path = self.media_path / t.transcription_id
        meta = path.with_suffix('.json')
        with open(meta, 'w') as f:
            content = json.dumps(asdict(t))
            f.write(content)

    def select(self, transcription_id: str):
        if not transcription_id:
            raise Exception(f'id not specified')

        path = self.media_path / transcription_id
        meta = path.with_suffix('.json')
        if not meta.exists():
            raise Exception(f'id not found')

        with open(meta, 'r') as f:
            return json.load(f)


# store on nfs
db = Store(MEDIA_PATH)
