import fs from 'node:fs';

function splitDefinitions(body) {
 let depth=0, start=0; const parts=[];
 for(let i=0;i<body.length;i++) {
  if(body[i]==='(')depth++;
  if(body[i]===')')depth--;
  if(body[i]===','&&depth===0){parts.push(body.slice(start,i).trim());start=i+1;}
 }
 parts.push(body.slice(start).trim()); return parts;
}
export function schemaGuide(stack,E) {
 const sql=fs.readFileSync(`examples/${stack}/Sql/01-schema.sql`,'utf8');
 return [...sql.matchAll(/CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/g)].map(([,name,body])=>{
  const defs=splitDefinitions(body),fields=defs.filter(d=>! /^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/.test(d));
  const rows=fields.map(d=>{
   const [,field,type,rest]=d.match(/^(\w+)\s+(\w+(?:\([^)]*\))?)([\s\S]*)$/);
   const notes=[];
   if(/PRIMARY KEY/.test(rest))notes.push('PRIMARY');
   if(/UNIQUE/.test(rest))notes.push('UNIQUE');
   if(/AUTO_INCREMENT|AS IDENTITY/.test(rest))notes.push(stack==='mysql'?'A_I включён':'Identity: BY DEFAULT');
   const def=rest.match(/DEFAULT (FALSE|TRUE|\d+|'[^']*')/);if(def)notes.push('По умолчанию: '+def[1]);
   const reference=rest.match(/REFERENCES (\w+)\((\w+)\)/);if(reference)notes.push('Внешний ключ: '+reference[1]+'.'+reference[2]);
   const check=rest.match(/CHECK\(([\s\S]*)\)/);if(check)notes.push('CHECK: '+check[1]);
   const pk=defs.some(x=>x.startsWith('PRIMARY KEY')&&x.match(/\((.*?)\)/)[1].split(',').map(x=>x.trim()).includes(field));
   return `<tr><td><code>${E(field)}</code></td><td>${E(type)}</td><td>${/NOT NULL|PRIMARY KEY/.test(rest)||pk?'Нет':'Да'}</td><td>${E(notes.join('; ')||'—')}</td></tr>`;
  }).join('');
  const constraints=defs.filter(d=>/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/.test(d)).map(d=>{
   const fk=d.match(/^FOREIGN KEY\((.*?)\) REFERENCES (\w+)\((.*?)\)/);
   if(fk)return `Связь: ${fk[1]} → ${fk[2]}.${fk[3]}; ON DELETE / ON UPDATE: RESTRICT (в PostgreSQL по умолчанию NO ACTION).`;
   return d.replace('PRIMARY KEY','Общий первичный ключ').replace('UNIQUE','Уникальный индекс');
  });
  return `<details class="schema-card"><summary><strong>${E(name)}</strong> · ${fields.length} полей</summary><table><thead><tr><th>Поле</th><th>Тип (длина)</th><th>NULL</th><th>Настройки</th></tr></thead><tbody>${rows}</tbody></table>${constraints.length?'<ul>'+constraints.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul>':''}</details>`;
 }).join('');
}
