# L'abisso: il progetto che resta da costruire

Le parti dell'abisso già decise e non ancora scritte, coi numeri misurati sul
banco e i punti di rottura: la lettura unica delle cose, il bottino
graduato e le monete (la scala che risale è fatta: [scala-che-sale.md](scala-che-sale.md)). Com'è l'abisso oggi:
[abisso.md](abisso.md). Le voci in fila: [da-fare.md](da-fare.md).

Si costruisce **in quest'ordine**, e ogni pezzo si guarda col telefono prima
del successivo: 1 la lettura unica (mezza giornata, niente cambia a
schermo) · 3 il bottino graduato (una giornata) · 5 il banco e le monete
(mezza). Il punto 2, l'abisso stesso, e il 4, la risalita, sono fatti.

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
- **`possiedo(k)`, `quanteNeHo(k)` e `posso(k)` confrontano la base**: i
  mercanti non offrono `spada#3` a chi ha `spada#7`, e il grado non diventa
  una scappatoia al limite di classe.
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
| i mercanti di sopra (dal 7 ottobre 2026 non stanno più nei piani) | `G(f)−1`, con `f` il piano più profondo toccato, ai prezzi di quel grado |

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
  modo in cui il lavoro si fa. `quellaCosa` in `motore/storia.js` oggi
  indovina l'articolo dalla prima lettera: col campo potrebbe smettere.
- **Da guardare** col bottino graduato: il cavaliere, che nell'abisso si
  ferma per primo (vedi [abisso.md](abisso.md)); se la corazza cresce come
  l'arma il divario si allarga.

## 4. La scala che risale: fatta, e diversa dal progetto

**Fatta l'8 ottobre 2026**, per tutte le discese e per l'abisso insieme:
[scala-che-sale.md](scala-che-sale.md). Dal progetto restano il nome dei campi
della sosta (`dietro`, `fondo`) e la scala nella stanza d'ingresso; cambiano
due decisioni, perché l'utente ha chiesto che **il piano di sopra resti com'era**
(mostri battuti, cose prese, porte aperte) e non che si rifaccia:

- **Niente mostri di nuovo al loro posto, niente differenza forzieri/mostri**:
  risalire non è una strada per il bottino perché il piano è com'era lasciato, e
  quello che si è preso non torna. Il bottino della profondità (punto 3) è
  quello di quel piano, non di quello che si è risaliti a rifare.
- **I piani alle spalle sono otto, non venti** (`PIANI_ALLE_SPALLE`), e salvati
  per indice come tutta la sosta (`cambiDelPiano`), non per cella: le soste di
  prima non si leggono più (`VERSIONE` 5), quindi il problema dell'ordine di
  `arreda()` che la cella evitava non si pone. Misurato: l'abisso al piano 21
  pesa 4 KB; i piani più su si rifanno dal seme, intatti.
- Le soglie del banco (punto 5, «si risale e si ridiscende senza perdere
  niente») sono provate in `unita/sotterraneo-scala-su`.

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
  4. **la sosta sotto i 10 KB** anche a quaranta piani: con otto piani alle
     spalle (`PIANI_ALLE_SPALLE`) è fatto a venti (4 KB,
     `unita/sotterraneo-scala-su`);
  5. **si risale e si ridiscende senza perdere niente**: fatto, lo prova
     `unita/sotterraneo-scala-su` (mostri battuti, porte, cose prese, mappa,
     e niente vita regalata salendo e scendendo).
