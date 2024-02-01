// @ts-expect-error keep react here
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { SingleValue } from 'react-select';

// third party
// @ts-expect-error no types
import * as _ from 'underscore';
import ReactPlayer from 'react-player/lazy';
import * as log from 'loglevel';

// components
import Editor from '../Editor.tsx';
import EditableText from '../EditableText.tsx';
import ErrorMessage from '../ErrorMessage.tsx';
import MiniProgress from '../MiniProgress.tsx';
import PlayButton from '../PlayButton.tsx';
import Player from '../Player.tsx';
import ZeeSelect from '../ZeeSelect.tsx';

// images
import logoImg from '../../timething.svg';
import addImg from '../../add.svg';

// styles
import '../../css/pages/StudioPage.css';

// lib
import {
  supportedLanguages as languages,
  languageLongName,
  process,
  WhisperResult,
  Transcription,
  TranscriptionState,
  Track,
  help,
} from '../lib.ts';

// data
import {
  getTranscription,
  debouncedPutTitle,
  debouncedPutDescription,
} from '../data.ts';

// info log level for development
log.setLevel(log.levels.INFO);

// route parameters
type StudioParams = {
  transcriptionId: string;
}

/**
 * Studio page, mounted at /studio/:transcriptionId. This is the main editing
 * environment for a transcription.
 *
 */
