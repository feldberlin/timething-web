import json

import common


def test_from_dict():
    with open("fixtures/meta.json", "r") as f:
        d = json.load(f)
        t = common.Transcription.from_dict(d)
        assert t.transcription_id == "e4f0f909-8772-4b18-a397-a9b4c4726476"
        assert t.transcript["language"] == "en"
