from pathlib import Path

from scipy.io.wavfile import write
import transcriber

fixtures = Path("fixtures")

def test_load_audio():

    with open(fixtures / "one.mp3", 'rb') as f:
        data = transcriber.load_audio(f.read(), sr=16000)
        assert data.shape == (22640,)

    with open(fixtures / "silent.wav", 'rb') as f:
        data = transcriber.load_audio(f.read(), sr=16000)
        assert data.shape == (101054,)
