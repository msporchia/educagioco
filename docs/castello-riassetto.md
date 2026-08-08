# Riassetto del castello — il contratto fra i tre cantieri

Tre lavori girano **in parallelo** sullo stesso gioco. Questo file dice chi
possiede cosa, e qual è la forma dei dati che li tiene insieme. Chi lavora
qui lo legge prima di toccare un file.

## Il problema che stiamo risolvendo

Finire una tappa oggi costa da **21 a 52 operazioni in colonna**. È troppo:
didatticamente ricco, ma una partita diventa un compito. Il bersaglio nuovo
è **6 calcoli** nella prima tappa e **30** nell'ultima, con la campagna
allungata a tre archi da cinque tappe.

La causa non è un prezzo sbagliato: è che il numero di calcoli oggi è un
**effetto**. `postiDi()` sceglie le postazioni proprio perché l'energia si
spenda tutta (`RESPIRO_SPESA`), quindi più energia entra → più posti → più
calcoli. Va rovesciato: **`calcoli` diventa l'input della tappa**, e da lì
si derivano ondate, energia in entrata, prezzi e postazioni. La vita dei
nemici si tara **dopo**, sulla difesa che ne esce.

## La curva, decisa

Tre campagne, cinque tappe ciascuna:

| campagna | calcoli per tappa |
|---|---|
| Bosco | 6 · 7 · 8 · 10 · 12 |
| Sotterraneo | 9 · 11 · 13 · 16 · 19 |
| Mura | 14 · 18 · 22 · 26 · 30 |

Ogni campagna riparte più bassa della fine della precedente ma arriva più
in alto: è il modello del Generale. Un calcolo = un acquisto (una torre
costruita o un gradino salito).

## Chi possiede cosa

Nessuno tocca i file di un altro. Se serve una modifica fuori dal proprio
recinto, si chiede — non si fa.

### A · Equilibrio
- `src/data/castello.js` — il modello economico
- `strumenti/tara-castello.mjs`, `strumenti/simula-castello.mjs`
- `src/data/taratura-castello.js` (generato, mai a mano)
- `test/unita/castello.test.mjs`

Vincolo: **non rimuove e non rinnomina** gli export già usati da
`views/TowerDefense.vue` e `motore/battaglia.js` (`CFG`, `TAPPE`, `LIBERA`,
`costoNuovaTorre`, `costoSalita`, `vitaNemico`, `velocitaNemico`,
`nemiciDiOnda`, `intervalloDiOnda`, `tiroDi`, `geloDi`, `premioTappa`).
Aggiungere sì, togliere no.

### B · Livelli
- `src/data/campagne-castello.js` — le quindici tappe (lo scheletro esiste già)
- `src/grafica/terreni/` — file nuovi, uno per terreno, con il suo `indice.js`
- `docs/campagne-castello.md`

Vincolo: **non tocca `src/data/castello.js`**. Riempie il file dei dati
rispettando la forma qui sotto; i numeri di equilibrio non li scrive.

### C · Riassetto
- `src/views/TowerDefense.vue` e i file nuovi che ne nascono
- `src/motore/battaglia.js`
- `src/grafica/castello.js`
- il foglio di stile separato
- il **preavviso delle ondate** (motore + interfaccia)

Vincolo: **non tocca i dati** (`data/castello.js`, `data/campagne-castello.js`,
`data/taratura-castello.js`). Consuma quello che esportano.

## La forma del dato — `src/data/campagne-castello.js`

È il confine fra B (che lo riempie) e A (che lo legge e ci mette sopra i
numeri). Una tappa dichiara **solo quello che si racconta**:

```js
{
  nome: 'Il sentiero', emoji: '🌱',
  ambiente: 'prato',        // che terreno si dipinge
  calcoli: 6,               // ← il bersaglio: quante operazioni per finirla
  cap: 3,                   // fin dove arriva la scaletta delle operazioni
  torri: ['add'],           // quali operazioni mette a disposizione
  mostri: ['slime', 'goblin'],
  debolezze: false,
  forma: [[0.03, 0.35], …], // il percorso, in coordinate 0–1
}
```

