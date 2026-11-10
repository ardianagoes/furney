import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const forbidden=['api.openai.com/v1/responses','process.env.OPENAI_API_KEY','OPENAI_API_KEY','FURNEY_SERVER_ONLY_CANARY','FURNEY_SERVER_MODEL_CANARY'];
for(const name of ['OPENAI_API_KEY','OPENAI_MODEL'])if(process.env[name]?.length>12)forbidden.push(process.env[name]);
let count=0;
function walk(dir){
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    if(statSync(path).isDirectory())walk(path);
    else if(/\.(?:js|css|html|map)$/.test(path)){
      count++;const data=readFileSync(path,'utf8');
      if(path.endsWith('.map')||forbidden.some(value=>data.includes(value)))throw new Error('Unexpected server data or source map in public artifact: '+path);
    }
  }
}
walk('dist');if(!count)throw new Error('No production artifacts found. Run npm run build first.');
console.log(`Checked ${count} browser artifacts: no server adapter/key identifiers, secret canaries, configured server values or source maps found.`);
