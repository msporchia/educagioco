# La fattoria — da fare

Solo voci aperte. Una voce chiusa si cancella: la regola che ne resta va
nel file del suo argomento.

## Sprite che mancano

Il gioco è intero anche senza: chi aspetta usa un ripiego e lo dichiara in
`aspetta` (vedi [sprite.md](sprite.md)). I prompt sono già scritti in
`strumenti/sprite/sorgenti/fattoria/generati/PROMPT-secondo-albero.md`.

- [ ] **Rifare alcuni costumi di Halloween** (fogli `animali_halloween_1` e
      `_2`, vedi [stagioni.md](stagioni.md)). Galline e capre sono due
      fantasmini quasi uguali, e nelle galline che dormono sembrano pecore;
      le pecore sono quasi senza costume; le anatre e gli asini cambiano
      vestito da uno stato all'altro (vampiro, poi strega); l'alpaca è
      diventata grigia come un asino; le api non sono vestite. I prompt
      usati sono nei foglietti.
- [ ] **`merce_parmigiana` — la parmigiana di melanzane**, una teglia vista
      un po' dall'alto, nello stile delle altre merci (`PROMPT-merce.md`).
      Arrivato il pezzo, `parmigiana` in `dati/coltivazioni.js` perde
      `aspetta` e prende `pezzo`; intanto usa l'emoji 🍆.
- [ ] **`animali_3.png` — i ritratti della peschiera** (calmo, mangia,
      pronto…). È un recinto, e si chiede accanto ai recinti, col prato che
      hanno tutti. Arrivato il foglio, `peschiera` in `dati/catalogo.js`
      smette di `aspetta: 'recinto_pesci_calmo'` e prende i suoi `stati`.
- [ ] **`addobbi.png` — fiocco, sciarpa, campanella, mantellina,
      zainetto**, in tre viste ciascuno. È l'unico foglio che vuole anche
      codice: `addosso()` in `scena/tela.js` sa posare solo un'emoji, e va
      insegnato a posare un `pezzo`. Poi le righe in `dati/addobbi.js`
      passano da `emoji` a `pezzo` e perdono `sospeso`; `unita/addobbi`
      pretende un punto per ogni aggancio. Con gli sprite può tornare anche
      il maglione come addobbo pagato col granaio, e con lui la quinta
      uscita di `dati/usi.js`.

## Da provare giocando

- [ ] **Il ritmo dei livelli.** Il premio a gesti (`PER_GESTO = 2`) è un
      conto sulle tabelle: al banco un raccolto rende ⭐6 contro 7, e
      botteghe e mongolfiera dovrebbero riportare la media a quella di
      prima ([chi-chiede.md](chi-chiede.md)). La fila fa produrre di più a
      chi gioca, e quanto non l'ha misurato nessuno. Se la roba nuova
      arriva troppo in fretta, la leva è `PER_GESTO`.
- [ ] **La fila da un posto.** 🪙20 · 40 · 80 · 160 · 320 sono una proposta
      sul rincaro che raddoppia: guardare se il secondo posto lo comprano
      tutti subito (allora 🪙20 è una formalità) e se oltre il terzo ci
      arriva qualcuno. Le leve sono `PRIMO_POSTO` e `RINCARO_DELLA_FILA`
      in `dati/coda.js`.

## Da guardare col dito, su un telefono vero

Fatte e provate dai test, mai giocate col dito: in Chrome girano coi tocchi
simulati.

- [ ] **La fila di una macchina, una bottega, la mongolfiera.**
- [ ] **La camminata**: il cane che aggira la casa invece di attraversarla,
      e chi si accosta quando sulla meta non si può stare
      (`motore/camminata.js`).

## Da migliorare

- [ ] **Dire *cosa* serve, non solo che serve.** Il 💭 sopra cani e gatti è
      generico: un'icona per bisogno (🍖 la pancia, 🎾 il gioco, 🪮 il pelo —
      sono già le `icona` di `BISOGNI` in `dati/bisogni.js`) si legge da
      lontano senza aprire la scheda. Lo stesso per il 🧺 dei campi, che
      potrebbe dire cosa è pronto. I recinti l'hanno già risolto col fumetto
      della merce: il disegno c'è (`chiede` di `Tela` in `scena/tela.js`),
      manca chi gli passi la faccia giusta.
- [ ] **Gli animali dei recinti non camminano.** Un recinto è un disegno che
      cambia stato; per farli girare servirebbe un attore a quattro
      direzioni per specie, cioè un foglio ciascuno. Va bene così, ma è la
      cosa che un bambino chiederà.
- [ ] **L'acqua si vende come disegno, non come acqua.** Laghetto e stagno
      sono pezzi da giardino di due-tre celle. L'acqua vera si dipinge
      (`dipingi`/`spiana` nel motore, `dati/terreni.js`,
      `scena/bordi.js`), e il pennello resta spento in `Gioco.vue` finché il
      pittore non sa raccordare due materie diverse.
- [ ] **Altri modi di spendere monete grosse**: un campo che matura più in
      fretta, un annaffiatoio. Il money pit vive sull'attrezzatura (silos e
      fila ci sono già; gli addobbi sono la spesa piccola).
- [ ] **Il bosco è salvato cella per cella** (`ostacoli` nel salvataggio,
      ~400 voci dopo sei acquisti di terra). Regge; se un giorno si
      comprano decine di piazzole conviene generarlo al volo dalle
      coordinate e salvare solo gli sgomberi.
