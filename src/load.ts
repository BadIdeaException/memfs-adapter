import { Item, Directory, DirectoryFactory, FileFactory, DirectoryLiteral } from './items.js';
import fs, { Dirent, Stats } from 'fs';
import adapter from './index.js';
import path from 'node:path';

export default function load(target: string, recursive: boolean): DirectoryLiteral {
	let candidates: string[] = [target];

	if (fs.statSync(target).isDirectory()) {
		let dirents: Dirent[] = fs.readdirSync(target, {
			recursive,
			withFileTypes: true,
			encoding: 'utf8'
		});
		// Experimentally determined: in non-recursive mode, mockfs omits all child directories entirely
		if (!recursive) dirents = dirents.filter(dirent => dirent.isFile());

		const children: string[] = dirents.map((dirent: Dirent): string =>
			path.join(dirent.path, dirent.name)
		);
		candidates = candidates.concat(children);
	}
	const result: DirectoryLiteral = {};
	for (const candidate of candidates) {
		const stats = fs.statSync(candidate);
		const properties = {
			mode: stats.mode & 0o777,
			uid: stats.uid,
			gid: stats.gid,
			atime: stats.atime,
			mtime: stats.mtime,
			ctime: stats.ctime,
			birthtime: stats.birthtime
		};
		if (stats.isFile()) {
			result[path.relative(target, candidate)] = adapter.file({
				...properties,
				content: fs.readFileSync(candidate)
			});
		} else if (stats.isDirectory()) {
			result[path.relative(target, candidate)] = adapter.directory(properties);
		}
	}
	return result;
}
