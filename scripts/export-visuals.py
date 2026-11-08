"""Export faithful PC/mobile promotional layouts from original screenshots.
Run: python scripts/export-visuals.py (requires Pillow).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'visuals'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BG = '#070d0b'
CYAN = '#3ee8ff'
WHITE = '#e9f5ee'

def text(im, xy, value, size, color=WHITE):
    ImageDraw.Draw(im).text(xy, value, font=ImageFont.truetype(FONT, size), fill=color)

def shot(im, source, box):
    x,y,w,h = box
    fitted = ImageOps.contain(source, (w,h), Image.Resampling.LANCZOS)
    pos = (x+(w-fitted.width)//2,y+(h-fitted.height)//2)
    im.paste(fitted,pos)
    ImageDraw.Draw(im).rectangle((pos[0]-1,pos[1]-1,pos[0]+fitted.width,pos[1]+fitted.height), outline='#2c4740',width=2)

menu = Image.open(OUT/'references/menu.png').convert('RGB')
game = Image.open(OUT/'references/gameplay.png').convert('RGB')
# Remove only the desktop window chrome; retain the actual game and HUD.
menu = menu.crop((0,32,menu.width,menu.height))
game = game.crop((0,32,game.width,game.height))
pc = Image.new('RGB',(1920,1080),BG)
ImageDraw.Draw(pc).rectangle((64,48,72,144),fill=CYAN)
text(pc,(96,42),'PAINTBALL 2D',58)
text(pc,(98,112),'SPLAT ARENA / CAPTURE DU JEU',22,CYAN)
shot(pc,game,(64,178,1792,808))
text(pc,(64,1020),'DASH. VISE. PEINS.',24)
text(pc,(1360,1024),'PC • FORMAT 16:9',20,CYAN)
pc.save(OUT/'splat-arena-pc-1920x1080.png',optimize=True)
mobile = Image.new('RGB',(1080,1920),BG)
ImageDraw.Draw(mobile).rectangle((56,64,64,200),fill=CYAN)
text(mobile,(88,62),'PAINTBALL',82)
text(mobile,(88,155),'2D / SPLAT ARENA',42,CYAN)
text(mobile,(56,294),'01 / ENTRE DANS L’ARÈNE',28,CYAN)
shot(mobile,menu,(48,356,984,548))
text(mobile,(56,1000),'02 / PRENDS LE TERRAIN',28,CYAN)
shot(mobile,game,(48,1064,984,548))
text(mobile,(56,1716),'DASH. VISE. PEINS.',44)
text(mobile,(56,1790),'Survis aux vagues.',28)
text(mobile,(56,1854),'CAPTURES PC • VISUEL MOBILE 9:16',18,'#8aa99b')
mobile.save(OUT/'splat-arena-mobile-1080x1920.png',optimize=True)
print('Exported PC 1920×1080 and mobile 1080×1920')
