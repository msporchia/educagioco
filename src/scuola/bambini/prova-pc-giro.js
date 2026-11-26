// La prova del computer nel browser (docs/scuola/prova-computer.md): il contatore delle immagini al secondo, le regie che fanno
// giocare ogni gioco mentre si conta (quello che farebbe un bambino nel momento più pieno), e quanto ci mette lo schermo a
// rispondere a un tocco. Le regie usano i ganci dei giochi (`window.__td`, `__estremo`, `__sale`, `__soluzione`, `__shop`,
// `__poz`, `__sotterraneo3d`) e i bersagli dei test; un bersaglio che non c'è non fa niente.

const perc = (v, q) => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(q * o.length))] : 0 }
const pausa = ms => new Promise(r => setTimeout(r, ms))
const dopoIlDisegno = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

/**
 * Le immagini al secondo come le vede chi gioca: gli intervalli fra un requestAnimationFrame e l'altro, scartato il `rodaggio`.
 * → { fps, sotto30 (% oltre 34 ms), fermi (oltre 100 ms), dt95 }. `fermo()` chiude prima.
 */
export function contaFotogrammi({ rodaggio, misura }, fermo = () => false) {
  return new Promise(fatto => {
    const dt = []
    let t0 = 0, prima = 0
    const chiudi = () => {
      const somma = dt.reduce((a, b) => a + b, 0)
      fatto({ fps: somma ? Math.round(1000 * dt.length / somma) : 0, sotto30: Math.round(100 * dt.filter(x => x > 34).length / Math.max(1, dt.length)),
              fermi: dt.filter(x => x > 100).length, dt95: Math.round(perc(dt, 0.95)) })
    }
    const giro = t => {
      if (!t0) t0 = t
      if (fermo()) return chiudi()
      if (t - t0 > rodaggio) { if (prima) dt.push(t - prima); prima = t }
      if (t - t0 > rodaggio + misura) return chiudi()
      requestAnimationFrame(giro)
    }
    requestAnimationFrame(giro)
  })
}

/** Il riposo prima del primo gioco: la pagina dei bambini (25 MB) finisce di prepararsi, e il suo lavoro non entra nella misura del
    primo gioco. Si aspetta mezzo secondo di fotogrammi tutti sotto i 50 ms, fino a `tetto`. */
export async function riposo(tetto = 4000) {
  const t0 = performance.now()
  let calmi = 0, prima = performance.now()
  while (performance.now() - t0 < tetto && calmi < 500) {
    await new Promise(r => requestAnimationFrame(r))
    const ora = performance.now(), dt = ora - prima
    prima = ora
    calmi = dt < 50 ? calmi + dt : 0
  }
}

/* ── i gesti, misurati: dal tocco a quando lo schermo l'ha ridisegnato ── */
function gesti(risposte) {
  const misurato = async fai => { const t0 = performance.now(); fai(); await dopoIlDisegno(); risposte.push(performance.now() - t0) }
  const el = sel => (typeof sel === 'string' ? document.querySelector(sel) : sel)
  return {
    el,
    // un clic su un bersaglio che c'è e non è spento; vero se l'ha fatto
    async tocca(sel) { const e = el(sel); if (!e || e.disabled) return false; await misurato(() => e.click()); return true },
    async tasto(key) {
      await misurato(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
      })
    },
    async tieni(key, ms) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      await pausa(ms)
      window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
    },
    // un tocco del mouse in un punto della pagina, sulla tela che c'è lì: giù e su, come un dito
    async punta(tela, x, y) {
      const c = el(tela)
      if (!c) return false
      const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, isPrimary: true }
      await misurato(() => { c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 })) })
      return true
    },
  }
}

