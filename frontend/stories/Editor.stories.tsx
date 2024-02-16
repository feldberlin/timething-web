import { useState } from 'react';
import Editor from '../src/Editor';

// wrapper
const EditorWrapper = (props) => {
  let [editing, setEditing] = useState(false);
  let [text, setText] = useState(props.title);

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

// example data
const helloWorldDoc: ZDocument = {
  words: ["hello", "world", "this", "is", "a", "test"],
  scores: [0.9, 0.8, 0.95, 0.7, 0.85, 0.6],
  speakers: ["Rany", "Alexey"],
  turns: [
    [0, 0], // Speaker 1 said "hello"
    [1, 1], // Speaker 2 said "world"
    [0, 2], // Speaker 1 said "this"
    [1, 3], // Speaker 2 said "is"
    [0, 4], // Speaker 1 said "a"
    [1, 5], // Speaker 2 said "test"
  ],
};

export const Primary = {
  args: {
    zDocument: helloWorldDoc,
    setFocus: (ev) => { console.log('focus', ev) },
  },
};

export const Focussed = {
  args: {
    zDocument: helloWorldDoc,
    setFocus: (ev) => { console.log('focus', ev) },
    focus: 3,
  },
};

export const Named = {
  args: {
    zDocument: helloWorldDoc,
    title: 'Hello World',
    setFocus: (ev) => { console.log('focus', ev) },
  },
};
