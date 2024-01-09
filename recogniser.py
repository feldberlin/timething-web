"""
timething-web transcriber
"""

from dataclasses import dataclass
from functools import partial
from pathlib import Path
import itertools
import logging
import tempfile
import time
import uuid

from modal import Image, NetworkFileSystem, method
import numpy as np

import common
from common import stub
import progress

# main storage volume
volume = NetworkFileSystem.persisted("media")

# nfs
nfs = {
    str(common.MEDIA_PATH): volume
}

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class RecogniserError(Exception):
    pass


def load_model():
    import whisper
    whisper.load_model(common.MODEL_NAME)

    # import timething
    # from timething import utils

    # cfg = utils.load_config(LANGUAGE)
    # timething_align.Aligner.build(get_device(), cfg)


image = (
    Image.debian_slim(python_version="3.10.8")
    .apt_install("git", "ffmpeg", "curl")
    .run_commands("curl https://sh.rustup.rs -sSf | sh -s -- -y")
    .run_commands("ln ~/.cargo/bin/* /usr/local/bin")
    .env({"RUSTUP_TOOLCHAIN": "1.72.1"})
    .pip_install(
        "https://github.com/openai/whisper/archive/v20230314.tar.gz",
        "ffmpeg-python",
        "tqdm"
    )
    .run_function(load_model)
)


@dataclass
class TranscodingProgress:
    percent_done: int = None
    track: common.Track = None


@dataclass
class TranscriptionProgress:
    percent_done: int = None
    transcript: str = None


def transcode(
    transcription_id: str,
    sr: int = 16000,
    media_path=common.MEDIA_PATH
):
    import ffmpeg
    import numpy as np

    # input media file
    in_file = media_path / transcription_id

    # output transcoded wav file
    out_file = in_file.with_suffix(".wav")

    # get metadata
    probe = ffmpeg.probe(in_file)
    track = common.Track.from_probe(probe)

    with progress.sock() as (socket_filename, socket):
        process = (
            ffmpeg.input(str(in_file))
            .output(
                filename=str(str(out_file)),
                format="wav",
                ac=1,
                ar=sr
            )
            .overwrite_output()
            .global_args('-progress', 'unix://{}'.format(socket_filename))
            .run_async(
                cmd=["ffmpeg", "-nostdin"],
            )
        )

        yield from map(
            lambda x: TranscodingProgress(percent_done=x),
            progress.ffmpeg(socket, track.duration)
        )

        return_code = process.wait()
        if return_code != 0:
            raise RecogniserError(f"ffmpeg failed : {return_code}")

    track.path = str(out_file)
    yield TranscodingProgress(track=track)


def get_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


@stub.cls(
    gpu="A10G",
    container_idle_timeout=180,
    image=image,
    network_file_systems=nfs,
    timeout=600
)
class Recogniser:
    def __enter__(self):
        import whisper
        # from timething import utils

        self.use_gpu = get_device() == "gpu"
        # self.timething_cfg = utils.load_config(LANGUAGE, k_shingles=5)

    @method()
    def recognise(
        self,
        transcription_id: str,
        media_path: Path = common.MEDIA_PATH
    ):
        # transcode
        track = None
        logger.info(f"transcoding...")
        for update in transcode(transcription_id, media_path=media_path):
            yield update
            match update:
                case TranscodingProgress(track=track):
                    track = track

        logger.info(f"transcribing...")
        for update in progress.transcribe(track.path, get_device()):
            match update:
                case int(percent_done):
                    yield TranscriptionProgress(percent_done=percent_done)
                case dict(transcript):
                    transcript=transcript
                    yield TranscriptionProgress(transcript=transcript['text'])
                case Exception as e:
                    logger.error(e)

        common.db.create(
            common.Transcription(
                transcription_id=transcription_id,
                transcript=transcript,
                track=track
            )
        )

    @method()
    def align(
        self,
        np_array,
        transcript: str):

        tmp = tempfile.NamedTemporaryFile()

        # set up as audio as a dataset
        ds = dataset.WindowedTrackDataset(
            Path(tmp.name),
            "wav",
            transcript,
            seconds_per_window * 1000,
            seconds_per_window * 1000,
            16000,
        )

        # configure a chunked alignment job
        j = job.LongTrackJob(
            self.timething_cfg,
            ds,
            batch_size=batch_size,
            n_workers=n_workers)

        # run the aligner
        alignment = j.run()
        return alignment
