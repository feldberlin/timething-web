/**
 * Current state of the transcription as it is processing
 *
 */
export type TranscriptionState = {
  // long text of the state
  text: string;
  // short text of the state
  shortText: string;
  // logical color of the state, e.g. success, primary, secondary, neutral
  color: string;
}

/**
 * Progress of the transcription as it is processing
 *
 */
export type Progress = {
  // percentage of progress made so far
  percent: number;
  // how many bytes of progress have been made so far
  currentBytes: number | null;
  // total number of bytes to process
  totalBytes: number | null;
};

/**
 * Segment of the whisper result. These are chunked by whisper
 *
 */
type WhisperSegment = {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
};

/**
 * Complete whisper result
 *
 */
export type WhisperResult = {
    text: string;
    segments: WhisperSegment[];
    language: string;
};

/**
 * Segment of the alignment
 *
 */
type AlignmentSegment = {
  label: string;
  start: number;
  end: number;
  score: number;
}

/**
 * Complete alignment
 *
 */
export type Alignment = {
  words: AlignmentSegment[];
}

/**
 * Track metadata
 *
 */
export type Track = {
  title: string | null;
  artist: string | null;
  album: string | null;
  comment: string | null;
  description: string | null;
  date: string | null;
  duration: number;
}

/**
 * A turn in the diarization
 *
 */
export type Turn = {
  speaker: string;
  start: number;
  end: number;
}

/**
 * Diarization
 *
 */
export type Diarization = {
  turns: Turn[];
}

/**
 * The main transcription object
 *
 */
export type Transcription = {
  transcription_id: string;
  transcript: WhisperResult;
  diarization: Diarization | null;
  alignment: Alignment | null;
  track: Track;
  language: string;
  path: string;
}

/**
 * Display settings for each state of the transcription.
 *
 */
export const transcriptionStates = {
  preparing: { text: 'Preparing your file', shortText: 'Preparing', color: 'success' },
  uploading: { text: 'Uploading', shortText: 'Preparing', color: 'primary' },
  transcoding: { text: 'Processing media', shortText: 'Processing', color: 'primary' },
  transcribing: { text: 'Transcribing', shortText: 'Transcribing', color: 'secondary' },
  aligning: { text: 'Matching timecodes', shortText: 'Aligning', color: 'secondary' },
  annotating: { text: 'Detecting speakers', shortText: 'Detect speakers', color: 'secondary' },
};

// make it discoverable by tailwind
export const progressColors = {
  neutral: 'progress-neutral',
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  success: 'progress-success',
};

// needed for typescript
export type ProgressColorKey = keyof typeof progressColors;

// make it discoverable by tailwind
export const textColors = {
  neutral: 'text-neutral',
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
};

// needed for typescript
export type TextColorKey = keyof typeof textColors;

/**
 * Supported langauges. Currently constrained by what timething can handle.
 *
 */
export const supportedLanguages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portugese' },
  { value: 'fr', label: 'French' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'el', label: 'Greek' },
];

// get the long name given the short code
export function languageLongName(langaugeCode: string | null): string | null {
  if (langaugeCode == null) {
    return null;
  }

  const lang = supportedLanguages.find((l) => l.value === langaugeCode);
  if (lang) {
    return lang.label;
  }

  return null;
}

/**
 * Help
 *
 */

export const help = {
  trackTitle: [
    'Keep it short and descriptive.',
  ].join(' '),
  trackDescription: [
    'What is happening in this clip.',
    'Be specific and include names and any special terms.',
  ].join(' '),
};

/**
 * Process audio. Transcodes and transcribes the media file.
 *
 */