Tutto il resto lo calcola A e lo appende: `ondate`, `posti`, `partenza`,
`attesa`, `durezza`, `vite`. Nessuno di questi si scrive a mano.

Le quattro torri, per memoria: `add` arciere 🏹, `sub` magica 🔮,
`mul` ghiaccio ❄️ (non fa danno, gela), `div` bombe 💣.

## Il preavviso delle ondate

Oggi le debolezze dei mostri esistono solo nell'ultima tappa e si scoprono
quando l'ondata è già partita: non c'è il tempo di costruire la torre
giusta, quindi la debolezza non cambia una decisione. Va anticipata — «fra
tre ondate arriva il Golem, debole alle bombe» — così il bambino sceglie
cosa comprare **prima**, e la scelta della torre diventa il cuore del
gioco invece di un dettaglio.

Chi arriva è già deterministico (`mostroDiOnda(tappa.mostri, o)`), quindi
il preavviso si può calcolare senza toccare l'equilibrio.

**Su chi si tara.** Il metro resta un giocatore che il preavviso lo
ignora (`PROFILI.misura` in `simula-castello.mjs`, con `debolezze`
spento). Tarare su chi lo sfrutta renderebbe obbligatorio leggerlo, e
chi non l'ha ancora capito si troverebbe le tappe ingiocabili: in un
gioco che insegna, un'informazione in più deve premiare chi la usa, non
punire chi non la usa. Quindi il preavviso **non chiede una
ritaratura** — è margine in più.

**Dove sono accese le debolezze.** Dalla seconda tappa in poi,
quattordici su quindici. Resta fuori solo la primissima, che ha una
torre sola: con un tipo solo la debolezza non è una scelta ma
un'etichetta. Le debolezze puntano a tre torri — arciere, magica,
bombe: il ghiaccio non ne ha, perché non fa danno. Perciò in ogni tappa
che le accende ogni mostro deve avere la sua torre fra quelle
disponibili, e nell'elenco devono comparire almeno due debolezze
diverse: se la risposta è sempre la stessa, la meccanica non esiste.

## Il Bosco è il tutorial, il resto è aperto

Le quattro torri entrano una per volta lungo la prima campagna, e dalla
seconda in poi ci sono tutte: chi arriva lì il tutorial l'ha già fatto.

    Bosco 1   ['add']
    Bosco 2   ['add','sub']
    Bosco 3   ['add','sub']
    Bosco 4   ['add','sub','mul']
    Bosco 5   ['add','sub','mul','div']
    Sotterraneo e Mura   tutte e quattro

Dare le bombe presto non taglia fuori chi le divisioni in colonna non
le ha ancora fatte a scuola: `contoDi` in `data/ops.js` fa chiedere a
quella torre moltiplicazioni di tre gradini più su quando i genitori
spengono le divisioni. La torre resta comprabile, cambia il conto.

### D · Mostri

Un quarto cantiere aggiunge otto mostri ai dieci di oggi — per ora solo
come sprite differenziati, il piazzamento nelle tappe si decide dopo.
Possiede `src/grafica/mostri/` (nuova, un file per mostro più il suo
indice) e `src/data/mostri.js`. I pittori dei mostri restano quindi
fuori dallo spezzettamento di `grafica/castello.js`.

## Migrazione dei salvataggi

`state.profile.td = { tappa: 0, libera: false }` è un indice lineare sulle
sei tappe di oggi. Con quindici tappe quel numero va rimappato, e nessun
bambino deve trovarsi ricacciato all'inizio: chi aveva finito le sei
vecchie tiene sbloccato almeno fino alla fine della seconda campagna.
Se ne occupa A, con un test che parte da un profilo vecchio.
