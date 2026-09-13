import fs from 'node:fs';
import path from 'node:path';
import '../src/conditions.js';

// Each row defines a separate manufacturing brief: company, two products, three materials.
const domains=[
 ['Молочная мастерская','Йогурт','Какао-напиток','Молоко','Сахар','Какао'],
 ['Пекарня Колос','Булочка','Кекс','Мука','Сахар','Масло'],
 ['Кондитерская Лакомка','Печенье','Пряник','Мука','Мёд','Масло'],
 ['Мастерская Свеча','Свеча малая','Свеча большая','Воск','Краситель','Ароматизатор'],
 ['Мыльная фабрика','Мыло классическое','Мыло ароматное','Мыльная основа','Масло','Ароматизатор'],
 ['Цех Керамика','Чашка','Тарелка','Глина','Глазурь','Пигмент'],
 ['Мебельный цех','Полка','Тумба','Древесина','Клей','Лак'],
 ['Швейная мастерская','Сумка','Чехол','Ткань','Подкладка','Нить'],
 ['Фабрика Упаковка','Коробка малая','Коробка большая','Картон','Клей','Краска'],
 ['Чайная фабрика','Чай ягодный','Чай пряный','Чайный лист','Ягоды','Пряности'],
 ['Кофейная мастерская','Смесь утренняя','Смесь десертная','Арабика','Робуста','Пряности'],
 ['Цех Лимонад','Напиток цитрусовый','Напиток ягодный','Вода','Сироп','Ягодное пюре'],
 ['Фабрика Мороженое','Пломбир','Шоколадное мороженое','Сливки','Сахар','Какао'],
 ['Макаронный цех','Лапша','Паста с зеленью','Мука','Яичная смесь','Сушёная зелень'],
 ['Фабрика Соус','Соус томатный','Соус острый','Томатное пюре','Масло','Специи'],
 ['Цех Варенье','Джем','Конфитюр','Ягодное пюре','Сахар','Пектин'],
 ['Фабрика Шоколад','Плитка','Шоколадные конфеты','Какао-масса','Сахар','Ореховая паста'],
 ['Цех Сыр','Сыр сливочный','Сыр с травами','Молоко','Закваска','Сушёные травы'],
 ['Цех Полуфабрикат','Пельмени','Равиоли','Тесто','Мясная начинка','Сырная начинка'],
 ['Фабрика Завтрак','Гранола','Батончик','Хлопья','Мёд','Сухофрукты'],
 ['Цех Бетон','Плитка','Бордюр','Цемент','Песок','Пигмент'],
 ['Мастерская Краска','Краска белая','Краска цветная','Основа','Наполнитель','Пигмент'],
 ['Фабрика Бумага','Лист белый','Лист цветной','Целлюлоза','Клей','Краситель'],
 ['Студия Косметика','Крем базовый','Крем питательный','Эмульсионная основа','Масло','Витаминная смесь'],
 ['Цех Уборка','Средство для пола','Средство для кухни','Моющая основа','Вода','Ароматизатор'],
 ['Мастерская Декор','Гипсовая фигурка','Декоративное панно','Гипс','Вода','Пигмент'],
 ['Цех Сувенир','Подставка','Сувенирная табличка','Смола','Наполнитель','Краситель'],
 ['Фабрика Корм','Корм базовый','Корм витаминный','Зерновая смесь','Белковая смесь','Витаминная добавка'],
 ['Садовая мастерская','Грунт универсальный','Грунт для цветов','Торф','Песок','Минеральная добавка'],
 ['Цех Аромат','Саше','Ароматическая плитка','Воск','Сухие цветы','Ароматизатор']
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const money=n=>(n/100).toFixed(2);
function table(title,columns,rows){return `<h3>${esc(title)}</h3><div class="scroll-table"><table><thead><tr>${columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;}
export function makeVariants(){return domains.map((d,index)=>{
 const number=index+1,id='V'+String(number).padStart(2,'0'),batch=[1,5,10][index%3];
 const company=`ООО «${d[0]}»`,customerIds=Array.from({length:6},(_,i)=>String(number*100+i+1).padStart(9,'0'));
 const customers=customerIds.map((key,i)=>({id:key,name:i===0?company:i===1?`ООО «Снабжение ${number}»`:`ООО «Заказчик ${number}-${i-1}»`,inn:'',addres:`г. Учебный, ул. Производственная, ${number*10+i}`,phone:`+7000${String(number*100+i).padStart(7,'0')}`,salesman:i<2,buyer:i>=2}));
 const products=d.slice(1,3).map((name,i)=>({code:`P${i+1}`,name,unit:'шт',batch}));
 const materials=d.slice(3).map((name,i)=>({code:`M${i+1}`,name,unit:'кг'}));
 const recipe=[['P1','M1',200+number*2],['P1','M2',30+number],['P2','M1',300+number*3],['P2','M2',40+number],['P2','M3',10+number]].map(([product,material,grams])=>({product,material,qty:grams*batch/1000}));
 const prices=materials.flatMap((m,i)=>[{material:m.code,from:'2026-05-01',cents:5000+number*130+i*2700},{material:m.code,from:'2026-06-15',cents:5500+number*140+i*2900}]);
 const orders=[['2026-06-10',6+number,3+number],['2026-06-20',4+number,8+number],['2026-07-01',10+number,2+number]].map(([date,a,b],i)=>({number:`${id}-ЗП-${i+1}`,date,customer:customerIds[i+2],executor:customerIds[0],lines:[{product:'P1',qty:a,salePrice:money(20000+number*500)},{product:'P2',qty:b,salePrice:money(30000+number*500)}]}));
 const production={number:`${id}-ПР-1`,date:'2026-06-09',manufacturer:customerIds[0],product:'P1',qty:batch*2,materials:recipe.filter(r=>r.product==='P1').map(r=>({material:r.material,qty:r.qty*2}))};
 const tasks=[
  {id:'M1',title:'Проектирование ER-диаграммы',text:`По документам ${id} спроектируйте базу предприятия ${company}. Отразите контрагентов, номенклатуру, заказы со строками, спецификации, цены на даты и производство. Обеспечьте 3НФ, PK и FK. Сохраните читаемую ER-диаграмму в PDF.`},
  {id:'M2',title:'Разработка базы данных',text:`Создайте базу по своей диаграмме на MySQL или PostgreSQL. Настройте типы, ключи, связи и ограничения. Импортируйте шесть записей из файла «Заказчики.json» варианта ${id}. Внесите номенклатуру, спецификации, историю цен, заказы и производство из исходных документов. Сохраните SQL-дамп структуры и данных.`},
  {id:'M3',title:'Создание запроса',text:`Создайте запрос полной материальной стоимости каждого из трёх заказов ${id}. Учитывайте количество продукции, нормы на партию, выход партии и последнюю цену материала, действующую на дату заказа. Цена продажи не участвует в расчёте. Сохраните запрос и его результат. Проверьте один заказ вручную.`},
  {id:'M4',title:'Разработка информационной системы',text:`Создайте приложение C# Windows Forms для ${company} с подключением к своей базе. Реализуйте обязательные логин и пароль, роли «Администратор» и «Пользователь», пазл из изображения. Три подряд ошибки пароля или пазла блокируют учётную запись. Администратор добавляет и изменяет пользователей, снимает блокировку; повторяющийся логин запрещён. Используйте сообщения и требования к оформлению из приложенного условия M4. Покажите в приложении заказчиков и расчёт заказов своего варианта. Сохраните исходный проект и снимки основных форм.`},
  {id:'M5',title:'Разработка проектной документации',text:`Опишите назначение и реализованные функции приложения ${company}, способы запуска и подключения, используемые методы с параметрами и результатами. Добавьте снимки своих форм, описание ролей и результаты проверки входа, блокировки, импорта и расчёта. Сохраните документацию рядом с проектом.`}
 ];
 const inputHtml=`<p>Предприятие: <strong>${esc(company)}</strong>. Выпускает два вида продукции по спецификациям и продаёт их заказчикам. Каждый материал учитывается в килограммах, готовая продукция — в штуках. Нормы условные и относятся к указанному выходу партии.</p>`+
 table('Номенклатура',['Код','Наименование','Вид','Единица'],[...products.map(p=>[p.code,p.name,'Продукция',p.unit]),...materials.map(m=>[m.code,m.name,'Материал',m.unit])])+
 table('Спецификации',['Продукция','Выход партии, шт','Материал','Норма на партию, кг'],recipe.map(r=>[r.product,batch,r.material,r.qty.toFixed(3)]))+
 table('История цен материалов',['Материал','Действует с','Цена за кг, руб.'],prices.map(p=>[p.material,p.from,money(p.cents)]))+
 table('Заказы покупателей',['Номер','Дата','Заказчик (код)','Исполнитель (код)','Продукция','Количество, шт','Цена продажи, руб.'],orders.flatMap(o=>o.lines.map(l=>[o.number,o.date,o.customer,o.executor,l.product,l.qty,l.salePrice])))+
 table('Производство: выпуск',['Документ','Дата','Производитель (код)','Продукция','Выпущено, шт'],[[production.number,production.date,production.manufacturer,production.product,production.qty]])+
 table('Производство: расход',['Документ','Материал','Фактически израсходовано, кг'],production.materials.map(m=>[production.number,m.material,m.qty.toFixed(3)]))+
 table('Контрагенты',['Код','Название','Поставщик','Покупатель'],customers.map(c=>[c.id,c.name,c.salesman?'Да':'Нет',c.buyer?'Да':'Нет']));
 return {id,number,company,title:d[0],batch,customers,products,materials,recipe,prices,orders,production,tasks,inputHtml,zip:`mock/${id}.zip`,document:`mock/${id}.html`};
});}

