import React from 'react';

// styles
import '../css/EditableText.css';

// third party
import TextareaAutosize from 'react-textarea-autosize';

// props
type EditableTextProps = {
  className?: string | null;
  value: string | null;
  setValue: (value: string) => void;
  onUpdate?: (value: string) => void;
};

/**
 * Resizing text area. Looks like you're just editing the page with a cursor
 *
 */
export default function EditableText({
  className = null,
  value = null,
  setValue = () => {},
  onUpdate = () => {},
} : EditableTextProps) {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <div className="editable-text">
      <TextareaAutosize
        ref={textAreaRef}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className={className || undefined}
        onChange={(ev) => {
          const val = ev.target.value;
          setValue(val);
          onUpdate(val);
        }}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === 'Escape') {
            if (textAreaRef.current !== null) {
              textAreaRef.current.blur();
            }
          }
        }}
        value={value || undefined}
      />
    </div>
  );
}
