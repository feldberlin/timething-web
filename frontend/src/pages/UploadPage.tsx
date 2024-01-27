// @ts-expect-error keep react here
import React from 'react';

// components
import Upload from '../Upload.tsx';

// images
import logoUrl from '../../timething.svg';

/**
 * Upload page. Mounted on /upload
 *
 */
export default function UploadPage() {
  return (
    <div className="flex flex-col items-center h-screen bg-images w-full pt-14">
      <div className="mt-20 ">
        <img src={logoUrl} height="36" width="180" className="mb-6" alt="logo" />
        <Upload />
      </div>
    </div>
  );
}
