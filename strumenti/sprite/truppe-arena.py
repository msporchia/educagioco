#!/usr/bin/env python3
"""Le truppe dipinte di Castle Battle, una squadra per foglio (voce 12b di DA-GENERARE.md).

    python3 strumenti/sprite/truppe-arena.py

Legge `sorgenti/arena/truppe-blu.png` (chi gioca) e `truppe-rosso.png` (il nemico): otto colonne e cinque righe, due truppe per
riga nell'ordine di `truppe.json`, quattro pose ciascuna (ferma, un passo, l'altro passo, il colpo), tutte che guardano a destra.
Scrive `src/giochi/arena/dati/truppe-dipinte.js`: `PEZZI['io:scheletri:3']` → [x, y, largo, alto, centro] nell'atlante.

La griglia non basta per tagliare: la freccia dell'arciere e la fiammata del drago escono dalla loro casella, e nel foglio rosso la
fiammata tocca quasi il drago dopo. Quindi le figure sono le macchie di pixel attaccati, e ogni macchia va alla casella dove sta il
suo baricentro. Le quattro pose di una truppa hanno lo stesso piede (il più basso delle quattro) e lo stesso centro (quello della
figura ferma): il pipistrello che sbatte le ali e il drago che sputa restano dove sono. La misura: in `truppe.json`, `alto` è la figura
più alta di ogni truppa in pixel del foglio delle figure del castello, quella che `SCALA` di `scena/figure.js` porta a schermo; l'atlante
la tiene `risoluzione` volte più grande, perché a schermo non sgrani.
"""
import base64
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import codifica  # noqa: E402
import righe  # noqa: E402

QUI = Path(__file__).resolve().parent
REPO = QUI.parent.parent
SORGENTI = QUI / 'sorgenti' / 'arena'
MODULO = REPO / 'src' / 'giochi' / 'arena' / 'dati' / 'truppe-dipinte.js'
COLONNE, RIGHE, POSE = 8, 5, 4
ATLANTE_LARGO = 1024
BRICIOLA = 12          # le macchie più piccole (in pixel a metà risoluzione) sono polvere: via


def macchie(maschera):
    """Le macchie di pixel attaccati (anche in diagonale) di una maschera 0/1 a liste: [(pixel, cx, cy)]."""
    h, w = len(maschera), len(maschera[0])
    vista = [[False] * w for _ in range(h)]
    fuori = []
    for y0 in range(h):
        for x0 in range(w):
            if not maschera[y0][x0] or vista[y0][x0]:
                continue
            coda, pixel = deque([(x0, y0)]), []
            vista[y0][x0] = True
            while coda:
                x, y = coda.popleft()
                pixel.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h and maschera[ny][nx] and not vista[ny][nx]:
                            vista[ny][nx] = True
                            coda.append((nx, ny))
            if len(pixel) >= BRICIOLA:
                fuori.append((pixel, sum(p[0] for p in pixel) / len(pixel), sum(p[1] for p in pixel) / len(pixel)))
    return fuori


