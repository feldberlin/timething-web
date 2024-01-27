import React from 'react';

// images
import downloadImg from '../download.svg';

// styles
import '../css/Editor.css';

import { WhisperResult, Track } from './lib.ts';

/**
 * The main document editor. Used to display and edit the transcript.
 *
 */
export default function Editor({
  transcript,
  track,
  focus,
  setFocus,
  initialTranscriptionId,
} : {
  transcript: WhisperResult | null,
  track: Track | null,
  focus: number,
  setFocus: (f: number) => void,
  initialTranscriptionId: string,
}) {
  /**
   * Event handlers
   *
   */
  function hClick(ev: React.MouseEvent<HTMLDivElement>) {
    const target = ev.target as HTMLElement;
    const key = target.getAttribute('data-key');
    if (key) {
      setFocus(parseInt(key, 10));
    }
  }

  function targets(text: string) {
    return text.trim().split(' ').map((word, index) => {
      if (index === focus) {
        return (
          <>
            <span className="bg-primary text-white rounded inline-block pl-1 pr-1 cursor-pointer" data-key={index}>{word}</span>
            <span> </span>
          </>
        );
      }
      return (
        <>
          <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1 cursor-pointer" data-key={index}>{word}</span>
          <span className="inline-block -ml-px"> </span>
        </>
      );
    });
  }

  const { title = 'Transcript' } = track || {};
  return (
    <>
      <h1 className="mb-5 flex justify-between">
        {title}
        <a
          href={`/export/${initialTranscriptionId}?format=srt`}
          className="editor-controls flex items-center text-sm text-secondary font-bold filter grayscale opacity-50 hover:filter-none hover:opacity-100"
          download
        >
          <img src={downloadImg} className="w-6 h-6" alt="Download" />
          <span className="ml-1">Download</span>
        </a>
      </h1>
      <div className="flex justify-end mb-5" />

      <article className={transcript ? 'article-loaded' : 'article-loading'}>
        { !transcript
          && (
          <div className="flex flex-col gap-4 w-full opacity-50">
            <div className="skeleton h-3 w-16 mt-5" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-3 w-16 mt-10" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
          </div>
          )}
        <div className="contents" onClick={hClick}>
          {targets(transcript ? transcript.text : '')}
        </div>
      </article>
    </>
  );
}
