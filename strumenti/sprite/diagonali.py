#!/usr/bin/env python3
"""I pezzi dei muri obliqui del sotterraneo, fatti in codice dalle tessere dritte di ogni scena (cripta, cantine, fornace, inferno).

    python3 strumenti/sprite/diagonali.py                    # riscrive i fogli e i foglietti di tutte le scene
    python3 strumenti/sprite/diagonali.py cantine            # solo quella
    python3 strumenti/sprite/diagonali.py --provino          # e un foglio da guardare per scena in tmp/diagonali-<scena>.png
    python3 strumenti/sprite/atlante.py sotterraneo          # poi si rifà l'atlante

Le stanze smussate, le cappelle e le sale hanno muri che girano di 45°, ma le tessere sono dritte: un muro obliquo usciva come una
scaletta di quadrati. I pezzi che mancano si ricavano dalle tessere che ci sono (ritagliate come fa `atlante.py`), così restano della
stessa mano. Le funzioni sono in `derivati.py` (e `docs/core/sprite.md`, «I pezzi derivati in codice»); qui sta solo **la configurazione di
ogni scena**: da quale foglio vengono le tessere, come si chiamano, quali righe della faccia fanno il coronamento. Regola e perché: docs/sotterraneo/scenari.md,
«I muri in diagonale». Una scena nuova è una voce di SCENE.

Per ogni scena escono sei pezzi, in pixel del disegno (una cella è 16×16, un pixel è 4×4 a schermo):
  <scena>-taglio-so|se        16×16  la roccia tagliata dalla diagonale col suo bordo chiaro (tetto + bordo-n)
  <scena>-faccia-no|ne-0|1    16×32  la faccia della parete obliqua, una fascia di 16 pixel spostata di un pixel per colonna
Dove nella cella c'è pavimento il pezzo è trasparente: sotto resta il pavimento vero.
"""
import sys

import derivati

T = 16                                   # una cella, in pixel del disegno

# Una scena: `sorgente` (il foglio da cui si ritagliano le tessere, come per atlante.py), `foglio` (il foglio che esce, accanto), e i
# nomi delle tre tessere si ricavano dal prefisso: `<p>-tetto`, `<p>-bordo-n`, `<p>-faccia-fila`. `coronamento`: le righe della faccia dritta
# che fanno il coronamento (a 45° tre righe sembrano due: una si raddoppia); `mattoni_da`: da quale riga della faccia dritta cominciano i mattoni.
SCENE = {
    'cripta': {
        'sorgente': 'sotterraneo/generati/sotterraneo_4.png', 'foglio': 'sotterraneo_4_diagonali',
        'coronamento': [0, 1, 1, 2], 'mattoni_da': 3,
    },
    'cantine': {
        'sorgente': 'sotterraneo/generati/sotterraneo_2.png', 'foglio': 'sotterraneo_2_diagonali',
        'coronamento': [0, 1, 2, 3], 'mattoni_da': 4,
    },
    'fornace': {
        'sorgente': 'sotterraneo/generati/sotterraneo_5.png', 'foglio': 'sotterraneo_5_diagonali',
        'coronamento': [0, 1, 1, 2], 'mattoni_da': 3,
    },
    # il tetto dell'inferno lo fa inferno.py (foglio derivato): `ancheDa` porta le sue tessere accanto a quelle della scena. Il coronamento è
    # di massi, alto più delle altre: quattro righe, poi i mattoni
    'inferno': {
        'sorgente': 'sotterraneo/generati/sotterraneo_6.png', 'ancheDa': 'sotterraneo/generati/sotterraneo_6_derivati.png',
        'foglio': 'sotterraneo_6_diagonali', 'coronamento': [0, 1, 2, 3], 'mattoni_da': 4,
    },
}


def _tessere(c):
    t = dict(derivati.tessere_di(c['sorgente']))
    if c.get('ancheDa'):
        t.update(derivati.tessere_di(c['ancheDa']))
    return t


def costruisci(scena, tessere=None):
    """Tutti i pezzi di una scena: nome → immagine. `tessere` (nome → immagine) di difetto si ritagliano dal foglio della scena."""
    c = SCENE[scena]
    t = tessere or _tessere(c)
    fila = t[f'{scena}-faccia-fila']
    righe = c['coronamento'] + list(range(c['mattoni_da'], c['mattoni_da'] + T - len(c['coronamento'])))
    righe = [min(r, fila.size[1] - 1) for r in righe]
    pezzi = {}
    for lato in ('so', 'se'):
        pezzi[f'{scena}-taglio-{lato}'] = derivati.bordo_su_diagonale(t[f'{scena}-tetto'], t[f'{scena}-bordo-n'], lato, T)
    for lato in ('no', 'ne'):
        for parita in (0, 1):
            pezzi[f'{scena}-faccia-{lato}-{parita}'] = derivati.faccia_su_diagonale(fila, lato, parita, righe, T)
    return pezzi


def scrivi(scena, pezzi):
    c = SCENE[scena]
    nota = (f"Il foglietto di {c['sorgente'].split('/')[-1][:-4]}_diagonali.png: i pezzi per i muri obliqui ({scena}), costruiti in codice da "
            f"`strumenti/sprite/diagonali.py` (funzioni in `derivati.py`) dalle tessere dritte di {c['sorgente'].split('/')[-1]} (il PNG si rifà "
            f"col comando, non si tocca). Fondo trasparente: dove nella cella c'è pavimento il pezzo è vuoto.")
    derivati.scrivi_foglio(pezzi, derivati.SORGENTI / 'sotterraneo/generati' / c['foglio'], nota,
                           [f'{scena}-faccia', f'{scena}-taglio'], T)


def provino(scena, pezzi):
    t = _tessere(SCENE[scena])
    derivati.provino(pezzi, [(f'{scena}-faccia-fila', t[f'{scena}-faccia-fila']), (f'{scena}-bordo-n', t[f'{scena}-bordo-n'])],
                     derivati.REPO / f'tmp/diagonali-{scena}.png')


if __name__ == '__main__':
    scelte = [a for a in sys.argv[1:] if not a.startswith('--')] or list(SCENE)
    for scena in scelte:
        pezzi = costruisci(scena)
        scrivi(scena, pezzi)
        if '--provino' in sys.argv:
            provino(scena, pezzi)
