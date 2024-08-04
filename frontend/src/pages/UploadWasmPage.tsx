// @ts-expect-error keep react here
import React from 'react';

// components
import UploadWasm from '../UploadWasm.tsx';

// images
import logoUrl from '../../timething.svg';

/**
 * Upload page. Mounted on /upload
 *
 */
export default function UploadWasmPage() {
  return (
    <div className="flex flex-col items-center h-screen bg-images w-full pt-14">
      <div className="mt-20 ">
        <img src={logoUrl} height="36" width="180" className="mb-6" alt="logo" />
        <UploadWasm />
      </div>
    </div>
  );
}