export const process = ({
  transcriptionId,
  language = null,
  setTranscript = () => {},
  setEta = () => {},
  setShowEta = () => {},
  setProgress = () => {},
  showState = () => {},
  onComplete = () => {},
  onError = () => {},
} : {
  transcriptionId: string;
  language?: string | null;
  setTranscript?: (transcript: WhisperResult) => void;
  setEta?: (eta: number | null) => void;
  setShowEta?: (show: boolean) => void;
  setProgress?: (progress: Progress | null) => void;
  showState?: (state: TranscriptionState) => void;
  onComplete?: (transcription: Transcription) => void;
  onError?: () => void;
}) => {
  const id = encodeURIComponent(transcriptionId);
  let url = `/transcribe/${id}`;

  // add language if specified
  if (language != null) {
    url = `${url}?language=${language}`;
  }

  // eta timers
  let transcodingStartedAt: number | null;
  let transcribingStartedAt: number | null;
  const eta = (stepStartedAt: number, percentDone: number): [number, boolean] => {
    const stepDuration: number = (Date.now() - stepStartedAt) / 1000;
    const secondsPerPoint = stepDuration / percentDone;
    const remaining = Math.round((100 - percentDone) * secondsPerPoint);
    return [
      remaining,
      (remaining > 120) && (stepDuration > 60),
    ];
  };

  // create and event source and start processing
  const sse = new EventSource(url);

  // transcode
  sse.addEventListener('TranscodingProgress', (ev) => {
    const data = JSON.parse(ev.data);
    const percentDone = data.percent_done;
    const { track } = data;
    transcodingStartedAt = transcodingStartedAt || Date.now();
    if (track == null) {
      if (percentDone === 100) {
        setProgress(null);
        setEta(null);
        setShowEta(false);
      } else {
        const [remaining, show] = eta(transcodingStartedAt, percentDone);
        setProgress({ percent: percentDone } as Progress);
        setEta(remaining);
        if (show) {
          setShowEta(true);
        }
      }
    }
  });

  // transcribe
  sse.addEventListener('TranscriptionProgress', (ev) => {
    const data = JSON.parse(ev.data);
    const percentDone = data.percent_done;
    const { transcript } = data;
    transcribingStartedAt = transcribingStartedAt || Date.now();
    if (transcript == null) {
      const [remaining, show] = eta(transcribingStartedAt, percentDone);
      setProgress({ percent: percentDone } as Progress);
      setEta(remaining);
      if (show) {
        setShowEta(true);
      }
    } else {
      setTranscript(transcript);
    }
  });

  // overall pipeline
  sse.addEventListener('PipelineProgress', (ev) => {
    const data = JSON.parse(ev.data);
    switch (data.state) {
      case 'transcoding':
        setProgress(null);
        showState(transcriptionStates.transcoding);
        break;
      case 'transcribing':
        setProgress(null);
        showState(transcriptionStates.transcribing);
        break;
      case 'aligning':
        setProgress(null);
        showState(transcriptionStates.aligning);
        break;
      case 'annotating':
        setProgress(null);
        showState(transcriptionStates.annotating);
        break;
      case 'completed':
        sse.close();
        setProgress(null);
        onComplete(data.transcription);
        break;
      case 'error':
        sse.close();
        setProgress(null);
        onError();
        break;
      default:
        sse.close();
        onError();
        break;
    }
  });

  sse.onerror = () => {
    sse.close();
    onError();
  };
};

/**
 * A single speaker
 *
 */
export type Speaker = {
  // backend identifier for this speaker
  id: string
  // name of the speaker
  name: string
}

/**
 * Document representation for the editor
 *
 */
export type ZDocument = {
  // an array of words, W long
  words: string[];
  // an array of scores, W long.
  scores: number[];
  // speakers, an array of speaker names and ids, S long
  speakers: Speaker[];
  // an array of [speaker id, word index], T long
  turns: [string, number][];
}

export type ZTokens = {
  // unique token identifier, used as react key
  id: string
  // the type of tokens, either speaker-name or content
  type: string;
  // the value of the token
  value: string;
  // the word index of the token. does not include speaker names.
  wordIndex: number | null;

}

/**
 * Generates a sequence of tokens from a ZDocument. Tokens have the type
 * speaker-name or word.
 *
 */
