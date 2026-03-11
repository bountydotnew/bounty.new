import { config } from '@bounty/eslint-config/next';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
];
