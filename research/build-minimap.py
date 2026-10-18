import math,json,io,concurrent.futures,urllib.request
from PIL import Image
z=18;n=2**z;lat=16.4728;lon=102.8240
fx=(lon+180)/360*n;fy=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
x0=math.floor(fx)-2;y0=math.floor(fy)-2
out=Image.new('RGB',(1280,1280))
def tile(a):
 x,y=a;u=f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
 req=urllib.request.Request(u,headers={'User-Agent':'ENKKU-local-campus-reference/1.0'})
 with urllib.request.urlopen(req,timeout=30) as r:return x,y,Image.open(io.BytesIO(r.read())).convert('RGB')
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for x,y,im in pool.map(tile,[(x0+x,y0+y)for y in range(5)for x in range(5)]):out.paste(im,((x-x0)*256,(y-y0)*256))
out.save('assets/faculty-satellite.jpg',quality=90)
originLat=16.4722497;originLon=102.8235039
ofx=(originLon+180)/360*n;ofy=(1-math.asinh(math.tan(math.radians(originLat)))/math.pi)/2*n
mpp=math.cos(math.radians(originLat))*2*math.pi*6378137/(256*n)
json.dump({'originPixelX':(ofx-x0)*256,'originPixelY':(ofy-y0)*256,'metersPerPixel':mpp,'size':1280,'attribution':'Esri, Maxar, Earthstar Geographics'},open('assets/faculty-map-metadata.json','w'),indent=2)
print('Created faculty reference minimap and geographic calibration')
