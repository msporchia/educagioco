# «Come si gioca»: la guida che si richiama

Approvata dall'utente il 21 novembre 2026, col pilota su Castle Battle. Il pezzo comune sta in
[guida.md](guida.md); qui le regole della guida richiamata e il pilota.

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
  deve anche correre. Riparte quando la guida finisce o la si spegne, e nei passi che hanno
  bisogno del tempo (`aspetta: true`: aspettare i 💎, la caserma che riposa).
- **Si spegne in tre modi**: da sé all'ultimo passo (la riga col ✓ resta qualche secondo e
  sparisce), con la **✕ sulla riga**, o toccando di nuovo il `?`. La ✕ c'è nella guida
  richiamata e in quella che a scuola parte da sé; il primo giro di casa resta senza niente
  da chiudere ([guida.md](guida.md)). Una battaglia finita la spegne.
- **Il primo giro: a casa una volta, a scuola sempre.** A casa la prima battaglia della vita
  la accende da sé, e spenta (finita o con la ✕) non torna più (`settings.guideViste`, come il
  castello; il banco la salta, `giochi/spiegazioni.js`). A scuola parte da sé alla prima
  battaglia della pagina, si salta con la ✕, e il `?` la riaccende (l'utente: «basta che sia
  skippabile, può partire sempre»).
- **Il `?` fa partire la guida subito**, senza un foglio in mezzo (scelta dell'utente). Il
  testo non sparisce, si sposta dietro: nei giochi che hanno una voce in `AIUTI` la riga
  finale della guida porta un «📖 tutte le regole» (solo a casa: `src/guide/` non entra nella
  pagina dei bambini, [../scuola/architettura.md](../scuola/architettura.md)), e il foglio
  resta nelle guide dei grandi. Castle Battle non ha testo, quindi nel pilota il 📖 non c'è:
  si fa col primo gioco che ne ha uno.
- **Il `?` resta un `?`**: è il tasto che i bambini conoscono già, nello stesso posto. Cambia
  cosa fa, non come si chiama.

## Il pezzo comune

| Dove | Cosa cambia |
|---|---|
| `components/Barra.vue` | prop `come` (sì/no): con `come` il `?` emette `@come` invece di aprire il foglio, e compare anche se `AIUTI` non ha la voce |
| `scuola/sostituti/Barra.vue` | lo stesso `?` con `come`; senza `come` resta come oggi, solo ⏸ |
| `giochi/Guida.vue` | la ✕ (`spegnibile`, `@spegni`) e il passo finale `{ testo, fine: true }` col ✓ al posto del 👇 |
| `giochi/guida.js` | `usaGuida` invariato; in più `usaGuidaRichiamata()`: accesa o spenta, se si può spegnere con la ✕, le mosse fatte da quando è accesa (`segna`/`fatto`), lo spegnersi qualche secondo dopo il passo finale |
| `giochi/spiegazioni.js` | `saltaLeSpiegazioni` per i giochi che vanno anche a scuola (il sostituto dice sempre no) |

Nel gioco restano la funzione pura dei passi, il quadro che le si passa e poche righe; il
gioco dice anche quando una mossa è fatta (`guida.segna('costruisci')` alla risposta giusta),
quando una partita nuova azzera le mosse (`guida.daCapo()`) e ferma il campo se il passo non
è `aspetta` né `fine`:

```js
const guida = usaGuidaRichiamata({ prima, saltabile: aScuola, finita: () => segnaGuidaVista(CHIAVE) })
const passoGuida = computed(() => guida.accesa.value ? guidaDiArena(quadro()) : null)
guida.segui(radice, passoGuida)   // usaGuida, e lo spegnersi dopo il passo finale
```
```html
<Barra :come="sulCampo" @come="guida.alterna()" … />
<Guida :passo="passoGuida" :spegnibile="guida.spegnibile.value" @spegni="guida.spegni()" />
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
| nessuna caserma, niente aperto | Tocca una piazzola vuota: lì si costruisce una caserma | `[data-piazzola]` libera, la prima |
| piazzole libere ma 💎 pochi | I 💎 arrivano da soli: aspetta (il campo corre) | `[data-monete]` |
| la nuvoletta aperta | Scegli chi costruire. Il numero è quanto costa in 💎 | `[data-costruisci]` della truppa più economica |
| il calcolo aperto | (tace: il calcolo ha già la sua schermata) | — |
| una caserma, niente aperto | Tocca la tua caserma | `[data-piazzola][data-variante]` |
| l'anello aperto | ⬆️ la fa salire: truppe più forti e più numerose | `[data-anello="potenzia"]` |
| un conto sbagliato al potenziamento | La caserma riposa un attimo: aspetta e riprova (il campo corre, `aspetta`) | la caserma |
| una caserma al livello 1, 💎 pochi per ⬆️ | I 💎 arrivano da soli: aspetta (il campo corre) | `[data-monete]` |
| potenziata (o nessuna caserma da far salire) | ✓ Le truppe escono da sole e vanno al castello nemico: abbattilo prima che finisca il tempo | — (fine) |

Le mosse contano da quando la guida è accesa: richiamata con tre caserme già in piedi, fa
costruire la quarta (se c'è posto e bastano i 💎, se no salta al potenziamento). Il conto
sbagliato non rompe niente: il passo si legge di nuovo dallo schermo («tocca una piazzola
vuota» torna finché la caserma non c'è). Il campo sta fermo per tutta la guida
(oggi sta fermo solo col calcolo aperto), tranne nei passi `aspetta`, che hanno bisogno del
tempo: un conto sbagliato al potenziamento e i 💎 che mancano. Si parte con 14 💎: nella prima
tappa arcieri (6) più un potenziamento (8) ci stanno senza aspettare; dove la truppa più
economica costa 8, la guida fa aspettare i 💎 per il ⬆️ (pochi secondi). Finché il campo non è
pronto (le piazzole non ci sono ancora) la guida tace.

Il `?` c'è solo sul campo e non nella sfida in due (lì il campo non si ferma per uno solo).
A scuola è lo stesso gioco con la stessa guida: la barra della scuola mostra il `?`, la guida
parte da sé e ha la ✕.

## Gli altri giochi, dopo il pilota

1. **Chi ha già la guida del primo giro** (Robot, Passo passo, castello, fattoria,
   sotterraneo): basta `come` sulla barra e `usaGuidaRichiamata`; i passi ci sono già. Il
   Robot e Passo passo hanno la guida legata al primo livello: richiamata altrove indica
   le stesse cose (la fila, ▶) sul livello di adesso.
2. **Asteroidi**: i sassi stanno nel 3D, serve un segno disegnato nella scena.
3. **Gli altri** (Codice Segreto, Conta, Prima e dopo, pozioni, cucina, Survivors, le
   lingue): uno alla volta, ognuno con la sua funzione dei passi.

## Nei test

`[data-azione="aiuto"]` (il `?`, con `come` accende e spegne la guida), `[data-guida-riga]`
(`="fine"` sulla riga finale), `[data-indicato]`, `[data-guida-spegni]` (la ✕). Castle Battle:
`unita/arena-guida` (i passi dal quadro), `integrazione/arena-guida` (il giro col dito, a casa
e col limite della scuola).
