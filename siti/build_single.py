import re, base64, os
R='/home/user/matteo/siti/for-svapo/'
rd=lambda p: open(R+p,encoding='utf8').read()
b64=lambda p,m: f"data:{m};base64,"+base64.b64encode(open(R+p,'rb').read()).decode()
html=rd('index.html')

# CSS con font e immagini incorporati
css=rd('assets/css/style.css')
css=re.sub(r'url\(\.\./fonts/([^)]+)\)', lambda m: f'url({b64("assets/fonts/"+m.group(1),"font/woff2")})', css)
css+="\n.legal{display:none}.legal:target{display:block}\n"
lcss=rd('assets/vendor/leaflet/leaflet.css')
lcss=re.sub(r'url\(images/([^)]+)\)', lambda m: f'url({b64("assets/vendor/leaflet/images/"+m.group(1),"image/png")})', lcss)
html=html.replace('<link rel="stylesheet" href="assets/css/style.css">',f'<style>\n{css}\n</style>')
html=html.replace('<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">',f'<style>\n{lcss}\n</style>')
html=re.sub(r'<link rel="preload"[^>]+>\n','',html)
html=html.replace('href="assets/img/favicon.svg"',f'href="{b64("assets/img/favicon.svg","image/svg+xml")}"')
html=html.replace('src="assets/img/flacone.svg"',f'src="{b64("assets/img/flacone.svg","image/svg+xml")}"')

# main.js: icone marker incorporate + ancore legali senza Lenis
main=rd('assets/js/main.js')
icon=b64('assets/vendor/leaflet/images/marker-icon.png','image/png'); icon2=b64('assets/vendor/leaflet/images/marker-icon-2x.png','image/png'); sh=b64('assets/vendor/leaflet/images/marker-shadow.png','image/png')
main=main.replace("window.L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';",
  f"window.L.Icon.Default.mergeOptions({{iconUrl:'{icon}',iconRetinaUrl:'{icon2}',shadowUrl:'{sh}'}});")
main=main.replace("var t = document.querySelector(id); if (!t) return;","var t = document.querySelector(id); if (!t || t.classList.contains('legal')) return;")
assert 'mergeOptions' in main and "contains('legal')" in main

# script inline, nello stesso ordine (defer -> in fondo al body)
order=['assets/js/consent.js','assets/vendor/gsap.min.js','assets/vendor/ScrollTrigger.min.js','assets/vendor/lenis.min.js','assets/vendor/three.min.js','assets/vendor/leaflet/leaflet.js','assets/js/scene3d.js']
scripts=[(p,rd(p)) for p in order]+[('assets/js/main.js',main)]
html=re.sub(r'<script src="[^"]+" defer></script>\n','',html)
inl=''.join(f'<script>/* {p} */\n'+s.replace('</script','<\\/script')+'\n</script>\n' for p,s in scripts)

# pagine legali come sezioni :target
legali=''
for pg in ['privacy','cookie','crediti','accessibilita']:
    c=rd(pg+'.html'); body=re.search(r'<main id="contenuto" class="doc">(.*?)</main>',c,re.S).group(1)
    body=body.replace('<h1>','<h2 class="titolo">',1).replace('</h1>','</h2>',1)
    legali+=f'<section class="doc legal" id="{pg}" tabindex="-1"><p><a class="btn" href="#top">Torna al sito</a></p>{body}</section>\n'
html=html.replace('</main>','</main>\n'+legali,1)
for pg in ['privacy','cookie','crediti','accessibilita']:
    html=html.replace(f'href="{pg}.html"',f'href="#{pg}"')
html=html.replace('</body>',inl+'</body>')
out='/home/user/matteo/siti/for-svapo-completo.html'
open(out,'w',encoding='utf8').write(html)
print(out, round(os.path.getsize(out)/1024),'KB', 'riferimenti assets/ residui:', len(re.findall(r'(src|href)="assets/',html)), '.html residui:', re.findall(r'href="\w+\.html"',html))
