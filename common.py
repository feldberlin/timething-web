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


# Shared data structures
#
#

@dataclass
class UploadInfo:
    """
    Original file metadata for a file uploaded by the user.
    """

    filename: str
    content_type: str
    size_bytes: int


@dataclass
class Track:
    """
    A processed upload. Tracks go through the following states:

    - uploaded (an upload was completed by the user)
    - transcoded (ffmpeg ran and a wav was written out)
    - transcribed (whisper ran and a json result was written out)
    """

    title: str = None
    artist: str = None
    album: str = None
    comment: str = None
    date: str = None
    duration: float = None

    def from_probe(probe):
        tags = probe.get("format", {}).get("tags", {})
        allowed_tags = Track().__dict__.keys()
        tags = {k: v for (k, v) in tags.items() if k in allowed_tags}
        tags["duration"] = float(probe['format']['duration'])
        return Track(**tags)


@dataclass
class Transcription:
    """
    A complete transcription and metadata of a processed Upload.
    """

    transcription_id: str
    upload: UploadInfo
    track: Track = None
    transcoded: bool = False
    transcript: str = None
    path: str = None

    @property
    def transcribed(self):
        return self.transcript is not None

    @property
    def uploaded_file(self):
        return Path(self.path)

    @property
    def transcoded_file(self):
        return self.uploaded_file.with_suffix('.wav')

    @property
    def transcribed_file(self):
        return self.uploaded_file.with_suffix('.json')



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

        with open(t.transcribed_file, 'w') as f:
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
