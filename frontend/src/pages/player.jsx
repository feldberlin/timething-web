import { useLocation } from 'react-router-dom';
import "../../index.css";
import { Player } from "../player.jsx";
import logoUrl from '../../timething.svg'

export default function PlayerPage() {
  let location = useLocation();
  let state = location.state;
  let transcript = "No transcript."
  let transcriptionId = null
  let track = null
  if (state) {
    transcript = state.transcript
    transcriptionId = state.transcriptionId
    track = state.track
  }

  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex">
        <main className="p-12 w-full flex flex-col items-start gap-3 overflow-auto">
          <div className="flex-col mx-auto" >
            <Player
              initialTranscript={transcript}
              initialTranscriptionId={transcriptionId}
              initialTrack={track}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
