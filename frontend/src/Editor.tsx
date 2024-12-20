import React from 'react';

// third party
// @ts-expect-error no types
import * as _ from 'underscore';
import * as log from 'loglevel';

// components
import EditableText from './EditableText.tsx';

// images
import downloadImg from '../download.svg';

// styles
import '../css/Editor.css';

// lib
import { ZDocument, zDocumentToZTokens, Speaker } from './lib.ts';

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
  speakers: Speaker[];
  setSpeakers: (s: Speaker[]) => void,
  editingSpeaker: string | null,
  setEditingSpeaker: (s: string | null) => void,
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
      if (token.type === 'speaker') {
        const speakerId = token.value;
        const speaker = speakers.find((x) => x.id === speakerId);
        if (!speaker) {
          // could not find the speaker
          log.error('could not find speaker: ', speakerId, ' in ', speakers);
          return (null);
        }
        return (
          <h3 key={speakerId} className="-mb-2 mt-1">
            <EditableText
              className="mt-4 font-semibold text-base-300"
              value={speaker.name}
              setValue={(name) => {
                const newSpeakers = [...speakers];
                const s = newSpeakers.find((x) => x.id === speaker.id);
                if (s) {
                  s.name = name;
                  setSpeakers(newSpeakers);
                }
              }}
              editing={editingSpeaker === speaker.id}
              setEditing={() => {
                setEditingSpeaker(speaker.id);
              }}
            />
          </h3>
        );
      }

      if (token.type === 'content') {
        if (token.wordIndex === focus) {
          return (
            <>
              <span className="focussed inline-block cursor-pointer" data-key={token.wordIndex}>{token.value}</span>
              <span> </span>
            </>
          );
        }

        return (
          <>
            <span className="unfocussed inline-block cursor-pointer" data-key={token.wordIndex}>{token.value}</span>
            <span> </span>
          </>
        );
      }

      return <> </>;
    });
  }

  return (
    <div className="transcript-editor">
      <h1 className="mb-4 flex justify-between">
        {zDocument !== null
          ? (
            <>
              <EditableText
                editing={editingTitle}
                setEditing={setEditingTitle}
                setValue={setTitle}
                value={title === null ? 'Script' : title}
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
    </div>
  );
}