export default function StudioPage() {
  const { transcriptionId } = useParams<StudioParams>();
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<WhisperResult | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [requestedLanguage, setRequestedLanguage] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [focus, setFocus] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // sidebar fields
  const [title, setTitle] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [description, setDescription] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  // retranscription
  const [retranscribing, setRetranscribing] = useState<boolean>(false);
  const [retranscribingProgress, setRetranscribingProgress] = useState<number | null>(null);
  const [retranscribingState, setRetranscribingState] = useState<TranscriptionState | null>(null);

  // User error, system error. Like 404 vs 500.
  const [err, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  /**
   * Fetch the transcription metadata.
   *
   */
  useEffect(() => {
    const get = async () => {
      try {
        const res = await getTranscription(transcriptionId);
        if (res.ok) {
          const meta = JSON.parse(await res.text());
          setTrack(meta.track);
          setTitle(meta.track.title);
          setDescription(meta.track.description);
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
              const label = names.of(detectedLanguage);
              if (label) {
                log.info(`adding ${detectedLanguage}, ${label} to source languages`);
                languages.push({
                  value: detectedLanguage,
                  label,
                });
              }
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

    get();
  }, [transcriptionId]);

  if (!transcriptionId) {
    return (
      <ErrorMessage message="No transcription ID provided." />
    );
  }

  /**
   * State
   *
   */

  // editor will get this callback to set the focused word. side effect is
  // that the player will seek to the elapsed time of the focused word.
  const setFocusFromEditor = (editorFocus: number) => {
    // convert focused word (editor knows this)
    // to elapsed seconds (player knows this)
    const findElapsed = (f: number) => (
      transcript ? transcript.alignment[f] : 0
    );

    const e = findElapsed(editorFocus);
    setFocus(editorFocus);
    setElapsed(e);
    playerRef?.current?.seekTo(e, 'seconds');
  };

  // player will get this callback to set the elapsed time. side effect is
  // that the editor will set the focused word.
  const setElapsedFromPlayer = (playerElapsed: number) => {
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

    const f = findFocus();
    setElapsed(playerElapsed);
    setFocus(f);
  };

  const hRetranscribe = () => {
    const oldTranscript = transcript;
    setLanguage(requestedLanguage);
    setRetranscribing(true);
    setTranscript(null);
    process({
      language: requestedLanguage,
      transcriptionId,
      showState: (state) => {
        log.info('Transitioned retranscribing state.', state);
        setRetranscribingProgress(null);
        setRetranscribingState(state);
      },
      setProgress: (progress) => {
        log.info('Retranscription progress.', progress);
        const { percent } = progress || {};
        if (percent) {
          setRetranscribingProgress(Number(percent));
        }
      },
      onError: () => {
        log.error('Retranscription error.');
        setTranscript(oldTranscript);
        setRetranscribing(false);
        setError("We couldn't process your audio.");
      },
      onComplete: (transcription: Transcription) => {
        log.info('Retranscription complete', transcription);
        setRetranscribing(false);
        setRetranscribingProgress(null);
        setRetranscribingState(null);
        setTranscript(transcription.transcript);
      },
    });
  };

  /**
   * Event handlers
   *
   */
  const hChange = (s: SingleValue<{ value: string; label: string }>) => {
    if (s && language) {
      // very modal
      setPlaying(false);
      setRequestedLanguage(s.value);
      setModalMessage(
        '😬 Looks like we got the source language wrong.'
        + ' Would you like to generate a new automatic transcription'
        + ` in ${s.label}?`,
      );

      const modal = document.querySelector('#change-language-modal') as HTMLFormElement;
      if (modal) {
        modal.showModal();
      }
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
            <p className="py-4">
              {modalMessage}
            </p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn mr-2" type="submit">Cancel</button>
                <button className="btn bg-black text-white" type="submit" onClick={hRetranscribe}>
                  Change to
                  {' '}
                  { languageLongName(requestedLanguage) }
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
      <div id="sidebar" className="h-screen bg-base-100 w-72 text-base">
        { /* Logo */ }
        <div className="section border-b border-base-200">
          <img
            src={logoImg}
            height="26"
            width="130"
            className="ml-8 my-7"
            alt="Logo"
          />
        </div>
        { /* Title */ }
        <div className="section border-b border-base-200 py-1">
          { (!title && !editingTitle) && (
            <div className="tt-add float-right tooltip tooltip-top" data-tip={help.trackTitle}>
              <img
                src={addImg}
                width="27px"
                height="27px"
                className="m-3 mr-5"
                onClick={() => setEditingTitle(true)}
                alt="Add title"
              />
            </div>
          )}
          <h3 className="my-3 mx-8 font-bold">Title</h3>
          { (editingTitle || title) && (
            <EditableText
              className="my-3 mx-8"
              editing={editingTitle}
              setEditing={setEditingTitle}
              setValue={setTitle}
              value={title}
              onUpdate={_.partial(debouncedPutTitle, transcriptionId)}
            />
          )}
        </div>
        { /* Description */ }
        <div className="section border-b border-base-200 py-1">
          { (!description && !editingDescription) && (
            <div className="tt-add float-right tooltip tooltip-top" data-tip={help.trackDescription}>
              <img
                src={addImg}
                width="27px"
                height="27px"
                className="m-3 mr-5"
                onClick={() => setEditingDescription(true)}
                alt="Add description"
              />
            </div>
          )}
          <h3 className="my-3 mx-8 font-bold">Description</h3>
          { (editingDescription || description) && (
            <EditableText
              className="my-3 mx-8"
              editing={editingDescription}
              setEditing={setEditingDescription}
              setValue={setDescription}
              value={description}
              onUpdate={_.partial(debouncedPutDescription, transcriptionId)}
            />
          )}
        </div>
        { /* Source Language */ }
        <div className="section border-b border-base-200 py-1 pb-7">
          <h3 className="my-3 mb-4 mx-8 font-bold">Source Language</h3>
          <ZeeSelect
            onChange={hChange}
            selected={language}
            options={languages}
            disabled={!language}
          />
        </div>
        {/*
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
        */}
        <div className="section border-b border-base-200 py-1">
          {/*
          <img
            src={addImg}
            width="27px"
            height="27px"
            className="float-right m-3 mr-5"
            alt="Add transcript"
          />
          */}
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
        {/*
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
        */}
      </div>
      <div id="editor" className="bg-white">
        {err
          && <ErrorMessage message={err} />}
        <Editor
          focus={focus}
          setFocus={setFocusFromEditor}
          transcript={transcript}
          title={title}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          setTitle={setTitle}
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
