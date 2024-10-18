import { expect } from 'chai';

describe('Module resolution hook', function () {
	const EXPORTS_BASE = [
		'F_OK',
		'R_OK',
		'W_OK',
		'X_OK',
		'constants',
		'Stats',
		'Dir',
		'Dirent',
		'ReadStream',
		'WriteStream',
		'accessSync',
		'appendFileSync',
		'chmodSync',
		'chownSync',
		'closeSync',
		'copyFileSync',
		'existsSync',
		'fchmodSync',
		'fchownSync',
		'fdatasyncSync',
		'fstatSync',
		'fsyncSync',
		'ftruncateSync',
		'futimesSync',
		'lchmodSync',
		'lchownSync',
		'linkSync',
		'lstatSync',
		'mkdirSync',
		'mkdtempSync',
		'openSync',
		'readdirSync',
		'readFileSync',
		'readlinkSync',
		'readSync',
		'readvSync',
		'realpathSync',
		'renameSync',
		'rmdirSync',
		'rmSync',
		'statSync',
		'symlinkSync',
		'truncateSync',
		'unlinkSync',
		'utimesSync',
		'lutimesSync',
		'writeFileSync',
		'writeSync',
		'writevSync',
		'cpSync',
		'statfsSync',
		'access',
		'appendFile',
		'chmod',
		'chown',
		'close',
		'copyFile',
		'createReadStream',
		'createWriteStream',
		'exists',
		'fchmod',
		'fchown',
		'fdatasync',
		'fstat',
		'fsync',
		'ftruncate',
		'futimes',
		'lchmod',
		'lchown',
		'link',
		'lstat',
		'mkdir',
		'mkdtemp',
		'open',
		'read',
		'readv',
		'readdir',
		'readFile',
		'readlink',
		'realpath',
		'rename',
		'rm',
		'rmdir',
		'stat',
		'symlink',
		'truncate',
		'unlink',
		'unwatchFile',
		'utimes',
		'lutimes',
		'watch',
		'watchFile',
		'write',
		'writev',
		'writeFile'
	];
	const EXPORTS_PROMISES = [
		'constants',
		'access',
		'appendFile',
		'chmod',
		'chown',
		'copyFile',
		'cp',
		'lchmod',
		'lchown',
		'lutimes',
		'link',
		'lstat',
		'mkdir',
		'mkdtemp',
		'open',
		'opendir',
		'readdir',
		'readFile',
		'readlink',
		'realpath',
		'rename',
		'rmdir',
		'rm',
		'stat',
		'statfs',
		'symlink',
		'truncate',
		'unlink',
		'utimes',
		'watch',
		'writeFile'
	];

	it('should import the switched-out library', async function () {
		await Promise.all(
			['fs', 'node:fs'].map(async specifier => {
				const imported = await import(specifier);
				const expected = await import('../src/bootstrap/fs-base.js');

				return expect(imported, specifier).to.equal(expected);
			})
		);

		await Promise.all(
			['fs/promises', 'node:fs/promises'].map(async specifier => {
				const imported = await import(specifier);
				const expected = await import('../src/bootstrap/fs-promises.js');

				return expect(imported, specifier).to.equal(expected);
			})
		);
	});

	it('should have default export', async function () {
		const base = await import('../src/bootstrap/fs-base.js');
		expect(base.default).to.exist.and.be.an('object').that.includes.all.keys(EXPORTS_BASE);

		const promises = await import('../src/bootstrap/fs-promises.js');
		expect(promises.default)
			.to.exist.and.be.an('object')
			.that.includes.all.keys(EXPORTS_PROMISES);
	});

	it('should have named exports', async function () {
		const base = await import('../src/bootstrap/fs-base.js');
		expect(base).to.include.all.keys(EXPORTS_BASE);

		const promises = await import('../src/bootstrap/fs-promises.js');
		expect(promises).to.include.all.keys(EXPORTS_PROMISES);
	});
});