export function buildVariants(out,zip,standalone){
 const variants=makeVariants(),all={};
 const instructions=fs.readFileSync('content/is.json','utf8');
 const source=JSON.parse(instructions).years.find(y=>y.year===2026).practice.tasks.find(t=>t.id==='M4');
 const shared={};
 // Use the original M4 resources, including its interface requirements and puzzle images.
 for(const f of source.files){const p=path.join('materials',f.url);if(fs.existsSync(p))shared['Приложения_M4/'+f.name]=fs.readFileSync(p);}
 fs.mkdirSync(path.join(out,'mock'),{recursive:true});
 for(const v of variants){
  const body=`<p>Учебный вариант ${v.id} · номер по списку ${v.number} · C# WinForms + MySQL / PostgreSQL · 150 минут</p><p>Выполните пять заданий на одном наборе данных. Материалы подходят для обоих стеков.</p>${v.tasks.map(t=>`<h2>${esc(t.id+' · '+t.title)}</h2>${ExamConditions.format(t.text,t.id)}`).join('')}${v.inputHtml}<h2>Требования к приложению</h2>${ExamConditions.format(source.text,'M4',true)}`;
  const page=standalone(`${v.id} · ${v.company}`,body).replaceAll('href="style.css"','href="../style.css"').replaceAll('href="lessons.css"','href="../lessons.css"').replaceAll('href="./"','href="../?mode=mock"');
  fs.writeFileSync(path.join(out,v.document),page);
  const data={variant:v.id,company:v.company,products:v.products,materials:v.materials,specifications:v.recipe,prices:v.prices.map(p=>({material:p.material,from:p.from,price:money(p.cents)})),orders:v.orders,production:v.production};
  const files={...shared,'Задания и документы.html':page.replaceAll('../style.css','style.css').replaceAll('../lessons.css','lessons.css').replaceAll('href="../?mode=mock"','href="https://olgakraven.github.io/demo-dkip-2026/?mode=mock"'),'Заказчики.json':JSON.stringify(v.customers,null,2),'Исходные данные.json':JSON.stringify(data,null,2),'style.css':fs.readFileSync('src/style.css'),'lessons.css':fs.readFileSync('src/lessons.css'),'Начните здесь.txt':`${v.id} — ${v.company}\nНомер по списку: ${v.number}.\nОткройте «Задания и документы.html» браузером. Исходные документы представлены таблицами.\n«Заказчики.json» содержит 6 контрагентов; поле addres — адрес, salesman и buyer — признаки ролей. «Исходные данные.json» содержит остальные документы. Свяжите коды из документов со своей моделью. Количество в specifications задано на выход партии products.batch.\nВсе задания выполняются на одном варианте; готовой базы и решения в архиве нет.\nМатериалы M4 находятся в папке Приложения_M4.\nРезультаты: ER.pdf, SQL-дамп, запрос, C#-проект и документация.\n`};
  const archive=zip(files);fs.writeFileSync(path.join(out,v.zip),archive);all[v.id+'.zip']=archive;
 }
 fs.writeFileSync(path.join(out,'mock/all-30.zip'),zip(all));
 return variants.map(({customers,products,materials,recipe,prices,orders,production,...visible})=>visible);
}
