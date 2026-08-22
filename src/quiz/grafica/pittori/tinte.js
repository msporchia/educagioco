/* ═══════════════════════════════════════════════════════════════════
   LE TINTE — la tavolozza dei pittori dei quiz.

   Stava dentro `pittori/geometria.js`, ed è uscita il giorno che un
   secondo modulo ha avuto bisogno di disegnare figure colorate: due
   tavolozze quasi uguali sarebbero diventate due tavolozze diverse alla
   prima ritoccata, e in una domanda dove il colore È la regola («i
   colori tornano a turno: rosso, blu») due rossi diversi sono un
   guasto, non una sfumatura.

   IL NOME DELLA TINTA SI LEGGE A VOCE. Non è un'etichetta interna: in
   `indizi` e in `sequenze` finisce dentro il testo della domanda («non
   è rosso», «i colori tornano a turno: rosso, blu»), quindi la
   tavolozza può usare solo parole che un bambino di sei anni ha già.
   C'erano `corallo` e `turchese`, che sono nomi da cartella colori: la
   domanda restava risolvibile guardando le figure, ma chiedeva di
   riconoscere un colore da un nome mai sentito — e nello stesso
   `indizi.js` gli indovinelli sulle cose del mondo dicevano già «sono
   rosso» e «sono arancione». Adesso il vocabolario è uno solo.

   Ogni tinta ha quattro gradazioni: `scuro` e `luce` servono a far
   sembrare un cubo un cubo, `orlo` è quasi bianco perché sul fondo
   scuro della scheda una figura senza contorno chiaro sparisce — e in
   un riquadro di 118 pixel il contorno è metà della leggibilità.
   ═══════════════════════════════════════════════════════════════════ */

export const TINTE = {
  azzurro:   { scuro: '#2f6f9e', base: '#4ea8e8', luce: '#8fd0fb', orlo: '#dcf0ff' },
  verde:     { scuro: '#2e8a5b', base: '#4fbf7e', luce: '#93e5b3', orlo: '#dcffe9' },
  giallo:    { scuro: '#b0921a', base: '#f0cf4a', luce: '#ffe98c', orlo: '#fff8d2' },
  rosso:     { scuro: '#9c3630', base: '#e0524a', luce: '#ff8d84', orlo: '#ffdcd8' },
  viola:     { scuro: '#6a4fa8', base: '#a184e8', luce: '#cbb8ff', orlo: '#eee7ff' },
  arancione: { scuro: '#a55a12', base: '#f0862c', luce: '#ffb571', orlo: '#ffe6cd' },
}

export const COLORI = Object.keys(TINTE)
export const tinta = n => TINTE[n] || TINTE.azzurro

/* il tratteggio dell'asse: ambra, che non è nessuna delle tinte —
   tranne il giallo e l'arancione, e allora si passa al bianco */
export const inchiostroAsse = c => (c === 'giallo' || c === 'arancione' ? '#ffffff' : '#ffd167')
