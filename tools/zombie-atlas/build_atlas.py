import json,base64,io
import numpy as np
from PIL import Image
T=json.load(open('tiles.json'))
im=Image.open('source-atlas.png').convert('RGB')
M=4
def crop(k,i):
    a,b,c,d=T[k][i];return im.crop((a+M,b+M,c-M,d-M))
def med(arr):return [int(v) for v in np.median(arr.reshape(-1,3),axis=0)]
def hexs(c):return (c[0]<<16)|(c[1]<<8)|c[2]
tiles=[];meta={'faces':[],'tops':[],'pants':[],'dmg':[]}
# faces
for i in range(30):
    t=crop('faces',i);a=np.array(t).astype(float);h,w,_=a.shape
    hair=med(a[:int(h*.14),int(w*.2):int(w*.8)]);skin=med(a[int(h*.5):int(h*.64),int(w*.18):int(w*.34)])
    meta['faces'].append({'skin':hexs(skin),'hair':hexs(hair)})
    tiles.append(t.resize((32,32),Image.BOX).convert('RGBA'))
# tops: cloth row 0 (10)
for i in range(10):
    t=crop('cloth',i);a=np.array(t).astype(float);h,w,_=a.shape
    meta['tops'].append(hexs(med(a[int(h*.3):int(h*.9),int(w*.2):int(w*.8)])))
    tiles.append(t.resize((32,32),Image.BOX).convert('RGBA'))
# pants: cloth rows 1-2 (20)
for i in range(10,30):
    t=crop('cloth',i);a=np.array(t).astype(float);h,w,_=a.shape
    meta['pants'].append(hexs(med(a[int(h*.25):int(h*.9),int(w*.15):int(w*.85)])))
    tiles.append(t.resize((32,32),Image.BOX).convert('RGBA'))
# damage overlays with alpha derived from distance to the tile's background
for i in range(32):
    t=crop('dmg',i);a=np.array(t).astype(float);h,w,_=a.shape
    border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)])
    bg=np.median(border,axis=0);d=np.sqrt(((a-bg)**2).sum(axis=2))
    al=np.clip((d-34)/30,0,1)
    rgba=np.dstack([a,al*255]).astype(np.uint8);r=Image.fromarray(rgba,'RGBA')
    # resize colour and alpha separately (alpha-weighted) to avoid grey fringes
    c32=Image.fromarray(np.dstack([a*al[...,None]]).astype(np.uint8)).resize((32,32),Image.BOX);a32=Image.fromarray((al*255).astype(np.uint8)).resize((32,32),Image.BOX)
    ca=np.array(c32).astype(float);aa=np.array(a32).astype(float)/255
    col=np.where(aa[...,None]>.02,ca/np.maximum(aa[...,None],.02),0).clip(0,255).astype(np.uint8)
    tiles.append(Image.fromarray(np.dstack([col,(aa*255).astype(np.uint8)]),'RGBA'))
    meta['dmg'].append(0)
COLS=16;rows=(len(tiles)+COLS-1)//COLS
A=Image.new('RGBA',(COLS*32,rows*32),(0,0,0,0))
for i,t in enumerate(tiles):A.paste(t,((i%COLS)*32,(i//COLS)*32))
buf=io.BytesIO();A.save(buf,'PNG',optimize=True);b=base64.b64encode(buf.getvalue()).decode()
A.save('atlas.png')
out='/* LAST FRONTIER — zombie texture atlas (32x32 tiles cut from the supplied ZOMBIE TEXTURE ATLAS sheet).\n   Index order: faces 0-29, tops 30-39, pants 40-59, damage/decay overlays 60-91 (alpha = everything that differs from the tile background). */\nconst ZATLAS={cols:%d,rows:%d,png:"data:image/png;base64,%s",\n faces:%s,\n tops:%s,\n pants:%s,\n nd:32};\n'%(COLS,rows,b,json.dumps(meta['faces']),json.dumps(meta['tops']),json.dumps(meta['pants']))
open('zombie-atlas.js','w').write(out);print(len(out),len(tiles),rows)
