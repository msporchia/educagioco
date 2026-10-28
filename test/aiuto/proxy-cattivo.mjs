/* ═══════════════════════════════════════════════════════════════════
   UN PROXY CATTIVO DAVANTI AL SERVIZIO VERO

   Un telefono nel browser parla col servizio (wrangler dev) passando
   di qui, e qui la rete si guasta a comando, a livello di TCP come
   succede davvero (docs/core/insieme.md, «Le prove»):
   - `taglia()`     tutti i fili cadono (il browser vede 1006)
   - `buco()`       i fili muoiono in silenzio: niente passa, niente si chiude
   - `spegni(ms)`   niente rete per un po': i fili muoiono, i nuovi non si aprono
   - `ferma(ms)`    tutto resta in coda e poi passa in blocco
   Uno per telefono: `const p = await proxyCattivo(8787)`, poi la pagina
   usa `http://localhost:${p.porta}` come servizio.
   ═══════════════════════════════════════════════════════════════════ */
import net from 'node:net'

export function proxyCattivo(versoPorta, { host = '127.0.0.1' } = {}) {
  const coppie = new Set()                  // { dentro, fuori, morta, coda: { su: [], giu: [] } }
  let spentaFino = 0, fermaFino = 0, timer = null
  const ora = () => Date.now()

  const scrivi = (c, verso, dato) => {
    if (c.morta) return
    if (ora() < fermaFino) { c.coda[verso].push(dato); return }
    ;(verso === 'su' ? c.fuori : c.dentro).write(dato)
  }
  const libera = () => {
    for (const c of coppie) for (const verso of ['su', 'giu']) {
      const d = c.coda[verso]; c.coda[verso] = []
      for (const x of d) if (!c.morta) (verso === 'su' ? c.fuori : c.dentro).write(x)
    }
  }

  const server = net.createServer(dentro => {
    if (ora() < spentaFino) { dentro.destroy(); return }
    const fuori = net.connect(versoPorta, host)
    const c = { dentro, fuori, morta: false, coda: { su: [], giu: [] } }
    coppie.add(c)
    dentro.on('data', d => scrivi(c, 'su', d))
    fuori.on('data', d => scrivi(c, 'giu', d))
    const fine = () => { coppie.delete(c); dentro.destroy(); fuori.destroy() }      // anche un filo morto: se no Node resta acceso
    dentro.on('close', fine); fuori.on('close', fine)
    dentro.on('error', () => {}); fuori.on('error', () => {})
  })

  return new Promise(ok => server.listen(0, host, () => ok({
    porta: server.address().port,
    get fili() { return [...coppie].filter(c => !c.morta).length },
    taglia() { for (const c of coppie) { c.dentro.resetAndDestroy?.() ?? c.dentro.destroy(); c.fuori.destroy() } },
    /* i fili restano aperti ma non passa più niente, né ora né dopo: come un telefono che ha cambiato rete senza dirlo */
    buco() { for (const c of coppie) c.morta = true },
    spegni(ms) { spentaFino = ora() + ms; for (const c of coppie) c.morta = true },
    ferma(ms) { fermaFino = ora() + ms; clearTimeout(timer); timer = setTimeout(libera, ms + 5) },
    chiudi() { for (const c of coppie) { c.dentro.destroy(); c.fuori.destroy() } server.close() },
  })))
}
