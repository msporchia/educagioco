#!/usr/bin/env python3
"""Monta l'atlante del sotterraneo dentro il prototipo.

    python3 strumenti/sprite/dungeon.py
    python3 strumenti/sprite/dungeon.py --provini    # e un foglio da guardare

── COSA FA, IN UNA RIGA ──────────────────────────────────────────────
Legge un foglio di tessere e una tabella di ritagli, taglia solo i pezzi
che servono, li impacchetta in un PNG piccolo e lo **riscrive dentro**
`poc/sotterraneo-gfx.html` in base64. Il prototipo resta un file solo,
apribile col doppio click e senza server: è il vincolo di tutto il
progetto, e vale anche per i prototipi.

── PERCHÉ UNA TABELLA E NON UN'EURISTICA ─────────────────────────────
La stessa lezione di `atlante.py`, che qui si eredita invece di
riimpararla: la geometria di un foglio non si indovina. Ogni set mette
i muri dove gli pare, gli angoli interni magari non ce li ha, e i
personaggi sono più alti delle tessere. Quindi il foglio porta con sé
un `pezzi.json` — `{"nome": [x, y, larghezza, altezza]}` in pixel — e
questo script non fa altro che fidarsi di quella tabella. Se il ritaglio
è storto, si corregge il JSON: lo script non cambia mai.

── I NOMI SONO IL CONTRATTO ──────────────────────────────────────────
E sono nostri, non del set. La Tela del prototipo chiede `suolo-0`,
`muro-angolo-no`, `forziere-chiuso`; da dove arrivino quei pixel non lo
sa e non deve saperlo. È quello che rende **cambiare set** un lavoro da
mezz'ora invece che da un pomeriggio: si riscrivono le coordinate, si
rilancia, e il gioco non se ne accorge. Cambia davvero solo se cambia la
*geometria* — tessere di un'altra misura, muri alti due celle — perché
lì non è più una tabella diversa, è un'altra forma di mondo.

Serve `pillow`.
"""
import base64
import json
import re
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).parent
REPO = Path(__file__).resolve().parents[2]
SORGENTE = QUI / 'sorgenti' / '0x72'
DESTINAZIONE = REPO / 'poc' / 'sotterraneo-gfx.html'
LARGO = 256                       # larghezza dell'atlante, in pixel

# Fra questi due marcatori vive la roba generata. Riscrivere *fra due
# righe* invece di rigenerare il file intero è quello che permette di
# lavorare sul prototipo a mano e rilanciare lo script senza perdere
# niente di quello che si è scritto.
APRE = '/* ═══ ATLANTE GENERATO — non si scrive a mano ═══ */'
CHIUDE = '/* ═══ fine dell\'atlante generato ═══ */'


def foglio_e_tabella():
    """Il PNG più grande della cartella sorgente, e il suo `pezzi.json`.

    Il PNG più grande e non «quello che si chiama così»: i set arrivano
    con nomi di versione diversi (v1.3, v1.7…) e inseguirli a mano vuol
    dire rompere lo script il giorno che si aggiorna il set."""
    tabella = SORGENTE / 'pezzi.json'
    if not tabella.exists():
        raise SystemExit(f'manca {tabella.relative_to(REPO)} — '
                         'la tabella dei ritagli, senza la quale non si indovina niente')
    png = sorted(SORGENTE.glob('*.png'), key=lambda f: -f.stat().st_size)
    if not png:
        raise SystemExit(f'nessun PNG in {SORGENTE.relative_to(REPO)}')
    return png[0], json.loads(tabella.read_text())


def ritaglia(im, pezzi):
    """Ogni pezzo della tabella, tagliato. Quello che cade fuori dal
    foglio si dice ad alta voce: un ritaglio sbagliato che diventa un
    rettangolo trasparente è il guasto che si scopre a schermo, quando
    costa dieci volte tanto."""
    fuori = {}
    for nome, r in sorted(pezzi.items()):
        if nome.startswith('__'):              # note per chi legge, non pezzi
            continue
        x, y, w, h = r
        if x < 0 or y < 0 or x + w > im.width or y + h > im.height:
            print(f'  ! {nome} cade fuori dal foglio ({x},{y} {w}×{h})')
            continue
        taglio = im.crop((x, y, x + w, y + h))
        if not taglio.getbbox():
            print(f'  ! {nome} è tutto trasparente: coordinate sbagliate?')
            continue
        fuori[nome] = taglio
    return fuori


