// @ts-expect-error keep react here
import React from 'react';

// styles
import '../css/TrackForm.css';

// lib
import { help } from './lib.ts';

export default function TrackForm() {
  return (
    <form className="track-form">
      <div className="input-group">
        <label htmlFor="title">Title</label>
        <span className="description">{ help.trackTitle }</span>
        <input id="title" type="text" />
      </div>
      <div className="input-group">
        <label htmlFor="description">Description</label>
        <span className="description">{ help.trackDescription }</span>
        <textarea
          id="description"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </form>
  );
}
