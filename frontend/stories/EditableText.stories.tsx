import { useState } from 'react';
import EditableText from '../src/EditableText';

// wrapper
const EditableTextWrapper = () => {
  let [text, setText] = useState('Hello World');
  let [display, setDisplay] = useState();

  return (
    <>
      <EditableText
        setValue={setText}
        value={text === null ? 'Default' : text}
        onSave={
          (newValue: string) => {
            setDisplay(newValue)
          }
        }
      />
      { display &&
        <span>{display}</span>
      }
    </>
  );
};

export default {
  title: 'EditableText',
  component: EditableTextWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Bare = {
  args: {
  }
};
