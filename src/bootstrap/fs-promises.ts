// @ts-nocheck
import { promises } from './switch.js';
export { constants } from './switch.js';

export default promises;

export const access = (...args) => promises.access.apply(promises, args);
export const copyFile = (...args) => promises.copyFile.apply(promises, args);
export const cp = (...args) => promises.cp.apply(promises, args);
export const glob = (...args) => promises.glob.apply(promises, args);
export const open = (...args) => promises.open.apply(promises, args);
export const opendir = (...args) => promises.opendir.apply(promises, args);
export const rename = (...args) => promises.rename.apply(promises, args);
export const truncate = (...args) => promises.truncate.apply(promises, args);
export const rm = (...args) => promises.rm.apply(promises, args);
export const rmdir = (...args) => promises.rmdir.apply(promises, args);
export const mkdir = (...args) => promises.mkdir.apply(promises, args);
export const readdir = (...args) => promises.readdir.apply(promises, args);
export const readlink = (...args) => promises.readlink.apply(promises, args);
export const symlink = (...args) => promises.symlink.apply(promises, args);
export const lstat = (...args) => promises.lstat.apply(promises, args);
export const stat = (...args) => promises.stat.apply(promises, args);
export const statfs = (...args) => promises.statfs.apply(promises, args);
export const link = (...args) => promises.link.apply(promises, args);
export const unlink = (...args) => promises.unlink.apply(promises, args);
export const chmod = (...args) => promises.chmod.apply(promises, args);
export const lchmod = (...args) => promises.lchmod.apply(promises, args);
export const lchown = (...args) => promises.lchown.apply(promises, args);
export const chown = (...args) => promises.chown.apply(promises, args);
export const utimes = (...args) => promises.utimes.apply(promises, args);
export const lutimes = (...args) => promises.lutimes.apply(promises, args);
export const realpath = (...args) => promises.realpath.apply(promises, args);
export const mkdtemp = (...args) => promises.mkdtemp.apply(promises, args);
export const writeFile = (...args) => promises.writeFile.apply(promises, args);
export const appendFile = (...args) => promises.appendFile.apply(promises, args);
export const readFile = (...args) => promises.readFile.apply(promises, args);
export const watch = (...args) => promises.watch.apply(promises, args);