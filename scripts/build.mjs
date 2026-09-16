import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {schemaGuide} from './schema-guide.mjs';
import {buildErGuide} from './er-guide.mjs';
import {buildErLayouts} from './er-layout.mjs';
import {buildVariants} from './mock-variants.mjs';
import {appGuide} from './app-guide.mjs';
import '../src/core.js';
const root=path.resolve(import.meta.dirname,'..');
process.chdir(root);
const E=ExamCore.escape;
const out='site';
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
for(const f of ['er-guide.js','er-guide.css','product-tour.js','student-ui.css','study-steps.js','programs.js','resource-viewer.js','resources.css'])write(path.join(out,f),fs.readFileSync(path.join('src',f)));
const erData=buildErGuide();erData.layouts=await buildErLayouts(erData);
write(path.join(out,'er-data.js'),'globalThis.ER_GUIDE='+JSON.stringify(erData)+';\n');
const programGuides=JSON.parse(fs.readFileSync('content/program-guides.json','utf8'));for(const guide of Object.values(programGuides))for(const step of guide.steps){if(step.codeFile)step.code=fs.readFileSync(step.codeFile,'utf8');step.files=(step.codeFiles||[]).map(file=>({file,code:fs.readFileSync(file,'utf8')}));}
write(path.join(out,'program-data.js'),'globalThis.PROGRAM_GUIDES='+JSON.stringify(programGuides)+';');
write(path.join(out,'file-previews.js'),'globalThis.FILE_PREVIEWS='+fs.readFileSync('content/file-previews.json','utf8')+';');
const presentationGuides=JSON.parse(fs.readFileSync('content/presentation-guides.json','utf8')),presentations={};
for(const [module,items] of Object.entries(presentationGuides)){
 presentations[module]={};
 for(const stack of ['mysql','postgresql'])presentations[module][stack]=items.filter(x=>!x.stackOnly||x.stackOnly===stack).map(raw=>{
  const item=JSON.parse(JSON.stringify(raw).replaceAll('{{stack}}',stack).replaceAll('{{dbGuide}}',stack==='mysql'?'phpmyadmin':'postgresql'));
  let html=(item.points?'<ul>'+item.points.map(p=>'<li>'+E(p)+'</li>').join('')+'</ul>':'');
  if(item.image)html+='<figure class="app-shot"><img src="'+E(item.image)+'" alt="'+E(item.title)+'"><figcaption>'+E(item.caption)+'</figcaption></figure>';
  if(item.file){const lines=fs.readFileSync(item.file,'utf8').replaceAll('\r\n','\n').split('\n');html+='<pre data-code-file="'+E(item.file)+'" data-code-lines="1–'+Math.min(17,lines.length)+'"><code>'+E(lines.slice(0,17).join('\n'))+'</code></pre>';}
  if(item.resource)html+='<p><a class="btn" href="'+E(item.resource.url)+'">'+E(item.resource.title)+'</a></p>';
  return {title:item.title,html};
 });
}
write(path.join(out,'presentation-data.js'),'globalThis.PRESENTATION_GUIDES='+JSON.stringify(presentations)+';');
const dbFiles={'База.sql':fs.readFileSync('materials/database/polesie-mysql.sql'),'05-cost-procedure.sql':fs.readFileSync('examples/mysql/Sql/05-cost-procedure.sql'),'README.txt':Buffer.from('Создайте новую пустую базу utf8mb4_bin. В phpMyAdmin выберите её и импортируйте База.sql. Затем выполните CALL calculate_order_material_costs(); Ожидаемые суммы: 371.00; 126.45; 183.95. База.sql уже содержит учебные данные и сохранённую процедуру. Отдельный 05-cost-procedure.sql нужен только для создания процедуры в вашей собственной базе.\n')};
write(path.join(out,'downloads/polesie-mysql-database.zip'),ExamCore.zip(dbFiles));
write(path.join(out,'downloads/polesie-mysql-database.sql'),dbFiles['База.sql']);
const c=JSON.parse(fs.readFileSync('content/is.json','utf8'));
c.id='demo-dkip-2026-is';c.templateVersion='1.0.0';c.years=c.years.filter(y=>y.year===2026);
const y=c.years[0];delete y.exercise;y.status='passport';y.contentVersion='polesie-2026-1';
y.mockVariants=buildVariants(out,ExamCore.zip,standalone);
y.completeCourse=false;
ExamCore.validateCourse(c);
for(const f of ['mascot-scientist.png','index.html','style.css','practice.css','lessons.css','teaching.css','teaching.js','core.js','conditions.js','content-tools.js','practice.js','course-app.js'])write(path.join(out,f),fs.readFileSync(path.join('src',f)));
for(const f of ['practice','sources','screenshots','diagrams'])fs.cpSync(path.join('materials',f),path.join(out,f),{recursive:true});
for(const stack of ['mysql','postgresql'])write(path.join(out,`downloads/polesie-${stack}-app.zip`),fs.readFileSync(`materials/applications/polesie-${stack}-app.zip`));
write(path.join(out,'course.js'),'globalThis.COURSE='+JSON.stringify(c)+';\n');
const lessons={},toc={},examples={},exampleToc={};
for(const [folder,compiled,headings,prefix] of [['',lessons,toc,'lesson'],['examples/',examples,exampleToc,'example']])for(const m of y.modules){
 const html=fs.readFileSync(`lessons/${folder}${m.id}.html`,'utf8').replaceAll('{{full-app-guide}}',appGuide(programGuides.visualstudio,E));
 headings[m.id]=[...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]);
 compiled[m.id]={};
 for(const stack of ['mysql','postgresql']){
  let i=0;
  let content=html.replaceAll('{{app-walkthrough}}',fs.readFileSync('lessons/app-walkthrough.html','utf8')).replace(/<div data-stack-only="(.*?)">([\s\S]*?)<\/div>/g,(_,s,t)=>s===stack?t:'')
   .replaceAll('{{schema-guide}}',schemaGuide(stack,E))
   .replaceAll('{{requirements}}',ExamConditions.format(y.practice.tasks.find(t=>t.id==='M4').supplements[0].text))
   .replaceAll('{{documentation}}',fs.readFileSync('lessons/documentation.html','utf8').replace('{{methods}}',fs.readFileSync('lessons/M5.html','utf8').match(/<table>[\s\S]*?<\/table>/)[0]).replaceAll('../screenshots/','screenshots/'))
   .replaceAll('{{stack}}',stack).replaceAll('{{stackLabel}}',stack==='mysql'?'MySQL':'PostgreSQL')
   .replace(/<h3>/g,()=>`<h3 id="${prefix}-step-${++i}">`)
   .replace(/\{\{code:(.*?)\}\}/g,(_,f)=>{
    const file=f.startsWith('stack/')?f.replace('stack/',`examples/${stack}/`):f;
    const code=fs.readFileSync(file,'utf8');
    write(path.join(out,'code',file+'.txt'),code);
    return `<details class="code-source"><summary>${E(file)} · ${code.split('\n').length} строк · открыть код</summary><p class="code-actions"><button class="btn" data-copy-code>Копировать весь код</button> <a class="btn" href="code/${file}.txt" download>Скачать файл как текст</a></p><pre><code>${E(code)}</code></pre></details>`;
   });
  compiled[m.id][stack]=content;
 }
}
write(path.join(out,'lessons.js'),'globalThis.LESSONS='+JSON.stringify(lessons)+';\nglobalThis.LESSON_TOC='+JSON.stringify(toc)+';\nglobalThis.EXAMPLE_LESSONS='+JSON.stringify(examples)+';\nglobalThis.EXAMPLE_TOC='+JSON.stringify(exampleToc)+';');
function standalone(title,html){return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)}</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="lessons.css"><main class="standalone"><p><a href="./">← Вернуться к разбору</a></p><h1>${E(title)}</h1>${html}</main></html>`;}
write(path.join(out,'gallery.html'),'<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./?mode=learn&module=M4"><title>Разбор приложения</title><p><a href="./?mode=learn&module=M4">Открыть разбор приложения с примерами экранов</a></p></html>');
const sources=JSON.parse(fs.readFileSync('docs/sources.json','utf8'));
write(path.join(out,'sources.html'),standalone('Источники и адаптация к 2026 году',`<p>Основа интерфейса — утверждённый шаблон. Основной маршрут соответствует только базовому уровню КОД 09.02.07-5-2026.</p><ul>${sources.repositories.map(r=>`<li><a href="${r.url}">${E(r.name)}</a> · ${E(r.used)} · версия <code>${r.commit.slice(0,8)}</code></li>`).join('')}</ul><h2>Что исправлено</h2><ul>${sources.changes.map(s=>'<li>'+E(s)+'</li>').join('')}</ul><p><a href="sources/2026.pdf">Официальный документ из переданного комплекта</a>. Исходный JSON и картинки капчи сохранены. Данные продуктов и заказов в разборе учебные; они не объявляются официальным решением.</p>`));
const results=JSON.parse(fs.readFileSync('docs/integration-results.json','utf8'));
const archiveChecks=JSON.parse(fs.readFileSync('docs/archive-verification-20260916.json','utf8'));
write(path.join(out,'verification.html'),standalone('Проверка примеров',`<p>16 сентября 2026 года скачаны публичные архивы полных проектов, распакованы в отдельные папки и собраны в .NET Framework 4.8.</p><ul>${archiveChecks.map(r=>`<li><strong>${E(r.stack)}</strong>: ${E(r.build)}; ${E(r.result)}</li>`).join('')}</ul><p>Проверены вход, роли, блокировка, импорт JSON, ограничения базы, расчёт и создание всех форм. Архивы требуют собственного сервера базы и настройки ConnectionString.</p><h2>Дополнительные проверки примеров</h2><ul>${results.map(r=>`<li>${r.server}: ${E(r.result)}</li>`).join('')}</ul><p>Проверки включают расчёт, хэши, роли, дубли логина, три ошибки, сохранение блокировки, разблокировку, смену логина и пароля, сброс счётчика, повторный импорт и сохранность исходных строк.</p><p>Это проверка комплектов примеров. Сайт не выполняет и не оценивает пользовательские решения.</p>`));
const documents={};
for(const stack of ['mysql','postgresql']){
 const fragment=fs.readFileSync('lessons/documentation.html','utf8').replaceAll('{{stack}}',stack).replaceAll('{{stackLabel}}',stack==='mysql'?'MySQL':'PostgreSQL').replace('{{methods}}',fs.readFileSync('lessons/M5.html','utf8').match(/<table>[\s\S]*?<\/table>/)[0]);
 documents[stack]=standalone('Проектная документация — Полесье',fragment).replaceAll('href="style.css"','href="../style.css"').replaceAll('href="lessons.css"','href="../lessons.css"').replaceAll('href="./"','href="../"');
 write(path.join(out,`downloads/project-documentation-${stack}.html`),documents[stack]);
}
const csv='\uFEFFДействие;Ожидаемый результат;Фактический результат\r\nВерные данные и пазл;Успешный вход;\r\nТри ошибки подряд;Блокировка;\r\nРазблокировка;Счётчик 0 и вход разрешён;\r\nПовторный логин;Сообщение о дубле;\r\nПовторный импорт;6 заказчиков без дублей;\r\nЗаказ 1;371,00;\r\nЗаказ 2;126,45;\r\nЗаказ 3;183,95;\r\n';
write(path.join(out,'downloads/test-cases.csv'),csv);
function tree(dir,files){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['bin','obj'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())tree(p,files);else if(!e.name.endsWith('.local.txt'))files[p.replaceAll('\\','/')]=fs.readFileSync(p);}}
const firstFormFiles={};tree('examples/first-form',firstFormFiles);
write(path.join(out,'downloads/polesie-first-form.zip'),ExamCore.zip(Object.fromEntries(Object.entries(firstFormFiles).map(([p,v])=>[p.replace('examples/first-form/',''),v]))));
for(const stack of ['mysql','postgresql']){
 const files={};tree('examples/shared',files);tree('examples/'+stack,files);
 files['README.md']=fs.readFileSync('examples/README.md');
 files['Заказчики.json']=fs.readFileSync('materials/practice/2026/assets/M2/Заказчики.json');
 files['ER.pdf']=fs.readFileSync('materials/diagrams/er.pdf');
 files['Проектная документация.html']=documents[stack].replaceAll('../style.css','style.css').replaceAll('../lessons.css','lessons.css').replaceAll('href="../"','href="./"').replaceAll(`../screenshots/${stack}/`,'screenshots/');
 for(const f of ['login','customers','costs','users'])files[`screenshots/${f}.png`]=fs.readFileSync(`materials/screenshots/${stack}/${f}.png`);
 files['style.css']=fs.readFileSync('src/style.css');files['lessons.css']=fs.readFileSync('src/lessons.css');files['Тесты.csv']=csv;
 write(path.join(out,`downloads/polesie-${stack}.zip`),ExamCore.zip(files));
}
write(path.join(out,'.nojekyll'),'');
write(path.join(out,'downloads/USER_GUIDE.md'),fs.readFileSync('docs/USER_GUIDE.md'));
write(path.join(out,'downloads/LECTURE_TEMPLATE_LICENSE.txt'),fs.readFileSync('docs/LECTURE_TEMPLATE_LICENSE.txt'));
// Content versions prevent browsers from reusing scripts from an older release.
const indexPath=path.join(out,'index.html');
write(indexPath,fs.readFileSync(indexPath,'utf8').replace(/(src|href)="([^"?]+\.(?:js|css))"/g,(_,attr,file)=>{
 const version=createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex').slice(0,12);
 return `${attr}="${file}?v=${version}"`;
}));
console.log('Built site: 5 modules, 2 stacks, 8 application screenshots.');
