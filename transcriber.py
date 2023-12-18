"""
timething-web transcriber
"""

import tempfile
import time

from modal import Image, method

from common import stub

# fixed language for now
LANGUAGE = "en"

# fixed english whisper model for now
MODEL_NAME = "base.en"


def download_model():
    import whisper
    # import timething
    # from timething import utils

    # cfg = utils.load_config(LANGUAGE)
    whisper.load_model(MODEL_NAME)
    # timething_align.Aligner.build(get_device(), cfg)


def get_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


transcriber_image = (
    Image.debian_slim(python_version="3.10.8")
    .apt_install("git", "ffmpeg", "curl")
    .run_commands("curl https://sh.rustup.rs -sSf | sh -s -- -y")
    .run_commands("ln ~/.cargo/bin/* /usr/local/bin")
    .env({ "RUSTUP_TOOLCHAIN": "1.72.1" })
    .pip_install(
        "https://github.com/openai/whisper/archive/v20230314.tar.gz",
        "ffmpeg-python"
    )
    .run_function(download_model)
)


def load_audio(data: bytes, sr: int = 16000):
    import ffmpeg
    import numpy as np

    try:
        fp = tempfile.NamedTemporaryFile(delete=False)
        fp.write(data)
        fp.close()

        # This launches a subprocess to decode audio while down-mixing and
        # resampling as necessary. Requires the ffmpeg CLI and `ffmpeg-python`
        # package to be installed.
        out, _ = (
            ffmpeg.input(fp.name)
            .output("-", format="f32le", acodec="pcm_f32le", ac=1, ar=sr)
            .run(
                cmd=["ffmpeg", "-nostdin"],
                capture_stdout=True,
                capture_stderr=True,
            )
        )
    except ffmpeg.Error as e:
        raise RuntimeError(f"Failed to load audio: {e.stderr.decode()}") from e

    return np.frombuffer(out, np.float32).flatten()


@stub.cls(
    gpu="A10G",
    container_idle_timeout=180,
    image=transcriber_image,
)
class Recognise:
    def __enter__(self):
        import torch
        # import scipy.io.wavfile
        import whisper
        # from timething import utils

        self.use_gpu = torch.cuda.is_available()
        self.model = whisper.load_model(MODEL_NAME, device=get_device())
        # self.timething_cfg = utils.load_config(LANGUAGE, k_shingles=5)

    @method()
    def transcribe(
        self,
        audio_data: bytes,
    ):
        t0 = time.time()
        np_array = load_audio(audio_data)
        result = self.model.transcribe(np_array, fp16=self.use_gpu)  # type: ignore
        print(f"Transcribed in {time.time() - t0:.2f}s")

        return result, np_array

    def align(
        self,
        np_array,
        transcript: str):

        tmp = tempfile.NamedTemporaryFile()
        scipy.io.wavfile.write(tmp.name, Fs, y)

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
