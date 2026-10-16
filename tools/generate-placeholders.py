"""
ANILyfe PNG placeholder generator (original art only, no copyrighted characters).
Run:  python3 tools/generate-placeholders.py
Output: assets/images/*.png  -- every image slot on the site is a PNG.
Replace any file with your own artwork using the SAME filename and size ratio.
"""
import math, random, os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
os.makedirs(OUT, exist_ok=True)
NAVY=(8,31,92); DEEP=(7,27,82); BLUE=(51,78,172); MID=(112,139,209); LIGHT=(208,227,255); VL=(231,241,255); WHITE=(255,255,255); GLOW=(127,176,255)

def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))

def gradient(w,h,c1,c2,diag=True):
    img=Image.new('RGB',(w,h)); px=img.load()
    for y in range(h):
        for x in range(w):
            t=((x/w)*0.45+(y/h)*0.55) if diag else y/h
            px[x,y]=lerp(c1,c2,t)
    return img

def glow(img,cx,cy,r,color,alpha=150):
    layer=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(layer)
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=color+(alpha,))
    layer=layer.filter(ImageFilter.GaussianBlur(r*0.55))
    img.alpha_composite(layer)

def grid(img,step=48,alpha=22):
    d=ImageDraw.Draw(img,'RGBA')
    for x in range(0,img.width,step): d.line([(x,0),(x,img.height)],fill=LIGHT+(alpha,),width=1)
    for y in range(0,img.height,step): d.line([(0,y),(img.width,y)],fill=LIGHT+(alpha,),width=1)

