from dataclasses import dataclass
import typing
import logging
import os
import sys

from modal import Image, Secret

import common
from common import stub

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@dataclass
class Turn:
    speaker: str
    start: float
    end: float


@dataclass
class AnnotationProgress:
    percent_done: int
    annotations: typing.List[Turn] = None


class AnnotationError(Exception):
    pass


annotation_image = (
    Image
        .debian_slim(python_version="3.10.8")
        .pip_install("pyannote.audio")
)


@stub.function(
    gpu="A10G",
    container_idle_timeout=180,
    image=annotation_image,
    network_file_systems=common.nfs,
    timeout=1200,
    secrets=[
        Secret.from_name("huggingface-secret"),
    ],
)
def annotate(transcription_id):
    from pyannote.audio import Pipeline
    import torch

    t = common.db.select(transcription_id)

    hf_token = os.getenv['HF_TOKEN']
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token)

    # send pipeline to GPU (when available)
    pipeline.to(torch.device("cuda"))

    # apply pretrained pipeline
    diarization = pipeline(t.transcoded_file)

    # print the result
    turns = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        turns.append(Turn(speaker, turn.start, tun.end))
        print(f"start={turn.start:.1f}s stop={turn.end:.1f}s speaker_{speaker}")

    return turns
