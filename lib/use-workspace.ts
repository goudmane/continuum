'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { toast } from 'sonner';
import { emptyWorkspace,sampleWorkspace,workspaceSchema,type Workspace } from './domain/workspace';
export function useWorkspace(){
 const [workspace,setWorkspace]=useState<Workspace>(emptyWorkspace);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [demo,setDemo]=useState(false);const [identity,setIdentity]=useState({userId:'',email:''});const [recovery,setRecovery]=useState<{workspace:Workspace,revision:number}|null>(null);
 const state=useRef(workspace);const revision=useRef(0);const lock=useRef(false);const key=useRef('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await fetch('/api/workspace');if(r.status===401){const sample=sampleWorkspace();state.current=sample;setWorkspace(sample);setDemo(true);return;}if(!r.ok)throw new Error('Unable to load your workspace. Please retry.');const body=await r.json() as {workspace:Workspace,revision:number,userId:string,email:string};state.current=body.workspace;revision.current=body.revision;setWorkspace(body.workspace);setIdentity({userId:body.userId,email:body.email});key.current='continuum-pending-'+body.userId;try{const raw=sessionStorage.getItem(key.current);if(raw){const p=JSON.parse(raw);if(workspaceSchema.safeParse(p.workspace).success)setRecovery(p);}}catch{} }catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{void load()},[load]);
 const commit=useCallback(async(next:Workspace)=>{if(lock.current)return false;const valid=workspaceSchema.safeParse(next);if(!valid.success){toast.error(valid.error.issues[0].message);return false;}if(demo){state.current=valid.data;setWorkspace(valid.data);toast.info('Updated in example mode. Sign in to keep your work.');return true;}
 lock.current=true;setBusy(true);setError('');try{try{sessionStorage.setItem(key.current,JSON.stringify({workspace:valid.data,revision:revision.current}));}catch{}
 const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:revision.current,workspace:valid.data})});const body=await response.json() as {revision:number,error?:string};if(!response.ok)throw new Error(body.error||'Unable to save');revision.current=body.revision;state.current=valid.data;setWorkspace(valid.data);setRecovery(null);try{sessionStorage.removeItem(key.current)}catch{}return true;}catch(e){setError((e as Error).message);setRecovery({workspace:valid.data,revision:revision.current});toast.error('Not saved. Your draft is preserved.');return false;}finally{lock.current=false;setBusy(false);}},[demo]);
 const mutate=useCallback((fn:(draft:Workspace)=>void)=>{const next=structuredClone(state.current);fn(next);return commit(next)},[commit]);
 const discardRecovery=()=>{setRecovery(null);setError('');try{sessionStorage.removeItem(key.current)}catch{}};
 const retry=async()=>{if(!recovery)return;if(recovery.revision!==revision.current){toast.error('The server version changed. Download the preserved draft before discarding it and reapplying your changes.');return;}await commit(recovery.workspace)};
 return {workspace,loading,busy,error,demo,identity,mutate,load,recovery,retry,discardRecovery,revision};
}
