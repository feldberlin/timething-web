import React from 'react';

// images
import downloadImg from '../download.svg';

// styles
import '../css/Editor.css';

// components
import EditableText from './EditableText.tsx';

// lib
import { WhisperResult, Track } from './lib.ts';

/**
 * The main document editor. Used to display and edit the transcript.
 *
 */
export default function Editor({
  initialTranscriptionId,
  transcript,
  track,
  // focus
  focus,
  setFocus,
  // title
  title = null,
  editingTitle,
  setEditingTitle,
  setTitle,
} : {
  transcript: WhisperResult | null,
  track: Track | null,
  focus: number,
  setFocus: (f: number) => void,
  initialTranscriptionId: string,
  title: string | null,
  editingTitle: boolean,
  setEditingTitle: (e: boolean) => void,
  setTitle: (t: string) => void,
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

  return (
    <>
      <h1 className="mb-10 flex justify-between">
        {track !== null
          ? (
            <>
              <EditableText
                editing={editingTitle}
                setEditing={setEditingTitle}
                setValue={setTitle}
                value={title === null ? 'Transcript' : title}
              />
              <a
                href={`/export/${initialTranscriptionId}?format=srt`}
                className="editor-controls flex items-start ml-4 text-sm text-secondary font-bold filter grayscale opacity-50 hover:filter-none hover:opacity-100"
                download
              >
                <img src={downloadImg} className="w-6 h-6" alt="Download" />
                <span className="ml-1 mt-1">Download</span>
              </a>
            </>
          )
          : (
            <div className="flex flex-col w-full opacity-50">
              <div className="skeleton h-5 w-28" />
            </div>
          )}
      </h1>

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
