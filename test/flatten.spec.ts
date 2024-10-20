import { expect } from 'chai';
import flatten from '../src/flatten.js';
import adapter from '../src/index.js';
import { isDirectory, isFactory } from '../src/items.js';

describe('flatten', function () {
	const isDirectoryFactory = item => isDirectory(item) && isFactory(item);

	it('should add a file to the result', function () {
		['abc', Buffer.from('abc'), adapter.file({})].forEach(file => {
			const config = { '/test': file };
			expect(flatten(config, '')).to.have.property('/test', file);
		});
	});

	it('should add a symlink to the result', function () {
		const symlink = adapter.symlink({
			path: '/target'
		});
		const config = { '/test': symlink };
		expect(flatten(config, '')).to.have.property('/test', symlink);
	});

	it('should add a directory to the result', function () {
		[{}, adapter.directory({})].forEach(directory => {
			const config = { '/test': directory };
			const expected = { ...directory };
			if ('items' in expected) delete expected.items;
			expect(flatten(config, '')).to.have.property('/test').that.deep.equals(expected);
		});
	});

	it("should add a directory's contents to the result", function () {
		const items = { a: 'a', b: 'b', c: 'c' };
		[items, adapter.directory({ items })].forEach(directory => {
			const config = { '/test': directory };
			const result = flatten(config, '');

			expect(result).to.have.property('/test/a', items.a);
			expect(result).to.have.property('/test/b', items.b);
			expect(result).to.have.property('/test/c', items.c);
		});
	});

	it('should create intermediate directories for each component', function () {
		const config = { '/a/b/c': 'c' };
		const result = flatten(config, '');

		expect(result).to.have.property('/a').that.deep.equals({});
		expect(result).to.have.property('/a/b').that.deep.equals({});
	});

	it("should respect the config's definition for an intermediate directory, if one is given", function () {
		const config = {
			'/a/test': 'test',
			'/a': adapter.directory({})
		};
		const result = flatten(config, '');

		expect(result).to.have.property('/a').that.satisfies(isDirectoryFactory);
	});

	it('should ignore trailing slashes', function () {
		const config = {
			'/a': {},
			'/a/': {}
		};
		const result = flatten(config, '');
		expect(result).to.have.property('/a');
		expect(result).to.not.have.property('/a/');
	});

	it('should not care about leading slashes', function () {
		const config = {
			a: {},
			'/a': {}
		};
		const result = flatten(config, '');
		expect(result).to.have.property('/a');
		expect(result).not.to.have.property('a');
	});

	it('should not have an entry for the root dir', function () {
		const config = { '/a': 'test' };
		expect(flatten(config, '')).to.not.have.property('/');
	});
});
