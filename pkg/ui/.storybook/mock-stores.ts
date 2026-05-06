// Mock Pinia stores for Storybook
// Use in story decorators or directly in stories

import { createPinia, setActivePinia } from 'pinia';

// Create and activate Pinia for stories
export function setupPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

// Mock settings store
export const mockSettingsStore = {
  darkMode: false,
  region: 'us-east-1',
  // Add other store properties as needed
};

// Re-export for convenience
export { createPinia } from 'pinia';