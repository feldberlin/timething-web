import common

import modal
from modal import Image

from common import app


alignment_image = (
    Image
        .debian_slim(python_version="3.10.8")
        .pip_install_private_repos(
            "github.com/voicelayerai/timething@1.0.1",
            git_user="purzelrakete",
            secrets=[modal.Secret.from_name("github-read-private")],
        )
)

@app.function(
    gpu=["A100-40GB", "A10G"],
    cpu=8.0,
    container_idle_timeout=180,
    image=alignment_image,
    network_file_systems=common.nfs,
    timeout=1200
)
def timething(transcription_id):
    pass


def piecewise_linear(transcription: common.Transcription):
    alignment = common.Alignment()
    for s in transcription.transcript['segments']:
        text = s['text']
        start = float(s['start'])
        end = float(s['end'])
        duration = end - start
        words = text.strip().split(' ')
        for i, word in enumerate(words):
            alignment.words.append(common.Segment(
                word,
                start + i * duration / len(words),
                start + (i + 1) * duration / len(words),
                1.0
            ))

    transcription.alignment = alignment
