import type { Preview } from '@storybook/vue3-vite';
import '../src/styles/main.css';
import { createPinia, setActivePinia } from 'pinia';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    }
  },
  // Setup Pinia for all stories
  decorators: [
    () => ({
      setup() {
        const pinia = createPinia();
        setActivePinia(pinia);
        return {};
      },
      template: '<story />'
    })
  ]
};

export default preview;