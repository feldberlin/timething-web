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
import { ZDocument, ZTokens, zDocumentToZTokens, Speaker } from './lib.ts';

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
  // speakers
  speakers,
  setSpeakers,
} : {
  focus: number,
  zDocument: ZDocument | null,
  setFocus: (f: number) => void,
  initialTranscriptionId: string,
  title: string | null,
  setTitle: (t: string) => void,
  speakers: Speaker[];
  setSpeakers: (s: Speaker[]) => void,
}) {

  log.info(`Rendering Editor component with focus ${focus}`);

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

  /**
   * Display ZTokens.
   *
   */
  function targets(tokens: ZTokens[]) {
    return tokens.map((token) => {

      // speaker token
      if (token.type === 'speaker') {
        const speakerIdx = speakers.findIndex((x) => x.id === token.value);
        if (speakerIdx == -1) {
          return null;
        }

        // found the speaker in the given speakers array
        const speaker = speakers[speakerIdx];

        // an editable speaker name
        return (
          <EditableText
            key={Math.random().toString()}
            className="pl-1 mt-5 -mb-2 font-semibold text-base-300"
            value={speaker.name}
            setValue={(name) => {
              const newSpeakers = [...speakers];
              newSpeakers[speakerIdx].name = name;
              setSpeakers(newSpeakers);
            }}
          />
        );

      // content token
      } else {
        return (
          <span key={Math.random()}>
            {token.value}
          </span>
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
          { zDocument !== null && targets(zDocumentToZTokens(zDocument)) }
        </div>
      </article>
    </>
  );
}
