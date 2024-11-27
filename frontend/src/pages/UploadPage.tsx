// @ts-expect-error keep react here
import React from 'react';

// components
import Upload from '../Upload.tsx';

// images
import logoUrl from '../../voicelayer.svg';

/**
 * Upload page. Mounted on /upload
 *
 */
export default function UploadPage() {
  return (
    <div className="upload-page flex flex-col items-center h-screen w-full pt-14">
      <div className="mt-20">
        <img src={logoUrl} height="36" width="160" className="mb-6" alt="logo" />
        <Upload />
      </div>
    </div>
  );
}
