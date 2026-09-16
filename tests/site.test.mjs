import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
import '../src/core.js';import '../src/conditions.js';import '../src/practice.js';
import {makeVariants} from '../scripts/mock-variants.mjs';
const sandbox={};vm.runInNewContext(fs.readFileSync('site/course.js','utf8')+fs.readFileSync('site/lessons.js','utf8'),sandbox);
const {COURSE:c,LESSONS:lessons}=sandbox,y=c.years[0];
test('only verified 2026 basic level and five modules',()=>{assert.equal(c.years.length,1);assert.equal(y.year,2026);assert.equal(y.modules.length,5);assert.equal(y.totalSeconds,9000);assert.equal(y.assessment.maxPoints,50);assert.equal(y.assessment.criteria.reduce((s,r)=>s+r.points,0),50);ExamCore.validateCourse(c);});
test('all modules have substantial stepwise explanations for both stacks',()=>{for(const m of y.modules)for(const s of ['mysql','postgresql']){const html=lessons[m.id][s];assert.ok(html.length>4000);assert.ok((html.match(/<h3/g)||[]).length>=7);assert.doesNotMatch(html,/\{\{(?:code|stack)/);assert.doesNotMatch(html,/data-stack-only/);}});
test('every lesson download, code file and image exists',()=>{for(const lesson of Object.values(lessons))for(const html of Object.values(lesson))for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){const u=m[1];if(/^(#|https?:)/.test(u))continue;const file=new URL(u,'https://course.test/index.html').pathname;assert.ok(fs.existsSync(path.join('site',decodeURIComponent(file))),u);}});
test('two distinct source archives and eight real form captures',()=>{for(const s of ['mysql','postgresql']){assert.ok(fs.statSync(`site/downloads/polesie-${s}.zip`).size>100000);for(const p of ['login','customers','costs','users'])assert.ok(fs.statSync(`site/screenshots/${s}/${p}.png`).size>10000);}});
test('practice and mock use source tasks, preserve different timer rules',()=>{const get=()=>null,set=()=>{};const training=ExamPractice.render({c,year:y,mode:'training',get,set});assert.match(training,/Моя тренировка/);assert.match(training,/20 минут/);const mock=ExamPractice.render({c,year:y,mode:'mock',get,set});assert.match(mock,/150 минут/);assert.doesNotMatch(mock,/id="practice-pause"/);assert.match(mock,/Перед началом/);});
test('frozen sample assets and original source PDF exist',()=>{for(const t of y.practice.tasks){assert.ok(fs.existsSync('site/'+t.zip));for(const f of t.files)assert.ok(fs.existsSync('site/'+f.url));}assert.ok(fs.existsSync('site/'+y.source.url));});
test('each source workbook has a local sheet preview and SQL guide contains complete source code',()=>{
 const data={};vm.runInNewContext(fs.readFileSync('site/file-previews.js','utf8')+fs.readFileSync('site/program-data.js','utf8'),data);
 for(const file of y.practice.tasks.flatMap(t=>t.files).filter(f=>f.url.endsWith('.xlsx'))){
  const preview=data.FILE_PREVIEWS[decodeURIComponent(file.url)];assert.ok(preview?.sheets.length,file.url);
  for(const sheet of preview.sheets){assert.ok(sheet.name);assert.match(sheet.html,/<table/);assert.match(sheet.html,/title="[A-Z]+[0-9]+"/);}
 }
 for(const step of data.PROGRAM_GUIDES.sql.steps.filter(s=>s.codeFile))assert.equal(step.code,fs.readFileSync(step.codeFile,'utf8'));
 const dump=fs.readFileSync('site/downloads/polesie-mysql-database.sql','utf8');assert.match(dump,/PROCEDURE.*calculate_order_material_costs/);assert.doesNotMatch(dump,/DEFINER=/);
});
test('program walkthroughs have usable steps, existing screenshots and working local resources',()=>{
 const guides=JSON.parse(fs.readFileSync('content/program-guides.json','utf8'));
 for(const guide of Object.values(guides))for(const step of guide.steps){
  assert.ok(step.title&&step.goal&&step.actions.length&&step.check);
  for(const url of [step.image,step.link?.url].filter(Boolean)){
   if(url.startsWith('?'))continue;
   for(const stack of ['mysql','postgresql'])assert.ok(fs.existsSync(path.join('site',decodeURIComponent(url.replaceAll('{{stack}}',stack)))),url);
  }
 }
 assert.ok(guides.phpmyadmin.steps.some(s=>s.catalog));
 assert.ok(guides.phpmyadmin.steps.some(s=>s.image?.endsWith('14-foreign-keys.png')));
 assert.match(JSON.stringify(guides.sql),/371,00.*126,45.*183,95/);
 assert.match(JSON.stringify(guides.visualstudio),/\.NET Framework 4\.8/);
 for(const name of ['programs','study-steps'])new vm.Script(fs.readFileSync('src/'+name+'.js','utf8'));
});
test('30 complete mock variants have valid references, prices and distinct calculations',()=>{
 const variants=makeVariants(),totals=new Set();assert.equal(variants.length,30);assert.equal(y.mockVariants.length,30);
 for(const v of variants){
  assert.equal(v.tasks.length,5);assert.equal(v.customers.length,6);assert.equal(new Set(v.customers.map(c=>c.id)).size,6);
  const customers=new Set(v.customers.map(c=>c.id)),products=new Set(v.products.map(p=>p.code)),materials=new Set(v.materials.map(m=>m.code));
  for(const r of v.recipe){assert.ok(products.has(r.product));assert.ok(materials.has(r.material));assert.ok(r.qty>0);}
  const sums=v.orders.map(o=>{assert.ok(customers.has(o.customer));assert.ok(customers.has(o.executor));return o.lines.reduce((sum,l)=>{
   assert.ok(products.has(l.product));return sum+v.recipe.filter(r=>r.product===l.product).reduce((cost,r)=>{const prices=v.prices.filter(p=>p.material===r.material&&p.from<=o.date).sort((a,b)=>b.from.localeCompare(a.from));assert.ok(prices.length);return cost+l.qty/v.batch*r.qty*prices[0].cents;},0);
  },0);});
  assert.ok(sums.every(n=>Number.isFinite(n)&&n>0));totals.add(sums.map(Math.round).join(','));
  assert.ok(fs.statSync('site/'+v.zip).size>10000);assert.ok(fs.existsSync('site/'+v.document));
 }
 assert.equal(totals.size,30);assert.ok(fs.existsSync('site/mock/all-30.zip'));
});
test('mock state is isolated by variant and training retains original tasks',()=>{
 const memory={},get=k=>memory[k]??null,set=(k,v)=>memory[k]=v,pref='practice-pref:'+c.id+':'+y.year;
 const key=ExamPractice.stateKey(c,y,'mock','V01');
 memory[key]=JSON.stringify({timer:ExamCore.transition(ExamCore.restoreTimer(null,y.totalSeconds,'mock'),'start'),prepared:[0,1,2],selected:'M5',done:['M1']});
 memory[pref]=JSON.stringify({mockVariant:'V01'});
 let html=ExamPractice.render({c,year:y,mode:'mock',get,set});assert.match(html,/Документации|документации/);assert.doesNotMatch(html,/Что осталось исправить|practice-notes|practice-pause|practice-hint/);
 memory[pref]=JSON.stringify({mockVariant:'V30'});html=ExamPractice.render({c,year:y,mode:'mock',get,set});assert.match(html,/Перед началом/);assert.match(html,/V30/);
 memory[pref]=JSON.stringify({task:'M4',mockVariant:'V30'});html=ExamPractice.render({c,year:y,mode:'training',get,set});assert.match(html,/ОПУБЛИКОВАННЫЙ ОБРАЗЕЦ/);assert.match(html,/Вы успешно авторизовались/);assert.doesNotMatch(html,/mock-variant|Что осталось исправить/);
});
test('both database guides contain complete structure and no obsolete client',()=>{
 for(const stack of ['mysql','postgresql']){const html=lessons.M2[stack];assert.equal((html.match(/class="schema-card"/g)||[]).length,11);assert.doesNotMatch(html,/\{\{|Workbench/);}
 assert.match(lessons.M2.mysql,/Способ А/);assert.match(lessons.M2.mysql,/Способ Б/);
 const svg=fs.readFileSync('site/diagrams/er.svg','utf8');assert.doesNotMatch(svg,/name, inn|qty, sale_price|password_hash, role/);
});
test('readable official conditions preserve the complete source wording',()=>{
 const plain=s=>s.replace(/<h4>[\s\S]*?<\/h4>/g,'').replace(/<[^>]*>/g,' ').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&').replace(/\s+/g,' ').trim();
 for(const t of y.practice.tasks){
  const expected=t.text.replace(/^Модуль\s+\d+\.[^\n]*\n\s*/,'').replace('Необходимые приложения:','').replace(/\n\s*-\s+/g,' ').replace(/\s+/g,' ').trim();
  const formatted=ExamConditions.format(t.text,t.id,true);assert.equal(plain(formatted),expected,t.id);assert.match(formatted,/<section/);
 }
 assert.match(ExamConditions.format(y.practice.tasks[2].text,'M3',true),/<ul>/);
 assert.doesNotMatch(ExamConditions.format(y.practice.tasks[0].text,'M1',true),/<ul>/);
 assert.doesNotMatch(ExamConditions.format('<script>alert(1)</script>'),/<script>/);
});
test('database screenshots and C# designer routes are integrated into lessons',()=>{
 const db=lessons.M2.mysql,app=lessons.M4.mysql;
 for(const name of ['01-create-table','02-table-structure','03-foreign-key','04-designer'])assert.match(db,new RegExp(name));
 assert.match(db,/Дополнительный способ: импорт JSON/);assert.doesNotMatch(app,/<h3>13\. Импортируйте JSON/);
 for(const name of ['LoginForm','MainForm'])for(const stack of ['mysql','postgresql']){
  const project=fs.readFileSync(`examples/${stack}/Polesie.csproj`,'utf8');assert.ok(project.includes(`${name}.Designer.cs`));assert.ok(project.includes(`<DependentUpon>${name}.cs</DependentUpon>`));
  assert.ok(fs.existsSync(`site/code/examples/shared/UI/${name}.Designer.cs.txt`));
 }
 assert.match(app,/Shift\+F7/);assert.doesNotMatch(fs.readFileSync('site/course-app.js','utf8'),/gallery.html/);
});
test('requirements keep all source words and restore headings and bullet list',()=>{
 const source=y.practice.tasks.find(t=>t.id==='M4').supplements[0].text;
 const html=ExamConditions.format(source);
 const normalize=s=>s.replace(/<[^>]*>/g,' ').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&').replace(/[\uf02d•]/g,' ').replace(/\s+/g,' ').trim();
 assert.equal(normalize(html),normalize(source));
 assert.equal((html.match(/<li>/g)||[]).length,10);
 assert.equal((html.match(/<h4>/g)||[]).length,9);
});
test('creation and example routes are complete and isolated for both stacks',()=>{
 for(const m of y.modules)for(const stack of ['mysql','postgresql']){
  const example=sandbox.EXAMPLE_LESSONS[m.id][stack];assert.ok(example.length>500);assert.doesNotMatch(example,/\{\{|data-stack-only/);
  for(const match of example.matchAll(/(?:src|href)="([^"]+)"/g))if(!/^(#|https?:)/.test(match[1]))assert.ok(fs.existsSync('site/'+match[1].split('#')[0]));
  assert.match(lessons[m.id][stack],/папку сдачи/);
 }
 assert.doesNotMatch(lessons.M4.mysql,/Введите <code>admin<\/code> и/);
 assert.match(sandbox.EXAMPLE_LESSONS.M4.mysql,/Введите <code>admin<\/code> и/);
 assert.equal((lessons.M2.postgresql.match(/<img[^>]*src="screenshots\/pgadmin\//g)||[]).length,8);
 assert.doesNotMatch(lessons.M2.mysql,/screenshots\/pgadmin/);
 assert.doesNotMatch(fs.readFileSync('site/course-app.js','utf8'),/Документы и материалы|Пять шагов к готовому проекту/);
 assert.doesNotMatch(fs.readFileSync('site/practice.js','utf8'),/Без отправки файлов/);
 for(const t of y.practice.tasks){assert.ok(t.hints.length>=3);assert.ok(t.hints.every(h=>h.split('\n').length===3));assert.ok(t.hints.every(h=>!h.includes('2027')));}
});
