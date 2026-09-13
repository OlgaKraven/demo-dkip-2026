(function(root){
'use strict';
const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const normalize=text=>text.replace(/\s+/g,' ').trim();
const sections={
 M1:[['На основании документов','Исходные данные'],['Обязательна 3','Требования к модели'],['ER - диаграмма должна','Что сохранить']],
 M2:[['Создайте базу данных','Создание базы'],['Создайте таблицы','Структура и ограничения'],['После создания базы','Импорт данных']],
 M3:[['Создайте запрос','Что должен вычислять запрос']],
 M4:[['Для выполнения задания','Таблица пользователей'],['Разработайте форму','Форма входа'],['При неверно','Сообщения и проверка учётных данных'],['На страницу авторизации','Проверка пазла'],['Если в течении','Блокировка после трёх ошибок'],['На рабочем столе','Возможности администратора'],['Графический интерфейс','Оформление приложения']],
 M5:[['Разработайте проектную документацию','Назначение документации'],['Включите описание','Что включить']]
};
function paragraphs(text){
 const parts=normalize(text).split(/(?<=[.!?])\s+(?=[А-ЯЁ])/).filter(Boolean);
 return parts.map(p=>'<p>'+escape(p)+'</p>').join('');
}
function developmentRequirements(text){
 const titles=['Требования к разработке','Название приложения','Файловая структура','Структура проекта','Макет и технические характеристики','Обратная связь с пользователем','Обработка ошибок','Оформление кода','Комментарии'];
 const lines=String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const blocks=[];let current={title:'',lines:[]};
 for(const line of lines){
  if(titles.includes(line)){if(current.title||current.lines.length)blocks.push(current);current={title:line,lines:[]};}
  else current.lines.push(line);
 }
 if(current.title||current.lines.length)blocks.push(current);
 return '<div class="condition-text development-requirements">'+blocks.map(b=>{
  const items=normalize(b.lines.join(' ')).split(/\s*[\uf02d•]\s*/);
  return '<section class="condition-section">'+(b.title?'<h4>'+escape(b.title)+'</h4>':'')+paragraphs(items[0])+(items.length>1?'<ul>'+items.slice(1).map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>':'')+'</section>';
 }).join('')+'</div>';
}
function format(text,id,official=false){
 let body=String(text).trim();
 if(body.startsWith('Требования к разработке'))return developmentRequirements(body);
 if(!official)return '<div class="condition-text">'+paragraphs(body)+'</div>';
 body=body.replace(/^Модуль\s+\d+\.[^\n]*\n\s*/,'');
 const app=body.indexOf('Необходимые приложения:');
 const attachments=app>=0?body.slice(app+'Необходимые приложения:'.length):'';
 if(app>=0)body=body.slice(0,app);
 const normal=normalize(body),markers=(sections[id]||[]).map(([start,title])=>({at:normal.indexOf(start),title})).filter(s=>s.at>=0).sort((a,b)=>a.at-b.at);
 if(!markers.length)markers.push({at:0,title:'Задание'});
 if(markers[0].at>0)markers.unshift({at:0,title:'Задание'});
 const html=markers.map((s,i)=>{
  const fragment=normal.slice(s.at,markers[i+1]?.at??normal.length).trim();
  const bullets=id==='M3'?fragment.split(/\s+-\s+/):[fragment];
  const content=bullets.length>1?paragraphs(bullets[0])+'<ul>'+bullets.slice(1).map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>':paragraphs(fragment);
  return `<section class="condition-section"><h4>${escape(s.title)}</h4>${content}</section>`;
 }).join('');
 return `<div class="condition-text">${html}${attachments?'<section class="condition-attachments"><h4>Приложения</h4><p>'+escape(normalize(attachments))+'</p></section>':''}</div>`;
}
root.ExamConditions={format};
})(globalThis);
