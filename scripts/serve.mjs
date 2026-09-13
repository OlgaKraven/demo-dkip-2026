import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve(import.meta.dirname,'../site');
const port=Number(process.env.PORT||4190);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.zip':'application/zip','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
http.createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Read-only server');return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)||'/';

  let f=path.resolve(base,'.'+pathname);if(f!==base&&!f.startsWith(base+path.sep))throw Error('path');
  if((await fs.stat(f)).isDirectory())f=path.join(f,'index.html');
  const data=await fs.readFile(f);res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Файл не найден');}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}`));
