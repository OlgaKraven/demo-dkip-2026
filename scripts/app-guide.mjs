export function appGuide(guide,E){
 return '<p class="lesson-lead">Соберите всё приложение по одному действию: создайте компоненты, задайте свойства, добавьте код и свяжите события. Код каждого файла можно скопировать целиком. Проверяйте результат перед переходом дальше.</p>'+guide.steps.map((s,i)=>
  `<h3>${i+1}. ${E(s.title)}</h3><p class="step-purpose">${E(s.goal)}</p><ol>${s.actions.map(a=>'<li>'+E(a)+'</li>').join('')}</ol>`+
  Object.entries(s.actionsByStack||{}).map(([stack,actions])=>`<div data-stack-only="${stack}"><ol>${actions.map(a=>'<li>'+E(a)+'</li>').join('')}</ol></div>`).join('')+
  (s.controls?'<div class="scroll-table"><table><thead><tr><th>Компонент</th><th>(Name)</th><th>Родитель / событие</th><th>Что установить</th></tr></thead><tbody>'+s.controls.map(row=>'<tr>'+row.map(v=>'<td>'+E(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'')+
  (s.codeFiles||[]).map(f=>'{{code:'+f+'}}').join('')+
  (s.image?`<figure class="app-shot"><img loading="lazy" src="${E(s.image)}" alt="${E(s.title)}"><figcaption>${E(s.caption||'Реальный экран программы. Нажмите для увеличения.')}</figcaption></figure>`:'')+
  `<p class="step-check"><strong>Проверьте:</strong> ${E(s.check)}</p>`+
  (s.link?`<p><a class="btn" href="${E(s.link.url)}">${E(s.link.title)}</a></p>`:'')
 ).join('\n')+'<details><summary>Требования к разработке из исходного задания</summary>{{requirements}}</details>';
}
