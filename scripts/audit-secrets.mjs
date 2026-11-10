// Read-only heuristic scan. Prints locations/rule names, never matched values.
// --history includes every locally available Git blob, including deleted files,
// fetched PR refs and unreachable objects; it cannot inspect unfetched forks.
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const git=(args,input)=>execFileSync('git',args,{input,maxBuffer:64*1024*1024});
const rules=[
  ['openai',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g],
  ['github',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/g],
  ['aws',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['google',/\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['slack',/\bxox[baprs]-[A-Za-z0-9-]{20,}/g],
  ['credential-url',/\b(?:https?|postgres(?:ql)?|mongodb(?:\+srv)?|redis):\/\/[^\s/@:]{2,}:[^\s/@]{8,}@/g],
  ['credential-assignment',/(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|aws_secret_access_key)["']?\s*[:=]\s*["']([A-Za-z0-9_+/=-]{24,})["']/gi],
];
const findings=[];let files=0,bytes=0;
function scan(label,buffer){
  files++;bytes+=buffer.length;
  const value=buffer.toString('utf8');
  for(const [rule,pattern] of rules){
    pattern.lastIndex=0;
    for(const match of value.matchAll(pattern))findings.push({location:label,line:value.slice(0,match.index).split('\n').length,rule});
  }
}
if(process.argv.includes('--history')){
  const objects=git(['cat-file','--batch-all-objects','--batch-check=%(objectname) %(objecttype) %(objectsize)']).toString().trim().split('\n').map(line=>line.split(' ')).filter(parts=>parts[1]==='blob');
  const raw=git(['cat-file','--batch'],objects.map(([sha])=>sha).join('\n')+'\n');
  let offset=0;
  while(offset<raw.length){
    const end=raw.indexOf(10,offset),[sha,,size]=raw.subarray(offset,end).toString().split(' ');
    offset=end+1;scan('git-blob:'+sha,raw.subarray(offset,offset+Number(size)));offset+=Number(size)+1;
  }
}else if(process.argv.includes('--dist')){
  function walk(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())walk(path);else scan(path,readFileSync(path));}}
  walk('dist');
}else{
  for(const file of git(['ls-files','-z']).toString().split('\0').filter(Boolean))scan(file,readFileSync(file));
}
console.log(JSON.stringify({scope:process.argv.includes('--history')?'all-local-git-blobs':process.argv.includes('--dist')?'dist':'tracked-files',files,bytes,findings},null,2));
if(findings.length)process.exitCode=1;
