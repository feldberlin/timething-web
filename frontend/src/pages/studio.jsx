import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router';
import "../../index.css";
import { Player } from "../player.jsx";
import { Editor } from "../editor.jsx";
import { PlayButton } from "../play-button.jsx";
import { ZeeSelect } from "../select.jsx";
import logoImg from '../../timething.svg'
import addImg from '../../add.svg'

/**
 * Studio page, mounted at /studio/:transcriptionId. This is the main editing
 * environment for a transcription.
 *
 */
export default function StudioPage() {
  let location = useLocation();
  const { transcriptionId } = useParams();
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false)
  const [transcript, setTranscript] = useState(null);
  const [track, setTrack] = useState(null);
  const [focus, setFocus] = useState(0);
  const [elapsed, setElapsed] = useState(0)
  const languages = [
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
    { value: 'ar', label: 'Arabic' }
  ];

  /**
   * Fetch the transcription metadata.
   *
   */
  useEffect(async () => {
    try {
      const res = await fetch(`/transcription/${transcriptionId}`, {})
      if (res.ok) {
        const meta = JSON.parse(await res.text());
        setTrack(meta.track)
        if (meta.transcript) {
          const alignment = interpolation(meta)
          meta.transcript.alignment = alignment
          setTranscript(meta.transcript)
        }
      } else {
        console.error(`couldn't find transcription ${transcriptionId}`)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  /**
   * State
   *
   */

  // editor will get this callback to set the focused word. side effect is
  // that the player will seek to the elapsed time of the focused word.
  function setFocusFromEditor(focus) {
    // convert focused word (editor knows this)
    // to elapsed seconds (player knows this)
    const findElapsed = (focus) => {
      return transcript ? transcript.alignment[focus] : 0
    }

    const e = findElapsed(focus)
    setFocus(focus)
    setElapsed(e)
    playerRef.current.seekTo(e, 'seconds')
  }

  // player will get this callback to set the elapsed time. side effect is
  // that the editor will set the focused word.
  function setElapsedFromPlayer(elapsed) {
    // convert elapsed seconds (player knows this)
    // to foussed word (editor knows this)
    const findFocus = (elapsed) => {
      if (!transcript) {
        return 0
      }

      const arr = transcript.alignment
      for (let i = 0; i < arr.length; i++) {
          if (arr[i] >= elapsed) {
            return i;
          }
      }

      return arr.length - 1;
    }

    const f = findFocus(elapsed)
    setElapsed(elapsed)
    setFocus(f)
  }

  // simple alignment heuristic
  function interpolation(meta) {
    const words = meta.transcript.text.trim().split(' ')
    const totalDuration = meta.track.duration
    const wordDuration = totalDuration / words.length
    const cumSum = (sum => value => sum += value)(0);
    return words
      .map((word, i) => wordDuration)
      .map(cumSum)
      .map(x => x - wordDuration)
  }


  // check if language is in the language options. if not, add the language
  // code and language name to the options array. we have a static list of
  // supported languages, but whisper may incorrectly identify the language of
  // the audio, e.g. welsh instead of english due to leading silence or music.
  // we would like to be able to display the language name in the select box.
  const { language = '' } = transcript || {}
  if (language && !languages.find(o => o.value === language)) {
    const names = new Intl.DisplayNames(['en'], { type: 'language' });
    languages.push({ value: language, label: names.of(language) })
  }

  return (
    <div id="studio" className="flex min-w-full min-h-screen screen">
      <div id="sidebar" className="h-screen bg-base-100 w-72 text-base">
        <div className="section border-b border-base-200">
          <img src={logoImg} height="26" width="130" className="ml-8 my-7" />
        </div>
        <div className="section border-b border-base-200 py-1">
          <img src={addImg} width="27px" height="27px" className="float-right m-3 mr-5" alt="Add title" />
          <h3 className="my-3 mx-8 font-bold">Title</h3>
          <p className="my-3 mx-8">{track ? track.title : ''}</p>
        </div>
        <div className="section border-b border-base-200 py-1 pb-7">
          <h3 className="my-3 mb-4 mx-8 font-bold">Source Language</h3>
          <ZeeSelect selected={language} options={languages} />
        </div>
        <div className="section border-b border-base-200 py-1">
          <img src={addImg} width="27px" height="27px" className="float-right m-3 mr-5" alt="Add translation" />
          <h3 className="my-3 mx-8 font-bold">Translations</h3>
        </div>
        <div className="section border-b border-base-200 py-1">
          <img src={addImg} width="27px" height="27px" className="float-right m-3 mr-5" alt="Add transcript" />
          <h3 className="my-3 mx-8 font-bold">Transcripts</h3>
          <p className="my-3 mx-8">Auto Transcript</p>
        </div>
        <div className="section border-b border-base-200 py-1">
          <img src={addImg} width="27px" height="27px" className="float-right m-3 mr-5" alt="Add caption" />
          <h3 className="my-3 mx-8 font-bold">Captions</h3>
          <p className="my-3 mx-8">Auto Captions</p>
        </div>
        <div className="section border-b border-base-200 pt-1 pb-5">
          <img src={addImg} width="27px" height="27px" className="float-right m-3 mr-5" alt="Add speaker" />
          <h3 className="my-3 mx-8 font-bold">Speakers</h3>
        </div>
      </div>
      <div id="editor" className="bg-white p-14">
        <Editor
          focus={focus}
          setFocus={setFocusFromEditor}
          transcript={transcript}
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
