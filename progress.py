from functools import partial
import contextlib
import logging
import os
import queue
import shutil
import socket
import sys
import tempfile

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

WHISPER_MODEL_NAME = "base.en"


def ffmpeg(sock, total_duration):
    """Connect to ffmpeg progress unix socket and read lines of progress"""
    connection, client_address = sock.accept()
    data = b''
    progress = 0
    try:
        while True:

            more_data = connection.recv(16)
            if not more_data:
                break
            data += more_data
            lines = data.split(b'\n')
            for line in lines[:-1]:
                line = line.decode()
                parts = line.split('=')
                key = parts[0] if len(parts) > 0 else None
                value = parts[1] if len(parts) > 1 else None
                if key == 'out_time_ms':
                    current = round(float(value) / 1000000., 2)
                    progress = int(100 * current / total_duration)
                    yield progress
                elif key == 'progress' and value == 'end':
                    yield progress

            data = lines[-1]
    finally:
        connection.close()


@contextlib.contextmanager
def tmpdir_scope():
    tmpdir = tempfile.mkdtemp()
    try:
        yield tmpdir
    finally:
        shutil.rmtree(tmpdir)


@contextlib.contextmanager
def sock():
    """Creating and close a unix-domain socket"""
    with tmpdir_scope() as tmpdir:
        socket_filename = os.path.join(tmpdir, 'sock')
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        with contextlib.closing(sock):
            sock.bind(socket_filename)
            sock.listen(1)
            yield socket_filename, sock


def worker(q, audio, device):
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
        transcribe_module = sys.modules['whisper.transcribe']
        transcribe_module.tqdm.tqdm = Progress

        # run recognition and send back the transcript. this will also send
        # progress back to the parent process via the given pipe
        use_gpu = device == "gpu"
        model = whisper.load_model(WHISPER_MODEL_NAME, device=device)
        transcript = model.transcribe(audio, fp16=use_gpu, verbose=False)
        q.put(transcript)
        q.put(None)
    except Exception as e:
        q.put(e)
        q.put(None)


def transcribe(audio, device):
    import torch.multiprocessing as mp

    mp.set_start_method("spawn", force=True)
    q = mp.Queue()
    p = mp.Process(target=worker, args=(q, audio, device))
    p.start()
    while True:
        res = q.get()
        if res is None:
            break
        yield res
    p.join()
