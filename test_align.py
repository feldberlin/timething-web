import json
from pathlib import Path

import align

fixtures = Path("fixtures")


def test_alignment_heuristic():
    with open(fixtures / "meta.json", "r") as f:
        meta = json.loads(f.read())
        transcript = meta['transcript']
        align.piecewise_linear(transcript)
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
