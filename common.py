from dataclasses import dataclass, asdict, field
import inspect
from pathlib import Path
import contextlib
import json
import logging
import shutil
import tempfile
import typing

from modal import App, Dict, NetworkFileSystem

import llm

# directory to store media on the volume
MEDIA_PATH = Path("/media")

# fixed language for now
LANGUAGE = "en"

# fixed english whisper model for now
MODEL_NAME = "large-v2"

# main storage volume
volume = NetworkFileSystem.from_name("media")

# nfs
nfs = {
    str(MEDIA_PATH): volume
}

# app
app = App(name="timething-web")
transcriptions = Dict.from_name("transcriptions", create_if_missing=True)

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
        return UploadInfo(
            **{
                k: v
                for k, v in d.items()
                if k in inspect.signature(UploadInfo).parameters
            }
        )


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
class Turn:
    """
    Diarization information
    """
    # name of the speaker
    speaker: str
    # time in seconds
    start: float
    # time in seconds
    end: float


@dataclass
class Diarization:
    """
    Diarization of this transcript
    """

    # speaker turns
    turns: typing.List[Turn]

    def from_dict(d):
        return Diarization(**{
            k: v for k, v in d.items()
            if k in inspect.signature(Diarization).parameters
        })


@dataclass
class Segment:
    """
    A single alignment segment
    """
    # token
    label: str
    # time in seconds
    start: float
    # time in seconds
    end: float
    # likelihood of this alignment
    score: float


@dataclass
class Alignment:
    """
    A single word level alignment
    """

    # original word segments
    words: typing.List[Segment] = field(default_factory=list)

    def from_dict(d):
        return Alignment(**{
            k: v for k, v in d.items()
            if k in inspect.signature(Alignment).parameters
        })


@dataclass
class Transcription:
    """
    A complete transcription and metadata of a processed Upload.
    """

    # canonical id
    transcription_id: str

    # initial upload information
    upload: UploadInfo

    # track metadta
    track: Track = None

    # transcript
    transcript: str = None

    # diarization
    diarization: typing.Optional[Diarization] = None

    # alignment
    alignment: typing.Optional[Alignment] = None

    # is it already transcoded
    transcoded: bool = False

    # path to the original upload
    path: str = None

    # source language
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
        if self.upload:
            return self.upload.content_type

    def from_dict(d: dict):
        track = Track()
        if 'track' in d and d['track']:
            track = Track.from_dict(d['track'])

        upload_info = UploadInfo()
        if 'upload' in d and d['upload']:
            upload_info = UploadInfo.from_dict(d['upload'])

        alignment = Alignment()
        if 'alignment' in d and d['alignment']:
            alignment = Alignment.from_dict(d['alignment'])

        diarization = Diarization(turns=[])
        if 'diarization' in d and d['diarization']:
            diarization = Diarization.from_dict(d['diarization'])

        return Transcription(
            transcription_id=d['transcription_id'],
            track=track,
            upload=upload_info,
            alignment=alignment,
            diarization=diarization,
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

        transcriptions[t.transcription_id] = t
        content = json.dumps(asdict(t), cls=JSONEncoder)
        with open(t.transcribed_file, 'w') as f:
            f.write(content)

    def select(self, transcription_id: str) -> typing.Optional[Transcription]:
        if not transcription_id:
            raise Exception(f'id not specified')

        # guard against path traversal attacks
        if transcription_id not in transcriptions:
            return None

        path = self.media_path / transcription_id
        meta = path.with_suffix('.json')
        if not meta.exists():
            raise Exception(f'id not found')

        with open(meta, 'r') as f:
            t_dict = json.load(f)
            t = Transcription.from_dict(t_dict)
            transcriptions[transcription_id] = t
            return t


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
    return "cuda:0" if torch.cuda.is_available() else "cpu"


@contextlib.contextmanager
def tmpdir_scope():
    tmpdir = tempfile.mkdtemp()
    try:
        yield tmpdir
    finally:
        shutil.rmtree(tmpdir)


class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Path):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
