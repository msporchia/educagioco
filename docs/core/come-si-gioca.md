# «Come si gioca»: la guida che si richiama

**Proposta, da approvare prima di scrivere codice.** Approvata, le regole passano in
[guida.md](guida.md) e questo file resta solo per quello che non ci sta.

Il problema: il `?` della barra apre un foglio di testo (`AIUTI` in `src/guide/contenuti.js`),
e un bambino non lo legge; a scuola il `?` non c'è proprio, e chi non ha mai visto il gioco
resta lì. La guida del primo giro ([guida.md](guida.md)) invece funziona, ma si vede una volta
sola, in cinque giochi, e non si può chiamare di nuovo.

La proposta: **il `?` fa ripartire la guida del primo giro, dentro la partita di adesso**. Il
bambino fa davvero tre o quattro mosse col dito sull'anello che respira, e alla fine sta
giocando. Niente schermate da sfogliare, niente partita finta.

## Le regole

- **È la stessa guida del primo giro, non un'altra cosa.** I passi restano calcolati dallo
  stato (la funzione pura del gioco), l'anello e la riga col 👇 restano quelli di
  `usaGuida` e `Guida.vue`. Cambia solo chi la accende: il primo giro (da sé, una volta) o il
  `?` (quando vuole il bambino).
- **Poche mosse, fatte davvero.** Tre-cinque passi, ognuno una mossa vera della partita in
  corso (una caserma costruita resta costruita). Quello che non si fa col dito non entra: se
  serve dirlo, lo dice la riga dell'ultimo passo, in una frase.
- **Riparte da dove si è**: richiamata a metà battaglia, con due caserme già in piedi, salta i
  passi già fatti e indica quello che manca (è già così, perché il passo si legge dallo
  schermo).
- **Mentre la guida parla, il campo sta fermo** (nei giochi con un orologio): chi impara non
  deve anche correre. Riparte quando la guida finisce o la si spegne. Un passo che ha
  bisogno che il tempo scorra (aspettare le monete) non si mette.
- **Si spegne in tre modi**: da sé all'ultimo passo (la riga dice «✓ ora sai giocare» e
  sparisce dopo qualche secondo), con la **✕ sulla riga** (solo nella guida richiamata: il
  primo giro resta senza niente da chiudere), o toccando di nuovo il `?`. Uscire dalla partita
  la spegne.
- **Il primo giro resta automatico a casa, non a scuola.** A casa la prima battaglia della
  vita la accende da sé (`settings.guideViste`, come il castello). A scuola il profilo muore
  con la pagina, quindi la guida tornerebbe a ogni lezione: si accende solo col `?`, e la
  maestra può dire «toccate il punto di domanda».
- **Il testo non sparisce, si sposta dietro.** Nei giochi con la guida richiamabile il `?`
  non apre più il foglio: lo apre l'ultima riga della guida, con un «📖 tutte le regole» (solo
  a casa, e solo se `AIUTI` ha la voce). Il foglio resta anche nelle guide dei grandi. A
  scuola non c'è: `src/guide/` non entra nella pagina dei bambini
  ([../scuola/architettura.md](../scuola/architettura.md)).
- **Il `?` resta un `?`**: è il tasto che i bambini conoscono già, nello stesso posto. Cambia
  cosa fa, non come si chiama.

## Il pezzo comune

| Dove | Cosa cambia |
|---|---|
| `components/Barra.vue` | prop `come` (sì/no): con `come` il `?` emette `@come` invece di aprire il foglio, e compare anche se `AIUTI` non ha la voce |
| `scuola/sostituti/Barra.vue` | lo stesso `?` con `come`; senza `come` resta come oggi, solo ⏸ |
| `giochi/Guida.vue` | la ✕ (`@spegni`, solo se il gioco la chiede), il passo finale `{ testo, fine: true }` con ✓ e il «📖 tutte le regole» (`@regole`) |
| `giochi/guida.js` | invariato; in più `usaGuidaRichiamata()`: lo stato acceso/spento, chi l'ha accesa (`'primo' \| 'richiamo'`), lo spegnersi dopo il passo finale |

