import json
from pathlib import Path

import align
import common

fixtures = Path("fixtures")


def test_alignment_heuristic():
    with open(fixtures / "meta.json", "r") as f:
        d = json.loads(f.read())
        t = common.Transcription.from_dict(d)
        align.piecewise_linear(t)

        # test each chunk start
        assert t.alignment.words[0].start == 0.0
        assert t.alignment.words[1].start == 10 * 1 / 23 + 0.0
        assert t.alignment.words[23].start == 10.88
        assert t.alignment.words[24].start == 6.2 * 1 / 21 + 10.88
        assert t.alignment.words[44].start == 17.88
        assert t.alignment.words[45].start == 2 * 1 / 2 + 17.88
        assert t.alignment.words[46].start == 20.0
        assert t.alignment.words[47].start == 2.7 * 1 / 7 + 20
