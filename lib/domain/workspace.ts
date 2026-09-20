import { z } from 'zod';
export const statuses = ['todo','in_progress','blocked','done'] as const;
export const statusLabels = {todo:'To do',in_progress:'In progress',blocked:'Blocked',done:'Done'};
const id = z.string().min(1).max(100);
const dateOnly = z.string().refine(s=>s==='' || /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s+'T12:00:00Z').getTime()) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,'Invalid date');
const timestamp = z.string().datetime();
export const projectSchema=z.object({id,name:z.string().trim().min(1).max(100),description:z.string().max(2000),color:z.string().regex(/^#[a-fA-F0-9]{6}$/),archived:z.boolean()});
export const taskSchema=z.object({id,title:z.string().trim().min(1).max(240),description:z.string().max(10000),status:z.enum(statuses),priority:z.enum(['low','normal','high','urgent']),projectId:z.string(),tags:z.array(z.string().max(40)).max(20),dueDate:dateOnly,plannedDate:dateOnly,nextAction:z.string().max(2000),blocker:z.string().max(2000),progress:z.string().max(4000),checklist:z.array(z.object({id,text:z.string().max(500),done:z.boolean()})).max(100),notebookEnabled:z.boolean(),archived:z.boolean(),deleted:z.boolean(),position:z.number().finite(),createdAt:timestamp,updatedAt:timestamp});
export const noteSchema=z.object({id,taskId:id,label:z.enum(['Note','Investigation','Attempt','Result','Decision','Reference']),content:z.string().max(30000),createdAt:timestamp,updatedAt:timestamp});
export const sessionSchema=z.object({id,taskId:id,startedAt:timestamp,endedAt:timestamp.nullable(),summary:z.string().max(4000),blocker:z.string().max(2000),nextAction:z.string().max(2000)});
export const workspaceSchema=z.object({projects:z.array(projectSchema).max(100),tasks:z.array(taskSchema).max(2000),notes:z.array(noteSchema).max(3000),sessions:z.array(sessionSchema).max(5000)}).superRefine((w,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:z.ZodIssueCode.custom,message});
 for(const list of [w.projects,w.tasks,w.notes,w.sessions]) if(new Set(list.map(x=>x.id)).size!==list.length) fail('Duplicate identifiers');
 const projects=new Set(w.projects.map(x=>x.id)); const tasks=new Map(w.tasks.map(x=>[x.id,x]));
 if(w.tasks.some(t=>t.projectId&&!projects.has(t.projectId)))fail('Unknown project');
 if([...w.notes,...w.sessions].some(n=>!tasks.has(n.taskId)))fail('Unknown task');
 if(w.sessions.filter(s=>!s.endedAt).length>1)fail('Finish the active session before starting another');
 if(w.sessions.some(s=>s.endedAt && s.endedAt<s.startedAt))fail('Session must end after it starts');
 if(w.sessions.some(s=>!s.endedAt && (tasks.get(s.taskId)?.deleted || tasks.get(s.taskId)?.archived || w.projects.some(p=>p.id===tasks.get(s.taskId)?.projectId && p.archived))))fail('Finish the active session before archiving or deleting its task');
});
export type Workspace=z.infer<typeof workspaceSchema>;
export type Task=z.infer<typeof taskSchema>;
export type Project=z.infer<typeof projectSchema>;
export type Note=z.infer<typeof noteSchema>;
export type Session=z.infer<typeof sessionSchema>;
export const emptyWorkspace=():Workspace=>({projects:[],tasks:[],notes:[],sessions:[]});
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function makeTask(title:string,projectId=''):Task {const now=new Date().toISOString();return {id:crypto.randomUUID(),title:title.trim(),description:'',status:'todo',priority:'normal',projectId,tags:[],dueDate:'',plannedDate:'',nextAction:'',blocker:'',progress:'',checklist:[],notebookEnabled:false,archived:false,deleted:false,position:Date.now(),createdAt:now,updatedAt:now};}
export function sampleWorkspace():Workspace {
 const today=localDate();const tomorrow=localDate(new Date(Date.now()+86400000));const now=new Date().toISOString();
 const projects:Project[]=[{id:'p1',name:'RIS TV',description:'A smoother experience for every room.',color:'#8571dd',archived:false},{id:'p2',name:'Personal',description:'Make space for life outside of work.',color:'#4ea88e',archived:false},{id:'p3',name:'BringMeBack',description:'Thoughtful improvements, one at a time.',color:'#db9b54',archived:false}];
 const definitions=[['Refine remote navigation','p1','in_progress','high','Test focus movement from the first row to the center.'],['Plan the weekend','p2','todo','normal',''],['Review authentication flow','p3','todo','high',''],['Write deployment checklist','p1','blocked','normal','Confirm the maintenance window.'],['Book laptop repair','p2','todo','low',''],['Organize project references','','done','normal','']];
 const tasks=definitions.map(([title,projectId,status,priority,nextAction],i)=>({...makeTask(title,projectId),id:`t${i+1}`,status:status as Task['status'],priority:priority as Task['priority'],nextAction,plannedDate:today,dueDate:i===0?today:i===2?tomorrow:'',position:i,notebookEnabled:i===0,tags:i===0?['UX','navigation']:[],description:i===0?'Keep the selection near the middle of the screen as the channel list scrolls. Test with both short and long lists.':'',progress:i===0?'Focus now advances correctly within the first row. The scroll threshold still needs a check.':'',blocker:i===3?'Waiting for the maintenance window.':'',checklist:i===0?[{id:'c1',text:'Reproduce with a long channel list',done:true},{id:'c2',text:'Check the first and last rows',done:false}]:[]}));
 return {projects,tasks,notes:[{id:'n1',taskId:'t1',label:'Investigation',content:'## Current behavior\nFocus moves, but the list does not follow after the middle row.\n\n- Keep the focused item visible.\n- Clamp scrolling at the beginning and end.\n\n```javascript\nconst target = Math.max(0, activeRow - middleRow);\n```',createdAt:now,updatedAt:now}],sessions:[{id:'s1',taskId:'t1',startedAt:new Date(Date.now()-5400000).toISOString(),endedAt:new Date(Date.now()-3600000).toISOString(),summary:'Reproduced the issue and isolated the scroll threshold.',blocker:'',nextAction:'Test focus movement from the first row to the center.'}]};
}
