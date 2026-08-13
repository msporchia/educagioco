# Le tessiture — il contratto

Una **tessitura** è una funzione che dipinge una superficie: una muratura
(`MURI`) o una posa di pavimento (`POSE`). Non sa niente di stanze, di lacune
né di gioco: sa dipingere il suo materiale su una regione, e rispondere a due
domande che le arrivano da fuori.

Questo file è il patto. Chi lo rispetta funziona con tutto il resto senza
sapere che il resto esiste.

---

## 1. La firma

```js
// una muratura
export function mattoni (c, reg, A, lato, tinte, dentro, opz = {}) { … }
// una posa
export function lastre  (c, reg, A, lato, scoperto, opz = {}) { … }
```

| parametro | cos'è |
|---|---|
| `c` | il contesto 2D nudo (non il pennello di `tela.js`) |
| `reg` | `{x0,y0,x1,y1}` in pixel: la regione da coprire |
| `A` | la tavolozza dell'ambiente (`A.giunto`, `A.lastra`, `A.sasso`…) |
| `lato` | quanti pixel vale **una cella**. In gioco è 36: è lì che si giudica |
| `tinte` | `[chiaro, scuro]` per le murature. Le pose leggono `A.lastra` |
| `dentro` / `scoperto` | **il predicato per blocco** — vedi §2 |
| `opz` | `{ modo, seme }` — vedi §3 |

## 2. La regola che non si può rompere: chiedere per ogni blocco

> Prima di posare **ogni** concio, mattone, lastra o masso, la tessitura
> chiama `dentro(x, y, w, h)` (o `scoperto(...)`) e salta il blocco se
> risponde di no.

```js
if (dentro && !dentro(x, y, w, h)) continue
```

Non è un'ottimizzazione: è **il meccanismo con cui due materiali si
cuciono**. Chi dipinge la stanza usa quel predicato per dire «qui tocca a
un'altra tessitura», e siccome la domanda si fa al centro del blocco, il
confine fra due materiali corre lungo i giunti invece di tagliare le pietre a
metà. Una tessitura che ignora il predicato copre tutta la regione e rompe la
stanza in silenzio.

## 3. I modi stanno dentro la tessitura

Un muro rovinato **non è una macchia stesa sopra da qualcun altro**: è quel
muro, fatto in un altro modo. Chi chiama dice `modo: 'rotto'` e non deve
sapere altro.

```js
export function mattoni (c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale'
  const perde = modo === 'rotto' ? 0.76 : modo === 'vecchio' ? 0.955 : 2
  …
}
mattoni.modi = ['normale', 'vecchio', 'rotto']   // ← il catalogo li legge da qui
```

Regole dei modi:

- `'normale'` è sempre il primo e non cambia niente rispetto a prima;
- da tre a quattro modi per tessitura: oltre, si fa un pittore nuovo;
- un modo deve **distinguersi a 36 px**. Se si vede solo a zoom 3, non
  esiste;
- **quello che manca si dipinge**: un mattone caduto lascia vedere il vuoto
  dietro, che è scuro e ha un bordo. Se si salta e basta, resta il colore di
  ciò che sta sotto e sembra trasparenza.

## 4. Il seme

`opz.seme` è un intero che deve spostare **tutto** il caso di quella
chiamata: si somma alle costanti passate a `dado`.

```js
const sm = (opz.seme || 0) * 37
const r = m => dado(i, k, 500 + m + sm)
```

Serve perché due voci della stessa tessitura con due semi diversi sono due
partite di mattoni **parenti ma non gemelle**, ed è il modo più economico che
abbiamo di togliere monotonia: una riga in più nell'ambiente, nessun pittore
nuovo.

## 5. Il caso è deterministico, sempre

Solo `dado(a, b, c)` da `comune.js`: un numero fra 0 e 1 che dipende solo dai
tre interi. **Mai `Math.random`**, mai contatori, mai stato fra una chiamata e
l'altra. La stessa stanza deve uscire identica anche se domani la si
dipingesse a riquadri, al contrario, o due volte — e il seme di una tappa non
cambia mai, quindi «quello con la pozzanghera» resta quello con la
pozzanghera.

## 6. Le misure, che sono già state tarate

- un **corso di muratura** vale ~0,26 celle: nell'altezza di un personaggio ce
  ne stanno quattro;
- una **lastra** del pavimento è il doppio di un concio (~0,34), se no
  pavimento e parete diventano lo stesso tessuto e la stanza perde
  l'architettura;
- **niente frazioni tonde della cella**: `lato/3` e `lato/2` riportano a galla
  la griglia. Si usano numeri che non tornano mai (0,53 · 0,62 · 0,83);
- il **dettaglio dentro un blocco** deve stare in uno o due pixel a lato 36:
  chiazze larghe un terzo del mattone, spigoli scheggiati, non decorazioni.

## 7. Il carattere, cioè cosa distingue una campitura da una materia

È la parte che si è rivelata mancare, e vale per tutte le tessiture:

1. **il pezzo fuori partita** — uno su dodici di un'altra tinta (il mattone di
   recupero). Costa una riga e si vede da lontano;
2. **la faccia non è liscia** — due o tre chiazze appena più chiare o più
   scure sulla metà dei pezzi. Se le prendono tutti, torna un motivo;
3. **lo spigolo che manca** — uno su sei perde un angolo e sotto si vede il
   giunto;
4. **l'ombra di contatto** — un'ellisse scura sotto il pezzo: senza, i pezzi
   sono ritagli appoggiati, con, uno sta davanti all'altro;
5. **la taglia non è uniforme** — pochi grandi e molti piccoli (una curva
   `r³`, non un numero pescato dritto). Pezzi tutti uguali sono un motivo,
   qualunque sia la loro forma.

## 8. Come si prova

`strumenti/banco/catalogo.html` (col server di sviluppo) stampa **ogni
tessitura da sola**, in tutti i modi che dichiara e con quattro semi, alla
misura del gioco. È lì che si giudica se un modo ha carattere o è solo rumore.

`strumenti/banco/vetrina.html` mostra tutti i pittori in fila: serve a
giudicare la mescolanza, non la singola tessitura. (C'era anche un
`banco.html` con le manopole della resa: è servito a decidere, le
migliorie che ha promosso sono nel codice, e con loro se n'è andato.)

## 9. Aggiungerne una

Un file in `materiali/` + una riga in `MURI` o `POSE` dentro `indice.js`. Le
fabbriche di `pattern.js` si generano dai registri, quindi non c'è un secondo
elenco da tenere allineato, e il catalogo la trova da sé.
