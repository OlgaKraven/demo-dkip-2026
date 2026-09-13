from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import fitz
root=Path(__file__).resolve().parents[1]
out=root/'materials'/'diagrams'
out.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial',r'C:\Windows\Fonts\arial.ttf'))
w,h=1240,1290
pdf=canvas.Canvas(str(out/'er.pdf'),pagesize=(w,h))
svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="white"/>']
def text(x,y,s,size=15,color='#263244'):
    svg.append(f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{color}">{escape(s)}</text>')
    pdf.setFillColor(color)
    pdf.setFont('Arial',size)
    pdf.drawString(x,h-y,s)
def rect(x,y,bw,bh,fill,stroke='#cbd2dc'):
    svg.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="6" fill="{fill}" stroke="{stroke}"/>')
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke)
    pdf.roundRect(x,h-y-bh,bw,bh,6,fill=1,stroke=1)
def line(points,label=None):
    svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+'" fill="none" stroke="#718096" stroke-width="1.5"/>')
    pdf.setStrokeColor('#718096')
    for a,b in zip(points,points[1:]):pdf.line(a[0],h-a[1],b[0],h-b[1])
    x,y=points[-1]
    rect(x-3,y-3,6,6,'#718096','#718096')
    if label:text(points[0][0]+5,points[0][1]-7,label,12)
text(35,36,'Полесье · ER-модель · ДЭ 09.02.07-5-2026',25)
text(35,62,'PK — первичный ключ; FK — внешний ключ. У линии: N → 1. Точка обозначает сторону 1.',14)
boxes=[
 ('counterparty',35,100,['PK id','name','inn','address','phone','is_salesman','is_buyer']),
 ('item',445,100,['PK id','UNIQUE code','name','kind','unit']),
 ('users',855,100,['PK id','UNIQUE login','password_hash','role','failed_attempts','is_locked']),
 ('price',35,390,['PK/FK item_id → item.id','PK valid_from','amount']),
 ('specification',445,390,['PK id','FK product_id → item.id (UNIQUE)','FK manufacturer_id → counterparty.id','name','output_qty']),
 ('specification_material',855,390,['PK/FK specification_id','   → specification.id','PK/FK material_id → item.id','qty']),
 ('customer_order',35,680,['PK id','UNIQUE doc_no','doc_date','FK customer_id → counterparty.id','FK executor_id → counterparty.id']),
 ('customer_order_line',445,680,['PK id','FK order_id → customer_order.id','FK product_id → item.id','qty','sale_price']),
 ('production',35,970,['PK id','UNIQUE doc_no','doc_date','FK manufacturer_id → counterparty.id']),
 ('production_product',445,970,['PK/FK production_id → production.id','PK/FK product_id → item.id','qty']),
 ('production_material',855,970,['PK/FK production_id → production.id','PK/FK material_id → item.id','qty'])]
for points in [([(180,390),(180,345),(615,345),(615,285)]), ([(615,390),(615,285)]), ([(855,490),(795,490),(785,490)]), ([(1010,390),(1010,330),(700,330),(700,285)]), ([(35,765),(15,765),(15,250),(35,250)]), ([(445,775),(375,775)]), ([(610,680),(610,640),(815,640),(815,300),(745,300),(745,285)]), ([(35,1060),(5,1060),(5,200),(35,200)]), ([(445,1060),(375,1060)]), ([(1015,970),(1015,935),(205,935),(205,970)])]:
    line(points,'N → 1')
for title,x,y,fields in boxes:
    rect(x,y,340,185,'#ffffff')
    rect(x,y,340,38,'#edf1f7')
    text(x+12,y+25,title,19)
    for i,f in enumerate(fields):text(x+12,y+60+i*18,f,14)
text(855,712,'Дополнительные связи FK',17)
text(855,745,'Все ссылки на item и counterparty',14)
text(855,771,'подписаны внутри таблиц.',14)
text(855,805,'UNIQUE product_id: один продукт',14)
text(855,831,'имеет одну спецификацию.',14)
text(35,1210,'Расчёт стоимости — запрос по заказу, составу и цене на дату; вычисляемую сумму не дублируем в таблице.',16)
text(35,1238,'Единицы: одна базовая единица для каждой номенклатуры. output_qty — выход партии по спецификации.',15)
text(35,1264,'Учебная модель. SQL: examples/mysql/Sql/01-schema.sql или examples/postgresql/Sql/01-schema.sql.',14)
svg.append('</svg>')
(out/'er.svg').write_text('\n'.join(svg),encoding='utf8')
pdf.save()
doc=fitz.open(out/'er.pdf')
doc[0].get_pixmap(matrix=fitz.Matrix(1,1)).save(out/'er-preview.png')
print('ER diagram: PDF + SVG')
