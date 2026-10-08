#!/usr/bin/env python3
"""Taglia il font Twemoji alle sole emoji che il gioco usa. Lo lancia
`npm run emoji` (strumenti/emoji.mjs), che sa quali sono; qui c'è solo il
lavoro che vuole fontTools:

    python3 strumenti/emoji/taglia.py <font.ttf> <punti.json> <uscita.woff2> <uscita.ttf>

Vuole `pip install fonttools brotli`. Oltre al taglio fa due ritocchi, perché
Chrome scarta un font per ogni emoji col selettore FE0F (❄️, 🗺️, ⚠️: sono
quasi tutte quelle da testo) se il font non dichiara di conoscere la
coppia (carattere + FE0F):

  1. una tabella cmap di formato 14 che dice «con FE0F è il glifo di sempre»;
  2. per ogni legatura che contiene FE0F (🧑‍✈️ = persona + ZWJ + aereo + FE0F)
     la sua gemella senza FE0F: con la cmap 14 HarfBuzz ingloba il selettore
     nel carattere *prima* di cercare le legature, e quella originale non
     scatterebbe più.

Perché e come si controlla: docs/core/emoji.md."""
import json
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import otTables
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

FE0F = 0xFE0F


def main(fonte, punti_json, uscita_woff2, uscita_ttf):
    punti = set(json.load(open(punti_json)))

    opzioni = subset.Options()
    opzioni.hinting = False
    opzioni.layout_features = ['ccmp']
    opzioni.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]   # copyright, nome e licenza restano nel font
    opzioni.notdef_outline = True
    font = TTFont(fonte)
    sottoinsieme = subset.Subsetter(opzioni)
    sottoinsieme.populate(unicodes=punti)
    sottoinsieme.subset(font)

    cmap = font.getBestCmap()
    if FE0F not in cmap:
        raise SystemExit('il sottoinsieme non ha FE0F: non si può')

    # 1. la cmap 14: FE0F + qualunque carattere non ASCII che il font ha
    uvs = CmapSubtable.newSubtable(14)
    uvs.platformID, uvs.platEncID, uvs.language = 0, 5, 0
    uvs.cmap = {}
    uvs.uvsDict = {FE0F: [(c, None) for c in sorted(cmap) if c > 0x7F and c not in (0x200D, FE0F, 0x20E3)]}
    font['cmap'].tables.append(uvs)

    # 2. le legature gemelle
    fe = cmap[FE0F]
    gemelle = 0
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:
                st = st.ExtSubTable
            if not hasattr(st, 'ligatures'):
                continue
            for primo, lista in list(st.ligatures.items()):
                nuove = []
                for l in lista:
                    if fe in l.Component:
                        g = otTables.Ligature()
                        g.LigGlyph = l.LigGlyph
                        g.Component = [c for c in l.Component if c != fe]
                        g.CompCount = len(g.Component) + 1
                        nuove.append(g)
                if nuove:
                    gemelle += len(nuove)
                    # HarfBuzz prende la prima che combacia: le lunghe prima delle corte
                    st.ligatures[primo] = sorted(lista + nuove, key=lambda l: -len(l.Component))

    font.save(uscita_ttf)
    font.flavor = 'woff2'
    font.save(uscita_woff2)
    print(f'{len(cmap)} punti di codice, {gemelle} legature gemelle')


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise SystemExit(__doc__)
    try:
        main(*sys.argv[1:])
    except ImportError as e:
        raise SystemExit(f'manca una libreria Python ({e}): pip install fonttools brotli')
