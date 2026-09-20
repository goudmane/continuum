import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error('Tests may only run against local development');
const suffix=crypto.randomUUID();const alice='test-alice-'+suffix;const bob='test-bob-'+suffix;
async function request(user,method='GET',body,headers={}){const response=await fetch(base+'/api/workspace',{method,headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':'test@example.invalid'}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json()};}
assert.equal((await request(null)).status,401);
let state=await request(alice);assert.equal(state.status,200);assert.equal(state.body.revision,0);
const workspace=state.body.workspace;const now=new Date().toISOString();const task={id:'task1',title:'Only a title',description:'',status:'todo',priority:'normal',projectId:'',tags:[],dueDate:'',plannedDate:'2026-09-16',nextAction:'',blocker:'',progress:'',checklist:[],notebookEnabled:false,archived:false,deleted:false,position:1,createdAt:now,updatedAt:now};workspace.tasks.push(task);
assert.equal((await request(alice,'PUT',{revision:0,workspace})).status,200);
state=await request(alice);assert.equal(state.body.workspace.tasks[0].title,'Only a title');assert.equal(state.body.workspace.tasks[0].dueDate,'');assert.equal(state.body.workspace.tasks[0].notebookEnabled,false);
assert.equal((await request(bob)).body.workspace.tasks.length,0);
const stale=await request(alice,'PUT',{revision:0,workspace});assert.equal(stale.status,409);
const origin=await request(alice,'PUT',{revision:1,workspace},{Origin:'https://other.example'});assert.equal(origin.status,403);
const invalid=structuredClone(workspace);invalid.tasks[0].projectId='foreign-project';assert.equal((await request(alice,'PUT',{revision:1,workspace:invalid})).status,422);
workspace.notes.push({id:'note1',taskId:'task1',label:'Note',content:'# Saved context\n- [ ] Continue',createdAt:now,updatedAt:now});workspace.tasks[0].notebookEnabled=true;
workspace.sessions.push({id:'session1',taskId:'task1',startedAt:now,endedAt:null,summary:'',blocker:'',nextAction:''});assert.equal((await request(alice,'PUT',{revision:1,workspace})).status,200);
state=await request(alice);assert.equal(state.body.workspace.sessions[0].endedAt,null);assert.equal(state.body.workspace.notes[0].content,'# Saved context\n- [ ] Continue');
const badDate=structuredClone(workspace);badDate.tasks[0].dueDate='2026-99-99';assert.equal((await request(alice,'PUT',{revision:2,workspace:badDate})).status,422);
const hidden=structuredClone(workspace);hidden.projects.push({id:'p1',name:'Archived',description:'',color:'#123456',archived:true});hidden.tasks[0].projectId='p1';assert.equal((await request(alice,'PUT',{revision:2,workspace:hidden})).status,422);
const double=structuredClone(workspace);double.sessions.push({...double.sessions[0],id:'session2'});assert.equal((await request(alice,'PUT',{revision:2,workspace:double})).status,422);
const archived=structuredClone(workspace);archived.tasks[0].archived=true;assert.equal((await request(alice,'PUT',{revision:2,workspace:archived})).status,422);
workspace.sessions[0].endedAt=new Date(Date.now()+1000).toISOString();workspace.sessions[0].summary='A useful result';workspace.sessions[0].nextAction='Continue here';workspace.tasks[0].nextAction='Continue here';workspace.tasks[0].progress='A useful result';workspace.tasks[0].deleted=true;assert.equal((await request(alice,'PUT',{revision:2,workspace})).status,200);
workspace.tasks[0].deleted=false;assert.equal((await request(alice,'PUT',{revision:3,workspace})).status,200);
state=await request(alice);assert.equal(state.body.workspace.notes.length,1);assert.equal(state.body.workspace.sessions.length,1);assert.equal(state.body.workspace.tasks[0].nextAction,'Continue here');
// Two simultaneous saves from one revision must never both succeed.
const parallel=await Promise.all([request(alice,'PUT',{revision:4,workspace}),request(alice,'PUT',{revision:4,workspace})]);assert.deepEqual(parallel.map(r=>r.status).sort(),[200,409]);
assert.equal((await request(null,'PUT',{revision:0,workspace})).status,401);
assert.equal((await request(bob)).body.workspace.notes.length,0);assert.equal((await request(bob)).body.workspace.sessions.length,0);
console.log('PASS: authentication, ownership isolation, title-only creation, date separation, persistence, stale/concurrent saves, notebook recovery, one active session, soft delete and restore.');
