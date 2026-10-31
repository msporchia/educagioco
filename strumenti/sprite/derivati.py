#!/usr/bin/env python3
"""I pezzi derivati: pezzi ricavati in codice da tessere già dipinte, invece di generarne di nuovi.

Libreria, non comando: chi la usa è una configurazione per scena (oggi `inferno.py`). Quando conviene, come si usa, i limiti:
docs/core/sprite.md, «I pezzi derivati in codice».

  tessere_di(sorgente)       le tessere di un foglio, ritagliate come fa atlante.py (stesso fondo, stessa scala)
Il PNG che esce non si tocca a mano: si rifà col comando della configurazione, poi `atlante.py <gioco>`.
"""
import json

from PIL import Image

import atlante

REPO = atlante.REPO
SORGENTI = atlante.SORGENTI


def tessere_di(sorgente):
    """Le tessere di un foglio sorgente (`sotterraneo/generati/sotterraneo_6.png`), come le ritaglia atlante.py."""
    f = SORGENTI / sorgente
    fg = json.loads(f.with_suffix('.json').read_text())
    fg['_file'] = str(f)
    im = atlante.pulisci(atlante.alla_misura_vera(atlante.senza_alone(Image.open(f).convert('RGBA'), fg), fg), fg)
    r, pv, fa, tr, an = {}, {}, {}, {}, {}
    atlante.ritagli_di(im, fg, pv, r, fa, tr, an)
    return r
