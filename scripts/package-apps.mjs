import fs from 'node:fs';
import path from 'node:path';
import '../src/core.js';

// Run locally after building both .NET Framework projects with MSBuild.
fs.mkdirSync('materials/applications',{recursive:true});
for(const stack of ['mysql','postgresql']){
 const bin=`examples/${stack}/bin/Debug`,exe=`Polesie.${stack}.exe`,files={};
 for(const name of fs.readdirSync(bin))if(name.endsWith('.dll')||name===exe||name===exe+'.config')files[name]=fs.readFileSync(path.join(bin,name));
 if(!files[exe]||files[exe].subarray(0,2).toString()!=='MZ')throw Error(`Build ${exe} first`);
 const assets=JSON.parse(fs.readFileSync(`examples/${stack}/obj/project.assets.json`));
 for(const [id,pkg] of Object.entries(Object.values(assets.targets)[0])){
  for(const runtime of Object.keys(pkg.runtime||{}))if(runtime.endsWith('.dll')&&!files[path.basename(runtime)])throw Error(`Missing runtime dependency: ${id}/${runtime}. Rebuild with NuGet restore.`);
  if(!Object.keys(pkg.runtime||{}).length)continue;
  const folder=path.join(Object.keys(assets.packageFolders)[0],assets.libraries[id].path);
  for(const name of fs.readdirSync(folder))if(/^(license|licence|copyright|third-party-notices)(\..*)?$/i.test(name))files[`Licenses/${id.replace('/','-')}/${name}`]=fs.readFileSync(path.join(folder,name));
 }
 for(const [folder,source] of [['Assets','examples/shared/Assets'],['Sql',`examples/${stack}/Sql`]])for(const name of fs.readdirSync(source))if(fs.statSync(path.join(source,name)).isFile())files[folder+'/'+name]=fs.readFileSync(path.join(source,name));
 files['Заказчики.json']=fs.readFileSync('materials/practice/2026/assets/M2/Заказчики.json');
 files['Запуск.txt']=Buffer.from(`Готовое приложение «Полесье» — ${stack}\r\n\r\nНужны Windows, .NET Framework 4.8 и установленный сервер ${stack==='mysql'?'MySQL':'PostgreSQL'}. Для изменения подключения нужны исходники и Visual Studio.\r\n\r\n1. Распакуйте архив целиком в отдельную папку.\r\n2. Создайте отдельную пустую базу rassvet_demo_2026.\r\n3. Выполните в ней Sql/01-schema.sql, 02-customers.sql и 03-demo.sql по одному разу в указанном порядке.\r\n4. Для MySQL в этой сборке используются 127.0.0.1:3306, база rassvet_demo_2026, root без пароля. PostgreSQL требует настройки пароля до запуска. Скачайте исходники выбранной СУБД, откройте Data/Db.cs, измените ConnectionString и соберите проект. Используйте EXE из своей сборки. Не отключайте пароль своего сервера ради этого примера.\r\n5. Запустите ${exe}. DLL и папки Assets и Sql должны остаться рядом.\r\n6. Введите admin / DemoAdmin!2026, соберите пазл и нажмите «Войти». Для обычной роли: user / DemoUser!2026.\r\n7. Исходники и пошаговое создание: https://olgakraven.github.io/demo-dkip-2026/?mode=learn&module=M4&stack=${stack}\r\n\r\nПароль подключения к серверу не совпадает с учебным паролем приложения. Сервер базы в архив не входит.\r\n`,'utf8');
 fs.writeFileSync(`materials/applications/polesie-${stack}-app.zip`,ExamCore.zip(files));
 console.log(`${stack}: ${Object.keys(files).length} runtime files; local credentials excluded`);
}
