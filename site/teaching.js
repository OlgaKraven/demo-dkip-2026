/* Presentation and instructor profile for the existing static course. */
(function(root){
 'use strict';
 const profileKey='polesie-teacher-v2',materialsUrl='https://disk.yandex.ru/d/h3QUsGWcrr_tsQ';
 const fields={fullName:'ФИО преподавателя',position:'Должность',department:'Кафедра / подразделение',materialsUrl:'Ссылка на материалы'};
 let ctx,profile={},dialog,kind='',slides=[],slideIndex=0,positionKey='',returnFocus,deckDetail='brief';
 const E=value=>root.ExamCore.escape(value);
 function normalizeProfile(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Ожидается объект с данными преподавателя.');
  const result={};
  for(const key of Object.keys(fields)){
   if(value[key]!=null&&typeof value[key]!=='string')throw new Error('Поле «'+fields[key]+'» должно быть текстом.');
   result[key]=(value[key]||(key==='materialsUrl'?materialsUrl:'')).trim();
   if(result[key].length>(key==='materialsUrl'?2000:200))throw new Error('Слишком длинное поле: '+fields[key]);
  }
  if(result.materialsUrl){let url;try{url=new URL(result.materialsUrl);}catch{throw new Error('Введите полный адрес материалов: https://…');}
   if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Для материалов нужен адрес http:// или https:// без пароля.');
   result.materialsUrl=url.href;
  }
  return result;
 }
 function readProfile(){try{const saved=ctx.get(profileKey),data=JSON.parse(saved||ctx.get('polesie-teacher-v1')||'{}');if(!saved)data.materialsUrl=materialsUrl;return normalizeProfile(data);}catch{return normalizeProfile({});}}
 function profileHtml(){return `<div class="instructor-card"><span class="eyebrow">ПРЕПОДАВАТЕЛЬ</span><strong>${E(profile.fullName||'Добавьте данные перед занятием')}</strong>${[profile.position,profile.department].filter(Boolean).map(x=>'<span>'+E(x)+'</span>').join('')}${profile.materialsUrl?`<a href="${E(profile.materialsUrl)}" target="_blank" rel="noopener noreferrer">Открыть материалы ↗</a>`:''}</div>`;}
 function button(label,handler){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=label;b.onclick=handler;return b;}
 function iconButton(b,label,paths){b.className='icon-button theme-button';b.title=label;b.setAttribute('aria-label',label);b.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';return b;}
 const fullIcon='<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>';
 const guideIcon='<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/><path d="M5 8h4m-4 4h4m6-4h4m-4 4h4"/>';
 const settingsIcon='<path d="M9.5 3h5l.6 2.5 2.1 1.2 2.5-.7 2.5 4.3-1.9 1.8v2.4l1.9 1.8-2.5 4.3-2.5-.7-2.1 1.2-.6 2.5h-5l-.6-2.5-2.1-1.2-2.5.7-2.5-4.3 1.9-1.8v-2.4l-1.9-1.8L4.3 6l2.5.7 2.1-1.2Z" transform="translate(1 0) scale(.9)"/><circle cx="12" cy="12" r="3"/>';
 // Same icon-button / Moon(19) / Sun(19) interaction as the lecture template.
 function themeButton(button){
  const label=ctx.dark?'Включить светлую тему':'Включить тёмную тему';
  button.className='icon-button theme-button';button.type='button';button.title=label;button.setAttribute('aria-label',label);
  button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ctx.dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>':'<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.463.402.807a6.25 6.25 0 0 0 8.268 8.268c.344-.215.829-.004.803.397"/>')+'</svg>';
  button.onclick=ctx.toggleTheme;
 }
 function ensureDialog(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.className='teaching-dialog';dialog.setAttribute('aria-labelledby','teaching-title');document.body.append(dialog);
  dialog.addEventListener('close',()=>{if(dialog.open)return;kind='';dialog.classList.remove('deck-dialog');if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});if(returnFocus?.isConnected)returnFocus.focus();});
  dialog.addEventListener('keydown',event=>{
   if(kind!=='deck'||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,button,a,summary,[contenteditable="true"]'))return;
   const actions={ArrowRight:slideIndex+1,PageDown:slideIndex+1,' ':slideIndex+1,ArrowLeft:slideIndex-1,PageUp:slideIndex-1,Home:0,End:slides.length-1};
   if(Object.hasOwn(actions,event.key)){event.preventDefault();go(actions[event.key]);}
  });
 }
 function open(type){ensureDialog();kind=type;returnFocus=document.activeElement;dialog.classList.toggle('deck-dialog',type==='deck');if(!dialog.open)dialog.showModal();}
 function closeButton(){dialog.querySelector('[data-close]').onclick=()=>dialog.close();}
 function settings(){
  open('profile');
  dialog.innerHTML=`<header class="teaching-head"><h2 id="teaching-title">Настройка перед занятием</h2><button class="btn" data-close aria-label="Закрыть настройки">Закрыть</button></header><p>Данные появятся в разделе преподавателя и на титульных слайдах. Сохранение действует в этом браузере.</p><form id="teacher-form" class="teacher-form">${Object.entries(fields).map(([key,label])=>`<label>${label}<input name="${key}" type="${key==='materialsUrl'?'url':'text'}" maxlength="${key==='materialsUrl'?2000:200}" value="${E(profile[key])}" placeholder="${key==='materialsUrl'?'https://…':''}" autocomplete="${key==='fullName'?'name':'off'}"></label>`).join('')}<p class="small">Ссылка открывает вашу папку материалов; файлы на сайт не загружаются. Все поля необязательны.</p><p id="teacher-message" role="status" aria-live="polite"></p><div class="teaching-actions"><button class="btn primary" type="submit">Сохранить настройки</button><button class="btn" type="button" id="teacher-export">Скачать данные</button><label class="btn file-label">Загрузить данные<input id="teacher-import" type="file" accept="application/json,.json"></label></div></form>`;
  closeButton();
  const form=dialog.querySelector('form'),message=dialog.querySelector('#teacher-message');
  const formProfile=()=>normalizeProfile(Object.fromEntries(new FormData(form)));
  form.onsubmit=event=>{event.preventDefault();try{profile=formProfile();ctx.set(profileKey,JSON.stringify(profile));refreshProfile();message.textContent='Настройки сохранены.';}catch(error){message.textContent=error.message;}};
  dialog.querySelector('#teacher-export').onclick=()=>{try{const data=formProfile();const url=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,profile:data},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='teacher-profile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message.textContent=error.message;}};
  dialog.querySelector('#teacher-import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>20000)throw new Error('Файл профиля должен быть меньше 20 КБ.');const data=JSON.parse(await file.text());if(data.schemaVersion!==1)throw new Error('Неизвестная версия файла профиля.');const imported=normalizeProfile(data.profile);for(const key of Object.keys(fields))form.elements[key].value=imported[key];message.textContent='Данные загружены. Проверьте поля и нажмите «Сохранить настройки».';}catch(error){message.textContent=error.message;}event.target.value='';};
 }
 function refreshProfile(){const block=document.querySelector('#instructor-profile');if(block)block.innerHTML=profileHtml();}
 function guide(){
  open('guide');dialog.innerHTML=`<header class="teaching-head"><h2 id="teaching-title">Как пользоваться проектом</h2><button class="btn" data-close>Закрыть</button></header><div class="guide-grid">
  <section><span class="section-code">01 · НАЧАЛО</span><h3>Выберите один модуль</h3><p>Откройте «Учиться и выполнять» → «Разбор». Выберите модуль и свою базу: MySQL или PostgreSQL. Скачайте исходные материалы. Выполняйте действия разбора по одному шагу. Готовое решение для сверки находится в «Примерах проектов».</p></section>
  <section><span class="section-code">02 · ОДНО ДЕЙСТВИЕ ЗА РАЗ</span><h3>Сделайте шаг и проверьте результат</h3><p>Сначала прочитайте «Что должно получиться». Выполните текущий шаг в своей программе, затем нажмите «Далее». Содержание помогает вернуться к нужному действию. «Показать все шаги» раскрывает весь разбор. Место сохраняется в этом браузере.</p></section>
  <section><span class="section-code">03 · ПОМОЩЬ В ПРОГРАММАХ</span><h3>Найдите нужную кнопку</h3><p>В разделе «Работа в программах» доступны инструкции по phpMyAdmin, SQL-запросам, Visual Studio и pgAdmin. В phpMyAdmin начинайте с базы и таблиц, затем переходите к запросу. Снимок можно открыть крупнее нажатием.</p></section>
  <section><span class="section-code">04 · СХЕМА ДАННЫХ</span><h3>Разберитесь, откуда взялось поле</h3><p>В модулях 1 и 2 откройте справку по ER. Нажмите поле: справа появятся исходный файл, значение и объяснение. Нажмите связь, чтобы прочитать «один ко многим». «Готовая схема» открывается в отдельном окне на весь экран.</p></section>
  <section><span class="section-code">05 · САМОСТОЯТЕЛЬНАЯ РАБОТА</span><h3>Тренируйтесь после разбора</h3><p>В «Моей тренировке» можно включить таймер, взять подсказку и поставить время на паузу. В «Пробном экзамене» выберите V01–V30: на пять модулей даётся 150 минут без паузы. Запущенный таймер продолжает идти при переходе в другие разделы.</p></section>
  <section><span class="section-code">06 · ПРОВЕРКА И СДАЧА</span><h3>Сохраните файлы своей работы</h3><p>Сайт хранит отметки и место в разборе. SQL, PDF и C#-проект сохраняйте в папку сдачи самостоятельно. Откройте «Критерии экзамена», чтобы увидеть семь официальных критериев на 50 баллов. Сайт не оценивает и не отправляет решения.</p></section>
  <section><span class="section-code">07 · ДЛЯ ПРЕПОДАВАТЕЛЯ</span><h3>Подготовьте показ группе</h3><p>Откройте «Преподавателю», выберите модуль, СУБД и вид разбора. Здесь находятся презентация и настройка данных преподавателя. Слайды перелистываются кнопками или стрелками; «Содержание» ведёт к нужному месту. Esc закрывает окно. Профиль можно сохранить в JSON и перенести на другой компьютер.</p></section>
  </div>`;closeButton();
 }
 // Expand long teaching elements into readable pieces; never truncate source text.
 function lessonSlides(html,doc=document){
  const template=doc.createElement('template');template.innerHTML=html;
  const result=[];let title='Введение',blocks=[],weight=0,part=1,context='';
  const atoms=[];
  function expand(node,sourceLabel=''){
   if(node.nodeType!==1){atoms.push(node);return;}
   if(node.matches('details')){
    const heading=doc.createElement('h4');heading.textContent=node.querySelector('summary')?.textContent||'Подробности';atoms.push(heading);
    const label=node.classList.contains('code-source')?heading.textContent.split(' · ')[0]:sourceLabel;
    [...node.childNodes].filter(x=>x.nodeName!=='SUMMARY').forEach(x=>expand(x,label));return;
   }
   if(node.matches('section,div')&&node.querySelector('table,pre,h2,h3,h4,details,figure')){[...node.childNodes].forEach(x=>expand(x,sourceLabel));return;}
   if(node.matches('pre')&&node.querySelector('code')){
    const lines=node.querySelector('code').textContent.replace(/\r\n/g,'\n').split('\n');
    for(let i=0;i<lines.length;i+=17){const pre=doc.createElement('pre'),code=doc.createElement('code');code.textContent=lines.slice(i,i+17).join('\n');pre.append(code);pre.setAttribute('data-code-lines',(i+1)+'–'+Math.min(i+17,lines.length));pre.setAttribute('data-code-file',sourceLabel);atoms.push(pre);}return;
   }
   if(node.matches('table')){
    const rows=[...node.querySelectorAll('tbody > tr')];
    if(rows.length>5){for(let i=0;i<rows.length;i+=5){const copy=node.cloneNode(true);copy.querySelectorAll('tbody').forEach(x=>x.remove());if(i+5<rows.length)copy.querySelectorAll('tfoot').forEach(x=>x.remove());const body=doc.createElement('tbody');rows.slice(i,i+5).forEach(x=>body.append(x.cloneNode(true)));copy.append(body);copy.setAttribute('data-table-rows',(i+1)+'–'+Math.min(i+5,rows.length));atoms.push(copy);}return;}
   }
   if(node.matches('ol,ul')&&[...node.childNodes].every(x=>x.nodeName==='LI'||!x.textContent.trim())){
    const items=[...node.children];let batch=[],length=0,start=Number(node.getAttribute('start'))||1;
    const emit=()=>{if(!batch.length)return;const list=node.cloneNode(false);if(node.nodeName==='OL')list.setAttribute('start',String(start));batch.forEach(x=>list.append(x.cloneNode(true)));atoms.push(list);start+=batch.length;batch=[];length=0;};
    for(const item of items){if(batch.length&&(batch.length===4||length+item.textContent.length>650))emit();batch.push(item);length+=item.textContent.length;}emit();return;
   }
   atoms.push(node);
  }
  [...template.content.childNodes].forEach(x=>expand(x));
  function flush(){if(!blocks.length)return;result.push({title,part,context,html:blocks.join('')});blocks=[];weight=0;part++;}
  for(const node of atoms){
   if(node.nodeType===3&&!node.textContent.trim())continue;
   if(['H1','H2','H3'].includes(node.nodeName)){flush();title=node.textContent;part=1;context='';continue;}
   const size=node.textContent.length,large=node.nodeType===1&&(node.matches('table,figure,pre,img,svg')||node.querySelector('img,svg'));
   if(node.nodeType===1&&node.matches('img,figure,svg')){if(blocks.length!==1||!/^<h4\b/i.test(blocks[0]))flush();blocks.push(node.outerHTML);flush();continue;}
   if(node.nodeName==='H4'){if(blocks.length)flush();context=node.textContent;part=1;}
   const onlyHeading=blocks.every(b=>/^<h4\b|^<p class="code-actions"/i.test(b));
   if(blocks.length&&!onlyHeading&&(weight+size>800||large))flush();
   blocks.push(node.outerHTML||E(node.textContent));weight+=size;
   if(large||weight>800)flush();
  }
  flush();return result;
 }
 function prepareSlides(){
  const name=ctx.module.title,stackName=ctx.stack==='mysql'?'MySQL':'PostgreSQL';
  const seenFiles=new Set();
  const detailed=lessonSlides(ctx.html).filter(slide=>{
   const file=slide.html.match(/data-code-file="(examples\/[^\"]+)"/)?.[1];
   if(!file)return true;
   // A file gets one introduction slide; the complete source opens in the viewer.
   if(seenFiles.has(file))return false;seenFiles.add(file);return true;
  });
  const content=deckDetail==='brief'?root.PRESENTATION_GUIDES[ctx.module.id][ctx.stack]:detailed;
  const steps=[...new Map(content.map(x=>[x.title,x])).values()];
  slides=[{title:name,cover:true,html:`<p class="slide-intro">${ctx.lessonView==='steps'?'Как сделать пошагово':'Как посмотреть готовый пример'}</p><p>C# Windows Forms + ${stackName}</p>${profileHtml()}`},
   {title:'Материалы для занятия',html:`<p>Работаем с документами и примерами выбранного модуля.</p><ul><li><a href="practice/2026/sample.zip" download>Исходные задания и приложения 2026</a></li><li><a href="downloads/polesie-${ctx.stack}.zip" download>Полный C#‑пример · ${stackName}</a></li><li><a href="sources/2026.pdf" target="_blank" rel="noopener">КОД 09.02.07-5-2026 · исходный документ</a></li>${profile.materialsUrl?`<li><a href="${E(profile.materialsUrl)}" target="_blank" rel="noopener noreferrer">Материалы преподавателя</a></li>`:''}</ul>`},
   ...Array.from({length:Math.ceil(steps.length/8)},(_,i)=>({title:'Маршрут занятия'+(i?' · продолжение':''),html:'<ol class="slide-agenda" start="'+(i*8+1)+'">'+steps.slice(i*8,i*8+8).map(step=>`<li>${E(step.title)}</li>`).join('')+'</ol>'})),...content,
   {title:'Вопросы и обсуждение',cover:true,html:'<p class="slide-intro">Какой шаг стоит повторить вместе?</p><ul><li>Объясните назначение разобранных элементов.</li><li>Покажите результат в своём проекте.</li><li>Назовите способ проверить его правильность.</li></ul>'}];
  positionKey=['polesie-slide-v3',ctx.year.contentVersion,ctx.module.id,ctx.stack,ctx.lessonView,deckDetail].join(':');
  const stored=Number(ctx.get(positionKey));slideIndex=Number.isInteger(stored)?Math.max(0,Math.min(slides.length-1,stored)):0;
 }
 function presentation(){prepareSlides();open('deck');drawSlide();}
 function go(index){slideIndex=Math.max(0,Math.min(slides.length-1,index));ctx.set(positionKey,String(slideIndex));drawSlide();dialog.querySelector('.slide-body').focus();}
 function drawSlide(){
  if(root.ExamProductTour?.active())root.ExamProductTour.close();
  const slide=slides[slideIndex];
  const file=slide.html.match(/data-code-file="(examples\/[^"]+)"/)?.[1],isCode=/<pre\b/.test(slide.html);
  const heading=isCode&&file?'Разбираем '+file.split('/').pop():(slide.context||slide.title);
  const eyebrow=slide.context?slide.title:(isCode?'Код проекта':'');
  const slideHtml=slide.context?slide.html.replace(/^<h4\b[^>]*>[\s\S]*?<\/h4>/,''):slide.html;
  dialog.innerHTML=`<header class="teaching-head deck-head"><button class="btn" data-close>← К материалам преподавателя</button><span id="teaching-title">Модуль ${ctx.module.number} · ${ctx.stack==='mysql'?'MySQL':'PostgreSQL'}</span><div class="teaching-actions"><button class="btn" id="deck-detail">${deckDetail==='brief'?'Подробный разбор':'Краткий показ'}</button><button class="btn" id="deck-toc">Содержание</button><button class="btn" id="deck-theme">${ctx.dark?'Светлая':'Тёмная'} тема</button><button class="btn" id="deck-full">На весь экран</button></div></header><progress class="deck-progress" value="${slideIndex+1}" max="${slides.length}" aria-label="Прогресс презентации"></progress><article class="presentation-slide ${slide.cover?'slide-cover':''} ${isCode?'slide-code':''} ${/<img\b/.test(slide.html)?'slide-media':''}"><header class="slide-meta"><span>ДЭ 2026 · 09.02.07</span><span>${String(slideIndex+1).padStart(2,'0')}</span></header><div class="slide-body lesson" tabindex="0">${eyebrow?`<p class="slide-section">${E(eyebrow)}</p>`:''}<h2>${E(heading)}</h2>${file?`<button class="btn slide-code-open" data-preview-url="code/${E(file)}.txt">Открыть и скопировать полный файл</button>`:''}${slide.part>1?'<p class="slide-part">Продолжение · часть '+slide.part+'</p>':''}${slideHtml}</div><footer class="slide-meta"><span>${E(profile.fullName||'Разбор проекта «Полесье»')}</span><span>Модуль ${ctx.module.number} / ${ctx.lessonView==='steps'?'Пошаговый разбор':'Готовый пример'}</span></footer></article><footer class="deck-controls"><button class="btn" id="slide-prev" ${slideIndex===0?'disabled':''}>← Назад</button><span aria-live="polite">${slideIndex+1} / ${slides.length}</span><button class="btn primary" id="slide-next" ${slideIndex===slides.length-1?'disabled':''}>Вперёд →</button></footer><p class="deck-hint" role="status"></p>`;
  root.ExamProductTour?.add('deck',dialog.querySelector('.deck-head'),'Гид');
  dialog.querySelector('#deck-detail').onclick=()=>{deckDetail=deckDetail==='brief'?'full':'brief';prepareSlides();drawSlide();};
  closeButton();dialog.querySelector('#slide-prev').onclick=()=>go(slideIndex-1);dialog.querySelector('#slide-next').onclick=()=>go(slideIndex+1);
  themeButton(dialog.querySelector('#deck-theme'));
  iconButton(dialog.querySelector('#deck-full'),'На весь экран',fullIcon);
  dialog.querySelector('#deck-full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else throw new Error();}catch{dialog.querySelector('.deck-hint').textContent='Полный экран недоступен. Разверните окно браузера вручную.';}};
  dialog.querySelector('#deck-toc').onclick=()=>{
   const existing=dialog.querySelector('.deck-toc');if(existing){existing.remove();return;}
   const nav=document.createElement('nav');nav.className='deck-toc';nav.setAttribute('aria-label','Содержание презентации');nav.innerHTML='<h3>Слайды разбора</h3>';
   slides.forEach((s,i)=>{const b=button((i+1)+'. '+(s.context||s.title)+(s.part>1?' · часть '+s.part:''),()=>go(i));if(i===slideIndex)b.setAttribute('aria-current','step');nav.append(b);});dialog.querySelector('.deck-head').after(nav);nav.querySelector('[aria-current]').focus();
  };
 }
 function mount(input){
  ctx=input;profile=readProfile();
  const tools=document.querySelector('.top-tools');tools.prepend(iconButton(button('Как пользоваться',guide),'Как пользоваться',guideIcon));
  iconButton(document.querySelector('#fullscreen'),'На весь экран',fullIcon);
  themeButton(document.querySelector('#theme'));
  if(ctx.section==='teacher'){
   const host=document.querySelector('#teacher-actions');const launch=button('Открыть презентацию',presentation);launch.classList.add('primary');launch.id='presentation-launch';host.append(launch,button('Настройка преподавателя',settings));refreshProfile();
  }
  if(dialog?.open&&kind==='deck')drawSlide();
 }
 root.ExamTeaching={mount,normalizeProfile,lessonSlides};
})(globalThis);