export function zDocumentToZTokens(z: ZDocument): ZTokens[] {
  // helpers
  const getSpeakerForTurn = (i: number) => z.turns[i][0];
  const getWordIndexForTurn = (i: number) => z.turns[i][1];

  let iCurrentTurn = 0;
  const zTokens: ZTokens[] = [{
    id: Math.random().toString(),
    type: 'speaker',
    value: String(getSpeakerForTurn(iCurrentTurn)),
    wordIndex: null,
  }];

  let currentWordIndex = 0;
  for (let i = 0; i < z.words.length; i++) {
    // word is in the next or last turn
    const isLastTurn = iCurrentTurn === z.turns.length - 1;
    if (!isLastTurn && i >= getWordIndexForTurn(iCurrentTurn + 1)) {
      zTokens.push({
        id: Math.random().toString(),
        type: 'speaker',
        value: String(getSpeakerForTurn(iCurrentTurn + 1)),
        wordIndex: null,
      });

      iCurrentTurn += 1;
    }

    // word is in the current turn
    zTokens.push({
      id: Math.random().toString(),
      type: 'content',
      value: z.words[i],
      wordIndex: currentWordIndex,
    });

    currentWordIndex += 1;
  }

  return zTokens;
}

// collapse consecutive turns by the same speaker. Where there are
// overlapping turns, the first speaker wins.
export function collapseSpeakers(turns: Turn[]): Turn[] {
  let speaker;
  let start;
  let end;
  const ret = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (end && turn.end < end) {
      // new turn end before the last speaker ends. ignore this turn
      continue;
    }
    if (end && turn.start < end) {
      // new speaker starts before the last speaker ends
      turn.start = end;
    }

    if (turn.speaker !== speaker) {
      // new speaker
      if (speaker) {
        // not the first speaker

        // push the last turn
        ret.push({
          speaker: speaker || '',
          start: start || 0,
          end: end || 0,
        });
      }

      // remember as last values
      speaker = turn.speaker;
      start = turn.start;
      end = turn.end;
    } else {
      // same speaker
      end = turn.end;
    }
  }

  // last turn
  if (turns.length > 0) {
    ret.push({
      speaker: speaker || '',
      start: start || 0,
      end: end || 0,
    });
  }

  // always start at 0
  ret[0].start = 0;
  return ret;
}

/**
 * Construct ZDocument from Transcription
 *
 */
export function transcriptionToZDocument(t: Transcription): ZDocument {
  if (t.alignment == null) {
    throw new Error('Transcription does not have alignment');
  }

  const words = t.alignment ? t.alignment.words.map((w) => w.label) : [];
  const scores = t.alignment ? t.alignment.words.map((w) => w.score) : [];
  const allSpeakers = t.diarization ? t.diarization.turns.map((w) => w.speaker) : [];
  const uniqueSpeakers = Array.from(new Set(allSpeakers)).sort();
  const speakers = uniqueSpeakers.map((speaker) => ({
    id: speaker,
    name: speaker,
  }));

  // map from speaker names to starting offset in seconds
  let turns: [string, number][] = [];
  if (t.diarization) {
    const collapsed = collapseSpeakers(t.diarization.turns);
    turns = collapsed.map((w) => [
      w.speaker,
      w.start,
    ]);
  }

  // replace start times with word indices
  for (let i = 0; i < turns.length; i++) {
    const start = turns[i][1];
    // find word index for start
    let wordIndex = 0;
    for (let j = 0; j < t.alignment.words.length; j++) {
      if (t.alignment.words[j].start >= start) {
        wordIndex = j;
        break;
      }
    }

    turns[i][1] = wordIndex;
  }

  return {
    words,
    scores,
    speakers,
    turns,
  };
}

/**
 * Round timecodes to 6dp
 *
 */
export function roundAlignmentTimecodes(a: Alignment): Alignment {
  const words = a.words.map((w) => ({
    ...w,
    start: Math.round(w.start * 1000000) / 1000000,
    end: Math.round(w.end * 1000000) / 1000000,
  }));

  return { words };
}
