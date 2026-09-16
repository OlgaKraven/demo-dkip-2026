(function(root){
 'use strict';
 const E=v=>root.ExamCore.escape(v);
 function localUrl(value){const u=new URL(value,location.href);if(u.origin!==location.origin||!u.pathname.startsWith(new URL('./',location.href).pathname))return null;return u;}
 function fileList(files){return '<ul class="resource-list">'+files.map(f=>'<li><span>'+E(f.name)+'</span><div><button class="btn" data-preview-url="'+E(f.url)+'">Просмотр</button><a class="btn" href="'+E(f.url)+'" download data-download>Скачать</a></div></li>').join('')+'</ul>';}
 function shell(title,url){
  const previous=document.activeElement,d=document.createElement('dialog');d.className='resource-dialog';d.setAttribute('aria-labelledby','resource-title');
  d.innerHTML='<header class="resource-head"><h2 id="resource-title">'+E(title)+'</h2><div><a class="btn" href="'+E(url)+'" download data-download>Скачать</a><button class="btn" data-close>Закрыть</button></div></header><div class="resource-tools"></div><div class="resource-body" tabindex="0"><p role="status">Открываем файл…</p></div>';
  document.body.append(d);d.addEventListener('close',()=>{d.remove();if(previous?.isConnected)previous.focus({preventScroll:true});});d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();return d;
 }
 function imageView(src,title){
  const u=localUrl(src);if(!u)return;const d=shell(title||'Изображение',u.href),body=d.querySelector('.resource-body'),tools=d.querySelector('.resource-tools');body.classList.add('resource-image-stage');body.innerHTML='<img alt="'+E(title||'Увеличенное изображение')+'">';const img=body.querySelector('img');let scale=1;
  tools.innerHTML='<button class="btn" data-less aria-label="Уменьшить изображение">−</button><span role="status"></span><button class="btn" data-more aria-label="Увеличить изображение">+</button><button class="btn" data-fit>Поместить целиком</button><button class="btn" data-actual>100%</button>';
  function draw(value){scale=Math.max(.1,Math.min(4,value));img.style.width=Math.round(img.naturalWidth*scale)+'px';tools.querySelector('[role=status]').textContent=Math.round(scale*100)+'%';}
  function fit(){draw(Math.min(1,(body.clientWidth-32)/img.naturalWidth,(body.clientHeight-32)/img.naturalHeight));}
  img.onload=fit;img.onerror=()=>{body.textContent='Изображение не загрузилось. Попробуйте скачать файл.';};img.src=u.href;
  tools.querySelector('[data-less]').onclick=()=>draw(scale/1.25);tools.querySelector('[data-more]').onclick=()=>draw(scale*1.25);tools.querySelector('[data-fit]').onclick=fit;tools.querySelector('[data-actual]').onclick=()=>draw(1);
 }
 async function open(value,title){
  const u=localUrl(value);if(!u)return;const name=decodeURIComponent(u.pathname.split('/').pop());if(/\.(png|jpe?g|svg|webp)$/i.test(u.pathname)){imageView(u.href,title||name);return;}
  const d=shell(title||name,u.href),body=d.querySelector('.resource-body');
  try{
   const key=decodeURIComponent(u.pathname.slice(new URL('./',location.href).pathname.length));const preview=root.FILE_PREVIEWS?.[key];
   if(preview){body.innerHTML=preview.sheets.map(s=>'<section class="sheet-preview"><h3>'+E(s.name)+'</h3><div class="sheet-scroll">'+s.html+'</div></section>').join('');return;}
   if(/\.(pdf|html?)$/i.test(u.pathname)){body.classList.add('resource-document');body.innerHTML='<iframe title="'+E(title||name)+'"'+(/\.pdf$/i.test(u.pathname)?'':' sandbox="allow-same-origin"')+' src="'+E(u.href)+'"></iframe>';return;}
   const response=await fetch(u.href);if(!response.ok)throw Error('HTTP '+response.status);let text=await response.text();if(/\.json$/i.test(u.pathname))text=JSON.stringify(JSON.parse(text),null,2);
   body.innerHTML='<pre><code></code></pre>';body.querySelector('code').textContent=text;d.querySelector('.resource-tools').innerHTML='<button class="btn" data-copy-code>Копировать весь текст</button>';
  }catch{body.innerHTML='<p>Просмотр этого файла недоступен. Скачайте оригинал кнопкой вверху.</p>';}
 }
 document.addEventListener('click',async event=>{
  const copy=event.target.closest('[data-copy-code]');if(copy){event.preventDefault();const code=copy.closest('.code-source,.resource-dialog,.program-code')?.querySelector('pre code');if(!code)return;try{await navigator.clipboard.writeText(code.textContent);copy.textContent='Скопировано';}catch{copy.textContent='Выделите текст и нажмите Ctrl+C';}return;}
  const explicit=event.target.closest('[data-preview-url]');if(explicit){event.preventDefault();open(explicit.dataset.previewUrl,explicit.dataset.previewTitle);return;}
  if(event.target.closest('.resource-dialog'))return;
  const img=event.target.closest('.lesson img,.program-content img,.presentation-slide img,.practice-condition img');if(img){event.preventDefault();event.stopPropagation();imageView(img.currentSrc||img.src,img.alt);return;}
  const a=event.target.closest('a[href]');if(!a||a.hasAttribute('download')||a.hasAttribute('data-download'))return;
  const u=localUrl(a.href);if(u&&/\.(pdf|json|xlsx|csv|txt|sql|html?|png|jpe?g|svg|webp)$/i.test(u.pathname)&&a.closest('main,dialog')){event.preventDefault();event.stopPropagation();open(u.href,a.textContent.trim());}
 },true);
 root.ExamResources={open,imageView,fileList};
})(globalThis);
