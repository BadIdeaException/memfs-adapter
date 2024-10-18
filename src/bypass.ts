import { activate, deactivate } from './bootstrap/switch.js';

export default function <T>(op: () => T): T {
	const _fs = deactivate();
	const result: T = op();
	activate(_fs);
	return result;
};