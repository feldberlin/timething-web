import { Editor } from '../src/Editor';

export default {
  title: 'Editor',
  component: Editor,
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
    initialFocus: 3,
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
