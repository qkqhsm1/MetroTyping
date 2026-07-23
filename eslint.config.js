import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.superpowers', '.artifacts'] },
  { ...js.configs.recommended, files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: { console: 'readonly', fetch: 'readonly', setTimeout: 'readonly' } } },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
)
