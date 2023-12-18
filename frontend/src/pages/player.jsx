import { useLocation } from 'react-router-dom';
import "../../index.css";
import { Player } from "../player.jsx";
import logoUrl from '../../timething.svg'

export default function PlayerPage() {
  let location = useLocation();
  let state = location.state;
  let transcript = "No transcript."
  if (state) {
    transcript = state.transcript
  }

  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex">
        <main className="p-12 w-full flex flex-col items-start gap-3 overflow-auto">
          <div className="flex-col mx-auto" >
            <h1 className="mb-10">Transcript</h1>
            <Player initialTranscript={transcript}/>
          </div>
        </main>
      </div>
    </div>
  );
}
