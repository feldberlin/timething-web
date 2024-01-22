

def piecewise_linear(transcript):
    alignment = []
    for s in transcript['segments']:
        text = s['text']
        start = float(s['start'])
        end = float(s['end'])
        duration = end - start
        words = text.strip().split(' ')
        for i, w in enumerate(words):
            alignment.append(start + i * duration / len(words))

    transcript['alignment'] = alignment
