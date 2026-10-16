// Dove porta un portale che sale (quello fisso del piano e quello della pergamena): l'ultimo posto sicuro toccato. Oggi è il
// villaggio, accanto al gemello; il mondo nuovo potrà scrivere in `avventura.mondo.sicuro` la città o la pietra del viaggio
// toccata per ultima ({ chiave }), e chi lo disegna ci porterà l'eroe; finché non lo sa fare, resta il portale del villaggio.
// docs/sotterraneo/portale-e-sosta.md, «La pergamena del portale»
import { PORTALE } from '../dati/terra-mappa.js'

// `avventura`: quella dell'eroe (cfg.avventure[eroe]). Torna dove si sbuca sulla terra dipinta (`terra`, una cella) e nel
// mondo in 3D (`mondo`, quello che viste/Mondo3d.vue legge in `mondo.dove`), e la chiave del posto
export function ultimoPostoSicuro(avventura) {
  const m = avventura && typeof avventura === 'object' ? avventura.mondo : null
  const s = m && m.sicuro && typeof m.sicuro.chiave === 'string' ? m.sicuro.chiave : null
  return { chiave: s || 'villaggio', terra: [...PORTALE.accanto], mondo: { portale: true, ...(s ? { sicuro: s } : {}) } }
}
