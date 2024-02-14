import common


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
