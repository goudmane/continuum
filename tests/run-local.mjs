import {spawn} from 'node:child_process';
const port=8791;
const server=spawn(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port',String(port),'--inspector-port','0'],{stdio:['ignore','pipe','pipe']});
let started=false;const timeout=setTimeout(()=>{console.error('Local API test server did not become ready');server.kill('SIGTERM');process.exitCode=1},45000);
const run=async()=>{try{process.env.TEST_BASE_URL=`http://127.0.0.1:${port}`;await import('./api.mjs')}catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timeout);server.kill('SIGTERM')}};
for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{const s=b.toString();if(s.includes('Ready on')&&!started){started=true;void run()}});
