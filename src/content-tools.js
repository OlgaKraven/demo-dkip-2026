/* Reproducible example adapters. No uploads and no evaluation of student files. */
(function(root){
'use strict';
const C=root.ExamCore, E=C.escape;
const money=n=>(Math.round((n+Number.EPSILON)*100)/100).toFixed(2);
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
function dataFor(c,v){
 if(c.slug==='is'){
  const materials=v.materials.map((name,i)=>({id:i+1,name,price:v.costs[i]}));
  const products=v.items.map((name,i)=>({id:i+1,name}));
  const recipes=[{product_id:1,material_id:1,norm:v.norms[0]},{product_id:1,material_id:2,norm:v.norms[1]},{product_id:2,material_id:1,norm:v.norms[2]},{product_id:2,material_id:3,norm:v.norms[3]}];
  const order_items=[{order_id:1001,product_id:1,quantity:v.quantity[0]},{order_id:1001,product_id:2,quantity:v.quantity[1]},{order_id:1002,product_id:1,quantity:1}];
  const expected=[1001,1002].map(id=>({order_id:id,total_cost:money(order_items.filter(x=>x.order_id===id).reduce((s,o)=>s+recipes.filter(r=>r.product_id===o.product_id).reduce((a,r)=>a+o.quantity*r.norm*materials.find(m=>m.id===r.material_id).price,0),0))}));
  return {tables:[{name:'products',columns:['id','name'],rows:products.map(p=>[p.id,p.name])},{name:'materials',columns:['id','name','price'],rows:materials.map(m=>[m.id,m.name,m.price])},{name:'recipes',columns:['product_id','material_id','norm'],rows:recipes.map(r=>[r.product_id,r.material_id,r.norm])},{name:'order_items',columns:['order_id','product_id','quantity'],rows:order_items.map(o=>[o.order_id,o.product_id,o.quantity])}],expected};
 }
 if(c.slug==='programmer'){
  const k=v.seed,prices=[1999+k*13,1250+k*7,4000+k*19,640+k*11], discounts=[15,20+(k%3)*5,0,25],stocks=[4+k%3,7+k%4,0,2+k%5];
  const rows=prices.map((p,i)=>['T'+(i+1),v.items[i%2]+' · '+['стандарт','расширенный','компактный','профессиональный'][i],money(p),discounts[i],stocks[i]]);
  return {tables:[{name:'catalog',columns:['id','name','price','discount','stock'],rows}],expected:rows.map(r=>({id:r[0],price:r[2],final:money(Number(r[2])*(100-r[3])/100),large_discount:r[3]>15,out_of_stock:r[4]===0}))};
 }
 return {tables:[{name:'images',columns:['file','caption','width','height'],rows:v.items.map((t,i)=>['assets/slide-'+(i+1)+'.svg',t,1200,675])}],expected:[]};
}
function setupSql(c,v,flavor='postgres'){
 const d=dataFor(c,v), nameType=flavor==='mssql'?'NVARCHAR(160)':'VARCHAR(160)';
 let s='-- Авторские учебные данные. Выполнять только в новой пустой учебной базе.\n-- Не содержит запроса-решения. Для повторного запуска создайте другую пустую базу.\n';
 s+=`CREATE TABLE products (id INTEGER PRIMARY KEY, name ${nameType} NOT NULL);\nCREATE TABLE materials (id INTEGER PRIMARY KEY, name ${nameType} NOT NULL, price DECIMAL(12,2) NOT NULL);\nCREATE TABLE recipes (product_id INTEGER NOT NULL REFERENCES products(id), material_id INTEGER NOT NULL REFERENCES materials(id), norm DECIMAL(12,4) NOT NULL, PRIMARY KEY (product_id, material_id));\nCREATE TABLE order_items (order_id INTEGER NOT NULL, product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL, PRIMARY KEY (order_id, product_id));\n`;
 for(const t of d.tables){const values=t.rows.map(row=>'('+row.map(x=>typeof x==='number'?String(x):(flavor==='mssql'?'N':'')+q(x)).join(', ')+')').join(',\n');s+=`\nINSERT INTO ${t.name} (${t.columns.join(', ')}) VALUES\n${values};\n`;}
 return s;
}
const query=`SELECT oi.order_id,\n       ROUND(SUM(oi.quantity * r.norm * m.price), 2) AS total_cost\nFROM order_items AS oi\nJOIN recipes AS r ON r.product_id = oi.product_id\nJOIN materials AS m ON m.id = r.material_id\nGROUP BY oi.order_id\nORDER BY oi.order_id;\n`;
function svgSlide(v,i){
 const title=v.items[i],parts=title.split(' — ');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${E(title)}"><rect width="1200" height="675" fill="#1c1c1c"/><rect x="0" y="0" width="22" height="675" fill="#ED131C"/><circle cx="1050" cy="110" r="270" fill="#353535"/><circle cx="1010" cy="150" r="170" fill="none" stroke="#ED131C" stroke-width="22"/><text x="70" y="130" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="26">УЧЕБНЫЙ КАДР · ${E(v.id)} · ${i+1} / 4</text><text x="70" y="350" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="48">${E(parts[0])}</text><text x="70" y="430" fill="#E0E1E5" font-family="Arial,sans-serif" font-size="34">${E(parts[1]||'')}</text><text x="70" y="595" fill="#E0E1E5" font-family="Arial,sans-serif" font-size="24">Авторские изображения для тренировки, не приложение КОД</text></svg>`;
}
function fieldGuide(c){
 if(c.slug==='is')return 'products: id — ключ изделия; name — название. materials: id — ключ материала; name — название с единицей расхода; price — рубли за единицу материала. recipes: product_id и material_id — ссылки на эти ключи; norm — расход на одно изделие. order_items: order_id — номер заказа; product_id — изделие; quantity — количество изделий. Каждый состав и заказ полностью задан. Пустых составов в этом упражнении нет.';
 if(c.slug==='programmer')return 'id — устойчивый код позиции; name — название; price — исходная цена в рублях с десятичной точкой; discount — процент скидки (не доля и не рубли); stock — количество на складе. Исходные цены сохраняются отдельно от рассчитанных. Все записи учебные.';
 return 'file — относительный путь от создаваемого index.html; caption — подпись кадра; width и height — размеры SVG в пикселях. Все четыре файла переданы в папке assets. Учебные рисунки с текстовыми подписями не являются изображениями из официального приложения.';
}
function statement(c,y,v){
 const x=y.exercise,m=y.modules.find(a=>a.id===x.moduleId),d=dataFor(c,v);
 let out=`# ${x.title}\n\n${c.qualification} · 09.02.07 · ${y.year} · ДЭ БУ\n\n${v.id}: ${v.domain}\n\n**Статус: авторская тренировка ${x.scope==='fragment'?'фрагмента':'по мотивам модуля'}, не полный экзаменационный комплект.**\n\n${x.limits}\n\n## Условие\n${x.intro}\n\n## Предметная область\n${v.domain}. Объекты: ${v.items.join('; ')}.\n\n## Данные\n${x.inputNotes}\n\n${fieldGuide(c)}\n\n`;
 for(const t of d.tables)out+=`${t.name}.csv — ${t.rows.length} записей.\n\n`;
 out+=`## Требуемый результат\n${x.output.map(a=>'- '+a).join('\n')}\n\n## Время\nОфициальный норматив всего ${m.id}: ${m.durationSeconds/60} минут; источник: ${y.documentCode}, стр. ${y.source.timingPage}. Для отдельного фрагмента отдельный официальный лимит не установлен. Таймер модуля — ориентир, а не утверждение, что этот фрагмент занимает весь модуль.\n\n## Работа с комплектом\nРаспакуйте архив целиком. Выполняйте решение в своей локальной среде. На сайте нет отправки результатов и автоматической оценки. Сохраняйте свои файлы у себя.\n`;
 return out;
}
function statementHtml(c,y,v){
 const x=y.exercise,d=dataFor(c,v),m=y.modules.find(a=>a.id===x.moduleId);
 const table=t=>`<h3>${E(t.name)}</h3><table><thead><tr>${t.columns.map(a=>'<th>'+E(a)+'</th>').join('')}</tr></thead><tbody>${t.rows.map(r=>'<tr>'+r.map(a=>'<td>'+E(a)+'</td>').join('')+'</tr>').join('')}</tbody></table>`;
 return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(x.title)} · ${E(v.id)}</title><style>body{font:17px/1.65 Arial,sans-serif;color:#1c1c1c;max-width:1000px;margin:40px auto;padding:0 22px}h1{line-height:1.15}table{border-collapse:collapse;width:100%;margin:18px 0}th,td{border:1px solid #ccc;padding:9px;text-align:left}aside{border-left:4px solid #ed131c;padding:14px;background:#f4f4f6}.table-scroll{overflow:auto}@media print{body{font-size:11pt;max-width:none}tr{break-inside:avoid}}</style><h1>${E(x.title)}</h1><p>${E(c.qualification)} · ${y.year} · ${E(v.id)}: ${E(v.domain)}</p><aside><b>Авторская учебная тренировка. Не полный комплект ДЭ.</b><p>${E(x.limits)}</p></aside><h2>Условие</h2><p>${E(x.intro)}</p><h2>Исходные данные</h2><p>${E(x.inputNotes)}</p><p>${E(fieldGuide(c))}</p><div class="table-scroll">${d.tables.map(table).join('')}</div><h2>Результат</h2><ul>${x.output.map(a=>'<li>'+E(a)+'</li>').join('')}</ul><h2>Норматив времени</h2><p>${m.id}: ${m.durationSeconds/60} минут на весь модуль. Отдельный официальный лимит фрагмента не задан. Источник: ${E(y.documentCode)}, стр. ${y.source.timingPage}.</p><p>Работайте в своей локальной среде. Загрузка и проверка результатов на сайте отсутствуют.</p></html>`;
}
function trainingFiles(c,y,v){
 C.assert(y.exercise&&y.status!=='pending','Нет подтверждённого учебного профиля');
 const d=dataFor(c,v),files={'Задание.html':statementHtml(c,y,v),'Задание.md':statement(c,y,v),'Данные/Описание.txt':fieldGuide(c)+'\n'+y.exercise.inputNotes};
 for(const t of d.tables)files['Данные/'+t.name+'.csv']=C.csv([t.columns,...t.rows]);
 if(c.slug==='is') for(const sw of y.exercise.software)files['Данные/setup-'+sw.id+'.sql']=setupSql(c,v,sw.id);
 if(c.slug==='web')for(let i=0;i<4;i++)files['assets/slide-'+(i+1)+'.svg']=svgSlide(v,i);
 files['manifest.json']=JSON.stringify({schemaVersion:1,courseId:c.id,year:y.year,documentCode:y.documentCode,level:y.level,version:y.contentVersion,variant:v.id,exercise:y.exercise.id,scope:y.exercise.scope,status:'author-training-example',containsSolutions:false,files:Object.keys(files)},null,2);
 return files;
}
function solutionFiles(c,y,software){
 const v=c.example,d=dataFor(c,v),files={};
 if(c.slug==='is'){
  files['setup.sql']=setupSql(c,v,software);files['solution.sql']=query;
  files['expected.csv']=C.csv([['order_id','total_cost'],...d.expected.map(a=>[a.order_id,a.total_cost])]);
 }else if(c.slug==='programmer'){
  const rows=d.tables[0].rows;
  files['expected.csv']=C.csv([['id','price','final','large_discount','out_of_stock'],...d.expected.map(a=>[a.id,a.price,a.final,a.large_discount,a.out_of_stock])]);
  if(software==='python')files['solution.py']=`from decimal import Decimal, ROUND_HALF_UP\n\ndef price_after_discount(price: str, discount: int) -> Decimal:\n    p = Decimal(price)\n    if not p.is_finite() or p < 0 or not 0 <= discount <= 100:\n        raise ValueError("Недопустимые цена или скидка")\n    return (p * (100 - discount) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)\n\nrows = ${JSON.stringify(rows.map(r=>[r[0],r[2],r[3],r[4]]))}\nif __name__ == "__main__":\n    for item_id, price, discount, stock in rows:\n        print(item_id, price_after_discount(price, discount), discount > 15, stock == 0)\n`;
  if(software==='csharp'){
   files['PriceDemo.csproj']='<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup></Project>\n';
   files['Program.cs']=`using System.Globalization;\n\nstatic decimal PriceAfterDiscount(decimal price, int discount)\n{\n    if (price < 0 || discount < 0 || discount > 100)\n        throw new ArgumentOutOfRangeException();\n    return decimal.Round(price * (100m - discount) / 100m, 2, MidpointRounding.AwayFromZero);\n}\nvar rows = new (string Id, decimal Price, int Discount, int Stock)[] {\n${rows.map(r=>`    ("${r[0]}", ${r[2]}m, ${r[3]}, ${r[4]})`).join(',\n')}\n};\nforeach (var r in rows)\n    Console.WriteLine($"{r.Id} {PriceAfterDiscount(r.Price, r.Discount).ToString("F2", CultureInfo.InvariantCulture)} {r.Discount > 15} {r.Stock == 0}");\n`;
  }
  if(software==='java')files['PriceDemo.java']=`import java.math.BigDecimal;\nimport java.math.RoundingMode;\n\npublic class PriceDemo {\n    static BigDecimal priceAfterDiscount(String price, int discount) {\n        BigDecimal p = new BigDecimal(price);\n        if (p.signum() < 0 || discount < 0 || discount > 100)\n            throw new IllegalArgumentException("Недопустимые цена или скидка");\n        return p.multiply(BigDecimal.valueOf(100 - discount))\n                .divide(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);\n    }\n    public static void main(String[] args) {\n        String[] ids = {${rows.map(r=>JSON.stringify(r[0])).join(', ')}};\n        String[] prices = {${rows.map(r=>JSON.stringify(r[2])).join(', ')}};\n        int[] discounts = {${rows.map(r=>r[3]).join(', ')}};\n        int[] stocks = {${rows.map(r=>r[4]).join(', ')}};\n        for (int i = 0; i < ids.length; i++)\n            System.out.println(ids[i] + " " + priceAfterDiscount(prices[i], discounts[i]) + " " + (discounts[i] > 15) + " " + (stocks[i] == 0));\n    }\n}\n`;
 }else{
  files['index.html']=`<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Учебный слайдер</title><link rel="stylesheet" href="style.css"></head><body><main><h1>${E(v.domain)}</h1><figure><img id="slide" src="assets/slide-1.svg" alt="${E(v.items[0])}"><figcaption id="caption">${E(v.items[0])}</figcaption></figure><div class="controls"><button id="prev" type="button">Назад</button><span id="position">1 / 4</span><button id="next" type="button">Вперёд</button></div></main><script src="slider.js"></script></body></html>\n`;
  files['style.css']='*{box-sizing:border-box}body{margin:0;background:#f4f4f6;color:#1c1c1c;font:18px/1.5 Arial,sans-serif}main{max-width:980px;margin:auto;padding:20px}h1{font-size:clamp(24px,4vw,40px);overflow-wrap:anywhere}figure{margin:0}img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}figcaption{padding:14px 0}.controls{display:flex;align-items:center;justify-content:space-between;gap:12px}button{font:inherit;padding:12px 20px;border:1px solid #1c1c1c;background:white;cursor:pointer}button:focus-visible{outline:3px solid #4561c8;outline-offset:3px}\n';
  files['slider.js']=`'use strict';\nconst slides = ${JSON.stringify(v.items.map((caption,i)=>({src:'assets/slide-'+(i+1)+'.svg',caption})),null,2)};\nlet index = 0;\nlet interval;\nfunction show() {\n    document.getElementById('slide').src = slides[index].src;\n    document.getElementById('slide').alt = slides[index].caption;\n    document.getElementById('caption').textContent = slides[index].caption;\n    document.getElementById('position').textContent = (index + 1) + ' / ' + slides.length;\n}\nfunction move(direction) {\n    index = (index + direction + slides.length) % slides.length;\n    show();\n}\nfunction restart() {\n    clearInterval(interval);\n    interval = setInterval(() => move(1), 3000);\n}\ndocument.getElementById('prev').addEventListener('click', () => { move(-1); restart(); });\ndocument.getElementById('next').addEventListener('click', () => { move(1); restart(); });\nshow();\nrestart();\n`;
  for(let i=0;i<4;i++)files['assets/slide-'+(i+1)+'.svg']=svgSlide(v,i);
 }
 const sw=y.exercise.software.find(x=>x.id===software);
 files['Пояснение.md']=`# Разобранный учебный пример V00\n\n${y.exercise.title}\n\n${y.exercise.limits}\n\n## Среда\n${sw.environment}\n\n${sw.steps.map((x,i)=>(i+1)+'. '+x).join('\n')}\n\n## Порядок решения\n${y.exercise.steps.map(([h,t])=>'### '+h+'\n'+t).join('\n\n')}\n\n## Проверка\n${y.exercise.checks.join('\n\n')}\n\n## Границы проверки\n${sw.verified}\n\nЭто авторское учебное решение, не официальное решение ИРПО и не полный экзаменационный проект. Другие языки и программы допустимы на экзамене только при соответствии подтверждённой инфраструктуре площадки.\n`;
 return files;
}
root.ExamContent=Object.freeze({dataFor,setupSql,query,svgSlide,fieldGuide,statement,statementHtml,trainingFiles,solutionFiles});
})(globalThis);
