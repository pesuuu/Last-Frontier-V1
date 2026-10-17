from PIL import Image
import numpy as np
im=Image.open('source-atlas.png').convert('RGB')
A=np.array(im).astype(float)
def bounds(x0,x1,n,axis,y0,y1,x0b=None):
    # estimate n tiles across [x0,x1] on axis; refine each boundary to local minimum of darkness-gradient
    sub=A[y0:y1,x0b if x0b else 0:] if False else None
def edges(lo,hi,n,prof):
    pitch=(hi-lo)/n;out=[]
    for i in range(n+1):
        c=int(round(lo+pitch*i));w=int(pitch*.12)
        a=max(0,c-w);b=min(len(prof)-1,c+w)
        seg=prof[a:b+1];out.append(a+int(np.argmin(seg)))
    return out
def tiles(box,nc,nr):
    x0,y0,x1,y1=box
    sub=A[y0:y1,x0:x1].mean(axis=2)
    colp=sub.mean(axis=0);rowp=sub.mean(axis=1)
    xe=edges(0,x1-x0,nc,colp);ye=edges(0,y1-y0,nr,rowp)
    return [(x0+xe[i],y0+ye[j],x0+xe[i+1],y0+ye[j+1]) for j in range(nr) for i in range(nc)]
PAN={'faces':((13,83,803,322),10,3),'skin':((818,83,1436,322),9,3),'cloth':((12,370,801,672),10,4),'dmg':((817,370,1436,668),8,4)}
if __name__=='__main__':
    import json
    out={}
    for k,(box,nc,nr) in PAN.items():
        t=tiles(box,nc,nr);out[k]=t
        ws=[b[2]-b[0] for b in t];hs=[b[3]-b[1] for b in t];print(k,min(ws),max(ws),min(hs),max(hs))
    json.dump(out,open('tiles.json','w'))
