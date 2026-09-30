# L'abisso: il progetto che resta da costruire

Le parti dell'abisso già decise e non ancora scritte, coi numeri misurati sul
banco e i punti di rottura: la lettura unica delle cose, il bottino
graduato, la scala che risale e le monete. Com'è l'abisso oggi:
[abisso.md](abisso.md). Le voci in fila: [da-fare.md](da-fare.md).

Si costruisce **in quest'ordine**, e ogni pezzo si guarda col telefono prima
del successivo: 1 la lettura unica (mezza giornata, niente cambia a
schermo) · 3 il bottino graduato (una giornata) · 5 il banco e le monete
(mezza) · 4 la risalita (una giornata, per ultima: è l'unica che tocca il
salvataggio, e conviene farla sapendo quanti piani risalgono davvero i
bambini). Il punto 2, l'abisso stesso, è fatto.

## 1. `cosa(k)`: una lettura sola delle cose

- **Una cosa graduata si chiama `base#N`** (`ascia#5`, `corazza#3`): prima
  del cancelletto la chiave di sempre, che non cambia mai; dopo, il grado.
  Gli id non si rinominano (sono chiavi dei salvataggi), e `sosta.js` butta
  le chiavi che non riconosce: un `ascia-demoniaca-5` sparirebbe dallo zaino
  senza errori.
- **`#0` non si scrive**: la campagna continua a produrre le chiavi di oggi, i
  salvataggi vecchi si rileggono e nessun test cambia colore.
- **Tutte le letture `COSE[k]` fuori da `dati/cose.js` diventano
  `cosa(k)`** (oggi sono una sessantina, in `motore/corsa.js`, `Gioco.vue`,
  `scena/tela.js`, `motore/banco.js`, `motore/sosta.js` e nei test):

  ```js
  export function cosa(k) {
    if (!k) return null
    const [base, n] = String(k).split('#')
    const c = COSE[base]
    if (!c) return null
    const grado = Number(n) || 0
    if (!grado) return c
    return { ...c, grado, chiave: k, nome: nomeGraduato(c, grado), ...bonusDi(c, grado) }
  }
  ```

  Un controllo in `guastiDelleCose` pretende che fuori da `cose.js` non resti
  nessun `COSE[`: è la sostituzione con guardia.
- **`possiedo(k)`, `quanteNeHo(k)` e `posso(k)` confrontano la base**: il
  mercante non offre `spada#3` a chi ha `spada#7`, e il grado non diventa una
  scappatoia al limite di classe.
- **Lo sprite viene dalla base**: nessuna arte nuova. Se si vuole che si veda
  il grado, il posto è il filo di luce di `scena/tela.js`, più acceso.

## 3. Il bottino graduato

**`G(p) = floor(p / 2)`** è il grado che gira al piano `p`.

```
mostro:  ossa = base.ossa × (1 + p · 0,22)   att = base.att + floor(p / 3)   dif ferma
eroe:    att ≈ 3 (base) + 3 (arma di gradino 3) + G(p)
         dif ≈ 1 + 3 (corazza) + 3 (scudo) + floor(G(p) / 2)
```

- **Il `+N` di un'arma va sull'attacco; quello di armatura e scudo sulla
  difesa a metà ritmo** (`floor(N / 2)`): la difesa entra in una sottrazione.
  `floor(G(p)/2) = floor(p/4)` è esattamente la crescita di difesa che serve.
- **Misurato** con queste formule, 24 piani, quattro semi, bravura 0,8: 24
  piani su 24, 13–15 svenimenti, **13–17 domande obbligate per piano** e
  40–43 per «tutto», costanti dal primo al ventiquattresimo; forbice 2,6×. Il
  guardiano costa 4 risposte al primo piano e 7 al cinquantunesimo a chi ha
  l'arma del suo piano, 8–10 con l'arma di due piani prima: la differenza che
  dà un motivo per aprire il forziere.
- **Una seduta sono 85 domande, cioè cinque o sei piani**: il piano 30 sta a
  cinque o sei sere. L'abisso esiste solo se si riprende bene.