/* ── le regie: cosa fa un bambino in ogni gioco, in giro finché la prova non dice basta ── */
const REGIE = {
  // risponde: la risposta giusta, le tessere da mettere in fila, la pagina dei concetti, il cartello di fine
  async inglese(g, basta) {
    while (!basta()) {
      if (!(await g.tocca('[data-azione="capito"]')) && !(await g.tocca('.ing-opzione[data-giusta]')) &&
          !(await g.tocca('[data-banco] .ing-tessera:not([data-posto])')) && !(await g.tocca('[data-azione="consegna"]')))
        await g.tocca('[data-azione="avanti"]')
      await pausa(800)
    }
  },
  // scrive la fila (tre passi), la manda col ▶ e guarda il coniglio che corre; poi la cancella e ricomincia
  async 'passo-passo'(g, basta) {
    while (!basta()) {
      for (const k of ['ArrowRight', 'ArrowRight', 'ArrowUp']) { await g.tasto(k); await pausa(250) }
      await g.tasto('Enter')
      await pausa(2600)
      for (let i = 0; i < 3; i++) { await g.tasto('Backspace'); await pausa(120) }
      await g.tocca('[data-azione="ricomincia"]')
    }
  },
  // il programma del livello scritto (la sua soluzione), ▶, e il robot che costruisce; finito, si rifà
  async robot(g, basta) {
    while (!basta()) {
      if (g.el('[data-azione="via"]')) { window.__soluzione?.(); await pausa(150); await g.tocca('[data-azione="via"]') }
      await pausa(1500)
      await g.tocca('[data-azione="resta"]')
    }
  },
  // le torri su ogni piazzola (il castello a metà tappa) e le ondate chiamate una dietro l'altra
  async castello(g, basta) {
    window.__estremo?.()
    while (!basta()) {
      if (!(await g.tocca('[data-azione="chiama-prossima"]'))) await g.tocca('[data-azione="chiama-onda"]')
      await pausa(700)
    }
  },
  // la battaglia piena da tutte e due le parti, come a metà partita
  async 'castle-battle'(g, basta) {
    window.__estremo?.()
    while (!basta()) await pausa(500)
  },
  // la folla di fine tappa, e intanto l'eroe che scappa, sale di livello e paga la carta rispondendo
  async survivors(g, basta) {
    window.__estremo?.()
    const frecce = ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown']
    for (let k = 0; !basta(); k++) {
      if (await g.tocca('.qz-tasto[data-giusta]')) { await pausa(600); continue }
      if (await g.tocca('[data-carta]')) { await pausa(600); continue }
      if (g.el('[data-potenzia]')) { await g.tasto('Enter'); await pausa(500); continue }
      window.__sale?.()
      await g.tieni(frecce[k % 4], 700)
    }
  },
  // punta e spara: colpi ed esplosioni
  async asteroidi(g, basta) {
    for (let k = 0; !basta(); k++) { await g.tasto(k % 3 ? 'ArrowRight' : 'ArrowLeft'); await g.tasto('Enter'); await pausa(450) }
  },
  // due ampolle nell'ordine, si paga, il mercante versa; si rifà
  async pozioni(g, basta) {
    while (!basta()) {
      const P = window.__poz
      if (P?.bottega?.value && !P.occupato?.value && !P.bozza.value.length) {
        await gestoMisurato(g, () => { P.aggiungi(0, 0); P.aggiungi(0, 1) })
        await pausa(500)
        await gestoMisurato(g, () => P.ordina())
      }
      await pausa(1200)
    }
  },
  // un panino: il formaggio sul tagliere, il pane, il piatto, la consegna; alla cassa il resto
  async cucina(g, basta) {
    const S = () => window.__shop
    const cella = nome => S().cucina.value.celle.find(q => q.cosa === nome || q.nome === nome || q.tipo === nome)
    const vai = async nome => {
      const k = cella(nome), p = k && window.__cucina3d?.dove(k.id)
      if (!p) return
      await g.punta('[data-tela]', p.x, p.y)
      const t0 = performance.now()
      while (!basta() && performance.now() - t0 < 4000) {
        const c = S().cucina.value
        if (!c.fila.length && !c.strada.length && !c.arrivato && !c.tagliando) break
        await pausa(100)
      }
    }
    while (!basta()) {
      if (!S()?.cliente?.value) { await pausa(300); continue }
      if (g.el('.cassa')) {
        const s = S(), monete = s.scomponi(s.cliente.value.resto, s.cliente.value.monete)
        for (const v of monete) { await gestoMisurato(g, () => s.metti(v)); await pausa(400) }
        await gestoMisurato(g, () => s.proponi())
        await pausa(600)
        continue
      }
      const o = S().coda.value[0]
      if (o) o.articoli[0] = { ...o.articoli[0], emoji: '🥪' }       // un panino col formaggio: i passi qui sotto
      for (const n of ['formaggio', 'tagliere', 'pane', 'tagliere', 'piatti', 'consegna']) { if (basta()) return; await vai(n) }
      await pausa(400)
    }
  },
  // l'eroe scelto cammina un po' (due tocchi sul pavimento), poi va alla cosa più vicina che chiede (una porta, un forziere, un
  // mostro), la tocca e risponde. Il tocco che apre uno scontro costa (la scena del combattimento si prepara): una volta per
  // scontro, non a ogni passo, e con i passi in mezzo non fa da mediana
  async sotterraneo(g, basta) {
    for (let k = 0; !basta(); k++) {
      const eroe = g.el('.sot-eroe[data-eroe]')
      if (eroe) { eroe.click(); await pausa(800); continue }          // la scelta dell'eroe non è un tocco di gioco: non si misura
      if (await g.tocca('.sot-domanda .qz-tasto[data-giusta]')) { await pausa(700); continue }
      await g.tocca('[data-azione="dopo"]')        // il cartello della scala: «resto qui»
      const s = window.__sotterraneo3d, c = s?.corsa, tela = g.el('[data-tela="3d"]')
      if (!c?.livello || c.foglio || !tela) { await pausa(400); continue }
      const b = tela.getBoundingClientRect()
      if (k % 3 !== 2) {
        await g.punta(tela, b.x + b.width * (0.4 + 0.1 * (k % 2)), b.y + b.height * 0.55)
        await pausa(900)
        continue
      }
      const q = versoChiChiede(c)
      if (q) { const [x, y] = s.aSchermo(q.x + 0.5, 0.6, q.y + 0.5); await g.punta(tela, b.x + x, b.y + y) }
      await pausa(1500)
    }
  },
}

