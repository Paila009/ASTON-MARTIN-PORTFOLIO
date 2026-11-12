import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
execFileSync(process.execPath,[require.resolve('next/dist/bin/next'),'build'],{stdio:'inherit'});
// Next 16.4 on Windows emits catch-all segment payloads in nested folders,
// while its client requests dotted filenames. Retain originals and emit aliases.
let aliases=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name.startsWith('__next.'))flatten(full,dir,entry.name);else walk(full)}}}
function flatten(dir,dest,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())flatten(full,dest,prefix+'.'+entry.name);else{fs.copyFileSync(full,path.join(dest,prefix+'.'+entry.name));aliases++}}}
const exportDir = process.env.SITE_EXPORT_DIR || 'out';
walk(exportDir);
// Also permit publishing this exact export from a GitHub Pages branch.
fs.writeFileSync(path.join(exportDir,'.nojekyll'),'');
console.log('Static export ready; '+aliases+' segment payload aliases emitted.');
