# Verificação HTTP local com biblioteca padrão; não executa JavaScript ou serviços externos.
from pathlib import Path
import http.server,threading,urllib.request,re
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 refs=set(p.name for p in root.glob('*.html'))
 for source in root.glob('*.html'):
  for ref in re.findall(r'(?:src|href)=[\"\x27]([^\"\x27]+)',source.read_text()):
   if re.match(r'^(?:[a-z]+:|//|#)',ref):continue
   refs.add(ref.lstrip('./'))
 for source in (root/'css').glob('*.css'):
  for ref in re.findall(r'url\(\s*[\"\x27]?([^\s\)\"\x27]+)',source.read_text()):
   if re.match(r'^(?:[a-z]+:|//|#)',ref):continue
   refs.add(str((source.parent/ref).resolve().relative_to(root)))
 for ref in refs:
  req=urllib.request.Request(f'http://127.0.0.1:{server.server_port}/{ref}',method='HEAD')
  with urllib.request.urlopen(req,timeout=3) as response:assert response.status==200,(ref,response.status)
 print(f'PASSOU: {len(refs)} URLs locais retornaram HTTP 200 em servidor temporário de leitura')
finally:
 server.shutdown();server.server_close();thread.join()
