// I mostri grossi: uno in fondo a ogni discesa della storia, uno ogni GROSSO_OGNI piani nell'abisso
// (docs/sotterraneo/grossi.md). Il nome è suo, sta nella stanza della scala e ne porta la chiave, e quando cade
// lascia di sicuro un pezzo raro o meglio più il suo pezzo col nome (dati/pezzi.js, DEI_GROSSI). Dato puro: come
// si disegna (in codice, 2×2 caselle) sta in scena/grossi.js.
// `tipo`: il mostro del bestiario su cui si regge (dati/mostri.js): ossa e attacco di partenza, il rincaro della
// domanda; `ossa` moltiplica le sue ossa, `att` aggiunge al suo attacco. `disegno` e `colori` dicono la figura.
import { MOSTRI } from './mostri.js'
import { DEI_GROSSI } from './pezzi.js'

export const GROSSI = {
  ossuto: { nome: 'Re Ossuto', tipo: 'scheletro', ossa: 1.15, att: 0, disegno: 'scheletro', colori: 'osso',
            pezzo: 'ciondolo-di-ossuto', dice: 'Il re delle ossa vecchie. Scricchiola, ma picchia.' },
  grumo: { nome: 'Grumo', tipo: 'orco', ossa: 1.25, att: 1, disegno: 'bruto', colori: 'verde',
           pezzo: 'mazza-di-grumo', dice: 'Un orco grosso come una porta, con la sua mazza preferita.' },
  fiammetta: { nome: 'Fiammetta', tipo: 'troll', ossa: 1.1, att: 1, disegno: 'melma', colori: 'fuoco',
               pezzo: 'scudo-di-fiammetta', dice: 'Una melma di fuoco: dove passa, i sassi fumano.' },
  zannaverde: { nome: 'Zannaverde', tipo: 'orco', ossa: 1.3, att: 1, disegno: 'ragno', colori: 'ragno',
                pezzo: 'anello-di-zannaverde', dice: 'Un ragno lungo come un carro, con otto zampe e otto occhi.' },
  gorgo: { nome: 'Gorgo', tipo: 'gigante', ossa: 1.15, att: 1, disegno: 'melma', colori: 'acqua',
           pezzo: 'amuleto-di-gorgo', dice: 'Una melma d\'acqua nera che non smette di gorgogliare.' },
  minotto: { nome: 'Minotto', tipo: 'troll', ossa: 1.1, att: 1, disegno: 'bruto', colori: 'corna',
             pezzo: 'giubbone-di-minotto', dice: 'Ha le corna, e la botola è casa sua.' },
  carbonchio: { nome: 'Carbonchio', tipo: 'gigante', ossa: 1.1, att: 1, disegno: 'scheletro', colori: 'brace',
                pezzo: 'martello-di-carbonchio', dice: 'Il re di brace della miniera: le sue ossa sono carbone acceso.' },
}

// chi aspetta in fondo a ogni discesa della storia (la chiave della tappa in dati/campagna.js)
export const GROSSO_DELLA_DISCESA = {
  altare: 'ossuto', cantine: 'grumo', torre: 'fiammetta', gallerie: 'zannaverde',
  cisterna: 'gorgo', labirinto: 'minotto', fondo: 'carbonchio',
}

// nell'abisso uno ogni cinque piani (il 5°, il 10°…), a giro: tornano più forti, perché cresce il piano
export const GROSSO_OGNI = 5
export const GIRO_DELL_ABISSO = ['grumo', 'zannaverde', 'fiammetta', 'ossuto', 'minotto', 'gorgo', 'carbonchio']

// il mostro grosso del piano `piano` (da 0) della tappa, o null: nella storia l'ultimo piano, nell'abisso ogni GROSSO_OGNI
export function grossoDi(tappa, piano) {
  if (!tappa) return null
  if (tappa.abisso) {
    if ((piano + 1) % GROSSO_OGNI) return null
    return GIRO_DELL_ABISSO[(Math.floor((piano + 1) / GROSSO_OGNI) - 1) % GIRO_DELL_ABISSO.length]
  }
  return piano >= tappa.piani - 1 ? GROSSO_DELLA_DISCESA[tappa.chiave] || null : null
}

export function guastiDeiGrossi(campagna = []) {
  const g = []
  for (const [k, x] of Object.entries(GROSSI)) {
    if (!x.nome || !x.dice) g.push(`${k}: senza nome o senza frase`)
    if (!MOSTRI[x.tipo]) g.push(`${k}: si regge su "${x.tipo}", che non è nel bestiario`)
    if (!DEI_GROSSI[x.pezzo]) g.push(`${k}: il suo pezzo "${x.pezzo}" non c'è`)
    if (!(x.ossa >= 1 && x.ossa <= 3)) g.push(`${k}: ossa ×${x.ossa}, fuori da 1..3`)
    if (!['bruto', 'scheletro', 'ragno', 'melma'].includes(x.disegno)) g.push(`${k}: il disegno "${x.disegno}" non c'è`)
  }
  for (const t of campagna) if (!GROSSI[GROSSO_DELLA_DISCESA[t.chiave]]) g.push(`${t.chiave}: in fondo non c'è nessun mostro grosso`)
  for (const k of GIRO_DELL_ABISSO) if (!GROSSI[k]) g.push(`l'abisso chiama "${k}", che non c'è`)
  const pezzi = Object.values(GROSSI).map(x => x.pezzo)
  if (new Set(pezzi).size !== pezzi.length) g.push('due mostri grossi lasciano lo stesso pezzo')
  return g
}
