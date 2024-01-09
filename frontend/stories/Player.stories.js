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
  args: {},
};
