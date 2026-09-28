#!/usr/bin/env python3
"""Aggiorna la Content-Security-Policy di index.html.

Il sito ha alcuni script scritti direttamente nella pagina: la CSP li autorizza tramite
la loro impronta SHA-256, così il browser rifiuta qualunque altro script iniettato (XSS).
Dopo OGNI modifica a uno <script> di index.html lanciare:

    python3 tools/aggiorna-csp.py          (aggiorna il file)
    python3 tools/aggiorna-csp.py --check  (verifica soltanto; esce con errore se non allineata)
"""
import base64, hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"

def policy(hashes):
    return "; ".join([
        "default-src 'self'",
        "script-src 'self' " + " ".join(f"'sha256-{h}'" for h in hashes) + " https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-src 'none'",
        "worker-src 'none'",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
    ])

def main():
    html = PAGE.read_text(encoding="utf-8")
    inline = re.findall(r"<script>(.*?)</script>", html, flags=re.S)   # solo script senza attributi (= in linea)
    hashes = [base64.b64encode(hashlib.sha256(s.encode("utf-8")).digest()).decode() for s in inline]
    tag = f'<meta http-equiv="Content-Security-Policy" content="{policy(hashes)}">'
    current = re.search(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">', html)
    if "--check" in sys.argv:
        ok = bool(current) and current.group(0) == tag
        print("CSP allineata" if ok else "CSP NON allineata: lancia python3 tools/aggiorna-csp.py")
        sys.exit(0 if ok else 1)
    if current:
        html = html.replace(current.group(0), tag)
    else:
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + tag, 1)
    PAGE.write_text(html, encoding="utf-8")
    print(f"CSP aggiornata: {len(hashes)} script in linea autorizzati.")

if __name__ == "__main__":
    main()