// un gesto che non è un clic (i ganci dei giochi): misurato lo stesso, dal gesto al disegno
async function gestoMisurato(g, fai) {
  const t0 = performance.now(); fai(); await dopoIlDisegno()
  g.risposte.push(performance.now() - t0)
}

// la cosa più vicina che chiede, e l'eroe messo a qualche passo (come integrazione/sotterraneo-porte-scale)
function versoChiChiede(c) {
  const liv = c.livello, chiede = r => (r.che === 'porta' && !r.aperta) || (r.che === 'forziere' && !r.aperto) || (r.che === 'mostro' && !r.morto)
  const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const prima = new Map([[da.x + ',' + da.y, null]]), coda = [da]
  for (let i = 0; i < coda.length; i++) {
    const q = coda[i]
    if (liv.robe.some(r => chiede(r) && r.x === q.x && r.y === q.y)) {
      const via = []; for (let k = q.x + ',' + q.y; k; k = prima.get(k)) via.unshift(k.split(',').map(Number))
      const [x, y] = via[Math.max(0, via.length - 4)]
      c.eroe = { x: x + 0.5, y: y + 0.5 }; c.strada = []; c.segnaLaStanza(); c.aggiornaLuce()
      return q
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = q.x + dx, y = q.y + dy
      if (!prima.has(x + ',' + y) && (liv.calpestabile(x, y) || liv.robe.some(r => chiede(r) && r.x === x && r.y === y))) {
        prima.set(x + ',' + y, q.x + ',' + q.y); coda.push({ x, y })
      }
    }
  }
  return null
}

export const GIOCHI_CON_REGIA = Object.keys(REGIE)

/** Fa giocare il gioco finché non si chiama la funzione che torna; la guida «Come si gioca» si chiude e una pausa messa dal gioco
    da sé si toglie. → { ferma(), risposte } (le risposte ai tocchi, in ms) */
export function regia(id) {
  let finito = false
  const risposte = []
  const g = { ...gesti(risposte), risposte }
  const basta = () => finito
  const guardia = setInterval(() => {
    document.querySelector('[data-guida-spegni]')?.click()
    document.querySelector('[data-pausa] [data-azione="riprendi"]')?.click()
  }, 700)
  Promise.resolve().then(() => REGIE[id]?.(g, basta)).catch(() => { /* il gioco è cambiato sotto: la misura resta */ })
  return { ferma() { finito = true; clearInterval(guardia) }, risposte }
}

/** Le risposte ai tocchi in breve: la mediana e la peggiore delle tipiche (95%), in ms; null se non ce n'erano. */
export function rispostaDi(risposte) {
  if (!risposte.length) return null
  return { mediana: Math.round(perc(risposte, 0.5)), p95: Math.round(perc(risposte, 0.95)), tocchi: risposte.length }
}
