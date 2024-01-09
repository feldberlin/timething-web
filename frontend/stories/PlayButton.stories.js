import { PlayButton } from '../src/play-button';

export default {
  title: 'PlayButton',
  component: PlayButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = {
  args: { },
};

export const Playing = {
  args: {
    playing: true
  },
};