def sparkles(img,n,seed):
    r=random.Random(seed); d=ImageDraw.Draw(img,'RGBA')
    for _ in range(n):
        x=r.randint(0,img.width); y=r.randint(0,img.height); s=r.choice([1,1,2,2,3])
        d.ellipse([x-s,y-s,x+s,y+s],fill=WHITE+(r.randint(90,230),))
    for _ in range(max(2,n//18)):
        x=r.randint(0,img.width); y=r.randint(0,img.height//2); L=r.randint(90,220)
        for i in range(L):
            a=int(200*(1-i/L)); d.point((x-i,y+int(i*0.45)),fill=WHITE+(a,))

def skyline(img,seed,base=0.78,col=(6,22,70)):
    r=random.Random(seed); d=ImageDraw.Draw(img,'RGBA'); x=0; W,H=img.size
    while x<W:
        w=r.randint(40,110); h=r.randint(int(H*0.10),int(H*0.34)); top=int(H*base)-h
        d.rectangle([x,top,x+w,H],fill=col+(255,))
        for wy in range(top+10,H,22):
            for wx in range(x+8,x+w-8,16):
                if r.random()<0.35: d.rectangle([wx,wy,wx+6,wy+8],fill=GLOW+(r.randint(70,170),))
        x+=w+r.randint(0,10)

def mascot(img,cx,cy,size,visor=False,blink=False):
    """Original ANILyfe mascot: rounded face, spiky navy hair, big eyes."""
    S=3; s=size*S
    layer=Image.new('RGBA',(int(s*1.6),int(s*1.6)),(0,0,0,0)); d=ImageDraw.Draw(layer)
    ox=oy=int(s*0.3)
    def P(x,y): return (ox+x*s,oy+y*s)
    # hair back
    d.polygon([P(.04,.40),P(.10,.08),P(.30,.22),P(.42,-.02),P(.55,.20),P(.74,.00),P(.84,.22),P(.98,.12),P(.96,.42)],fill=NAVY+(255,))
    # face
    d.rounded_rectangle([ox+.08*s,oy+.18*s,ox+.92*s,oy+.96*s],radius=int(.26*s),fill=VL+(255,),outline=BLUE+(255,),width=int(.035*s))
    # fringe
    d.polygon([P(.08,.34),P(.20,.16),P(.30,.40),P(.44,.14),P(.56,.40),P(.70,.16),P(.80,.40),P(.92,.30),P(.92,.20),P(.60,.10),P(.30,.10),P(.10,.20)],fill=BLUE+(255,))
    # eyes
    for ex in (.30,.70):
        if blink:
            d.arc([ox+(ex-.10)*s,oy+.50*s,ox+(ex+.10)*s,oy+.66*s],200,340,fill=NAVY+(255,),width=int(.03*s))
        else:
            d.ellipse([ox+(ex-.095)*s,oy+.46*s,ox+(ex+.095)*s,oy+.72*s],fill=NAVY+(255,))
            d.ellipse([ox+(ex-.065)*s,oy+.50*s,ox+(ex+.065)*s,oy+.68*s],fill=BLUE+(255,))
            d.ellipse([ox+(ex-.040)*s,oy+.52*s,ox+(ex-.005)*s,oy+.58*s],fill=WHITE+(255,))
            d.ellipse([ox+(ex+.015)*s,oy+.62*s,ox+(ex+.040)*s,oy+.66*s],fill=LIGHT+(255,))
    # blush + mouth
    d.ellipse([ox+.14*s,oy+.70*s,ox+.24*s,oy+.76*s],fill=(255,170,190,120)); d.ellipse([ox+.76*s,oy+.70*s,ox+.86*s,oy+.76*s],fill=(255,170,190,120))
    d.arc([ox+.42*s,oy+.70*s,ox+.58*s,oy+.84*s],20,160,fill=NAVY+(255,),width=int(.025*s))
    if visor:
        d.rounded_rectangle([ox+.14*s,oy+.42*s,ox+.86*s,oy+.70*s],radius=int(.10*s),fill=GLOW+(110,),outline=WHITE+(230,),width=int(.02*s))
    # antenna sparks
    for ax,ay in ((.5,.0),(.22,.04),(.78,.04)):
        d.ellipse([ox+(ax-.03)*s,oy+(ay-.05)*s,ox+(ax+.03)*s,oy+(ay+.01)*s],fill=GLOW+(255,))
    layer=layer.resize((int(layer.width/S),int(layer.height/S)),Image.LANCZOS)
    img.alpha_composite(layer,(int(cx-layer.width/2),int(cy-layer.height/2)))

def panel(img,x,y,w,h,alpha=60,r=22):
    layer=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(layer)
    d.rounded_rectangle([x,y,x+w,y+h],radius=r,fill=WHITE+(alpha,),outline=LIGHT+(120,),width=2)
    img.alpha_composite(layer)

def base(w,h,seed,c1=DEEP,c2=(13,58,156)):
    img=gradient(w,h,c1,c2).convert('RGBA'); grid(img); glow(img,int(w*.78),int(h*.2),int(h*.5),MID,140); glow(img,int(w*.12),int(h*.9),int(h*.45),BLUE,150); sparkles(img,int(w*h/9000),seed); return img

def save(img,name): img.convert('RGBA').save(os.path.join(OUT,name),'PNG',optimize=True); print('saved',name,img.size)

def homepage():
    W,H=1600,900; img=base(W,H,1); skyline(img,3)
    glow(img,int(W*.68),int(H*.5),330,GLOW,120)
    mascot(img,int(W*.68),int(H*.48),520)
    for i,(x,y,w,h) in enumerate([(.40,.18,.15,.20),(.40,.52,.13,.18),(.88,.30,.10,.17),(.84,.62,.11,.16)]):
        panel(img,int(W*x),int(H*y),int(W*w),int(H*h)); d=ImageDraw.Draw(img,'RGBA')
        d.rounded_rectangle([int(W*x)+16,int(H*y)+16,int(W*(x+w))-16,int(H*(y+h))-52],radius=12,fill=LIGHT+(70,))
        d.rounded_rectangle([int(W*x)+16,int(H*(y+h))-38,int(W*x)+16+int(W*w*.55),int(H*(y+h))-26],radius=6,fill=WHITE+(130,))
    save(img,'homepage.png')

def admin():
    W,H=1400,800; img=base(W,H,2,(5,20,60),(10,46,128)); d=ImageDraw.Draw(img,'RGBA')
    for i in range(4):
        x=60+i*200; panel(img,x,70,180,110,70,16)
        d.rounded_rectangle([x+16,x*0+150,x+16+110,162],radius=6,fill=GLOW+(180,))
    panel(img,60,210,560,300,60,22)
    pts=[(90+i*50,470-int(120*abs(math.sin(i*.7))+i*10)) for i in range(10)]
    d.line(pts,fill=GLOW+(255,),width=5); 
    for p in pts: d.ellipse([p[0]-6,p[1]-6,p[0]+6,p[1]+6],fill=WHITE+(255,))
    panel(img,60,540,560,200,60,22)
    for i in range(5): d.rounded_rectangle([90,570+i*30,90+420-i*50,586+i*30],radius=6,fill=LIGHT+(90,))
    glow(img,1000,420,300,GLOW,120); mascot(img,1000,420,430,visor=True)
    save(img,'admin.png')

def seller():
    W,H=1400,800; img=base(W,H,4); skyline(img,7,.86); mascot(img,980,430,400)
    for i in range(3): panel(img,120+i*190,220+i*40,170,230,70,18)
    save(img,'seller.png')

def auth():
    W,H=1000,1200; img=base(W,H,5,(10,40,120),BLUE); mascot(img,500,520,520); skyline(img,9,.95)
    save(img,'auth.png')

def marketplace():
    W,H=1600,500; img=base(W,H,6); skyline(img,11,.9); mascot(img,1250,250,360)
    for i in range(5): panel(img,80+i*190,120+(i%2)*40,160,200,70,18)
    save(img,'marketplace.png')

def checkout():
    W,H=1000,600; img=base(W,H,8); mascot(img,720,300,330)
    panel(img,90,150,330,300,70,22); save(img,'checkout.png')

def notfound():
    W,H=1000,700; img=base(W,H,12); mascot(img,500,330,420,blink=True); save(img,'404.png')

def empty():
    W,H=800,600; img=base(W,H,13,(16,52,138),(51,78,172)); mascot(img,400,290,300); save(img,'empty.png')

def loader_mascot():
    W=H=512; img=Image.new('RGBA',(W,H),(0,0,0,0)); glow(img,256,256,200,GLOW,110); mascot(img,256,256,340); save(img,'loader-mascot.png')
    img2=Image.new('RGBA',(W,H),(0,0,0,0)); glow(img2,256,256,200,GLOW,110); mascot(img2,256,256,340,blink=True); save(img2,'loader-mascot-blink.png')

def splash():
    W,H=1080,1920; img=base(W,H,14,(5,18,56),(13,58,156)); skyline(img,15,.93); glow(img,540,820,380,GLOW,120); mascot(img,540,820,560)
    save(img,'splash.png')

def categories():
    names=['figures','manga','apparel','wall-art','collectibles','accessories']
    for i,n in enumerate(names):
        W,H=800,800; img=base(W,H,20+i,(10,40,120),BLUE); d=ImageDraw.Draw(img,'RGBA')
        panel(img,120,140,560,520,60,40)
        if n=='figures': d.ellipse([340,200,460,320],fill=LIGHT+(230,)); d.rounded_rectangle([320,330,480,560],radius=40,fill=WHITE+(230,)); d.rounded_rectangle([260,580,540,620],radius=14,fill=MID+(255,))
        elif n=='manga': 
            for k in range(3): d.rounded_rectangle([220+k*30,200+k*14,520+k*30,600+k*14],radius=14,fill=(255,255,255,200-k*40),outline=BLUE+(255,),width=4)
        elif n=='apparel': d.polygon([(260,260),(340,220),(460,220),(540,260),(600,360),(520,390),(500,340),(500,600),(300,600),(300,340),(280,390),(200,360)],fill=WHITE+(235,))
        elif n=='wall-art': d.rectangle([220,220,580,580],fill=WHITE+(235,),outline=NAVY+(255,),width=14); d.polygon([(250,550),(360,380),(430,480),(490,400),(550,550)],fill=BLUE+(255,)); d.ellipse([470,260,530,320],fill=GLOW+(255,))
        elif n=='collectibles': d.rounded_rectangle([250,250,550,600],radius=26,fill=(255,255,255,70),outline=WHITE+(230,),width=6); d.ellipse([340,330,460,450],fill=LIGHT+(240,)); d.rounded_rectangle([320,460,480,520],radius=16,fill=WHITE+(230,))
        else: d.ellipse([260,260,540,540],outline=WHITE+(240,),width=34); d.ellipse([360,200,440,280],fill=GLOW+(255,))
        save(img,f'category-{n}.png')

if __name__=='__main__':
    homepage(); admin(); seller(); auth(); marketplace(); checkout(); notfound(); empty(); loader_mascot(); splash(); categories()
