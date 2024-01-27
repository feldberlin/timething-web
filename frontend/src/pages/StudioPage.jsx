import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

// components
import Editor from '../Editor';
import ErrorMessage from '../ErrorMessage';
import MiniProgress from '../MiniProgress';
import PlayButton from '../PlayButton';
import Player from '../Player';
import ZeeSelect from '../ZeeSelect';

// images
import logoImg from '../../timething.svg';
import addImg from '../../add.svg';

// styles
import '../../css/pages/StudioPage.css';

// lib
import {
  supportedLanguages as languages,
  process,
} from '../lib';

/**
 * Studio page, mounted at /studio/:transcriptionId. This is the main editing
 * environment for a transcription.
 *
 */
export default function StudioPage() {
  const { transcriptionId } = useParams();
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [language, setLanguage] = useState(null);
  const [track, setTrack] = useState(null);
  const [focus, setFocus] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [modalMessage, setModalMessage] = useState(0);
  const [modalButtons, setModalButtons] = useState(0);

  // retranscription
  const [retranscribing, setRetranscribing] = useState(false);
  const [retranscribingProgress, setRetranscribingProgress] = useState(0);
  const [retranscribingState, setRetranscribingState] = useState(0);

  // User error, system error. Like 404 vs 500.
  const [err, setErr] = useState(null);
  const [fatalError, setFatalError] = useState(null);

  /**
   * Fetch the transcription metadata.
   *
   */
  useEffect(() => {
    const getTranscription = async () => {
      try {
        const res = await fetch(`/transcription/${transcriptionId}`, {});
        if (res.ok) {
          const meta = JSON.parse(await res.text());
          setTrack(meta.track);
          if (meta.transcript) {
            setTranscript(meta.transcript);

            // check if language is in the language options. if not, add the
            // language code and language name to the options array. we have
            // a static list of supported languages, but whisper may incorrectly
            // identify the language of the audio, e.g. welsh instead of english
            // due to leading silence or music. we would like to be able to
            // display the language name in the select box.
            const { language: detectedLanguage } = meta.transcript || {};
            if (detectedLanguage && !languages.find((o) => o.value === detectedLanguage)) {
              const names = new Intl.DisplayNames(['en'], { type: 'language' });
              languages.push({ value: detectedLanguage, label: names.of(detectedLanguage) });
            }

            setLanguage(detectedLanguage);
          }
        } else {
          // use a fatal here so we don't load any of the studio components.
          setFatalError("Couldn't find this transcription.");
        }
      } catch (e) {
        setFatalError("Couldn't load transcription.");
      }
    };

    getTranscription();
  }, [transcriptionId]);

  /**
   * State
   *
   */

  // editor will get this callback to set the focused word. side effect is
  // that the player will seek to the elapsed time of the focused word.
  const setFocusFromEditor = (editorFocus) => {
    // convert focused word (editor knows this)
    // to elapsed seconds (player knows this)
    const findElapsed = (f) => (transcript ? transcript.alignment[f] : 0);

    const e = findElapsed(editorFocus);
    setFocus(editorFocus);
    setElapsed(e);
    playerRef.current.seekTo(e, 'seconds');
  };

  // player will get this callback to set the elapsed time. side effect is
  // that the editor will set the focused word.
  const setElapsedFromPlayer = (playerElapsed) => {
    // convert elapsed seconds (player knows this)
    // to foussed word (editor knows this)
    const findFocus = () => {
      if (!transcript) {
        return 0;
      }

      const arr = transcript.alignment;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= playerElapsed) {
          return i;
        }
      }

      return arr.length - 1;
    };

    const f = findFocus(playerElapsed);
    setElapsed(playerElapsed);
    setFocus(f);
  };

  /**
   * Event handlers
   *
   */
  const hChange = ({ value, label }) => {
    if (language) {
      // very modal
      setPlaying(false);

      // message
      setModalMessage(
        <p className="py-4">
          😬 Looks like we got the source language wrong.
          Would you like to generate a new automatic transcription
          in
          {' '}
          {label}
          ?
        </p>,

      );

      const hRetranscribe = () => {
        // eslint-disable-next-line no-console
        console.log('clicked retranscribe. running');
        const oldTranscript = transcript;
        setLanguage(value);
        setRetranscribing(true);
        setTranscript(null);
        process({
          language: value,
          transcriptionId,
          setProgress: (progress) => {
            const { percent } = progress || {};
            if (percent) {
              setRetranscribingProgress(Number(percent));
            }
          },
          showState: (state) => {
            setRetranscribingState(state);
          },
          onError: () => {
            setTranscript(oldTranscript);
            setRetranscribing(false);
            setErr("We couldn't process your audio.");
          },
          onComplete: (transcription) => {
            setRetranscribing(false);
            setRetranscribingProgress(null);
            setRetranscribingState(null);
            setTranscript(transcription.transcript);
          },
        });
      };

      // buttons
      setModalButtons(
        <form method="dialog">
          <button className="btn mr-2" type="submit">Cancel</button>
          <button className="btn bg-black text-white" type="submit" onClick={hRetranscribe}>
            Change to
            {' '}
            {label}
          </button>
        </form>,
      );

      const modal = document.querySelector('#change-language-modal');
      modal.showModal();
    }
  };

  if (fatalError) {
    return (
      <div id="studio" className="flex flex-col justify-center items-center min-w-full min-h-screen screen p-20 -mt-16">
        <div>
          <h1 className="mb-3">Something went wrong.</h1>
          <p className="mb-5">
            Maybe try again later?
          </p>
          <ErrorMessage message={fatalError} />
        </div>
      </div>
    );
  }

  return (
    <div id="studio" className="flex min-w-full min-h-screen screen">
      <div id="studio-modal">
        <dialog id="change-language-modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Changing Language</h3>
            {modalMessage}
            <div className="modal-action">
              {modalButtons}
            </div>
          </div>
        </dialog>
      </div>
      <div id="sidebar" className="h-screen bg-base-100 w-72 text-base">
        <div className="section border-b border-base-200">
          <img
            src={logoImg}
            height="26"
            width="130"
            className="ml-8 my-7"
            alt="Logo"
          />
        </div>
        <div className="section border-b border-base-200 py-1">
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add title"
          />
          <h3 className="my-3 mx-8 font-bold">Title</h3>
          <p className="my-3 mx-8">{track ? track.title : ''}</p>
        </div>
        <div className="section border-b border-base-200 py-1 pb-7">
          <h3 className="my-3 mb-4 mx-8 font-bold">Source Language</h3>
          <ZeeSelect
            onChange={hChange}
            selected={language}
            options={languages}
            disabled={!language}
          />
        </div>
        <div className="section border-b border-base-200 py-1">
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add translation"
          />
          <h3 className="my-3 mx-8 font-bold">Translations</h3>
        </div>
        <div className="section border-b border-base-200 py-1">
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add transcript"
          />
          <h3 className="my-3 mx-8 font-bold">Transcripts</h3>
          <p className="my-3 mx-8">
            { retranscribing
              ? (
                <MiniProgress
                  state={retranscribingState}
                  progress={retranscribingProgress}
                />
              )
              : 'Auto Transcript'}
          </p>
        </div>
        <div className="section border-b border-base-200 py-1">
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add caption"
          />
          <h3 className="my-3 mx-8 font-bold">Captions</h3>
          <p className="my-3 mx-8">Auto Captions</p>
        </div>
        <div className="section border-b border-base-200 pt-1 pb-5">
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add speaker"
          />
          <h3 className="my-3 mx-8 font-bold">Speakers</h3>
        </div>
      </div>
      <div id="editor" className="bg-white">
        {err
          && <ErrorMessage message={err} />}
        <Editor
          focus={focus}
          setFocus={setFocusFromEditor}
          transcript={transcript}
          initialTranscriptionId={transcriptionId}
          track={track}
        />
      </div>
      <div id="player" className="flex justify-center items-center h-screen bg-images-right">
        <Player
          ref={playerRef}
          playing={playing}
          setPlaying={setPlaying}
          elapsed={elapsed}
          setElapsed={setElapsedFromPlayer}
          initialUrl={`/media/${transcriptionId}`}
          initialTrack={track}
        />
      </div>
      <div id="play-button" className="fixed bottom-16 w-full flex justify-center">
        <PlayButton
          playing={playing}
          setPlaying={setPlaying}
        />
      </div>
    </div>
  );
}
