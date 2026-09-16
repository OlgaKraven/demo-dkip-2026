import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildErGuide} from '../scripts/er-guide.mjs';
import '../src/product-tour.js';
const data=buildErGuide();
test('walkthrough reserves final positions and wire routes on every step',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('site/er-data.js','utf8'),context);
 const layouts=Object.values(context.ER_GUIDE.layouts),final=layouts.at(-1);
 for(const layout of layouts){
  assert.equal(layout.width,final.width);assert.equal(layout.height,final.height);
  for(const node of layout.nodes)assert.deepEqual(node,final.nodes.find(n=>n.id===node.id));
  for(const edge of layout.edges)assert.deepEqual(edge,final.edges.find(e=>e.id===edge.id));
 }
});
test('all incremental layouts keep tables apart and route arrows outside table interiors',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('site/er-data.js','utf8'),context);
 const layouts=Object.values(context.ER_GUIDE.layouts);assert.equal(layouts.length,60);
 for(const layout of layouts){for(let i=0;i<layout.nodes.length;i++)for(let j=i+1;j<layout.nodes.length;j++){const a=layout.nodes[i],b=layout.nodes[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'Overlapping tables');}
 for(const e of layout.edges)for(const s of e.sections){const p=[s.startPoint,...(s.bendPoints||[]),s.endPoint];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];for(const n of layout.nodes){const inside=a.x===b.x?a.x>n.x+1&&a.x<n.x+n.width-1&&Math.max(a.y,b.y)>n.y+1&&Math.min(a.y,b.y)<n.y+n.height-1:a.y>n.y+1&&a.y<n.y+n.height-1&&Math.max(a.x,b.x)>n.x+1&&Math.min(a.x,b.x)<n.x+n.width-1;assert.ok(!inside,'Arrow crosses '+n.id);}}}}
});
test('tour places the coach next to its target and keeps it on screen',()=>{
 const desktop=ExamProductTour.placement({left:100,right:400,top:180,bottom:230},390,250,1440,900);
 assert.equal(desktop.left,416);assert.equal(desktop.top,180);
 const mobile=ExamProductTour.placement({left:16,right:374,top:100,bottom:200},358,260,390,844);
 assert.equal(mobile.top,216);assert.ok(mobile.left>=12&&mobile.left+358<=390);
 const above=ExamProductTour.placement({left:16,right:374,top:600,bottom:680},358,260,390,844);
 assert.equal(above.side,'above');assert.equal(above.top+260,584);
});
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
