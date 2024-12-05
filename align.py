from pathlib import Path

import modal
from modal import Image

import common
from common import app


alignment_image = (
    Image.debian_slim(python_version="3.10.8")
    .apt_install("sox", "libsox-dev")
    .pip_install_private_repos(
        "github.com/voicelayerai/timething@1.0.4",
        git_user="purzelrakete",
        secrets=[modal.Secret.from_name("github-read-private")],
    )
)


@app.function(
    gpu=["A100-40GB", "A10G"],
    cpu=15.0,
    container_idle_timeout=180,
    image=alignment_image,
    network_file_systems=common.nfs,
    timeout=1200,
)
def align(
    transcription_id: str,
    language: str,
    batch_size=1,
    n_workers=10,
    seconds_per_window=10,
):
    from timething import dataset, job, utils

    if not language:
        # timething model key
        language = "en"

    t = common.db.select(transcription_id)
    ds = dataset.WindowedTrackDataset(
        str(t.transcoded_file),
        t.transcoded_file.suffix[1:],
        t.transcript["text"],
        seconds_per_window * 1000,
        seconds_per_window * 1000,
        16000,
    )

    cfg = utils.load_config(language)
    j = job.LongTrackJob(cfg, ds, batch_size=batch_size, n_workers=n_workers)
    tt_alignment = j.run()

    # convert to studio alignment
    alignment = common.Alignment(words=[])
    for s in tt_alignment.words:
        alignment.words.append(common.Segment(
            label=s.label,
            start=s.start,
            end=s.end,
            score=s.score
        ))

    return alignment


def align_piecewise_linear(transcription: common.Transcription):
    alignment = common.Alignment()
    for s in transcription.transcript["segments"]:
        text = s["text"]
        start = float(s["start"])
        end = float(s["end"])
        duration = end - start
        words = text.strip().split(" ")
        for i, word in enumerate(words):
            alignment.words.append(
                common.Segment(
                    word,
                    start + i * duration / len(words),
                    start + (i + 1) * duration / len(words),
                    1.0,
                )
            )

    return alignment
