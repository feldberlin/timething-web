/**
 * Display settings for each state of the transcription.
 *
 */
export const transcriptionStates = {
  preparing: { text: 'Preparing your file', shortText: 'Preparing', color: 'success' },
  uploading: { text: 'Uploading', shortText: 'Preparing', color: 'primary' },
  transcoding: { text: 'Processing audio', shortText: 'Processing', color: 'neutral' },
  transcribing: { text: 'Converting audio to text', shortText: 'Recognising', color: 'success' },
};

// make it discoverable by tailwind
export const progressColors = {
  neutral: 'progress-neutral',
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  success: 'progress-success',
};

// make it discoverable by tailwind
export const textColors = {
  neutral: 'text-neutral',
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
};

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
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'el', label: 'Greek' },
  { value: 'ar', label: 'Arabic' },
];

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
}) => {
  const id = encodeURIComponent(transcriptionId);
  let url = `/transcribe/${id}`;

  // add language if specified
  if (language != null) {
    url = `${url}?language=${language}`;
  }

  // eta timers
  let transcodingStartedAt;
  let transcribingStartedAt;
  const eta = (stepStartedAt, percentDone) => {
    const stepDuration = (Date.now() - stepStartedAt) / 1000;
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
        setProgress({ percent: percentDone });
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
      setProgress({ percent: percentDone });
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
        showState(transcriptionStates.transcoding);
        break;
      case 'transcribing':
        showState(transcriptionStates.transcribing);
        break;
      case 'completed':
        sse.close();
        onComplete(data.transcription);
        break;
      case 'error':
        sse.close();
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
