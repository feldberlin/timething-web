import { Player } from '../src/player';

export default {
  title: 'Player',
  component: Player,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = {
  args: {
    initialTranscript: "Alex Papadamus, you've written a book. Yeah, how about that? It's called 'Keanu Reeves, most triumphant: the movies and meaning of an irrepressable icon'. But I have a question for you.",
  },
};

export const Focussed = {
  args: {
    initialTranscript: "Alex Papadamus, you've written a book. Yeah, how about that? It's called 'Keanu Reeves, most triumphant: the movies and meaning of an irrepressable icon'. But I have a question for you.",
    initialFocus: 3,
  },
};
