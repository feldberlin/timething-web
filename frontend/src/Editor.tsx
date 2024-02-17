import React from 'react';

// third party
// @ts-expect-error no types
import * as _ from 'underscore';

// components
import EditableText from './EditableText.tsx';

// images
import downloadImg from '../download.svg';

// styles
import '../css/Editor.css';

// lib
import { ZDocument, zDocumentToZTokens } from './lib.ts';

// data
import { debouncedPutTitle } from './data.ts';

/**
 * The main document editor. Used to display and edit the transcript.
 *
 */
export default function Editor({
  initialTranscriptionId,
  zDocument,
  // focus
  focus,
  setFocus,
  // title
  title = null,
  setTitle,
  editingTitle,
  setEditingTitle,
  // speakers
  speakers,
  setSpeakers,
  editingSpeaker,
  setEditingSpeaker,
} : {
  focus: number,
  zDocument: ZDocument | null,
  setFocus: (f: number) => void,
  initialTranscriptionId: string,
  title: string | null,
  setTitle: (t: string) => void,
  editingTitle: boolean,
  setEditingTitle: (e: boolean) => void,
  speakers: string[],
  setSpeakers: (s: string[]) => void,
  editingSpeaker: number | null,
  setEditingSpeaker: (s: number | null) => void,
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

  function targets(zDoc: ZDocument) {
    return zDocumentToZTokens(zDoc).map((token) => {
      if (token.type == 'speaker-index') {
          const iSpeaker = Number(token.value);
          return (
            <h3 className="-mb-2 mt-1">
              <EditableText
                className="pl-1 mt-4 font-semibold text-base-300"
                value={speakers[iSpeaker]}
                setValue={(name) => {
                  const newSpeakers = [...speakers]
                  newSpeakers[iSpeaker] = name
                  setSpeakers(newSpeakers)
                }}
                editing={editingSpeaker === iSpeaker} 
                setEditing={() => {
                  setEditingSpeaker(iSpeaker)
                }}
              />
            </h3>
          );

      } else if (token.type == 'content') {
        if (token.wordIndex === focus) {
          return (
            <>
              <span className="bg-primary text-white rounded inline-block pl-1 pr-1 cursor-pointer" data-key={token.wordIndex}>{token.value}</span>
              <span> </span>
            </>
          );
        }

        return (
          <>
            <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1 cursor-pointer" data-key={token.wordIndex}>{token.value}</span>
            <span className="inline-block -ml-px"> </span>
          </>
        );
      }
    });
  }

  return (
    <>
      <h1 className="mb-4 flex justify-between">
        {zDocument !== null
          ? (
            <>
              <EditableText
                editing={editingTitle}
                setEditing={setEditingTitle}
                setValue={setTitle}
                value={title === null ? 'Transcript' : title}
                onUpdate={_.partial(debouncedPutTitle, initialTranscriptionId)}
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

      <article className={zDocument ? 'article-loaded' : 'article-loading'}>
        { !zDocument
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
          { zDocument !== null && targets(zDocument) }
        </div>
      </article>
    </>
  );
}
