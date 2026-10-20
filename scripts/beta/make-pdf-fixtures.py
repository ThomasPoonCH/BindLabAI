"""Generate public synthetic test fixtures; never real unpublished data."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.utils import ImageReader
import io
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[2] / 'test' / 'beta'
out.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
items = [Paragraph('Synthetic chemistry extraction fixture - demonstration only', styles['Title']), Spacer(1, 16), Paragraph('Not for laboratory execution. Fictional compounds; no validated outcomes or safety assessment.', styles['BodyText']), Spacer(1, 16), Table([['Reagent', 'Quantity', 'MW (g/mol)', 'Equivalents'], ['Fictional Alpha', '100 mg / 1 mmol', '100', '1'], ['Fictional Beta', '225 mg / 1.5 mmol', '150', '1.5']]), Spacer(1, 18), Paragraph('Step 1: Use fictional solvent S at final Alpha concentration 0.100 M. Demonstration conditions: 25 C for 1 h.', styles['BodyText']), Spacer(1, 12), Paragraph('Step 2: Transfer a 10 uL sample to a final volume of 1000 uL. No quench, analysis outcome, workup, purification or safety information is established.', styles['BodyText'])]
SimpleDocTemplate(str(out / 'synthetic-table.pdf')).build(items)
image=Image.new('RGB',(1200,600),'white'); draw=ImageDraw.Draw(image)
lines=['SYNTHETIC IMAGE ONLY - NOT FOR LAB USE','Fictional Alpha: 100 mg; MW 100 g/mol; 1 mmol.','Fictional Beta: 1.5 equivalents; MW 150 g/mol.','Fictional solvent S; target Alpha concentration 0.100 M.','Demonstration: 25 C, 1 h. Safety and workup not specified.']
for i,line in enumerate(lines): draw.text((40,60+i*75),line,fill='black',font_size=30)
png=io.BytesIO(); image.save(png,format='PNG'); png.seek(0)
c=canvas.Canvas(str(out / 'synthetic-scanned.pdf')); c.drawImage(ImageReader(png),30,400,width=535,height=267); c.save()
(out / 'malformed.pdf').write_bytes(b'%PDF-1.7\nnot a complete PDF\n%%EOF')
print('Created 2 synthetic PDF fixtures and 1 deliberately malformed input.')
