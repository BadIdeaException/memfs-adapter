import { register } from 'node:module';

// Register our import resolution hook.
register('./hook.js', import.meta.url);
