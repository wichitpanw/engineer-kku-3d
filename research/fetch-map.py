import math,json,urllib.request,concurrent.futures
from pathlib import Path
from PIL import Image
lat,lon,z=16.4722497,102.8235039,19
n=2**z
px=(lon+180)/360*n*256
py=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n*256
x0,y0=int(px//256)-2,int(py//256)-2
out=Path('assets/map-tiles');out.mkdir(exist_ok=True)
def fetch(pair):
 x,y=pair;p=out/f'{z}-{y}-{x}.jpg'
 if not p.exists():urllib.request.urlretrieve(f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',p)
 return x,y,p
canvas=Image.new('RGB',(1024,1024))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for x,y,p in pool.map(fetch,[(x0+i,y0+j) for i in range(4) for j in range(4)]):canvas.paste(Image.open(p),((x-x0)*256,(y-y0)*256))
canvas.save('assets/campus-satellite.jpg',quality=94)
mpp=156543.033928*math.cos(math.radians(lat))/2**z
meta=dict(latitude=lat,longitude=lon,zoom=z,size=1024,metersPerPixel=mpp,width=1024*mpp,offsetX=(512-(px-x0*256))*mpp,offsetZ=(512-(py-y0*256))*mpp,attribution='Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community')
Path('assets/map-metadata.json').write_text(json.dumps(meta,indent=2))
print(json.dumps(meta))
