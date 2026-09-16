(function(root){
 'use strict';
 function mount(ctx){
  const article=document.querySelector('.article.lesson');if(!article)return;
  const headings=[...article.querySelectorAll(':scope > h3[id]')];if(!headings.length)return;
  const sections=headings.map(h=>{const part=document.createElement('section');part.className='study-step';h.before(part);let n=h;while(n&&!(n!==h&&n.matches?.('h3[id]'))){const next=n.nextSibling;part.append(n);n=next;}return part;});
  const key=['study-step-v1',ctx.module.id,ctx.stack,ctx.lessonView].join(':');
  const hashIndex=headings.findIndex(h=>'#'+h.id===location.hash);
  let index=hashIndex>=0?hashIndex:Math.min(sections.length-1,Math.max(0,Number(ctx.get(key))||0));
  const controls=document.createElement('nav');controls.className='study-controls';controls.setAttribute('aria-label','Переход между шагами');controls.innerHTML='<button class="btn" data-prev>← Назад</button><span role="status"></span><button class="btn primary" data-next>Далее →</button><button class="btn" data-all>Показать все шаги</button>';article.append(controls);
  let showAll=false;
  const toc=document.querySelector('.lesson-toc');
  function display(scroll){sections.forEach((s,i)=>s.hidden=!showAll&&i!==index);controls.querySelector('[data-prev]').disabled=index===0;controls.querySelector('[data-next]').disabled=index===sections.length-1;controls.querySelector('[role=status]').textContent='Шаг '+(index+1)+' из '+sections.length;controls.querySelector('[data-all]').textContent=showAll?'По одному шагу':'Показать все шаги';toc?.querySelectorAll('a').forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});ctx.set(key,String(index));if(scroll){const u=new URL(location.href);u.hash=headings[index].id;history.replaceState(null,'',u);sections[index].scrollIntoView({block:'start',behavior:'instant'});}}
  controls.querySelector('[data-prev]').onclick=()=>{index--;display(true);};controls.querySelector('[data-next]').onclick=()=>{index++;display(true);};controls.querySelector('[data-all]').onclick=()=>{showAll=!showAll;display(false);};
  toc?.querySelectorAll('a').forEach((a,i)=>a.onclick=e=>{e.preventDefault();index=i;history.replaceState(null,'',a.getAttribute('href'));display(true);});
  display(false);
 }
 root.ExamStudySteps={mount};
})(globalThis);
