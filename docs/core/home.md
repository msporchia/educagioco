# La home

In cima la **riga del profilo**, poi **«riprendi da qui»**, il
**carosello** delle copertine e l'**indice** di tutti i giochi. Prima era
una lista di carte larghe, una per gioco: quindici giochi erano cinque
schermate da scorrere, e nessuna diceva «è un gioco». Nastri, Impostazioni,
Come funziona e versione sono rimasti dov'erano.

I file: `src/views/HomeView.vue` mette insieme, `src/components/home/`
disegna (`Riprendi.vue`, `Carosello.vue`, `Copertina.vue`, `scene.js`,
`Iniziale.vue`), `src/views/ProfiloView.vue` è il profilo.

## Lo stile

Pulito, scelto dall'utente fra due proposte («più elegante», non
cartonato): fondo grigio chiarissimo, superfici bianche, pesi 600 e 400,
caratteri piccoli, ombre appena accennate, testo `#1f2433` e grigio
`#7a8193`. Il colore lo mettono le copertine, ognuna sul fondo del suo
gioco (stinte erano più tristi), e il riquadro scuro di «riprendi».
La home parte dall'alto e non si centra: letti i nastri, il centrato
lasciava un vuoto sopra il profilo.

## Il profilo

- **La riga in cima** sostituisce la fila dei nomi e la fascia del
  livello: l'iniziale del bambino in un tondo, nome, titolo e livello, le
  monete. Toccata apre il profilo.
- **L'iniziale** (`Iniziale.vue`) prende il colore dall'id, quindi non
  cambia rinominando; non è un campo del profilo. Il personaggio scelto
  aggiungendo il bambino (`aspetto`) è caricato solo per chi gioca: per
  usarlo anche per gli altri va letto il loro profilo.
- **La pagina profilo**: nome, livello, monete, medaglie (apre l'albo),
  giorni di fila, gli altri bambini (uno tocco e si gioca lui: il watch su
  `state.player` in `App.vue` riporta in home) e «＋ aggiungi un bambino».
- **Aggiungere vuole il codice dei grandi**: il profilo lo chiede con
  `chiediDopoIlCodice('aggiungi')` (`store/pin.js`) e va nelle
  Impostazioni, che appena dentro aprono l'aggiunta di sempre. Uscendo
  senza codice la richiesta si scorda.

## Riprendi da qui

- **È l'ultimo gioco giocato**, letto dal registro delle sessioni
  (`store/sessioni.js`): la voce con l'inizio più recente, con
  `chiaveDelGioco` per i giochi che hanno più chiavi. Una visita sotto i
  cinque secondi non è una sessione, quindi non conta. Si aggiorna appena si
  torna da un gioco: la memoria del registro ha un contatore reattivo
  (`versione`), e rileggere il disco non butta la sessione appena chiusa che
  si sta ancora scrivendo (`unite`).
- **Un gioco spento non si ripropone**, e un bambino nuovo non ha il
  riquadro: senza partite la home parte dal carosello.
- Dice il nome, dove si era arrivati (la stessa riga della copertina) e ha
  un ▶ grande. Su un fondo chiaro il testo diventa scuro.
- **Un gioco con una partita a metà può dire quale** (`ripresa(av)` nel
  manifesto): la riga diventa la sua e la copertina lascia il posto alla sua
  immagine (il sotterraneo: la discesa ritagliata dalla mappa,
  `[data-riprendi] [data-ritaglio]`). Vedi [ripresa.md](ripresa.md).

## Il carosello

- **Tutti i giochi accesi, nell'ordine delle aree** (`AREE` in
  `data/aree.js`). Uno spento non c'è e basta: niente buchi.
- **Apre solo la copertina in mezzo.** Toccare una vicina la porta in
  mezzo; strisciare di lato scorre, e un lancio veloce va un po' più in
  là; su e giù scorre la pagina (`touch-action: pan-y`).
