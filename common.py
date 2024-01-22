from dataclasses import dataclass, asdict
from pathlib import Path
import contextlib
import json
import logging
import shutil
import tempfile

from modal import Stub, Dict, NetworkFileSystem

# directory to store media on the volume
MEDIA_PATH = Path("/media")

# fixed language for now
LANGUAGE = "en"

# fixed english whisper model for now
MODEL_NAME = "large-v2"

# main storage volume
volume = NetworkFileSystem.persisted("media")

# nfs
nfs = {
    str(MEDIA_PATH): volume
}

# stub
stub = Stub(name="timething-web")
stub.transcriptions = Dict.new()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# Common data structures
#
#

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


# Modal abstractions
#
#

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


# Utils
#
#


def dataclass_to_event(x):
    data = json.dumps(asdict(x), ensure_ascii=False)
    return f"event: {type(x).__name__}\ndata: {data}\n\n"


def get_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


@contextlib.contextmanager
def tmpdir_scope():
    tmpdir = tempfile.mkdtemp()
    try:
        yield tmpdir
    finally:
        shutil.rmtree(tmpdir)
