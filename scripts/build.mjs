import fs from 'node:fs';
import path from 'node:path';
import {schemaGuide} from './schema-guide.mjs';
import {buildVariants} from './mock-variants.mjs';
import '../src/core.js';
const root=path.resolve(import.meta.dirname,'..');
process.chdir(root);
const E=ExamCore.escape;
const out='site';
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
const c=JSON.parse(fs.readFileSync('content/is.json','utf8'));
c.id='demo-dkip-2026-is';c.templateVersion='1.0.0';c.years=c.years.filter(y=>y.year===2026);
const y=c.years[0];delete y.exercise;y.status='passport';y.contentVersion='polesie-2026-1';
y.mockVariants=buildVariants(out,ExamCore.zip,standalone);
y.practice.tasks.find(t=>t.id==='M1').hints[1]='Отделите заказ от его строк, а продукцию — от состава.';
y.practice.tasks.find(t=>t.id==='M3').hints[2]='Выбирайте цену материала на дату заказа и учитывайте, на какое количество продукции задана норма.';
y.practice.tasks.find(t=>t.id==='M5').hints[1]='Укажите назначение, параметры и результаты методов своего приложения; добавьте снимки форм и порядок запуска.';
y.completeCourse=false;
ExamCore.validateCourse(c);
for(const f of ['index.html','style.css','practice.css','lessons.css','core.js','conditions.js','content-tools.js','practice.js','course-app.js'])write(path.join(out,f),fs.readFileSync(path.join('src',f)));
for(const f of ['practice','sources','screenshots','diagrams'])fs.cpSync(path.join('materials',f),path.join(out,f),{recursive:true});
write(path.join(out,'course.js'),'globalThis.COURSE='+JSON.stringify(c)+';\n');
const lessons={},toc={};
for(const m of y.modules){
 const html=fs.readFileSync(`lessons/${m.id}.html`,'utf8');
 toc[m.id]=[...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]);
 lessons[m.id]={};
 for(const stack of ['mysql','postgresql']){
  let i=0;
  let content=html.replace(/<div data-stack-only="(.*?)">([\s\S]*?)<\/div>/g,(_,s,t)=>s===stack?t:'')
   .replaceAll('{{schema-guide}}',schemaGuide(stack,E))
   .replaceAll('{{stack}}',stack).replaceAll('{{stackLabel}}',stack==='mysql'?'MySQL':'PostgreSQL')
   .replace(/<h3>/g,()=>`<h3 id="lesson-step-${++i}">`)
   .replace(/\{\{code:(.*?)\}\}/g,(_,f)=>{
    const file=f.startsWith('stack/')?f.replace('stack/',`examples/${stack}/`):f;
    const code=fs.readFileSync(file,'utf8');
    write(path.join(out,'code',file+'.txt'),code);
    return `<details class="code-source"><summary>${E(file)} · ${code.split('\n').length} строк · открыть код</summary><p><a href="code/${file}.txt" download>Скачать файл как текст</a></p><pre><code>${E(code)}</code></pre></details>`;
   });
  lessons[m.id][stack]=content;
 }
}
write(path.join(out,'lessons.js'),'globalThis.LESSONS='+JSON.stringify(lessons)+';\nglobalThis.LESSON_TOC='+JSON.stringify(toc)+';');
function standalone(title,html){return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)}</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="lessons.css"><main class="standalone"><p><a href="./">← Вернуться к разбору</a></p><h1>${E(title)}</h1>${html}</main></html>`;}
write(path.join(out,'gallery.html'),'<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./?mode=learn&module=M4"><title>Разбор приложения</title><p><a href="./?mode=learn&module=M4">Открыть разбор приложения с примерами экранов</a></p></html>');
const sources=JSON.parse(fs.readFileSync('docs/sources.json','utf8'));
write(path.join(out,'sources.html'),standalone('Источники и адаптация к 2026 году',`<p>Основа интерфейса — утверждённый шаблон. Основной маршрут соответствует только базовому уровню КОД 09.02.07-5-2026.</p><ul>${sources.repositories.map(r=>`<li><a href="${r.url}">${E(r.name)}</a> · ${E(r.used)} · версия <code>${r.commit.slice(0,8)}</code></li>`).join('')}</ul><h2>Что исправлено</h2><ul>${sources.changes.map(s=>'<li>'+E(s)+'</li>').join('')}</ul><p><a href="sources/2026.pdf">Официальный документ из переданного комплекта</a>. Исходный JSON и картинки капчи сохранены. Данные продуктов и заказов в разборе учебные; они не объявляются официальным решением.</p>`));
const results=JSON.parse(fs.readFileSync('docs/integration-results.json','utf8'));
write(path.join(out,'verification.html'),standalone('Проверка примеров',`<p>Проверены сборка C# и выполнение запросов на отдельных тестовых серверах.</p><ul>${results.map(r=>`<li>${r.server}: ${E(r.result)}</li>`).join('')}</ul><p>Проверки включают расчёт, хэши, роли, дубли логина, три ошибки, сохранение блокировки, разблокировку, смену логина и пароля, сброс счётчика, повторный импорт и сохранность исходных строк.</p><p>Это проверка комплектов примеров. Сайт не выполняет и не оценивает пользовательские решения.</p>`));
const documents={};
for(const stack of ['mysql','postgresql']){
 const fragment=fs.readFileSync('lessons/documentation.html','utf8').replaceAll('{{stack}}',stack).replaceAll('{{stackLabel}}',stack==='mysql'?'MySQL':'PostgreSQL').replace('{{methods}}',fs.readFileSync('lessons/M5.html','utf8').match(/<table>[\s\S]*?<\/table>/)[0]);
 documents[stack]=standalone('Проектная документация — Полесье',fragment).replaceAll('href="style.css"','href="../style.css"').replaceAll('href="lessons.css"','href="../lessons.css"').replaceAll('href="./"','href="../"');
 write(path.join(out,`downloads/project-documentation-${stack}.html`),documents[stack]);
}
const csv='\uFEFFДействие;Ожидаемый результат;Фактический результат\r\nВерные данные и пазл;Успешный вход;\r\nТри ошибки подряд;Блокировка;\r\nРазблокировка;Счётчик 0 и вход разрешён;\r\nПовторный логин;Сообщение о дубле;\r\nПовторный импорт;6 заказчиков без дублей;\r\nЗаказ 1;371,00;\r\nЗаказ 2;126,45;\r\nЗаказ 3;183,95;\r\n';
write(path.join(out,'downloads/test-cases.csv'),csv);
function tree(dir,files){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['bin','obj'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())tree(p,files);else if(!e.name.endsWith('.local.txt'))files[p.replaceAll('\\','/')]=fs.readFileSync(p);}}
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
console.log('Built site: 5 modules, 2 stacks, 8 application screenshots.');
