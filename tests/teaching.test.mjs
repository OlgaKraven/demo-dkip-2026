import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import '../src/core.js';
import '../src/teaching.js';

test('teacher profile accepts optional fields and normalizes a safe materials URL',()=>{
 const value=ExamTeaching.normalizeProfile({fullName:'  Преподаватель  ',materialsUrl:'https://example.org/materials'});
 assert.equal(value.fullName,'Преподаватель');assert.equal(value.department,'');
 assert.equal(value.materialsUrl,'https://example.org/materials');
});
test('teacher import rejects malformed fields and executable or credential URLs',()=>{
 for(const value of [null,[],{fullName:42},{position:'x'.repeat(201)},{materialsUrl:'javascript:alert(1)'},{materialsUrl:'data:text/html,x'},{materialsUrl:'https://user:secret@example.org'},{materialsUrl:'file:///tmp/a'}])assert.throws(()=>ExamTeaching.normalizeProfile(value));
});
test('teacher settings discard the institution and default to the supplied materials folder',()=>{
 const value=ExamTeaching.normalizeProfile({organization:'Старое значение'});
 assert.equal(Object.hasOwn(value,'organization'),false);
 assert.equal(value.materialsUrl,'https://disk.yandex.ru/d/h3QUsGWcrr_tsQ');
});
test('code actions stay with the code rather than becoming an empty slide',()=>{
 const {document}=parseHTML('<html><body></body></html>');
 const html='<h3>Выполните запрос</h3><details class="code-source"><summary>examples/mysql/Sql/04-cost.sql · открыть код</summary><p class="code-actions"><button data-copy-code>Копировать весь код</button></p><pre><code>SELECT 1;</code></pre></details>';
 const slides=ExamTeaching.lessonSlides(html,document);
 assert.equal(slides.length,1);assert.ok(slides[0].html.includes('SELECT 1;'));
});
test('brief presentations cover every module and stack with existing images and full source links',()=>{
 const data={};vm.runInNewContext(fs.readFileSync('site/presentation-data.js','utf8'),data);
 for(const [id,stacks] of Object.entries(data.PRESENTATION_GUIDES))for(const [stack,slides] of Object.entries(stacks)){
  assert.ok(slides.length>=7&&slides.length<=12,id+'/'+stack);
  for(const slide of slides){assert.ok(slide.title);for(const m of slide.html.matchAll(/(?:src|href)="([^"]+)"/g)){
   const file=new URL(m[1],'https://course.test/index.html').pathname;
   assert.ok(fs.existsSync('site/'+decodeURIComponent(file)),m[1]);
  }}
 }
});
test('all browser entrypoints parse and presentation assets are bundled',()=>{
 for(const file of fs.readdirSync('src').filter(x=>x.endsWith('.js')))execFileSync(process.execPath,['--check','src/'+file]);
 for(const file of ['teaching.js','teaching.css'])assert.equal(fs.readFileSync('site/'+file,'utf8'),fs.readFileSync('src/'+file,'utf8'));
 const index=fs.readFileSync('site/index.html','utf8');assert.ok(index.indexOf('teaching.js')<index.indexOf('course-app.js'));
 assert.equal(fs.readFileSync('site/downloads/USER_GUIDE.md','utf8'),fs.readFileSync('docs/USER_GUIDE.md','utf8'));
});

