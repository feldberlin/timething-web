from dataclasses import dataclass
import typing
import logging
import os
import re
import sys

from modal import Image, Secret

import common
from common import stub

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@dataclass
class AnnotationProgress:
    percent_done: int
    annotations: typing.List[common.Turn] = None


class AnnotationError(Exception):
    pass


annotation_image = (
    Image
        .debian_slim(python_version="3.10.8")
        .pip_install("pyannote.audio===3.1.1", "num2words")
)


class Progress:
    def __call__(
        self,
        step_name,
        step_artifact,
        file = None,
        total: typing.Optional[int] = None,
        completed: typing.Optional[int] = None):
        pass


@stub.function(
    gpu="A10G",
    cpu=8.0,
    container_idle_timeout=180,
    image=annotation_image,
    network_file_systems=common.nfs,
    timeout=1200,
    secrets=[
        Secret.from_name("huggingface-secret"),
    ],
)
def annotate(transcription_id):
    from num2words import num2words
    from pyannote.audio.pipelines.utils.hook import ProgressHook
    from pyannote.audio import Pipeline
    import torchaudio
    import torch

    t = common.db.select(transcription_id)
    if not t:
        raise AnnotationError(f"invalid id : {transcription_id}")

    hf_token = os.getenv('HF_TOKEN')
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )

    device = torch.device(common.get_device())
    pipeline.to(device)
    logger.info(f"pipeline loaded onto {device}")

    with ProgressHook() as hook:
        # load audio. https://github.com/m-bain/whisperX/issues/399
        waveform, sample_rate = torchaudio.load(t.transcoded_file)
        logger.info(f"loaded waveform {waveform.size()}")
        diarization = pipeline({
            "waveform": waveform,
            "sample_rate": sample_rate,
            "hook": hook
        })

        turns = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            if not re.match(r"SPEAKER_\d+", speaker):
                raise AnnotationError(f"unexpected speaker format: {speaker}")
            number = int(speaker.split("_")[1]) + 1
            name = f"speaker {num2words(number)}".title()
            turns.append(common.Turn(name, turn.start, turn.end))

        return common.Diarization(
            turns=turns
        )
