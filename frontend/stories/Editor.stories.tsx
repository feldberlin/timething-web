import { useState } from 'react';
import Editor from '../src/Editor';
import fixtureData from '../../fixtures/alexey.json';
import { transcriptionToZDocument } from '../src/lib';

// wrapper
const EditorWrapper = (props) => {
  let [editing, setEditing] = useState(false);
  let [text, setText] = useState(props.title);
  let [speakers, setSpeakers] = useState(props.zDocument.speakers);
  let [editingSpeaker, setEditingSpeaker] = useState(null);

  return (
    <Editor
      {...props}
      title={text}
      setTitle={setText}
      editingTitle={editing}
      setEditingTitle={setEditing}
      speakers={speakers}
      setSpeakers={setSpeakers}
      editingSpeaker={editingSpeaker}
      setEditingSpeaker={setEditingSpeaker}
    />
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

// hello world data
const helloWorldDoc: ZDocument = {
  words: ["Hello", "world,", "this", "is", "a", "test!"],
  scores: [0.9, 0.8, 0.95, 0.7, 0.85, 0.6],
  speakers: [
    { key: "rany", name: "Rany" },
    { key: "alexey", name: "Alexey" },
  ],
  turns: [
    [0, 0], // Rany said "hello world"
    [1, 2], // Alexey said "this"
    [0, 3], // Rany said "is"
    [1, 4], // Alexey said "a test"
  ],
};

const realZDocument = transcriptionToZDocument(fixtureData);

// more realistic data from file

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

export const RealData = {
  args: {
    zDocument: realZDocument,
    title: 'Hello World',
    setFocus: (ev) => { console.log('focus', ev) },
  },
};
