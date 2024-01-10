import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router';
import "../../index.css";
import { Player } from "../player.jsx";
import { Editor } from "../editor.jsx";
import logoUrl from '../../timething.svg'

export default function StudioPage() {
  let location = useLocation();
  const { transcriptionId } = useParams();
  const [transcript, setTranscript] = useState(null);
  const [track, setTrack] = useState(null);

  useEffect(async () => {
    try {
      const res = await fetch(`/transcription/${transcriptionId}`, {})
      if (res.ok) {
        const meta = JSON.parse(await res.text());
        setTrack(meta.track)
        if (meta.transcript) {
          setTranscript(meta.transcript)
        }
      } else {
        console.error(`couldn't find transcription ${transcriptionId}`)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  return (
    <div id="studio" className="flex min-w-full min-h-screen screen">
      <div id="sidebar" className="h-screen bg-base-100 w-72 text-base">
        <div className="section border-b border-base-200">
          <img src={logoUrl} width="130" className="ml-8 my-7" />
        </div>
        <div className="section border-b border-base-200 py-1">
          <h3 className="my-3 mx-8 font-bold">Title</h3>
          <p className="my-3 mx-8">{track ? track.title : ''}</p>
        </div>
        <div className="section border-b border-base-200 py-1">
          <h3 className="my-3 mx-8 font-bold">Source Language</h3>
        </div>
        <div className="section border-b border-base-200 py-1">
          <h3 className="my-3 mx-8 font-bold">Translations</h3>
        </div>
        <div className="section border-b border-base-200 py-1">
          <h3 className="my-3 mx-8 font-bold">Transcripts</h3>
          <p className="my-3 mx-8">Auto Transcript</p>
        </div>
        <div className="section border-b border-base-200 py-1">
          <h3 className="my-3 mx-8 font-bold">Captions</h3>
          <p className="my-3 mx-8">Auto Captions</p>
        </div>
        <div className="section border-b border-base-200 pt-1 pb-5">
          <h3 className="my-3 mx-8 font-bold">Speakers</h3>
        </div>
      </div>
      <div id="editor" className="bg-white p-16">
        <Editor transcript={transcript} track={track} />
      </div>
      <div id="player" className="flex justify-center items-center h-screen">
        <Player
          initialTranscriptionId={transcriptionId}
          initialTrack={track}
        />
      </div>
    </div>
  );
}
