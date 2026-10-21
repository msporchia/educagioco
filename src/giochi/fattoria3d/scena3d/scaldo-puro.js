// Il riscaldamento dei modelli: a modelli.js costa costruire e fondere un tipo la PRIMA volta (poi le istanze sono cloni: cache-modelli.js).
// Il primo campo, il primo recinto, la prima gallina si pagherebbero nel momento di posarli: qui si fanno prima, in tempo morto, un
// compito per fotogramma e solo se l'ultimo fotogramma è stato veloce. Senza three e senza DOM, per i test.
// Vedi docs/fattoria3d/scena.md, «Qualità e peso».

/** `compiti`: [{ nome, fai() }] in ordine di urgenza. Un `passo` per fotogramma. */
export function creaScaldo (compiti, { massimoDt = 28, minimoFps = 30, riposoMs = 6 } = {}) {
  const coda = [...compiti]
  let riposo = 0
  const fatti = []
  return {
    get restanti () { return coda.length },
    get fatti () { return fatti },
    /** Si rinuncia a ciò che resta (una macchina che fatica non va caricata di lavoro in più). */
    abbandona () { coda.length = 0 },
    /** Un fotogramma: `dtMs` quanto è durato l'ultimo, `fps` la media (0 = non ancora misurata), `attivo` false se la pagina è nascosta.
        Torna `{ nome, ms }` se ha fatto un compito, altrimenti null. Un compito lungo lascia riposare qualche fotogramma. */
    passo ({ dtMs, fps = 0, attivo = true, ora = () => performance.now() }) {
      if (!coda.length || !attivo) return null
      if (riposo > 0) { riposo--; return null }
      if (dtMs > massimoDt || (fps > 0 && fps < minimoFps)) return null
      const c = coda.shift(), t0 = ora()
      try { c.fai() } catch (e) { /* un modello che non si riscalda si farà alla prima richiesta */ }
      const ms = ora() - t0
      riposo = ms > riposoMs ? Math.min(8, Math.ceil(ms / riposoMs)) : 0
      fatti.push({ nome: c.nome, ms })
      return { nome: c.nome, ms }
    },
  }
}
