// I mostri morti tornano col tempo (docs/sotterraneo/ricomparsa.md): il tempo sono i passi dell'eroe (motore/orologio.js), e il ritorno
// di ognuno è prenotato alla sua morte. Sono metodi di Corsa (`Object.assign(Corsa.prototype, ...)` in fondo a corsa.js); gira in Node.
// Il ritorno vive sul mostro stesso (`torna`, e `morti` per quante volte è già caduto): la sosta lo salva da sé, perché registra
// ogni campo cambiato rispetto al piano appena nato (motore/sosta.js).
import { RICOMPARSA_BASE } from '../dati/mondo.js'
import { tiroDalSeme } from './bottino.js'

// chiave (il guardiano della scala), grosso, caporale, bersaglio di una missione: restano morti
const haUnRuolo = r => !!(r.chiave || r.grosso || r.caporale || r.missione)

// per ogni piano nato (robeDelSeme): i branchi che hanno un capo, e quindi non tornano
const CON_CAPO = new WeakMap()
function branchiConCapo(nate) {
  let b = CON_CAPO.get(nate)
  if (!b) {
    b = new Set(nate.filter(r => r.che === 'mostro' && r.branco && haUnRuolo(r)).map(r => r.branco))
    CON_CAPO.set(nate, b)
  }
  return b
}

// un mostro torna solo se è un mostro qualunque nato col piano: né un ruolo, né nel branco di chi ce l'ha (gli scagnozzi del grosso, i
// caporali dell'anticamera), né nato dopo (un bersaglio, una cosa del bottino)
export function puoTornare(nate, i) {
  const n = nate[i]
  return !!n && n.che === 'mostro' && !haUnRuolo(n) && !(n.branco && branchiConCapo(nate).has(n.branco))
}

export const MetodiDellaRicomparsa = {
  // alla morte di `m`: prenota il ritorno, da BASE a due volte BASE passi, diverso per ogni mostro e ogni volta (niente caso: stessa sequenza
  // per le misure e i test)
  prenotaIlRitorno(m) {
    if (!this.ricomparsa) return
    const i = this.livello.robe.indexOf(m)
    if (i < 0 || !puoTornare(this.robeDelSeme, i)) return
    const morti = (m.morti || 0) + 1
    m.morti = morti
    m.torna = this.passi + RICOMPARSA_BASE * (1 + tiroDalSeme(43, this.seme, this.piano, i, morti))
  },

  // quelli scaduti tornano, se il loro posto non è la stanza dove sta l'eroe e non è in luce; gli altri aspettano il prossimo controllo
  // (a ogni passo camminato, e rientrando in un piano)
  faiTornareIMostri() {
    if (!this.ricomparsa) return
    const L = this.livello.largo
    const mia = this.livello.stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.y))
    this.livello.robe.forEach((m, i) => {
      if (m.che !== 'mostro' || !m.morto || !(m.torna <= this.passi)) return
      const n = this.robeDelSeme[i]
      if (!puoTornare(this.robeDelSeme, i) || this.inLuce(n.y * L + n.x)) return
      if (this.livello.stanzaDi(n.x, n.y) === mia) return
      for (const k of Object.keys(m)) if (!(k in n) && k !== 'morti') delete m[k]   // anche fx, casa, calmo: riparte come uno nuovo
      Object.assign(m, structuredClone(n))
    })
  },
}
