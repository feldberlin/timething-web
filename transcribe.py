from dataclasses import dataclass
import logging
import sys
import traceback

from modal import Image

import common
from common import app

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@dataclass
class TranscriptionProgress:
    percent_done: int
    transcript: dict = None


class TranscriptionError(Exception):
    pass


def load_whisper():
    import whisper

    whisper.load_model(common.MODEL_NAME)


transcriber_image = (
    Image.debian_slim(python_version="3.10.8")
    .apt_install("ffmpeg")
    .pip_install(
        "https://github.com/openai/whisper/archive/v20230314.tar.gz", "tqdm"
    )
    .run_function(load_whisper)
)


@app.function(
    gpu=["A100-40GB", "A10G"],
    cpu=8.0,
    container_idle_timeout=180,
    image=transcriber_image,
    network_file_systems=common.nfs,
    timeout=1200,
)
def transcribe(transcription_id, language, prompt=None):
    import torch.multiprocessing as mp

    t = common.db.select(transcription_id)
    if not t:
        raise TranscriptionError(f"invalid id : {transcription_id}")

    device = common.get_device()
    mp.set_start_method("spawn", force=True)
    q = mp.Queue()
    p = mp.Process(
        target=worker,
        args=(q, str(t.transcoded_file), device, language, prompt),
    )
    logger.info("spawning whisper process")
    p.start()
    while True:
        res = q.get()
        if res is None:
            break
        yield res
    p.join()


def worker(q, audio, device, language, prompt):
    import tqdm
    import whisper
    import whisper.transcribe

    class Progress(tqdm.tqdm):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._current = self.n

        def update(self, n):
            super().update(n)
            self._current += n
            percent_done = int(100 * self._current / self.total)
            logger.info(f"progress: {percent_done}")
            q.put(percent_done)

    try:

        # patch whisper so we can generate progress
        transcribe_module = sys.modules["whisper.transcribe"]
        transcribe_module.tqdm.tqdm = Progress

        # run recognition and send back the transcript. this will also send
        # progress back to the parent process via the given pipe
        use_gpu = device == "gpu"
        logger.info(f"transcribe loading model")
        model = whisper.load_model(common.MODEL_NAME, device=device)
        logger.info(f"transcribe {language} (gpu:{use_gpu}). prompt: {prompt}")
        transcript = model.transcribe(
            audio, language=language, prompt=prompt, fp16=use_gpu, verbose=False
        )
        q.put(transcript)
        q.put(None)
    except Exception as e:
        traceback.print_exc()
        q.put(e)
        q.put(None)
