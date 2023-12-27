import "../../index.css";
import { Upload } from "../upload.jsx";
import logoUrl from '../../timething.svg'
import { useHistory } from "react-router-dom";

export default function HomePage() {
  const history = useHistory();

  function upload() {
    history.push("/upload");
  }

  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex bg-images">
        <main className="w-full mt-20 ml-20 flex flex-col items-start gap-3 pt-6 overflow-auto">
          <img src={logoUrl} />
          <h1 className="mt-5 font-black">
            Make every word count. <br />Subtitle your videos, gain viewers.
          </h1>
          <h2 className="my-8 max-w-xl">
            <em>Bring it home.</em> Transcribe and subtitle your audio and
            video files with just one upload. Enhance accessibility, increase
            comprehension and break language barriers with subtitles.
          </h2>
          <div className="button">
            <label className="btn btn-lg btn-primary" onClick={upload}>Upload</label>
          </div>
        </main>
      </div>
    </div>
  );
}
