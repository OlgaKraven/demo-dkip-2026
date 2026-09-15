import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildErGuide} from '../scripts/er-guide.mjs';
const data=buildErGuide();
test('all SQL fields have provenance and all FK endpoints exist in both stacks',()=>{
 for(const schema of Object.values(data.stacks)){
 assert.equal(schema.tables.length,11);
 for(const t of schema.tables)for(const f of t.fields){assert.ok(f.title&&f.why&&f.kind,t.id+'.'+f.id);if(f.file)assert.ok(fs.existsSync('materials/practice/2026/assets/M1/'+f.file));}
 for(const l of schema.links){assert.ok(schema.tables.find(t=>t.id===l.from).fields.find(f=>f.id===l.field));assert.ok(schema.tables.find(t=>t.id===l.to).fields.find(f=>f.id===l.target)?.pk);}
 }
 assert.deepEqual(data.stacks.mysql.links.map(l=>l.from+'.'+l.field+'>'+l.to).sort(),data.stacks.postgresql.links.map(l=>l.from+'.'+l.field+'>'+l.to).sort());
});
test('JSON provenance uses real source values, including original addres spelling and leading zeros',()=>{
 const original=JSON.parse(fs.readFileSync('materials/practice/2026/assets/M1/Заказчики.json','utf8'))[5];
 for(const f of data.stacks.postgresql.tables.find(t=>t.id==='counterparty').fields){const key=f.location.match(/\[5\]\.(\w+)/)[1];assert.equal(f.value,String(original[key]));}
});
test('unknown dates and one-to-one constraint are not presented as invented source data',()=>{
 const s=data.stacks.postgresql;
 assert.equal(s.tables.find(t=>t.id==='price').fields.find(f=>f.id==='valid_from').kind,'Решение модели');
 assert.equal(s.links.find(l=>l.from==='specification'&&l.field==='product_id').cardinality,'1 : 0..1');
 assert.equal(s.tables.find(t=>t.id==='production').fields.find(f=>f.id==='manufacturer_id').nullable,false);
});
