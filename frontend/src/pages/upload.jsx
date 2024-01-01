import "../../index.css";
import { Upload } from "../upload.jsx";
import logoUrl from '../../timething.svg'

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center h-screen bg-images w-full pt-14">
      <div className="mt-20 ">
        <img src={logoUrl} className="mb-6" />
        <Upload initialProgressText={"Uploading"}/>
      </div>
    </div>
  );
}
