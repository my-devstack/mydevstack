import storybook from "eslint-plugin-storybook";

import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default [{ ignores: ['dist/', 'node_modules/', 'storybook-static/'] }, {
  files: ['**/*.{js,ts,vue}'],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.es2021,
    },
    parser: pluginVue.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
    },
  },
  plugins: {
    vue: pluginVue,
    storybook,
  },
}, pluginJs.configs.recommended, ...tseslint.configs.recommended, ...pluginVue.configs['flat/recommended'], {
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-unused-vars': 'off',
    'vue/no-v-html': 'off',
    'vue/require-prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': 'off',
    'no-empty': 'off',
    'no-redeclare': 'off',
  },
}, ...(storybook.configs?.['flat/recommended'] || storybook.configs?.recommended || [])];