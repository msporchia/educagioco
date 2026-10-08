"""Come un'immagine dipinta entra nel file unico: una regola sola per tutti.

    from codifica import webp, riga          # dentro un altro strumento di strumenti/sprite/

**WebP senza perdita, su colori a passo `PASSO`.** Ogni canale di colore cade
sul multiplo di 12 più vicino (22 livelli invece di 256), e poi l'immagine va
in WebP *senza perdita*; l'alfa non si tocca. Un pixel non si scosta mai dal
sorgente di più di 6 su 255 per canale: i bordi restano dove sono, nessun
colore sbava sul vicino, non c'è una macchia di compressione. Il file pesa
come un JPEG a qualità 90 e si vede come l'originale.

Il perché, coi numeri e con quello che non ha funzionato: `docs/core/grafica.md`
(«Fedeli ai sorgenti»). Il WebP *con* perdita non basta: sotto qualunque
qualità sta il sottocampionamento del colore (4:2:0), che su un contorno
nero accanto a un prato sporca il verde, e `Pillow` non offre l'altra metà
(`sharp_yuv`, `near_lossless`). Gli atlanti dei pixel veri (`atlante.py`) sono
già PNG senza perdita e non passano di qui.

`passo` 0 (o 1) è WebP senza perdita e basta: dieci volte il peso.
"""
import io
import math

from PIL import Image, ImageChops

PASSO = 12


def livelli(im, passo=PASSO):
    """L'immagine con i colori sui multipli di `passo` (e l'alfa com'era)."""
    if passo <= 1:
        return im
    lut = [min(255, ((v + passo // 2) // passo) * passo) for v in range(256)]
    if im.mode == 'RGBA':
        r, g, b, a = im.split()
        return Image.merge('RGBA', (r.point(lut), g.point(lut), b.point(lut), a))
    return im.convert('RGB').point(lut * 3)


def webp(im, passo=PASSO):
    """I byte del WebP: i colori a `passo`, la codifica senza perdita."""
    b = io.BytesIO()
    livelli(im, passo).save(b, 'WEBP', lossless=True, method=6)
    return b.getvalue()


def _db(mse):
    return 99.0 if mse == 0 else 10 * math.log10(255 * 255 / mse)


def psnr(a, b):
    """Quanto `b` somiglia ad `a`, in dB. RGB sui pixel dove `a` non è
    trasparente; per un RGBA, a parte anche l'alfa. 99 è «identiche»."""
    fuori = {}
    if a.mode == 'RGBA':
        pieno = a.getchannel('A').point(lambda v: 255 if v else 0)
        nero = Image.new('RGB', a.size, (0, 0, 0))
        h = ImageChops.difference(Image.composite(a.convert('RGB'), nero, pieno),
                                  Image.composite(b.convert('RGB'), nero, pieno)).histogram()
        n = max(1, pieno.histogram()[255] * 3)
        fuori['rgb'] = _db(sum(h[c * 256 + i] * i * i for c in range(3) for i in range(256)) / n)
        h = ImageChops.difference(a.getchannel('A'), b.getchannel('A')).histogram()
        fuori['alfa'] = _db(sum(h[i] * i * i for i in range(256)) / (a.width * a.height))
    else:
        h = ImageChops.difference(a.convert('RGB'), b.convert('RGB')).histogram()
        fuori['rgb'] = _db(sum(h[c * 256 + i] * i * i for c in range(3) for i in range(256))
                           / (a.width * a.height * 3))
    return fuori


def riga(originale, dati):
    """«2241 KB, 37.1 dB» per l'immagine `originale` codificata in `dati`: i
    comandi la stampano, così un passo troppo largo si vede subito."""
    decodificata = Image.open(io.BytesIO(dati))
    decodificata.load()
    p = psnr(originale, decodificata.convert(originale.mode))
    return f'{len(dati) // 1024} KB, {p["rgb"]:.1f} dB'
