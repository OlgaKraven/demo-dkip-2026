import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const guide=JSON.parse(fs.readFileSync('content/program-guides.json','utf8')).visualstudio;
const built={};vm.runInNewContext(fs.readFileSync('site/program-data.js','utf8'),built);
test('application walkthrough covers every designer component and actual event binding',()=>{
 const controls=guide.steps.flatMap(s=>s.controls||[]);
 for(const form of ['LoginForm','MainForm']){
  const designer=fs.readFileSync(`examples/shared/UI/${form}.Designer.cs`,'utf8');
  const code=fs.readFileSync(`examples/shared/UI/${form}.cs`,'utf8');
  for(const [,type,name] of designer.matchAll(/private System\.Windows\.Forms\.(\w+) (\w+);/g)){
   assert.ok(controls.some(c=>c[0]===type&&c[1]===name),`${form}: missing ${type} ${name}`);
  }
  for(const [,name,event,method] of designer.matchAll(/this\.(\w+)\.(\w+) \+= new \w+\(this\.(\w+)\)/g)){
   assert.ok(controls.some(c=>c[1]===name&&c[2]===event&&c[3].startsWith(method+'(')),`${form}: ${name}.${event} → ${method}`);
   assert.ok(code.includes('void '+method+'('));
  }
 }
});
test('all application source files are available at the step where they are added',()=>{
 const files=guide.steps.flatMap(s=>s.codeFiles||[]);
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);}
 for(const file of walk('examples/shared').filter(f=>f.endsWith('.cs')))assert.ok(files.includes(file),file);
 for(const step of built.PROGRAM_GUIDES.visualstudio.steps)for(const file of step.files)assert.equal(file.code,fs.readFileSync(file.file,'utf8'));
 assert.equal(guide.steps.length,30);
});
