import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
import '../src/core.js';import '../src/practice.js';
import {makeVariants} from '../scripts/mock-variants.mjs';
const sandbox={};vm.runInNewContext(fs.readFileSync('site/course.js','utf8')+fs.readFileSync('site/lessons.js','utf8'),sandbox);
const {COURSE:c,LESSONS:lessons}=sandbox,y=c.years[0];
test('only verified 2026 basic level and five modules',()=>{assert.equal(c.years.length,1);assert.equal(y.year,2026);assert.equal(y.modules.length,5);assert.equal(y.totalSeconds,9000);assert.equal(y.assessment.maxPoints,50);assert.equal(y.assessment.criteria.reduce((s,r)=>s+r.points,0),50);ExamCore.validateCourse(c);});
test('all modules have substantial stepwise explanations for both stacks',()=>{for(const m of y.modules)for(const s of ['mysql','postgresql']){const html=lessons[m.id][s];assert.ok(html.length>4000);assert.ok((html.match(/<h3/g)||[]).length>=7);assert.doesNotMatch(html,/\{\{(?:code|stack)/);assert.doesNotMatch(html,/data-stack-only/);}});
test('every lesson download, code file and image exists',()=>{for(const lesson of Object.values(lessons))for(const html of Object.values(lesson))for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){const u=m[1];if(/^(#|https?:)/.test(u))continue;assert.ok(fs.existsSync(path.join('site',decodeURIComponent(u.split('#')[0]))),u);}});
test('two distinct source archives and eight real form captures',()=>{for(const s of ['mysql','postgresql']){assert.ok(fs.statSync(`site/downloads/polesie-${s}.zip`).size>100000);for(const p of ['login','customers','costs','users'])assert.ok(fs.statSync(`site/screenshots/${s}/${p}.png`).size>10000);}});
test('practice and mock use source tasks, preserve different timer rules',()=>{const get=()=>null,set=()=>{};const training=ExamPractice.render({c,year:y,mode:'training',get,set});assert.match(training,/Моя тренировка/);assert.match(training,/20 минут/);const mock=ExamPractice.render({c,year:y,mode:'mock',get,set});assert.match(mock,/150 минут/);assert.doesNotMatch(mock,/id="practice-pause"/);assert.match(mock,/Перед началом/);});
test('frozen sample assets and original source PDF exist',()=>{for(const t of y.practice.tasks){assert.ok(fs.existsSync('site/'+t.zip));for(const f of t.files)assert.ok(fs.existsSync('site/'+f.url));}assert.ok(fs.existsSync('site/'+y.source.url));});
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
