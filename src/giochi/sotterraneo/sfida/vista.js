// Il sotterraneo in due visto da Gioco.vue (docs/sotterraneo/in-due-codice.md, «La vista»): la schermata di sempre chiama i
// metodi della discesa (`corsa.vaiVerso`, `corsa.rispondi`, la scena 3D tocca le porte…), e in due quei tocchi devono passare dal lockstep. Qui
// le azioni che la vista chiama diventano mosse da mandare (`manda`), mentre quando le chiama il motore stesso (`corsa.inMotore`,
// sfida/regia.js) restano quelle vere. Quello che il motore risponde arriva dopo, a mossa fatta (`motore.osserva`).
import { Corsa } from '../motore/corsa.js'

// azione → la mossa da mandare (o null: non si manda niente) e cosa rispondere subito alla vista
const AZIONI = {
  vaiVerso: (c, [cella, preciso]) => [cella ? ['vai', cella.x, cella.y, preciso ? 1 : 0] : null],
  rispondi: (c, [giusto]) => [c.chiesta ? ['rispondi', c.chiesta.id, giusto ? 1 : 0] : null, null],
  scendi: () => [['scendi'], null],
  sali: () => [['sali'], null],
  chiudi: () => [['chiudi']],
  riprendi: () => [['riprendi']],
  continua: () => [['continua'], { che: 'continua' }],
  nonAspettoPiu: () => [['nonAspetto']],
  scegliBersaglio: (c, [m]) => { const i = c.foglio && c.foglio.campo ? c.foglio.campo.indexOf(m) : -1; return [i >= 0 ? ['bersaglio', i] : null, i >= 0] },
  // la scelta del colpo: si sa subito se si può (la riga resta accesa), e si manda
  prepara: (c, [id]) => (!id ? [['prepara', ''], true] : c.perchéNonUsi(id) ? [null, false] : [['prepara', id], true]),
  beviNelloScontro: (c, [i]) => { const k = i ?? c.pozioneGiusta(); return [k == null ? null : ['bevi', k], null] },
  beviEnergiaNelloScontro: () => [['beviEnergia'], false],
  usa: (c, [i, dove]) => [['usa', i, dove || ''], null],
  butta: (c, [i]) => [['butta', i]],
  riponi: (c, [dove]) => [['riponi', dove || '']],
  indossaDallaTasca: (c, [i, dove]) => [['indossa', i, dove || ''], null],
  apriLaPergamena: (c, [i]) => [['pergamena', i], { che: 'niente' }],
  impara: (c, [id]) => [['impara', id], false],
  mettiInCasella: (c, [i, id]) => [['casella', i, id || ''], false],
  daiUnPunto: (c, [k]) => [['punto', k], false],
  compraTasca: () => [['tasca'], false],
  riassegnaPunti: () => [['riassegna'], false],
  dimenticaAlbero: () => [['dimentica'], false],
  // in due non si scappa (motore/in-due.js): il tocco non fa niente
  scappa: () => [null, { che: 'niente' }],
}

export function installaLeMosse(corsa, manda) {
  for (const [nome, mossaDi] of Object.entries(AZIONI)) {
    const vero = Corsa.prototype[nome]
    corsa[nome] = function (...argomenti) {
      if (this.inMotore) return vero.apply(this, argomenti)
      const [mossa, risposta] = mossaDi(this, argomenti)
      if (mossa) manda(mossa)
      return risposta
    }
  }
}
