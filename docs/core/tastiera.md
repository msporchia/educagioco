# La tastiera

A scuola, sui PC, i giochi si comandano anche dalla tastiera: serve a
imparare a usarla e alla coordinazione occhio-mano, e non toglie niente al
dito. Il codice comune è `src/giochi/tastiera.js` (`usaTasti`) e
`src/components/TastoTastiera.vue`.

- **Solo a scuola.** A casa si gioca col telefono: `giochi/tastiera-accesa.js`
  dice `ACCESA = false`, e la tastiera non fa niente né si vede. La build
  della scuola lo rimpiazza col suo sostituto, che la accende
  ([../scuola/architettura.md](../scuola/architettura.md)).

- **Un tasto fa quello che fa un pulsante**, con gli stessi divieti: un
  pulsante spento non si preme nemmeno dalla tastiera. Niente comandi che
  esistono solo da tastiera.
- **Ogni pulsante dice il suo tasto, sempre**: un tastino disegnato
  nell'angolo (`TastoTastiera`), anche sulle frecce (←) e sui salti (⇧→).
  A scuola i PC hanno la tastiera, quindi non si indovina: provato a
  mostrarli solo con un mouse (`pointer: fine`), e su un portatile con lo
  schermo touch e nelle prove non comparivano.
- **Un tasto tenuto giù non si ripete**: un passo per pressione, come un
  tocco. Ctrl, Alt e ⌘ restano del browser; dentro un campo di testo i tasti
  sono del campo.
- **Il pulsante cliccato col mouse perde il fuoco** quando si usa la
  tastiera: con Invio o Spazio scatterebbe anche lui, due volte la stessa
  cosa.
- **Sotto un foglio o il finale la tastiera tace**: il gioco lo dice con
  `attivo` (negli Asteroidi la pausa comune, in Passo passo il finale e il
  foglio del `?`).
- **Quello che costa monete non ha tasto** (il 💡 di Passo passo): premuto per
  sbaglio le spenderebbe.

Chi ce l'ha: Passo passo ([../passo-passo/regole.md](../passo-passo/regole.md),
«La tastiera»), gli Asteroidi ([../asteroidi/grafica-3d.md](../asteroidi/grafica-3d.md),
«La tastiera»).

Nei test: `[data-tasto-tastiera]` (il tasto scritto), `unita/asteroidi-3d`
(i nomi dei tasti), `integrazione/scuola` (gli Asteroidi e una prova di Passo
passo dalla tastiera); `integrazione/asteroidi-3d` e `integrazione/passo-passo`
controllano che a casa taccia.
