import {
	Directory,
	DirectoryFactory,
	DirectoryLiteral,
	Item,
	isDirectory,
	isFactory,
	isFile,
	isSymlink
} from './items.js';
import path from 'node:path';

/**
 * Flattens the given `config`, such that nested directories are instead turned into their corresponding absolute paths on the
 * root level. I.e. turns
 * ```
 * {
 * 	a: {
 * 		b: {
 * 			c: 'foo'
 * 		}
 * 	}
 * }
 * ```
 * into
 * ```
 * {
 * 	'/a': {},
 * 	'/a/b: {},
 * 	'/a/b/c': 'foo'
 * }
 * ```
 */
export default function flatten(
	directory: DirectoryLiteral,
	partialPath: string
): DirectoryLiteral {
	function mkdirp(filename: string): DirectoryLiteral {
		const result: DirectoryLiteral = {};
		for (
			let idx = filename.indexOf(path.sep);
			idx > -1;
			idx = filename.indexOf(path.sep, idx + 1)
		) {
			result[path.resolve(partialPath, filename.slice(0, idx))] ??= {};
		}
		return result;
	}

	const result: DirectoryLiteral = {};

	for (let filename in directory) {
		const item: Item = directory[filename];
		// Remove trailing slash, if present.
		if (filename.endsWith('/')) filename = filename.slice(0, -1);

		// Create required entries for intermediate directories, if the filename is a multi-component path
		// I.e. if filename is a/b/foo, create (empty) directory entries for a and a/b on the config
		Object.assign(result, mkdirp(filename));

		if (isDirectory(item)) {
			let subdir: Directory;
			// If item is a factory, use it (but make it empty by deleting the items property).
			// Otherwise, use an empty directory
			if (isFactory(item)) {
				subdir = { ...item };
				delete subdir.items;
			} else {
				subdir = {};
			}
			result[path.resolve(partialPath, filename)] = subdir;
			// Recursively flatten the child items of the directory, then add them to the result,
			// prefixing the partialPath
			let items: Directory = isFactory(item)
				? ((item as DirectoryFactory).items ?? {})
				: item;
			items = flatten(items, path.resolve(partialPath, filename));
			Object.assign(result, items);
		} else result[path.resolve(partialPath, filename)] = item;
	}

	// Delete entry for root directory, which cannot be recreated
	delete result['/'];
	return result;
}
