# Lasciare a metà

Uscire dal Codice Segreto non butta via la partita: si ritrova com'era. La
regola comune è in [../core/ripresa.md](../core/ripresa.md); qui quello che
è del gioco. Il formato sta in `src/giochi/codice-segreto/motore/sosta.js`
(`scrivi`, `leggi`, `dice`), la sosta in `profile.campagne.codice.sosta`.

## Cosa si salva

- **Nella tappa**: i codici già vinti (con le monete e le stelle peggiori
  della tappa) e il codice in corso: **il codice segreto stesso**, le righe
  già giocate e la riga a metà. Se uscendo se ne pescasse un altro, uscire
  diventerebbe ripescare; i pallini si rifanno da `confronta`, non si
  scrivono.
- **Nel libero**: la serie in corso (`fila`, quella del record) con
  difficoltà e tema scelti, più il codice in corso come sopra. Uscire **non
  chiude più la serie**: il record si scrive al codice sbagliato, o col
  «lascio perdere» della carta.
- **La serie dell'albo** (`serieCodici`) viaggia nella sosta, così uscire non
  la azzera.

## Cosa non si salva, e perché va bene

- **Un codice appena nato**, senza una casella posata, non è una partita a
  metà: nessuno ha visto niente. Nel libero conta solo se c'è già una serie.
- **Il codice dietro il cartello di fine**: un codice vinto o perso è
  finito. Uscendo col cartello aperto si salva la tappa (vinti, stelle) e al
  rientro il codice è nuovo e pulito; il vinto non si rigioca né si ripaga.
- **Una tappa finita** (o un codice perso nel libero, che chiude la serie)
  toglie la sosta.

## Le monete e le stelle

Le monete si pagano a ogni codice vinto (`addCoins`) e non si ripagano: la
sosta tiene solo il conto della tappa per il cartello finale. Dopo un codice
perso `peggiore` resta 1: uscire non restituisce le tre stelle.

La tappa si porta a casa (`completa`) **appena vinto l'ultimo codice**, non
dopo il respiro prima del cartello: chi esce in quell'attimo non perde le
stelle.

## Come si legge, e quando

- Un salvataggio che non torna (altra `VERSIONE`, tappa sparita, disegno non
  del tema, riga di lunghezza sbagliata, più righe del tabellone, monete
  negative) si butta e la mappa resta com'è. La tappa si ritrova per `chiave`.
- Il gioco non ha un orologio: la partita ripresa nasce com'era, senza velo
  di pausa.
- Si scrive a ogni casella posata o tolta, a ogni codice finito, col ←, su
  `visibilitychange` nascosta e `pagehide`, e in `onBeforeUnmount`.
- Toccare un'altra tappa (o il libero) con una sosta aperta chiede prima;
  «comincio» la butta, e se era un libero ne scrive la serie come record.

Nei test: `[data-ripresa]`, `[data-chiede]`, `[data-azione="riprendi"]`,
`[data-azione="scorda"]`, `[data-azione="comincia"]`,
`[data-azione="riprendi-invece"]`; `test/unita/codice-segreto-sosta.test.mjs`
e `test/integrazione/codice-segreto-sosta.test.mjs`.
