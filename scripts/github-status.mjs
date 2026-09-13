import {spawnSync} from 'node:child_process';
const r=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true});
if(r.status!==0)throw Error('GitHub credential unavailable');
const data=Object.fromEntries(r.stdout.trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}));
const base='https://api.github.com/repos/OlgaKraven/demo-dkip-2026';
const endpoint=process.argv[2]||'';
const method=process.argv[3]||'GET';
if(!['','/pages','/actions/runs','/actions/workflows/pages.yml/dispatches'].includes(endpoint))throw Error('Unsupported endpoint');
const response=await fetch(base+endpoint,{method,headers:{Authorization:'Bearer '+data.password,Accept:'application/vnd.github+json','User-Agent':'demo-dkip-2026','X-GitHub-Api-Version':'2022-11-28'},...(method==='POST'?{body:JSON.stringify(endpoint==='/pages'?{build_type:'workflow'}:{ref:'main'})}:{})});
const text=await response.text();
let body;try{body=JSON.parse(text);}catch{body={};}
console.log(JSON.stringify({status:response.status,...(endpoint==='/actions/runs'?{runs:body.workflow_runs?.slice(0,4).map(r=>({id:r.id,status:r.status,conclusion:r.conclusion,html_url:r.html_url,head_sha:r.head_sha}))}:endpoint==='/pages'?{url:body.html_url,build_type:body.build_type,message:body.message}:endpoint===''?{visibility:body.visibility,default_branch:body.default_branch,permissions:body.permissions,message:body.message}:{message:body.message})},null,2));
