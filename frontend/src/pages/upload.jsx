import "../../index.css";
import { Upload } from "../upload.jsx";
import logoUrl from '../../timething.svg'

export default function UploadPage() {
  return (
    <div className="flex w-full pt-20 flex flex-col items-center h-screen bg-images">
      <Upload initialProgressText={"Uploading"}/>
    </div>
  );
}
