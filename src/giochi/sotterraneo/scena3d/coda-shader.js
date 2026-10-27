// La coda degli shader (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): passi che chiedono programmi a three,
// al più UN programma nuovo per fotogramma e un tetto di ms di JS. Senza KHR_parallel_shader_compile ogni programma ferma il
// telefono 50-250 ms al disegno dopo: una scena intera chiesta in un colpo era un fotogramma di secondi. Pura: niente three.

// Il turno in comune fra le code della pagina (le discese, il mondo di sopra, le anteprime dello zaino: renderer diversi, ma la GPU del
// telefono compila in fila per tutti): un programma nuovo in un fotogramma, chiunque lo chieda. `ultimo`: quando è nato l'ultimo.
export const turno = { ultimo: -Infinity }
export const TURNO = 14   // ms: meno di un fotogramma a 60 Hz, così un fotogramma sì e uno no non si salta
export const turnoLibero = (ora = performance.now()) => ora - turno.ultimo >= TURNO || ora < turno.ultimo
export const segnaTurno = (ora = performance.now()) => { turno.ultimo = ora }

/**
 * `programmi()`: quanti programmi ha il renderer adesso; `ora()`: i ms (performance.now). `tetto`: i ms di JS che un fotogramma
 * può spendere qui; `perFotogramma`: i programmi nuovi dopo cui ci si ferma. Un passo è una funzione: se torna un elenco di
 * passi, quelli vanno in testa alla coda (un passo «la scena» diventa un passo per oggetto).
 */
export function creaCoda({ programmi, ora = () => performance.now(), tetto = 12, perFotogramma = 1 } = {}) {
  const fila = []
  const troppi = []   // i passi che da soli hanno fatto nascere più di un programma (il loro `chi`): dove il picco supera uno
  let picco = 0, fatti = 0, fermi = 0
  return {
    metti(...passi) { fila.push(...passi) },
    svuota() { fila.length = 0; fermi = 0 },
    get quanti() { return fila.length },
    get picco() { return picco },
    get fatti() { return fatti },
    get troppi() { return troppi },
    /** Ferma la coda per `n` fotogrammi (chi ha appena compilato tanto: il fotogramma dopo non ne aggiunge). */
    riposa(n = 1) { fermi = Math.max(fermi, n) },
    /**
     * Un fotogramma di coda: passi finché uno ha fatto nascere un programma, o il tetto è passato. `riposo`: dopo un programma nuovo,
     * quanti fotogrammi saltare (esplorando: uno sì e uno no). Torna { passi, nuovi, ms }.
     */
    passo({ riposo = 0 } = {}) {
      if (fermi > 0) { fermi--; return { passi: 0, nuovi: 0, ms: 0 } }
      if (!fila.length || !turnoLibero(ora())) return { passi: 0, nuovi: 0, ms: 0 }   // un'altra coda ha già compilato in questo fotogramma
      const t0 = ora(), p0 = programmi()
      let n = 0
      while (fila.length) {
        const f = fila.shift()
        let altri = null
        const p1 = programmi()
        try { altri = f() } catch (e) { /* solo un anticipo: il primo uso compila come sempre */ }
        if (Array.isArray(altri) && altri.length) fila.unshift(...altri)
        n++; fatti++
        if (programmi() - p1 > 1 && troppi.length < 20) troppi.push(`${f.chi || '?'} +${programmi() - p1}`)
        if (programmi() - p0 >= perFotogramma || ora() - t0 >= tetto) break
      }
      const nuovi = programmi() - p0, ms = ora() - t0
      if (nuovi > picco) picco = nuovi
      if (nuovi > 0) segnaTurno(ora())
      // un passo che da solo ha passato il doppio del tetto (il JS di un modello grande): il fotogramma dopo resta libero
      if (nuovi > 0 && riposo > 0) fermi = riposo
      else if (ms > 2 * tetto) fermi = 1
      return { passi: n, nuovi, ms }
    },
  }
}

