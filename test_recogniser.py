from functools import partial
from pathlib import Path
import json

import numpy as np

import progress
import recogniser
import shutil

fixtures = Path("fixtures")


def test_transcode():
    updates = list(
        recogniser.transcode("keanu.mp3", media_path=fixtures)
    )

    assert len(updates) >= 3
    assert updates[0].percent_done == 0
    assert updates[-2].percent_done == 100
    assert updates[-1].percent_done == None

    track = updates[-1].track
    assert track.read().shape == (25167360, )
    assert track.title == "Keanu Reeves"
    assert track.artist == "The New York Times"
    assert track.album == "Still Processing"
    assert track.comment == "preroll_1;postroll_1"
    assert track.date == "2022"


def test_transcribe():
    for update in progress.transcribe(str(fixtures / "one.wav"), device="cpu"):
        match update:
            case int(percent_done):
                print(percent_done)
            case dict(transcript):
                print(transcript)
            case Exception() as e:
                print(e)


def test_recogniser():
    with progress.tmpdir_scope() as tmp:
        shutil.copyfile(fixtures / "one.mp3", Path(tmp) / "one.mp3")
        r = recogniser.Recogniser()
        updates = list(
            r.recognise.local("one.mp3", media_path=Path(tmp))
        )

        assert len(updates) > 1
        assert type(updates[0]) == recogniser.TranscodingProgress
        assert updates[1].percent_done == 96
        assert updates[3].percent_done is None
        assert updates[3].track.duration > 1.4

        assert type(updates[-1]) == recogniser.TranscriptionProgress
        assert updates[-1].percent_done is None
        assert updates[-1].transcript.strip() == "One"


def test_alignment_heuristic():
    with open(fixtures / "meta.json", "r") as f:
        meta = json.loads(f.read())
        transcript = meta['transcript']
        recogniser.align(transcript)
        alignment = transcript['alignment']

        # test each chunk start
        assert alignment[0] == 0.0
        assert alignment[1] == 10 * 1/23 + 0.0
        assert alignment[23] == 10.88
        assert alignment[24] == 6.2 * 1/21 + 10.88
        assert alignment[44] == 17.88
        assert alignment[45] == 2 * 1/2 + 17.88
        assert alignment[46] == 20.0
        assert alignment[47] == 2.7 * 1/7 + 20
