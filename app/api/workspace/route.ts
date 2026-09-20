import { z } from 'zod';
import { workspaceSchema } from '@/lib/domain/workspace';
import { readWorkspace,saveWorkspace } from '@/db/workspaces';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){const user=request.headers.get('oai-authenticated-user-id');if(!user)return reply({error:'Sign in to load your workspace.'},401);try{return reply({...await readWorkspace(user),userId:user,email:request.headers.get('oai-authenticated-user-email')??''});}catch(error){console.error('Workspace read failed',error);return reply({error:'Your workspace could not be loaded. Please retry.'},503);}}
export async function PUT(request:Request){const user=request.headers.get('oai-authenticated-user-id');if(!user)return reply({error:'Sign in to save your workspace.'},401);
 const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)return reply({error:'Invalid request origin'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON required'},415);
 try{const raw=await request.text();if(raw.length>1_000_000)return reply({error:'Workspace exceeds the 1 MB limit.'},413);const parsed=z.object({revision:z.number().int().nonnegative(),workspace:workspaceSchema}).safeParse(JSON.parse(raw));if(!parsed.success)return reply({error:parsed.error.issues[0]?.message??'Invalid workspace'},422);
 if(!await saveWorkspace(user,parsed.data.revision,parsed.data.workspace))return reply({error:'This workspace changed in another tab. Your draft is preserved. Reload the latest version before applying your changes.'},409);
 return reply({revision:parsed.data.revision+1});}catch(error){if(error instanceof SyntaxError)return reply({error:'Invalid JSON'},400);console.error('Workspace save failed',error);return reply({error:'Could not save. Your draft is preserved; please retry.'},503);}}