def impacchetta(ritagli):
    """Impilati per altezza decrescente: è la stessa riga di `atlante.py`,
    ed è il modo più semplice di non sprecare metà foglio."""
    x = y = riga = 0
    mappa, dove = {}, {}
    for nome, im in sorted(ritagli.items(), key=lambda kv: (-kv[1].height, kv[0])):
        if x + im.width > LARGO:
            x, y, riga = 0, y + riga, 0
        dove[nome] = (x, y, im)
        mappa[nome] = [x, y, im.width, im.height]
        x += im.width
        riga = max(riga, im.height)
    atlante = Image.new('RGBA', (LARGO, y + riga), (0, 0, 0, 0))
    for nome, (px, py, im) in dove.items():
        atlante.paste(im, (px, py))
    return atlante, mappa


def provini(ritagli, dove):
    """Ogni pezzo col suo nome sotto. Le coordinate si sbagliano sempre,
    e guardarle tutte insieme è il modo più rapido di accorgersene."""
    from PIL import ImageDraw
    COL, PASSO = 8, 96
    righe = (len(ritagli) + COL - 1) // COL
    f = Image.new('RGBA', (COL * PASSO, righe * PASSO), (28, 28, 38, 255))
    d = ImageDraw.Draw(f)
    for i, nome in enumerate(sorted(ritagli)):
        im = ritagli[nome]
        z = min(4, max(1, 66 // max(im.width, im.height)))
        g = im.resize((im.width * z, im.height * z), Image.NEAREST)
        f.alpha_composite(g, ((i % COL) * PASSO + (PASSO - g.width) // 2,
                              (i // COL) * PASSO + 14))
        d.text(((i % COL) * PASSO + 3, (i // COL) * PASSO + 2), nome,
               fill=(255, 220, 140, 255))
    dove.parent.mkdir(parents=True, exist_ok=True)
    f.save(dove)
    print('  provini in', dove.relative_to(REPO))


def innesta(testo, blocco):
    """Rimette il blocco generato fra i due marcatori. Se i marcatori non
    ci sono ancora, lo dice invece di appiccicare roba in fondo al file:
    un atlante finito fuori dallo `<script>` non dà errore, semplicemente
    non fa niente, ed è mezz'ora persa a capire perché è tutto nero."""
    if APRE not in testo or CHIUDE not in testo:
        raise SystemExit(f'in {DESTINAZIONE.name} mancano i marcatori:\n  {APRE}\n  {CHIUDE}')
    return re.sub(re.escape(APRE) + '.*?' + re.escape(CHIUDE),
                  lambda _: blocco, testo, flags=re.S)


def main():
    png, pezzi = foglio_e_tabella()
    im = Image.open(png).convert('RGBA')
    print(f'{png.name}: {im.width}×{im.height}, {len(pezzi)} pezzi in tabella')

    ritagli = ritaglia(im, pezzi)
    atlante, mappa = impacchetta(ritagli)

    temporaneo = QUI / '.dungeon.png'
    atlante.save(temporaneo, optimize=True)
    b64 = base64.b64encode(temporaneo.read_bytes()).decode()
    kb = len(b64) * 3 // 4 // 1024
    temporaneo.unlink()

    blocco = (f'{APRE}\n'
              f"const ATLANTE = 'data:image/png;base64,{b64}'\n"
              f'const PEZZI = {json.dumps(mappa, separators=(",", ":"), sort_keys=True)}\n'
              f'{CHIUDE}')

    if not DESTINAZIONE.exists():
        raise SystemExit(f'{DESTINAZIONE.relative_to(REPO)} non c\'è ancora')
    DESTINAZIONE.write_text(innesta(DESTINAZIONE.read_text(), blocco))

    print(f'atlante {atlante.width}×{atlante.height}, {kb} KB di PNG, '
          f'{len(mappa)} pezzi → {DESTINAZIONE.relative_to(REPO)}')
    if '--provini' in sys.argv:
        provini(ritagli, REPO / 'poc/scatti/sotterraneo-pezzi.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