- **Si apre al `click`, non al `pointerup`**: il click che il dito si
  lascia dietro atterrerebbe sulla schermata del gioco appena aperta
  ([il-dito.md](il-dito.md)). Dopo una strisciata quel click si ingoia.
- **La soglia è quella del dito, 16 px**: sotto, il dito è fermo.
- **Il gioco in vista si ricorda** andando e tornando da un gioco (una
  variabile del modulo, non l'archivio): chi esce trova il carosello dove
  l'aveva lasciato. Un ricaricamento riparte dal primo.
- **Il carosello è uno strato a sé** (`isolation: isolate` su `.giro`):
  le copertine hanno uno `z-index` loro, e senza coprivano il foglio
  «cerca aggiornamenti» (lo ha trovato `integrazione/aggiornamento`).

## L'indice

Un'icona per gioco su un tassello quadrato, quella in mezzo cerchiata,
l'ultimo giocato col pallino giallo. Serve a trovare un
gioco senza scorrere: la copertina fa riconoscere, l'indice fa arrivare.
L'icona è il soggetto ritagliato dalla copertina dipinta, o l'emoji per chi
non ce l'ha; il cerchio sta fuori dal tassello perché l'icona lo riempie.
Cinque per riga a 375 px (~61 px l'uno): quindici giochi sono tre righe.

## Le copertine

**La copertina vera è dipinta**: una scena 3:2 del mondo del gioco col
soggetto dentro, niente emoji sopra. Si chiede a Grok in modalità agente
o a ChatGPT quattro per foglio
(`strumenti/sprite/sorgenti/home/PROMPT-copertine.md`), si salva accanto alla
scheda come `copertina-<chiave>` o come foglio elencato in `fogli.json`, e `strumenti/sprite/copertine.py`
la mette in `components/home/copertine-dipinte.js`: la copertina a 528×352
(tre volte la carta), l'icona quadrata ritagliata dal foglietto `icone.json`,
e il `fondo` della carta, che è il colore medio del dipinto. «Riprendi da
qui» mostra l'icona, non il taglio in mezzo della copertina, che a 64 px
perdeva il soggetto.

Finché un gioco non ha la sua, vale quella disegnata in codice: il gioco
porta `copertina: { fondo, disegno, scena }` nel suo manifesto (i giochi
vecchi nella loro riga di `data/giochi.js`); `scena` è uno dei disegni piatti
di `components/home/scene.js`, sopra ci va l'icona grande. Ogni gioco ha un
fondo e una scena sua, da riconoscere a colpo d'occhio, e niente di giallo in
un angolo, né disegnato né dipinto: il sole sembrava il pallino di una
notifica. Senza `copertina` il gioco uscirebbe grigio: `unita/aree` è rosso.

## Nei test

- `[data-azione="profilo"]`: la riga in cima (classe `.fascia`, il nome in
  `[data-nome]`, le monete in `.numeri`); `[data-profilo]` la pagina, il
  nome in `.nome`, gli altri bambini `[data-giocatore="…"]`,
  `[data-azione="aggiungi"]` e `[data-azione="medaglie"]`.
- `.carte`: la home è pronta.
- `.carta.gioco[data-gioco="…"]`: la copertina di un gioco, con `.davanti`
  quella in mezzo; dentro, `b` è il nome e `i` cosa insegna.
- `[data-indice="…"]`: l'icona dell'indice, `.ultimo` sull'ultimo giocato.
- `[data-dipinta]`: l'immagine di una copertina dipinta.
- `[data-riprendi="…"]`: il riquadro «riprendi da qui».
- **Per aprire un gioco dalla home si usa `scegli(page, chiave)`**
  (`test/aiuto/browser.mjs`): indice, poi la copertina in mezzo. Un
  `page.click` su una copertina che non è in mezzo la sposta e basta.
- `integrazione/home` prova col dito vero (CDP): strisciata, vicina,
  indice, apertura, ritorno e «riprendi»; poi il profilo e «aggiungi» col
  codice. Il cambio di bambino lo prova `integrazione/app`.