Nel gioco restano solo la funzione pura dei passi e due righe:

```js
const guida = usaGuidaRichiamata({ prima: !aScuola && !guidaGiaVista('arena') })
const passoGuida = computed(() => guida.accesa.value ? guidaDiArena(quadro()) : null)
usaGuida(radice, passoGuida)
```
```html
<Barra come @come="guida.alterna()" … />
<Guida :passo="passoGuida" :spegni="guida.richiamata" @spegni="guida.spegni()" />
```

## Il pilota: Castle Battle

Scelto invece degli Asteroidi: oggi non ha né guida né `?`, ogni cosa da toccare è un pulsante
vero sopra il canvas (piazzole, nuvoletta, anello, ripara e bomba: già bersagli dei test), il
campo sa già stare fermo, e gira uguale a casa e a scuola. Gli Asteroidi hanno i sassi dentro
la scena 3D: l'anello andrebbe disegnato nel 3D (`dove: null` e un segno nella scena), un
lavoro a parte dopo il pilota.

I passi (`giochi/arena/motore/guida.js`, puro, dal quadro della partita):

| Quando | Riga | Anello su |
|---|---|---|
| nessuna caserma, niente aperto | Tocca una piazzola vuota: lì si costruisce | `[data-piazzola]` libera, la prima |
| la nuvoletta aperta | Scegli chi costruire. Il numero è quanto costa in 💎 | `[data-costruisci]` della truppa più economica |
| il calcolo aperto | (tace: il calcolo ha già la sua schermata) | — |
| una caserma, niente aperto | Tocca la tua caserma | `[data-piazzola][data-variante]` |
| l'anello aperto | ⬆️ la fa salire: truppe più forti e più numerose | `[data-anello="potenzia"]` |
| potenziata (o 💎 non bastano) | ✓ Le truppe escono da sole e vanno al castello nemico: abbattilo prima che finisca il tempo | — (fine) |

Il conto sbagliato non rompe niente: il passo dopo si legge di nuovo dallo schermo («tocca
una piazzola vuota» torna finché la caserma non c'è). Il campo sta fermo per tutta la guida
(oggi sta fermo solo col calcolo aperto): si parte con 14 💎, e nella prima tappa arcieri
(6) più un potenziamento (8) ci stanno senza aspettare. Dove la truppa più economica costa
8, il potenziamento non ci sta e la guida finisce dopo la caserma.

A scuola è lo stesso gioco con la stessa guida: la barra della scuola mostra il `?`, la
guida non è automatica, niente «📖 tutte le regole».

## Gli altri giochi, dopo il pilota

1. **Chi ha già la guida del primo giro** (Robot, Passo passo, castello, fattoria,
   sotterraneo): basta `come` sulla barra e `usaGuidaRichiamata`; i passi ci sono già. Il
   Robot e Passo passo hanno la guida legata al primo livello: richiamata altrove indica
   le stesse cose (la fila, ▶) sul livello di adesso.
2. **Asteroidi**: i sassi stanno nel 3D, serve un segno disegnato nella scena.
3. **Gli altri** (Codice Segreto, Conta, Prima e dopo, pozioni, cucina, Survivors, le
   lingue): uno alla volta, ognuno con la sua funzione dei passi.

## Da decidere

- Il `?` che fa partire la guida senza chiedere (la proposta), o un foglio piccolo con un
  grande «▶ Mostrami come si gioca» e sotto il testo? Il foglio è un tocco in più e torna
  il testo davanti; la proposta lo mette in fondo alla guida.
- A scuola la guida solo col `?` (la proposta), o anche da sé alla prima battaglia della
  pagina?

## Nei test

`[data-azione="aiuto"]` (il `?`, con `come` fa partire la guida), `[data-guida-riga]`,
`[data-indicato]`, `[data-guida-spegni]` (la ✕), `[data-guida-fine]` (la riga finale),
`[data-guida-regole]` (il «📖 tutte le regole»).
