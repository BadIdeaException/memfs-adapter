// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import mocha from 'eslint-plugin-mocha';
import chai from 'eslint-plugin-chai-expect';
import friendly from 'eslint-plugin-chai-friendly';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Do not apply any linter rules to generated test files
  {
    ignores: ['test/**/*.spec.js']
  },

  // Apply mocha/chai rules only to files in test directory with extension .spec.ts
  {  
    ...mocha.configs.flat.recommended,
    files: ['test/**/*.spec.ts'],
  },
  {
    ...chai.configs['recommended-flat'],
    files: ['test/**/*.spec.ts']
  },
  { 
    ...friendly.configs.recommendedFlat,  
    files: ['test/**/*.spec.ts'],
    // Workaround, because eslint-plugin-chai-friendly does not turn off the typescript rule 
    // (https://github.com/ihordiachenko/eslint-plugin-chai-friendly/issues/41)
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      ...friendly.configs.recommendedFlat.rules
    }
  }
);