import { useState } from 'react';
import Editor from '../src/Editor';

// wrapper
const EditorWrapper = (props) => {
  let [editing, setEditing] = useState(false);
  let [text, setText] = useState();
  return (
    <Editor
      {...props}
      editingTitle={editing}
      setEditingTitle={setEditing}
      title={text}
      setTitle={setText} />
  );
};

export default {
  title: 'Editor',
  component: EditorWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

const transcript = {
  text: "Alex Papadamus, you've written a book. Yeah, how about that? It's called 'Keanu Reeves, most triumphant: the movies and meaning of an irrepressable icon'. But I have a question for you.",
}

export const Primary = {
  args: {
    transcript: transcript,
    setFocus: (ev) => { console.log('focus', ev) },
  },
};

export const Focussed = {
  args: {
    transcript: transcript,
    setFocus: (ev) => { console.log('focus', ev) },
    focus: 3,
  },
};

export const Named = {
  args: {
    transcript: transcript,
    setFocus: (ev) => { console.log('focus', ev) },
    track: {
      name: 'Keanu Reeves, most triumphant',
    }
  },
};