**Chi lascia cosa:**

| chi | grado |
|---|---|
| il guardiano del piano | esattamente `G(p)`, **e lascia sempre** |
| un forziere | `G(p)` una volta su tre, se no `G(p)−1` o `G(p)−2` |
| un mostro qualunque | da `G(p)−4` a `G(p)−2` |
| il mercante | `G(p)−1`, ai prezzi di quel grado |

- **Il guardiano lascia sempre**: oggi il bottino è a caso (`droppa: 0.6`
  l'orco, `0.85` il gigante), e in una discesa infinita tre guardiani a vuoto
  lasciano indietro di tre gradi senza aver sbagliato niente. È l'unica cosa
  che non si aggira, quindi l'unico posto dove garantire il pavimento.
- **Un piano dà il bottino della sua profondità, non della tua**: risalire non
  dà equipaggiamento migliore, e il farming resta una rete di sicurezza senza
  divieti.
- **Prezzi lineari**: `prezzo = base.prezzo × (1 + N × 0,5)`, mai
  esponenziali, perché anche le gemme crescono lineari (`scheda.gemme +
  floor(piano · 1,5)` dai mostri, `6 + piano · 3` nei forzieri): due rette
  con la stessa pendenza. Le gemme sono il carburante del `+N`: chi sviene di
  continuo non compra il grado che gli serve e si ferma da solo.
- **Il grado sta sulla mano che comanda.** Col `+N` sommato anche a sinistra
  due `spada#5` farebbero 7 + ⌈7/2⌉ = 11 contro 8 dell'`ascia#5`, e le armi
  pesanti sparirebbero. La mano debole porta l'arma, non la sua magia:

  ```js
  get attaccoMancino() {
    const c = COSE[base(this.mancina)]        // la scheda nuda, senza il +N
    return c ? Math.ceil((c.att || 0) / 2) : 0
  }
  ```

  Due `spada#5` fanno 7 + 1 = 8 = `ascia#5`, e il test «due leggere valgono
  una pesante» resta la guardia.
- **Il nome si accorda**: gradi 1–2 temprata/o, 3–5 runica/o, 6–9
  demoniaca/o, 10+ leggendaria/o, e il `+N` in coda («Ascia demoniaca +7»).
  «Ascia demoniaco» sarebbe una lezione sbagliata trenta volte a sera. Serve
  **`genere: 'f'`** sulle voci femminili di `COSE` (ascia, accetta, bipenne,
  spada, spada corta, balestra, verga, corazza, torcia, chiave, boccetta,
  pozione, ampolla) e un controllo in `guastiDelleCose` che lo pretenda su
  tutto quello che ha un `dove` o un `usa`: **parte rosso** apposta, ed è il
  modo in cui il lavoro si fa. `dellArticolo` in `viste/cambio.js` oggi
  indovina l'articolo dalla prima lettera: col campo potrebbe smettere.
- **Da guardare** col bottino graduato: il cavaliere, che nell'abisso si
  ferma per primo (vedi [abisso.md](abisso.md)); se la corazza cresce come
  l'arma il divario si allarga.

## 4. La scala che risale, e il salvataggio dei piani lasciati

- **Nella stanza d'ingresso di ogni piano c'è una seconda scala, che sale.**
  Rigenera il piano di sopra dal suo seme, stesso disegno, **coi mostri di
  nuovo al loro posto**, e porta la profondità a `p−1`. Si risale di quanti
  piani si vuole, **camminando, senza menù**: un elenco di quaranta piani non
  si legge, e un salto istantaneo renderebbe il farming gratis. La mappa del
  piano resta accesa, i mostri si aggirano, e la chiave del guardiano serve a
  scendere, non a salire.

| tornando su un piano | torna? |
|---|---|
| i mostri | **sì**, con le ossa piene del loro piano |
| le gemme dei mostri | sì; quelle per terra no |
| i forzieri e le curiosità | **no**: se tornassero, risalire sarebbe la strada per il bottino |
| il mercante | sì, e ripesca il banco |
| la roba lasciata per terra | **no**: il piano che si abbandona si rimette a posto |
| la mappa già girata | sì |

**Il salvataggio.** La sosta sta dentro il profilo
(`profile.campagne['sotterraneo'].sosta`, via `salvaSosta` in
`giochi/campagne.js`), e `persist()` lo clona e riscrive intero; il
sotterraneo lo chiama dopo ogni risposta e ogni otto secondi. Un piano pesa,
misurato: cantine 1 910 byte di `robe` (22 pezzi), il fondo 4 774 (54), il
labirinto 7 836 (87) — circa 88 byte a pezzo, e un quinto è arredo. Quaranta
piani salvati così sono ~188 KB: non è la CPU, è il timeout di 2,5 s di
`openDb()` in `store/storage.js` e il ripiego su `localStorage`, cinque
megabyte per tutta la casa.

- **Il piano su cui si sta si salva intero; quelli lasciati come
  differenza.** `generaPiano` è deterministico, quindi di un piano lasciato
  basta `{ p: 12, v: "…" /* visto a tratti */, c: ["30,12", "8,41"] }`, con
  in `c` le **celle** delle cose che non tornano (forzieri, curiosità, porte
  aperte, cose raccolte). Misurato: 154 · 378 · 514 byte invece di 1 910 ·
  4 774 · 7 836, quasi tutto `visto`; quaranta piani ~15 KB.
- **Celle e non indici**: l'indice nella lista `robe` sarebbe più corto (26
  byte contro 68) ma è legato all'ordine di `arreda()`, e spostare la
  generazione delle curiosità marcherebbe aperto il forziere sbagliato. Con
  la cella un disallineamento non corrisponde a niente e il piano si rilegge
  intatto.
