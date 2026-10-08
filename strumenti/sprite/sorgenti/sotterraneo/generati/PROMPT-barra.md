# Scheda di prompt — la barra in basso della discesa

La barra della discesa (docs/sotterraneo/barra.md) è fatta in codice, CSS e
SVG: due globi di vetro ai lati, sei caselle in mezzo, una cornice di
pietra. **Questa scheda si usa solo quando l'utente l'ha approvata così**:
allora la pietra, le coppe che reggono i globi e il vetro si fanno
dipingere, e il codice ci appoggia sopra quello che si muove (il liquido
dei globi, le onde, i numeri, le emoji delle caselle).

Un'immagine sola, da ritagliare: la striscia della barra, l'anello di un
globo, l'incavo di una casella, il riflesso del vetro, le due coppe.

## Le misure che il codice si aspetta

Sullo schermo (a 390 px di larghezza) la barra è alta 64 px, un globo è
largo 72 px (da 54 a 74 a seconda del telefono), una casella è circa
40×42, una coppa è larga quanto il globo più 14 px e alta il 44% della sua
larghezza. Nell'immagine tutto è **quattro volte** tanto, più un po' di
margine da ritagliare:

| pezzo | nell'immagine | sullo schermo | come entra |
|---|---|---|---|
| A · la striscia | 1536×252, in alto | tutta la larghezza × 64 | tre fette: 256 px a sinistra e a destra (sotto i globi), il mezzo si ripete in orizzontale |
| B · l'anello del globo | 320×320, foro di 272 | `--globo` | il foro è il vetro: il codice ci disegna dentro il liquido |
| C · l'incavo di una casella | 192×192 | una casella, stirata un poco | sotto l'emoji e il numero |
| D · il riflesso del vetro | 272×272, su NERO | il foro del globo | `mix-blend-mode: screen`: il nero sparisce |
| E, F · le due coppe | 400×176 ciascuna | larga quanto il globo + 14 px | davanti al globo, ne coprono il fondo |

Il foro di 272 su 320 è l'85% dell'anello: in codice oggi è l'89% (l'`inset`
di `.sot-globo-vetro` in `stile.css`, 4 px su 72), e passa al 7,5%. Se
l'anello viene più spesso o più sottile va bene lo stesso: si misura il
foro e si cambia quel numero.

## Come si fa

1. **Una chat nuova**, allegando `sotterraneo_4.png` (la cripta: è lo
   stile) e una foto della barra di oggi presa dai test
   (`node test/esegui.mjs sotterraneo-barra --scatti`, `test/scatti/barra-piena.png`):
   è la forma.
2. Il prompt qui sotto. Si guarda il controllo; una o due correzioni
   mirate, oltre si riparte con l'ultima buona allegata.
3. Si salva qui accanto come `barra_1.png`, e in «Com'è andata» si scrive
   cosa è venuto bene.

## Il prompt

```text
Disegna in pixel art a 16 bit i pezzi della barra in basso di un gioco di ruolo per bambini, nello stile dell'immagine allegata della cripta: stesso contorno scuro, stessa luce da in alto a sinistra, ogni pixel del disegno è un quadrato pieno di 4×4 px. L'altra immagine allegata è la barra com'è oggi, fatta in codice: è la FORMA da seguire (come la barra di Diablo III: un globo a sinistra, uno a destra, le caselle in mezzo), non lo stile.

Immagine 1536×1024 px, orizzontale, su un fondo MAGENTA PIENO (#FF00FF), uniforme, senza sfumature. Ogni pezzo sta da solo, staccato dagli altri da almeno 24 px di magenta; il magenta non compare mai DENTRO un pezzo. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ICONA nelle caselle, NIENTE LIQUIDO nei globi: quelli li mette il gioco.

Il materiale è pietra grigio-viola scura, a blocchi, con un filo d'oro opaco che corre lungo i bordi. Bella e un po' antica, MAI paurosa: niente teschi, demoni, artigli, denti, occhi, spine, sangue.

I pezzi:
A. In alto, larga tutta l'immagine (1536 px) e alta 252 px: la STRISCIA della barra, una mensola di pietra vista di fronte. Sul bordo in alto una cornice sporgente col filo d'oro; poco sotto, una scanalatura sottile e scura che corre per quasi tutta la lunghezza. I 256 px a sinistra e i 256 px a destra sono i posti dove siederanno i globi: pietra più massiccia, un po' più alta. Il tratto in mezzo deve potersi RIPETERE in orizzontale senza cuciture: niente decorazioni uniche al centro.
B. Sotto a sinistra, 320×320 px: l'ANELLO di un globo, un cerchio di pietra col filo d'oro e quattro piccole borchie d'oro in croce. Il foro al centro è un cerchio di 272 px di diametro, TUTTO MAGENTA: lì il gioco mette il vetro e il liquido.
C. Accanto, 192×192 px: l'INCAVO di una casella, un riquadro scavato nella pietra con gli angoli appena smussati e il fondo scuro, vuoto.
D. Accanto, su un quadrato NERO PIENO (#000000) di 320×320 px: il RIFLESSO del vetro di una sfera di 272 px, disegnato solo in bianco e grigi chiari sul nero: un riflesso grande in alto a sinistra a forma di finestra curva, un filo di luce lungo il bordo, un riflesso piccolo in basso a destra. Niente sfera, niente colore: solo le luci.
E. In basso a sinistra, 400×176 px: la COPPA che regge il globo della vita, una mezzaluna di pietra aperta in alto, che abbraccia il fondo di una sfera larga 330 px, con due riccioli alle punte e una piccola pietra rossa incastonata sotto, al centro.
F. Accanto, 400×176 px: la COPPA del globo della luce, uguale ma con la pietra d'oro.
```

Controllo: fondo magenta vero e foro dell'anello magenta; il riflesso è
su nero e senza colore; la striscia si ripete (si prova affiancando il
mezzo a se stesso); nessuna scritta, nessuna icona, niente di pauroso; la
scala dei pixel è quella della cripta.

## Come entra nel codice

Quando c'è `barra_1.png`: un foglietto accanto (`barra_1.json`, come gli
altri, `strumenti/sprite/FORMATO.md`) con i sei riquadri, e la barra prende
i pezzi come sfondi al posto dei gradienti di `.sot-plancia`,
`.sot-globo`, `.sot-cella` e dell'SVG `#sot-reggi` in
`viste/BarraDiSotto.vue`. Il liquido, le onde e i numeri restano in
codice. Le misure di schermo non cambiano: la foto a 390 e a 320 px dei
test deve stare in piedi uguale.

## Com'è andata

(da scrivere al primo giro)
