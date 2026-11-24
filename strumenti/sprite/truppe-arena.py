#!/usr/bin/env python3
"""Le truppe dipinte di Castle Battle, una squadra per foglio (voce 12b di DA-GENERARE.md).

    python3 strumenti/sprite/truppe-arena.py [provino.png]

Legge `sorgenti/arena/truppe-blu.png` (chi gioca) e `truppe-rosso.png` (il nemico): otto colonne e cinque righe, due truppe per
riga nell'ordine di `truppe.json`, quattro pose ciascuna (ferma, un passo, l'altro passo, il colpo), tutte che guardano a destra.
Scrive `src/giochi/arena/dati/truppe-dipinte.js`: `PEZZI['io:scheletri:3']` → [x, y, largo, alto, centro] nell'atlante.

La griglia non basta per tagliare: la freccia dell'arciere e la fiammata del drago escono dalla loro casella, e nel foglio rosso la
fiammata tocca quasi il drago dopo. Quindi le figure sono le macchie di pixel attaccati, e ogni macchia va alla casella dove sta il
suo baricentro. Le pose di una truppa si allineano sulla testa e sul busto della ferma (`allinea()`), non sulla casella: chi ha
generato il foglio non le mette allo stesso punto. Col provino si guarda se una salta. La misura: in `truppe.json`, `alto` è la figura
più alta di ogni truppa in pixel del foglio delle figure del castello, quella che `SCALA` di `scena/figure.js` porta a schermo; l'atlante
la tiene `risoluzione` volte più grande, perché a schermo non sgrani.
"""
import base64
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

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


def busto(im, quota):
    """L'alfa della figura dalla cima fino a `quota` della sua altezza, sotto vuoto: è la parte che si allinea."""
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    ImageDraw.Draw(a).rectangle((0, round(im.height * quota), im.width, im.height), fill=0)
    return a


def accordo(a, b, dx, dy):
    """Quanto si sovrappongono due alfa con `b` spostata di (dx, dy): l'intersezione sull'unione."""
    w, h = max(a.width, b.width + dx) - min(0, dx), max(a.height, b.height + dy) - min(0, dy)
    ox, oy = -min(0, dx), -min(0, dy)
    A, B = Image.new('L', (w, h), 0), Image.new('L', (w, h), 0)
    A.paste(a, (ox, oy))
    B.paste(b, (ox + dx, oy + dy))
    dentro = ImageStat.Stat(ImageChops.darker(A, B)).sum[0]
    return dentro / (ImageStat.Stat(ImageChops.lighter(A, B)).sum[0] or 1)


def allinea(ferma, posa, vola):
    """Dove va `posa` rispetto alla figura ferma, (dx, dy) fra i loro angoli in alto a sinistra. Chi ha generato il foglio non mette
    le pose allo stesso punto della casella, quindi il posto si cerca: la testa e il busto (i due terzi di sopra) della posa sopra
    quelli della ferma, dove si sovrappongono di più. Chi cammina tiene i piedi a terra (il fondo della figura): si cerca solo dx.
    Chi vola non ha un piede: si cerca anche dy."""
    quota = 0.62
    a, b = busto(ferma, quota), busto(posa, quota)
    giu = ferma.height - posa.height                       # i piedi sullo stesso fondo
    passo = max(1, ferma.width // 60)
    dys = range(giu - ferma.height // 4, giu + ferma.height // 4 + 1, passo) if vola else [giu]
    largo = ferma.width // 3
    migliore = max(((accordo(a, b, dx, dy), dx, dy) for dx in range(-largo, largo + 1, passo) for dy in dys))
    _, dx, dy = migliore
    # poi fino al pixel, attorno al migliore
    vicini = [(accordo(a, b, x, y), x, y) for x in range(dx - passo, dx + passo + 1)
              for y in (range(dy - passo, dy + passo + 1) if vola else [dy])]
    return max(vicini)[1:]


def truppe(sorgente, foglietto):
    """{ id: [quattro immagini alla misura dell'atlante, ognuna col suo centro] } per un foglio."""
    ordine, alto, ris, volano = foglietto['ordine'], foglietto['alto'], foglietto['risoluzione'], foglietto['volano']
    tutte = figure(sorgente, len(ordine) * POSE)
    fuori = {}
    for t, id in enumerate(ordine):
        pose = tutte[t * POSE:(t + 1) * POSE]
        ferma = pose[0][0]
        # dove sta ogni posa rispetto alla ferma: provato il centro della casella, ma le pose non ci stanno allo stesso punto e la
        # truppa saltava avanti e indietro a ogni passo
        posti = [(0, 0)] + [allinea(ferma, p[0], id in volano) for p in pose[1:]]
        piede = max(dy + p[0].height for (dx, dy), p in zip(posti, pose))
        centro = ferma.width / 2
        k = alto[id] * ris / max(piede - dy for dx, dy in posti)
        fuori[id] = []
        for (dx, dy), (im, *_) in zip(posti, pose):
            # fino al piede comune: chi alza un piede o un'ala resta più in alto
            tela = Image.new('RGBA', (im.width, piede - dy), (0, 0, 0, 0))
            tela.alpha_composite(im, (0, 0))
            w, h = max(1, round(tela.width * k)), max(1, round(tela.height * k))
            # premoltiplicato: il fondo trasparente è bianco, e un ridimensionamento diretto lascerebbe un alone chiaro
            fuori[id].append((tela.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA'), round((centro - dx) * k)))
    return fuori


def provino(squadre, file):
    """Le quattro pose di ogni truppa, ognuna col piede e il centro segnati, e in fondo la ferma con le altre in trasparenza:
    è da lì che si vede se una posa salta."""
    ordine = list(squadre['io'])
    cella, alta = 230, 200
    im = Image.new('RGBA', (len(squadre) * 5 * cella, len(ordine) * alta), (58, 84, 48, 255))
    d = ImageDraw.Draw(im)
    for s, pose_di in enumerate(squadre.values()):
        for r, id in enumerate(ordine):
            for n, (fig, c) in enumerate(pose_di[id]):
                x, y = (s * 5 + n) * cella + cella // 2, r * alta + alta - 10
                im.alpha_composite(fig, (x - c, y - fig.height))
                d.line([(x, y - alta + 14), (x, y)], fill=(255, 60, 60, 255))
                d.line([(x - cella // 2 + 8, y), (x + cella // 2 - 8, y)], fill=(255, 60, 60, 255))
            x = (s * 5 + 4) * cella + cella // 2
            for n, (fig, c) in enumerate(pose_di[id]):
                velo = fig.copy()
                velo.putalpha(fig.getchannel('A').point(lambda v: v * (255 if n == 0 else 90) // 255))
                im.alpha_composite(velo, (x - c, r * alta + alta - 10 - fig.height))
    im.convert('RGB').save(file)
    print(f'  provino: {file}')


def main():
    foglietto = json.loads((SORGENTI / 'truppe.json').read_text())
    pezzi, squadre = [], {}
    for squadra, file in (('io', 'truppe-blu.png'), ('nem', 'truppe-rosso.png')):
        squadre[squadra] = truppe(SORGENTI / file, foglietto)
        for id, pose in squadre[squadra].items():
            pezzi += [(f'{squadra}:{id}:{n}', im, c) for n, (im, c) in enumerate(pose)]
    if len(sys.argv) > 1:
        provino(squadre, sys.argv[1])
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