def figure(sorgente, quante):
    """Le figure delle prime `quante` caselle, ognuna coi suoi pixel soli: [(immagine ritagliata, sinistra, alto, destra, basso)]."""
    foglio = righe.senza_alone(Image.open(sorgente).convert('RGBA'))
    W, H = foglio.size
    alfa = foglio.getchannel('A')
    # le macchie si cercano a metà risoluzione: un pixel mezzo è pieno se lo è uno dei suoi quattro
    mezza = [[any(alfa.getpixel((min(W - 1, 2 * x + i), min(H - 1, 2 * y + j))) for i in (0, 1) for j in (0, 1))
              for x in range(W // 2)] for y in range(H // 2)]
    cw, ch = W / 2 / COLONNE, H / 2 / RIGHE
    di = {}
    casella = lambda x, y: int(y // ch) * COLONNE + int(x // cw)
    for pixel, cx, cy in macchie(mezza):
        # due figure che si toccano (la fiammata del drago e il drago dopo) sono una macchia sola con la massa divisa fra due caselle:
        # si taglia nel punto più stretto fra i loro centri, che è dove si toccano. Una freccia che sporge resta della sua figura
        conta = {}
        for x, y in pixel:
            conta[casella(x, y)] = conta.get(casella(x, y), 0) + 1
        prime = sorted(conta, key=lambda n: -conta[n])[:2]
        if len(prime) == 2 and conta[prime[1]] > 0.25 * len(pixel):
            a, b = sorted(prime, key=lambda n: n % COLONNE)
            da, fino = round(((a % COLONNE) + 0.5) * cw), round(((b % COLONNE) + 0.5) * cw)
            colonne = {}
            for x, _ in pixel:
                colonne[x] = colonne.get(x, 0) + 1
            taglio = min(range(da, fino), key=lambda x: colonne.get(x, 0))
            for x, y in pixel:
                n = a if x < taglio else b
                if n < quante:
                    di.setdefault(n, []).append((x, y))
            continue
        n = casella(cx, cy)
        if n < quante:
            di.setdefault(n, []).extend(pixel)
    mancano = [n + 1 for n in range(quante) if n not in di]
    assert not mancano, f'{sorgente.name}: caselle vuote {mancano}'
    fuori = []
    for n in range(quante):
        tiene = Image.new('L', (W, H), 0)
        for x, y in di[n]:
            for i in (0, 1):
                for j in (0, 1):
                    if 2 * x + i < W and 2 * y + j < H:
                        tiene.putpixel((2 * x + i, 2 * y + j), 255)
        sola = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sola.paste(foglio, (0, 0), tiene)
        l, t, r, b = sola.getchannel('A').getbbox()
        fuori.append((sola.crop((l, t, r, b)), l, t, r, b))
    return fuori


def truppe(sorgente, foglietto):
    """{ id: [quattro immagini alla misura dell'atlante, ognuna col suo centro] } per un foglio."""
    ordine, alto, ris = foglietto['ordine'], foglietto['alto'], foglietto['risoluzione']
    tutte = figure(sorgente, len(ordine) * POSE)
    casella = Image.open(sorgente).width / COLONNE
    fuori = {}
    for t, id in enumerate(ordine):
        pose = tutte[t * POSE:(t + 1) * POSE]
        piede = max(p[4] for p in pose)
        # il centro della figura ferma, misurato dentro la sua casella: ogni posa sta nella casella dopo, e preso nel foglio intero
        # il passo e il colpo finivano spostati di una, due, tre caselle (la truppa saltava a destra e sinistra a ogni passo)
        centro = (pose[0][1] + pose[0][3]) / 2
        k = alto[id] * ris / max(piede - p[2] for p in pose)
        fuori[id] = []
        for n, (im, l, t0, r, b) in enumerate(pose):
            centro_qui = centro + n * casella                          # lo stesso punto, nella casella di questa posa
            # fino al piede comune: chi alza un piede o un'ala resta più in alto
            tela = Image.new('RGBA', (r - l, piede - t0), (0, 0, 0, 0))
            tela.alpha_composite(im, (0, 0))
            w, h = max(1, round(tela.width * k)), max(1, round(tela.height * k))
            # premoltiplicato: il fondo trasparente è bianco, e un ridimensionamento diretto lascerebbe un alone chiaro
            fuori[id].append((tela.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA'), round((centro_qui - l) * k)))
    return fuori


def main():
    foglietto = json.loads((SORGENTI / 'truppe.json').read_text())
    pezzi = []
    for squadra, file in (('io', 'truppe-blu.png'), ('nem', 'truppe-rosso.png')):
        for id, pose in truppe(SORGENTI / file, foglietto).items():
            pezzi += [(f'{squadra}:{id}:{n}', im, c) for n, (im, c) in enumerate(pose)]
    pezzi.sort(key=lambda p: -p[1].height)
    pos, xx, yy, alto = {}, 0, 0, 0
    for nome, fig, c in pezzi:
        if xx + fig.width > ATLANTE_LARGO:
            xx, yy, alto = 0, yy + alto + 2, 0
        pos[nome] = [xx, yy, fig.width, fig.height, c]
        xx, alto = xx + fig.width + 2, max(alto, fig.height)
    im = Image.new('RGBA', (ATLANTE_LARGO, yy + alto), (0, 0, 0, 0))
    for nome, fig, _ in pezzi:
        im.alpha_composite(fig, tuple(pos[nome][:2]))
    dati = codifica.webp(im)
    print(f'  {len(pos)} pezzi, atlante {im.width}×{im.height}, {codifica.riga(im, dati)}')
    MODULO.write_text('/* GENERATO da strumenti/sprite/truppe-arena.py: non si tocca a mano.\n'
                      '   Le truppe dipinte di Castle Battle, una squadra per foglio (docs/arena/grafica.md). PEZZI: `<squadra>:<truppa>:<posa>`\n'
                      '   → [x, y, largo, alto, centro] in px dell\'atlante; le pose sono 0 ferma, 1 e 2 i passi, 3 il colpo; il piede è in fondo,\n'
                      '   `centro` il punto che sta sopra il piede. RISOLUZIONE: quante volte più grandi delle figure del castello. */\n'
                      f"export const RISOLUZIONE = {foglietto['risoluzione']}\n"
                      'export const PEZZI = {\n'
                      + ''.join(f"  '{a}': {json.dumps(b)},\n" for a, b in sorted(pos.items()))
                      + '}\n'
                      f"export const ATLANTE = 'data:image/webp;base64,{base64.b64encode(dati).decode()}'\n")
    print(f'{MODULO.relative_to(REPO)}: {len(dati) // 1024} KB')


if __name__ == '__main__':
    main()
