import { env } from 'cloudflare:workers';
import { emptyWorkspace, workspaceSchema, type Workspace } from '@/lib/domain/workspace';
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function readWorkspace(userId:string){const row=await database().prepare('SELECT revision, payload FROM workspaces WHERE user_id = ?').bind(userId).first<{revision:number,payload:string}>();return row?{revision:row.revision,workspace:workspaceSchema.parse(JSON.parse(row.payload))}:{revision:0,workspace:emptyWorkspace()};}
export async function saveWorkspace(userId:string,revision:number,workspace:Workspace){
 const payload=JSON.stringify(workspace);const now=new Date().toISOString();
 const result=revision===0?await database().prepare('INSERT INTO workspaces (user_id, revision, payload, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(user_id) DO NOTHING').bind(userId,payload,now).run():await database().prepare('UPDATE workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(payload,now,userId,revision).run();
 return result.meta.changes===1;
}