test('all 20 presentation routes preserve content, table rows, links and complete code',()=>{
 const data={};vm.runInNewContext(fs.readFileSync('site/lessons.js','utf8'),data);
 const {document}=parseHTML('<html><body></body></html>');
 const norm=x=>x.replace(/\s+/g,' ').trim();
 let count=0;
 for(const route of [data.LESSONS,data.EXAMPLE_LESSONS])for(const [module,stacks] of Object.entries(route))for(const [stack,html] of Object.entries(stacks)){
  const source=document.createElement('div');source.innerHTML=html;
  const slides=ExamTeaching.lessonSlides(html,document);assert.ok(slides.length>2,module+'/'+stack);
  const deck=document.createElement('div');deck.innerHTML=slides.map(s=>'<h3>'+ExamCore.escape(s.title)+'</h3>'+s.html).join('');
  assert.equal(deck.querySelectorAll('tbody > tr').length,source.querySelectorAll('tbody > tr').length,module+' table rows');
  assert.equal(deck.querySelectorAll('li').length,source.querySelectorAll('li').length,module+' list items');
  assert.equal(norm([...deck.querySelectorAll('pre code')].map(x=>x.textContent).join('\n')),norm([...source.querySelectorAll('pre code')].map(x=>x.textContent).join('\n')),module+' complete code');
  const output=norm(deck.textContent);
  function checkText(node){if(node.nodeType===3&&norm(node.textContent)&&!node.parentElement?.closest('pre'))assert.ok(output.includes(norm(node.textContent)),module+'/'+stack+' missing: '+node.textContent.slice(0,80));for(const child of node.childNodes)checkText(child);}
  checkText(source);
  for(const anchor of source.querySelectorAll('a'))assert.ok([...deck.querySelectorAll('a')].some(x=>x.getAttribute('href')===anchor.getAttribute('href')));
  assert.deepEqual([...deck.querySelectorAll('img')].map(x=>x.getAttribute('src')),[...source.querySelectorAll('img')].map(x=>x.getAttribute('src')),module+'/'+stack+' all screenshots preserved');
  for(const table of deck.querySelectorAll('table'))assert.ok(table.querySelectorAll('tbody > tr').length<=5,module+' oversized table');
  for(const pre of deck.querySelectorAll('pre[data-code-lines]'))assert.ok(pre.textContent.split('\n').length<=20,module+' oversized code');
  count++;
 }
 assert.equal(count,20);
});
test('standalone screenshots and figures get their own presentation slides',()=>{
 const {document}=parseHTML('<html><body></body></html>');
 const slides=ExamTeaching.lessonSlides('<h3>Экран</h3><p>Перед снимком</p><img src="screen.png" alt="Окно"><p>После снимка</p><figure><img src="diagram.svg"><figcaption>Схема</figcaption></figure>',document);
 const media=slides.filter(x=>x.html.includes('<img'));
 assert.equal(media.length,2);
 assert.ok(media.every(x=>!x.html.includes('Перед снимком')&&!x.html.includes('После снимка')));
});
test('M4 walkthrough covers all four screens in both routes and stacks',()=>{
 const data={};vm.runInNewContext(fs.readFileSync('site/lessons.js','utf8'),data);
 for(const route of [data.LESSONS,data.EXAMPLE_LESSONS])for(const stack of ['mysql','postgresql']){
  const html=route.M4[stack];
  assert.doesNotMatch(html,/\{\{app-walkthrough\}\}/);
  for(const name of ['login','customers','costs','users'])assert.match(html,new RegExp('screenshots/'+stack+'/'+name+'\\.png'));
  for(const action of ['Новый пользователь','Снять блокировку','Сохранить'])assert.ok(html.includes(action));
 }
 for(const stack of ['mysql','postgresql'])assert.ok(data.LESSONS.M1[stack].includes('diagrams/order-links.svg'));
});
test('lesson has navigation but no timer; timing remains in practice',()=>{
 const app=fs.readFileSync('src/course-app.js','utf8');
 assert.match(app,/В этом разборе/);
 assert.doesNotMatch(app,/id="clock"|data-timer=|loadTimer\(/);
 assert.match(fs.readFileSync('src/practice.js','utf8'),/practice-clock/);
});

test('timer checkpoints preserve elapsed time when wall clock moves backwards',()=>{
 let s=ExamCore.transition(ExamCore.freshTimer(1200,'training',10000),'start',10000);
 s=ExamCore.checkpoint(s,610000);
 assert.equal(ExamCore.timerView(s,610000).used,600000);
 s=ExamCore.checkpoint(s,10000);
 assert.equal(ExamCore.timerView(s,10000).used,600000);
 assert.equal(ExamCore.timerView(s,10000).clockChanged,true);
 s=ExamCore.transition(s,'pause',20000);
 assert.equal(ExamCore.timerView(s,100000).used,610000);
});
