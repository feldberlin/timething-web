from dataclasses import dataclass, asdict
import inspect
from pathlib import Path
import contextlib
import json
import logging
import shutil
import tempfile

from modal import Stub, Dict, NetworkFileSystem

import llm

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

    filename: str = None
    content_type: str = None
    size_bytes: int = None

    def from_dict(d):
        return UploadInfo(**{
            k: v for k, v in d.items()
            if k in inspect.signature(UploadInfo).parameters
        })



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
    description: str = None
    date: str = None
    duration: float = None

    def from_dict(d):
        return Track(**{
            k: v for k, v in d.items()
            if k in inspect.signature(Track).parameters
        })

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
    language: str = None

    @property
    def transcribed(self):
        return self.transcript is not None

    @property
    def uploaded_file(self):
        return Path(self.path) if self.path else None

    @property
    def transcoded_file(self):
        return self.uploaded_file.with_suffix('.wav')

    @property
    def transcribed_file(self):
        return self.uploaded_file.with_suffix('.json')

    @property
    def content_type(self):
        # RK(XXX )supports old uploads. remove as soon as possible.
        if hasattr(self, 'upload'):
            if self.upload:
                return self.upload.content_type

    def from_dict(d):
        track = Track()
        if 'track' in d:
            track = Track.from_dict(d['track'])

        ui = UploadInfo()
        if 'upload' in d:
            ui = UploadInfo.from_dict(d['upload'])

        return Transcription(
            transcription_id=d['transcription_id'],
            upload=ui,
            track=track,
            transcoded=d.get('transcoded', False),
            transcript=d.get('transcript', {}),
            path=d.get('path'),
            language=d.get('language')
        )


# Modal abstractions
#
#

class Store:
    """Keep a data layer here so we can move it out of modal later.
    """

    def __init__(self, media_path: Path):
        self.media_path = media_path

    def create(self, t: Transcription):
        if not t.transcription_id:
            raise Exception(f'id not specified')

        content = json.dumps(asdict(t))
        with open(t.transcribed_file, 'w') as f:
            f.write(content)

    def update_track(self, transcription_id: str, track: Track):
        t_dict = self.select(transcription_id)
        t = Transcription.from_dict(t_dict)
        t.track = track
        self.create(t)

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


# whisper gpt
def whisper_gpt():
    return llm.ChatGPT(
        llm.WHISPER_SYSTEM_PROMPT,
        llm.WHISPER_MAX_TOKENS
    )


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
