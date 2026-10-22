# Il pentolone e il cortile nuovo (anatre, maiali, capre)

Giro G4 della parità ([parita/](parita/README.md): C18, C23, A1d–A1f, C30). La 14ª macchina della 2D e le tre bestie che mangiano da lei:
ricette, mangime, prodotti e cosa mangia chi sono **quelli della fattoria di sempre** ([../fattoria/macchine.md](../fattoria/macchine.md),
[../fattoria/catena.md](../fattoria/catena.md)); cambiano solo i tempi (minuti → secondi) e la scaletta.

## I numeri: dal 22/10/2026 sono della 2D

**Livelli, prezzi e tempi del pentolone e delle tre bestie sono quelli della 2D** (pentolone 23 · 🪙150, anatre 24 · 🪙240 · 6 min, porcile 28 · 🪙260 · 20 min, capre 40 · 🪙280 · 12 min; `NUMERI_DEL_CORTILE` in `dati/cortile.js`, letti da `dati/parita2d.js`); `TETTO_ULTIMO_MIN` non è più 660. Restano solo 3D le capienze e il prezzo delle bestie in più. Tabella e paragrafo «In coda alla scaletta» sotto sono la storia di com'erano (livelli 19–22, 🪙75/120/130/140).

## I numeri provvisori di prima: un punto solo

`dati/cortile.js` (`PROVVISORI`) tiene livelli, prezzi, capienze e tempi di questo giro. La scala (D2) e i tempi (D9) non sono decisi: i valori
sono coerenti con quelli di oggi e col metro di [calibrazione.md](../apprendimento/calibrazione.md) (🪙1 = 10 s), e **si cambiano lì**. Un test
(`unita/fattoria3d-cortile`, sezione 3) controlla che catalogo e animali li leggano da lì.

| | livello | 🪙 | capienza | bestia (la 2ª, rincaro) | secondi | 2D |
|---|--:|--:|--:|---|--:|---|
| pentolone | 19 | 75 | – | – | – | 150 / 23 |
| stagno delle anatre (`anatre`) | 20 | 120 | 6 | 30 (+14) | 20 | 240 / 24 · 6 min |
| porcile (`porcile`) | 21 | 130 | 4 | 70 (+35) | 50 | 260 / 28 · 20 min |
| capre (`capre`) | 22 | 140 | 4 | 75 (+35) | 45 | 280 / 40 · 12 min |

- **In coda alla scaletta** (19–22, una cosa produttiva per livello): i livelli 2–18 sono tutti occupati e spostarli cambierebbe ogni soglia.
  Come fecero friggitoria e sushi bar. Conseguenza dichiarata: l'ultimo livello costa ~651 minuti (10 h 50) e `TETTO_ULTIMO_MIN` è salito da 510
  a 660, **provvisorio** come i numeri (D2 lo rifarà).
- I prezzi seguono il rapporto 2D→3D delle altre macchine (~0,5) e stanno sotto i due terzi del salto del loro livello; i tempi seguono l'ordine
  della 2D (anatre < capre < maiali) e tengono i tartufi sotto il tetto d'attesa in catena (110 s su 120).

## Il pentolone

Edificio unico 3×3 (`pentolone`, 🪙75, livello 19), come tutte le macchine: un posto di partenza, gli altri si comprano, si mette dove si vuole.
Le quattro ricette sono quelle della 2D (id, ingredienti, quantità, tempo; un test le confronta) e sono **mangime**: non si chiedono al banco,
non salgono in mongolfiera, non si baratterebbero.

