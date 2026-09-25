"""Monta una clip animata dai fotogrammi registrati da `strumenti/scatti.mjs`.

    python3 strumenti/clip.py <cartella dei fotogrammi> <uscita.webp> [larghezza] [accelera]

La cartella contiene `fotogrammi.json` — `[{ "file": "0001.jpg", "t": 12.345 }, …]`
con `t` in secondi, l'orologio del browser — e i JPEG che nomina. Chrome
consegna un fotogramma solo quando lo schermo cambia, quindi arrivano a
raffiche e a buchi: qui si ricampionano su un passo fisso (FPS), e i
fotogrammi uguali di fila diventano uno solo più lungo, che è quello che
tiene piccolo il file mentre il gioco sta fermo.

Esce un WebP animato: GitHub lo mostra nel README come una GIF, pesa un
terzo e non si ferma a 256 colori — che su uno sfondo sfumato fanno le
strisce.

`accelera` (1 di serie) fa scorrere il gioco più svelto del vero: 1.5 vuol
dire dodici secondi registrati in otto. Serve dove il gioco ha dei tempi
morti che dal vivo sono il suo ritmo e in un filmato sono cielo vuoto.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

FPS = 12
QUALITA = 55


def main():
    cartella = Path(sys.argv[1])
    uscita = Path(sys.argv[2])
    larghezza = int(sys.argv[3]) if len(sys.argv) > 3 else 280
    accelera = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0

    elenco = json.loads((cartella / 'fotogrammi.json').read_text())
    if not elenco:
        sys.exit('nessun fotogramma')
    elenco.sort(key=lambda f: f['t'])
    inizio, fine = elenco[0]['t'], elenco[-1]['t']
    # l'ultimo fotogramma resta a schermo quanto il passo, se no sparisce
    passi = max(1, int((fine - inizio) * FPS / accelera) + 1)

    cache = {}

    def apri(nome):
        if nome not in cache:
            img = Image.open(cartella / nome).convert('RGB')
            altezza = round(img.height * larghezza / img.width)
            cache[nome] = img.resize((larghezza, altezza), Image.LANCZOS)
        return cache[nome]

    quadri, durate = [], []
    j = 0
    for i in range(passi):
        t = inizio + i * accelera / FPS
        while j + 1 < len(elenco) and elenco[j + 1]['t'] <= t:
            j += 1
        img = apri(elenco[j]['file'])
        if quadri and (quadri[-1] is img or
                       ImageChops.difference(quadri[-1], img).getbbox() is None):
            durate[-1] += 1000 / FPS
        else:
            quadri.append(img)
            durate.append(1000 / FPS)

    durate = [round(d) for d in durate]
    # una pausa in fondo prima di ricominciare: il giro si legge come giro
    durate[-1] += 900
    quadri[0].save(uscita, save_all=True, append_images=quadri[1:],
                   duration=durate, loop=0, quality=QUALITA, method=6)
    kb = uscita.stat().st_size / 1024
    print(f'{uscita.name}: {len(quadri)} quadri, {sum(durate) / 1000:.1f} s, {kb:.0f} KB')


if __name__ == '__main__':
    main()