// le cose che three disegna con un programma (i tipi che `renderer.compile` guarda)
const disegnabile = o => o.isMesh || o.isPoints || o.isLine || o.isSprite
// le scelte dell'oggetto che fanno variante insieme al materiale (WebGLPrograms.getParameters): pelle, istanze, morph, tangenti
const chiaveDi = (o, m) => `${m.uuid}|${o.isSkinnedMesh ? 's' : ''}${o.isInstancedMesh ? 'i' : ''}${o.isBatchedMesh ? 'b' : ''}${o.isPoints ? 'p' : ''}` +
  `${o.isLine ? 'l' : ''}${o.isSprite ? 'r' : ''}${o.geometry && o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length ? 'm' : ''}` +
  `${o.geometry && o.geometry.attributes && o.geometry.attributes.tangent ? 't' : ''}${o.instanceColor ? 'c' : ''}`

/**
 * I passi per compilare `radice` un materiale alla volta (e non tutta in un fotogramma): uno per ogni oggetto e materiale non ancora
 * visto (`visti`: le chiavi già fatte, condivise fra più chiamate). `compila(o)` è quella di chi disegna, con le luci della scena; gli
 * si passa un finto contenitore che ha solo l'oggetto (three lo percorre con `traverse`, e cerca le luci in `traverseVisible`), e
 * per una mesh con più materiali un oggetto che ne ha uno solo. Un materiale trasparente a due facce fa due programmi (three
 * compila davanti e dietro): il picco di un passo è due.
 */
export function passiDi(radice, compila, visti = new Set(), { visibili = false } = {}) {
  const passi = []
  radice[visibili ? 'traverseVisible' : 'traverse'](o => {
    if (!disegnabile(o) || !o.material) return
    const tanti = Array.isArray(o.material)
    for (const m of tanti ? o.material : [o.material]) {
      const k = chiaveDi(o, m)
      if (!m || visti.has(k)) continue
      visti.add(k)
      const lui = tanti ? Object.create(o, { material: { value: m } }) : o
      const passo = () => { compila(soloLui(lui, o, m)) }
      passo.chi = nomeDi(o) + ':' + m.type
      passi.push(passo)
    }
  })
  return passi
}
/**
 * I passi per mandare alla scheda le trame che i materiali di `radice` usano (`inizia(t)`: renderer.initTexture), una per passo:
 * il primo disegno di un piano le caricava tutte insieme. `altre`: uniform in comune (la maschera), `viste`: quelle già fatte.
 */
export function passiTrame(radice, inizia, viste = new Set(), altre = null, { visibili = false } = {}) {
  const passi = []
  const metti = t => { if (t && t.isTexture && !t.isRenderTargetTexture && !viste.has(t)) { viste.add(t); passi.push(() => { inizia(t) }) } }
  const daUniform = u => { if (u) for (const k in u) metti(u[k] && u[k].value) }
  daUniform(altre)
  radice[visibili ? 'traverseVisible' : 'traverse'](o => {
    if (!disegnabile(o) || !o.material) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture) metti(v) }
      daUniform(m.uniforms)
    }
  })
  return passi
}

/**
 * I programmi dei materiali di `radice` restano in serbo anche buttandoli: three libera un programma quando si butta l'ultimo materiale
 * che lo usa, e il piano dopo (gli stessi materiali, oggetti nuovi) lo ricompilava da capo, a ogni scala. Il `dispose` del materiale
 * diventa un nulla (come per gli effetti, effetti3d/gestore.js): i programmi sono pochi e sempre gli stessi, il resto lo prende il GC.
 */
export function tieniProgrammi(radice) {
  radice.traverse(o => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m) m.dispose = TIENI })
}
const TIENI = () => {}

// il nome di un oggetto per le misure: il suo e quelli dei genitori, o il tipo
const nomeDi = o => { const n = []; for (let x = o; x && n.length < 3; x = x.parent) if (x.name) n.push(x.name); return n.join('<') || o.type }

// un contenitore finto per `renderer.compile`: percorre solo `o` (non i figli, che hanno un passo loro) e non porta luci; `oggetto` e
// `materiale` per chi invece lo disegna (indice.js, disegnaUno)
export const soloLui = (o, oggetto = o, materiale = o.material) => ({ traverse: f => f(o), traverseVisible() {}, isObject3D: true, oggetto, materiale })
