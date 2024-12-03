import textwrap

import common


def format(transcription, format_type):
    match format_type:
        case "srt":
            return srt(transcription)


def srt(transcription, n_columns=80):
    """
    Convert transcript into an srt file. Example:

    1
    00:00:00,498 --> 00:00:02,827
    Here's what I love most
    about food and diet.

    2
    00:00:02,827 --> 00:00:06,383
    We all eat several times a day,
    and we're totally in charge

    3
    00:00:06,383 --> 00:00:09,427
    of what goes on our plate
    and what stays off.
    """

    if not transcription:
        return ""

    blocks = []
    for i, segment in enumerate(transcription["segments"]):
        text = segment["text"].strip()
        start = float(segment["start"])
        end = float(segment["end"])
        header = f"{i+1}\n{seconds_to_srt(start)} --> {seconds_to_srt(end)}\n"
        wrapped = textwrap.fill(text, n_columns)
        blocks.append(header + wrapped + "\n\n")

    return "".join(blocks)


def seconds_to_srt(seconds: float):
    "Convert seconds to srt format, e.g. 00:00:00,498"
    milliseconds = int(seconds % 1 * 1000)
    seconds = int(seconds)
    minutes = int(seconds // 60)
    hours = int(minutes // 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"
