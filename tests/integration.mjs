import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const pg='C:/Program Files/PostgreSQL/18/bin/psql.exe',my=path.join(root,'.qa/mysql-portable/mysql-8.4.0-winx64/bin/mysql.exe');
const run=(exe,args,input,env={})=>{const r=spawnSync(exe,args,{input,encoding:'utf8',windowsHide:true,env:{...process.env,...env}});if(r.status!==0)throw Error(r.stderr||r.stdout||String(r.error));return r.stdout;};
const pgargs=['-h','127.0.0.1','-p','45432','-U','demo_owner','-d','rassvet_demo_2026','-v','ON_ERROR_STOP=1'];
const myargs=['--no-defaults','-h','127.0.0.1','-P','43307','-u','root','--default-character-set=utf8mb4'];
if(!process.argv.includes('--existing'))run(my,myargs,'CREATE DATABASE rassvet_demo_2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;');
const results=[];
for(const stack of ['mysql','postgresql']){
 const isMy=stack==='mysql';
 for(const file of (process.argv.includes('--existing')||!isMy?[]:['01-schema.sql','02-customers.sql','03-demo.sql'])){
  const sql=fs.readFileSync(path.join(root,'examples',stack,'Sql',file),'utf8');
  run(isMy?my:pg,isMy?[...myargs,'rassvet_demo_2026']:pgargs,sql);
 }
 const bin=path.join(root,'examples',stack,'bin/Debug');
 const env={DEMO_CONNECTION:isMy?'Server=127.0.0.1;Port=43307;Database=rassvet_demo_2026;User ID=root;SslMode=None;':'Host=127.0.0.1;Port=45432;Database=rassvet_demo_2026;Username=demo_owner;',DEMO_IMPORT_FILE:path.join(root,'materials/practice/2026/assets/M2/Заказчики.json')};
 run(path.join(bin,`Polesie.${stack}.exe`),['--test'],undefined,env);
 const result=fs.readFileSync(path.join(bin,'test-result.txt'),'utf8');
 results.push({stack,server:isMy?'MySQL 8.4.0':'PostgreSQL 18',result});
 run(path.join(bin,`Polesie.${stack}.exe`),['--screenshots',path.join(root,'materials/screenshots',stack)],undefined,env);
}
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/integration-results.json'),JSON.stringify(results,null,2));
console.log(results);
