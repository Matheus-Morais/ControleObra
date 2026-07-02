// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    // Regras gerais (core) — warnings conhecidos, não quebram o CI.
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Regras novas e estritas alinhadas ao React Compiler (react-hooks v6 / expo 57).
      // Sinalizam padrões intencionais (timing/analytics em refs, sincronização
      // server→state em effects, mutação de sharedValue.value do Reanimated).
      // Mantidas como warning por serem falsos positivos ou refatoração futura.
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // Regras específicas de TypeScript — precisam do plugin registrado neste escopo.
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'babel.config.js', 'scripts/*'],
  },
];