| ricetta | ingredienti | s | dà | lo mangiano |
|---|---|--:|---|---|
| `beverone` (Verdure lesse) | 2 patate, 1 cavolfiore | 4 | `beverone` | anatre |
| `zuppa` (Pastone) | 2 zucche | 6 | `zuppa` | maiali |
| `zuppa_orto` (Pastone d'orto) | 2 pomodori | 4 | `zuppa` (seconda strada) | maiali |
| `pastura` (Verdura fresca) | 2 carote, 1 cavolfiore | 5 | `pastura` | capre |

Le emoji di ripiego sono 🍢 · 🫕 · 🫕 · 🥒: la 2D usa 🥔, 🥘 e 🥬, già di patata, parmigiana e foraggio (un'emoji non è di due merci); le facce vere
sono quelle dell'atlante.

## La catena, adesso

```
 patate + cavolfiore ─▶ pentolone: verdure lesse ─1─▶ stagno (anatra) ─▶ 🥚 uova (le stesse del pollaio)   20 s
 zucche | pomodori ───▶ pentolone: pastone ───────2─▶ porcile (maiale) ─▶ 🍄 tartufi                      50 s
 carote + cavolfiore ─▶ pentolone: verdura fresca ─1─▶ capre (capra)   ─▶ 🥛 latte (lo stesso della stalla) 45 s
```

**Tre mangimi, tre bocche** ([../fattoria/catena.md](../fattoria/catena.md)) torna intero (C30): ogni coltura ha la bocca che la mangia, e fra il
campo e la bocca c'è un mestiere. `MANGIMI` (dati/mangime.js) è l'elenco dei cinque; `ricetteDelMangime`, `livelloDelMangime` e `lavoroDelMangime`
li vedono tutti, quindi il rifiuto («Serve 🫕 pastone (2 a testa): lo fa il pentolone»), l'inventario e i tempi di ordini e scala funzionano senza
casi a parte. Resta fuori il `mangime` del mulino (cane, gatto, peschiera): è dei compagni, A6.

**Uova e latte sono un prodotto solo**: come in 2D (`da: 'uova'`) le anatre fanno `uova` e le capre `latte`, nello stesso scomparto. In
`PRODOTTI_ANIMALI` la voce dice `dove` (il primo pezzo, da cui il livello) e `anche` (gli altri). I **tartufi** sono l'unica merce nuova
(`merce_tartufi`, 🍄, nome e faccia della 2D); come uova e latte non si chiedono da soli al banco. L'evento è `tartufo`, senza contatore (un
gioco non aggiunge campi: i traguardi restano quelli del cortile).

## La zucca e la patata (C23)

Non hanno più una sola uscita: la zucca va nella conserva d'orto e nel pastone (maiali → tartufi), la patata nel minestrone, nelle patatine e
nelle verdure lesse (anatre). Anche pomodoro, carota e cavolfiore guadagnano una strada. Il perché della 2D: le colture che altrimenti si
accumulano senza scopo trovano una bocca.

## Il disegno (`scena3d/modelli-cortile.js`)

Ogni recinto è un pezzo 4×3 col calco di stalla e pollaio (`userData.{bestie, crea, posto, altezza}`; `sincronizzaBestie` e `muoviBestie` di
`modelli.js` li usano, e una bestia con `userData.animaBestia` porta la sua animazione). I tre stadi sono in `bestie-puro.js` (specie `anatra`,
`maiale`, `capra`: profili senza three, provati in `unita/fattoria3d-cortile`).

| | 0 · ha fame | 1 · al lavoro | 2 · pronta |
|---|---|---|---|
| **Anatra** | piccola e piatta, a pelo d'acqua, becco giù che rimesta, coda giù, nuota agitata | si arrotonda; **un uovo verdino galleggia accanto e cresce** | petto e becco in su, coda in su, **uovo enorme (×3)** accanto, alone dorato, scintillio, dondola |
| **Maiale** | magro, orecchie giù, muso basso, coda dritta | **grufola** nel fango; **un mucchio di terra cresce** accanto | tondo, orecchie su, coda a ricciolo che scodinzola, **un tartufo scuro e bitorzoluto (×2,2) sul mucchio**, alone, scintillio |
| **Capra** | piccola, testa e orecchie giù, mammella pallida | la **mammella rosea cresce**, mastica, ogni tanto una goccia | tonda, testa alta, coda in su, **secchio di rame col latte**, **saltella**, alone, scintillio |

- **Stagno delle anatre**: ellisse d'acqua con ninfee, sponda, canne, pontile, casetta con rampa, mangiatoia e sacco. **Porcile**: casetta di assi col
  tetto rosso, fango, truogolo, cartello «🍄 TARTUFI», steccato col cancelletto. **Capre**: roccia a gradini, tettoia con rastrelliera, abbeveratoio,
  steccato col cancelletto. **Pentolone**: focolare di pietre con la legna e le fiamme (che guizzano), pentolone di ferro appeso a una traversa con
  il brodo verde che bolle, zucche, patate e cavolfiore accanto, tettoia di pietra con l'insegna; fuma.
- **Le parti si toccano** ([animali.md](animali.md), «Le parti si toccano»): la capra ha il collo-osso dalla spalla alla testa, corna e orecchie sul cranio, coda dalla groppa e mammella sotto il ventre che seguono il corpo; maiale e anatra sono già corpi unici (la coda del maiale segue il corpo). Provato da `unita/fattoria3d-bestie-connesse`.
- **Peso** (nodi del catalogo 3D, fusi quelli fermi): stagno 32 mesh vuoto, ~56 con sei anatre; porcile ~47 con quattro maiali; capre ~57 con
  quattro; pentolone 16. Anatra 5–8 mesh, maiale 6–10, capra 8–11. Come pollaio e stalla; geometrie e materiali condivisi, animazioni col tempo.
- Si guardano col catalogo 3D (`npm run catalogo3d`, voci `fattoria:stagno-anatre`, `:porcile`, `:capre`, `:pentolone`, e una per stadio di anatra,
  maiale e capra).

## Nei test

`unita/fattoria3d-cortile` (ricette e bestie contro la 2D, numeri provvisori, zucca e patata, il motore, profili e modelli), `unita/fattoria3d-merci`
(la sorella 2D del pentolone), `unita/fattoria3d-bestie` (la monotonia dei profili nuovi). Integrazione: `integrazione/fattoria3d` non cambia (passa
anche coi pezzi nuovi in menu); i bersagli dei cartelli sono quelli di pollaio e stalla (`[data-f3="cartello-bestie"][data-pezzo="anatre|porcile|capre"]`).

## Da guardare (non visto)

Guardati solo dal catalogo 3D e in node: non dalla camera di gioco (~22) né su un telefono né col dito. In particolare se l'uovo verdino e il
tartufo si leggono a distanza, se le anatre sparse sull'acqua si distinguono da pronte, se 🪙75–140 e i tempi vanno a un bambino, e il pentolone
in scena (l'insegna sta sul retro, dietro il pentolone).
