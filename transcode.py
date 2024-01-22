import contextlib
from dataclasses import dataclass
import logging
import os
import socket

from modal import Image

from common import stub
import common

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@dataclass
class TranscodingProgress:
    percent_done: int = None
    track: common.Track = None


class TranscodeError(Exception):
    pass


transcoder_image = (
    Image
        .debian_slim(python_version="3.10.8")
        .apt_install("git", "ffmpeg", "curl")
        .pip_install("ffmpeg-python")
)


@stub.function(
    cpu=8.0,
    container_idle_timeout=180,
    image=transcoder_image,
    network_file_systems=common.nfs,
    timeout=1200
)
def transcode(
    transcription_id: str,
    sr: int = 16000,
    force_reprocessing: bool = False,
    media_path=common.MEDIA_PATH,
):
    import ffmpeg

    # input media file
    in_file = media_path / transcription_id

    # output transcoded wav file
    out_file = in_file.with_suffix(".wav")

    # get metadata
    probe = ffmpeg.probe(in_file)
    track = common.Track.from_probe(probe)
    track.path = str(out_file)

    # check if we've already transcoded this. we need a valid wav file
    if out_file.exists() and not force_reprocessing:
        try:
            probe = ffmpeg.probe(out_file)
            yield TranscodingProgress(track=track)
            return
        except:
            # invalid wav. reprocess
            pass

    with create_sock() as (socket_filename, socket):
        process = (
            ffmpeg.input(str(in_file))
            .output(
                filename=str(out_file),
                format="wav",
                ac=1,
                acodec="pcm_s16le",
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
            progress(socket, track.duration)
        )

        return_code = process.wait()
        if return_code != 0:
            raise TranscodeError(f"ffmpeg failed : {return_code}")

    yield TranscodingProgress(track=track)


def progress(sock, total_duration):
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
        yield 100


@contextlib.contextmanager
def create_sock():
    """Creating and close a unix-domain socket"""
    with common.tmpdir_scope() as tmpdir:
        socket_filename = os.path.join(tmpdir, 'sock')
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        with contextlib.closing(sock):
            sock.bind(socket_filename)
            sock.listen(1)
            yield socket_filename, sock
