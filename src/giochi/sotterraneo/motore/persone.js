// Gli alleati della discesa (docs/sotterraneo/in-due.md, «I due eroi nella discesa»): quello che è di un eroe (la roba, la vita, dove
// sta, la domanda che ha aperta) sta in una **persona**, e la discesa tiene il mondo e la lista delle persone. Il codice di sempre
// scrive `this.vita`, `this.eroe.x`: sono accessori che vanno alla persona di adesso (`persona`), che da soli è l'unica. Per far fare
// qualcosa a un altro alleato: `corsa.come(i, () => corsa.vaiVerso(c))`. Un campo nuovo dell'eroe va aggiunto qui, o resta del
// mondo e lo vedrebbero tutti (unita/sotterraneo-persone lo controlla).

// quelli del corredo (motore/corredo.js), poi quelli della discesa
export const CAMPI_DELLA_PERSONA = [
  'chiEro', 'io', 'crescita', 'gemme', 'zaino', 'mano', 'mancina', 'corpo', 'collo', 'dito', 'dito2', 'testa',
  'torciaResta', 'torceInScorta', 'avvisi', '_piu', '_piuFirma', '_sempre', '_sempreFirma',
  'vita', 'energia', 'energiaResto', 'vitaPiu', 'manaCammino', 'preparati', 'pronta', 'fiatoUsato',
  'eroe', 'verso', 'guarda', 'strada', 'mira', 'bersaglio', 'stanzaOra', 'camminati',
  'foglio', 'chiesta', 'contaChieste', 'domande', 'giuste',
  'svenimenti', 'svenimentiQui', 'ultimoSvenimento', 'espPresa', 'eventi', 'trovati', 'cureRifiutate', 'cureTrovate',
  'vincoloDelBanco',
]

const METODI = {
  // fa `fai` come l'alleato `i`, e torna a quello di prima
  come(i, fai) {
    const prima = this.persona
    this.persona = this.persone[i]
    try { return fai() } finally { this.persona = prima }
  },
}

// gli accessori sulla classe: il primo campo scritto (nel costruttore del corredo) fa nascere la prima persona
export function conLePersone(Classe) {
  for (const k of CAMPI_DELLA_PERSONA) {
    Object.defineProperty(Classe.prototype, k, {
      configurable: true,
      get() { const p = this.persona; return p ? p[k] : undefined },
      set(v) {
        if (!this.persona) { this.persona = {}; this.persone = [this.persona] }
        this.persona[k] = v
      },
    })
  }
  Object.assign(Classe.prototype, METODI)
}