- **Si tengono i venti piani più recenti**: dimenticarne uno richiude i suoi
  forzieri, ma il bottino è della profondità del piano, quindi non paga.
  Se i bambini risalgono davvero di venti, si alza (340 byte a piano).
- **La versione resta 3**: `robe` non cambia significato, e i campi sono
  aggiunti — `dietro` (le differenze, al massimo venti, ~7 KB al tetto) e
  `fondo` (il piano più profondo di questa discesa). Una sosta senza
  `dietro` si legge come «nessun piano alle spalle».
- **Se un giorno la sosta andasse fuori dai profili** (non serve: sotto i
  10 KB): una chiave propria `sosta:sotterraneo:<id>`, come
  `store/sessioni.js`, insegnata a `azzeraCampagna`, `resetPlayer` e
  `store/cestino.js`, più un gemello di `scordaSessioni`.
- La leva di riserva, se 15 KB dessero fastidio: ricordare solo le `stanze`
  (~90 byte a piano) e rinunciare alla traccia dei corridoi.

## 5. Il banco dell'abisso e le monete

- **Fatto: 🪙1 per risposta giusta, pagato subito**, mai per una
  sbagliata. Quando i premi di tutti i giochi sono passati al «si paga
  subito» è restato 🪙1, e le sei discese ci sono arrivate anche loro
  ([regole.md](regole.md#le-monete)).
- **Il rischio non è la quantità ma la varietà**: ogni cosa costa una
  risposta, quindi un'ora sul piano 19 è un'ora di esercizio. La stessa
  classe ripetuta la sorvegliano già la banda della pesca
  (`nucleo/bisogno.js`), la finestra dell'età e `quiz/allarme.js`.
- **Le soglie da aggiungere a `unita/sotterraneo-abisso`** (che oggi misura
  con `costoDeiPiani` e `finoADove`):
  1. il costo di un piano fra **10 e 25 domande** dal piano 1 al 30;
  2. la forbice fra «minimo» e «tutto» **oltre 2×**;
  3. il guardiano non oltre **8 risposte di fila** a chi ha l'arma del suo
     piano (il tetto di `guastiDeiMostri`);
  4. **quaranta piani sotto i 10 KB** di salvataggio;
  5. **si risale e si ridiscende senza perdere niente**: un piano condensato
     e rigenerato tiene i forzieri aperti e rimette i mostri (come
     `gioca(…, { da })` in `unita/sotterraneo-sosta`).
