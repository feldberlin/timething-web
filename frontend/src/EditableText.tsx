// @ts-expect-error keep react here
import React from 'react';

// styles
import '../css/EditableText.css';

// third party
import TextareaAutosize from 'react-textarea-autosize';

// props
type EditableTextProps = {
  className?: string | null;
  editing: boolean;
  value: string | null;
  setEditing: (editing: boolean) => void;
  setValue: (value: string) => void;
};

/**
 * Resizing text area. Looks like you're just editing the page with a cursor
 *
 */
export default function EditableText({
  className = null,
  editing = false,
  value = null,
  setEditing = () => {},
  setValue = () => {},
} : EditableTextProps) {
  return (
    <div className="editable-text">
      <TextareaAutosize
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        readOnly={!editing}
        className={className || undefined}
        onChange={(ev) => setValue(ev.target.value)}
        onClick={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onKeyDown={(ev) => {
          if (ev.keyCode === 13) {
            setEditing(false);
          }
        }}
        value={value || undefined}
      />
    </div>
  );
}
