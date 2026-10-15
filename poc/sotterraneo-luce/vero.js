// Il ponte col gioco vero: una Corsa del motore (src/giochi/sotterraneo/motore/corsa.js) con l'eroe, la roba e la crescita
// che la storia si aspetta a quella discesa (motore/storia.js, come fa il banco), e la sua pianta tradotta nella forma che
// il renderer 3D sa disegnare. Il motore non si copia e non si tocca: qui si legge e basta. Dall'indirizzo:
// tappa 0..6 (la discesa, CAMPAGNA), eroe cavaliere|elfa|mago|nano, seme (dal pannello di prova o dall'indirizzo)
import { markRaw, reactive } from 'vue'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { ROCCIA, PAVIMENTO, PORTA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { conLaStrada } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { nuovoRacconto } from '../../src/giochi/sotterraneo/viste/racconto.js'
import { ROCCIA as R3, PAVIMENTO as P3, OGGETTO } from './mappa.js'

export const DISCESE = CAMPAGNA.map((t, i) => ({ i, nome: t.nome }))
export const CLASSI = EROI.map(e => ({ chiave: e.chiave, nome: e.nome }))

export function corsaDiProva ({ tappa = 0, eroe = 'cavaliere', seme = 7 } = {}) {
  const k = Math.max(0, Math.min(CAMPAGNA.length - 1, Number(tappa) || 0))
  if (!EROI.some(e => e.chiave === eroe)) eroe = 'cavaliere'
  // l'eroe atteso a quella discesa ha già speso i punti abilità sulla strada della sua classe (motore/abilita.js, `conLaStrada`)
  return new Corsa(CAMPAGNA[k], { seme, eroe, roba: robaAttesa(eroe, k), crescita: conLaStrada(crescitaAttesa(eroe, k), eroe) })
}

// lo stato condiviso fra il renderer (main.js) e la sovrimpressione in Vue (Sopra.vue): la corsa (non reattiva: il
// motore è grande e cambia da sé), un contatore che dice «è cambiato qualcosa», e il racconto del turno (viste/racconto.js),
// che la vista vera legge per disegnare e il 3D legge per accendere luci, scintille e scosse
export function nuovoPonte (corsa) {
  const ponte = reactive({ corsa: markRaw(corsa), tic: 0, colpito: false, sotto: 0, bersaglio: null })
  ponte.racconto = markRaw(nuovoRacconto({
    colpitoEroe: () => { ponte.colpito = true; setTimeout(() => { ponte.colpito = false }, 380) },
    finito: () => { ponte.tic++; const f = ponte.dopo; ponte.dopo = null; if (f) f() },
  }))
  return ponte
}

// la pianta della corsa nella forma del renderer: la roccia resta roccia (anche le colonne, che il motore scava come roccia),
// pavimento e porte sono pavimento, relitti e acqua cose che non si attraversano ma la vista ci passa sopra
export function mappaDaCorsa (c) {
  const L = c.livello, W = L.largo, H = L.alto
  const celle = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const v = L.celle[i]
    celle[i] = v === ROCCIA ? R3 : (v === PAVIMENTO || v === PORTA) ? P3 : OGGETTO
  }
  const id = (x, y) => y * W + x
  const pav = (x, y) => x >= 0 && y >= 0 && x < W && y < H && celle[id(x, y)] === P3
  const roccia = (x, y) => x < 0 || y < 0 || x >= W || y >= H || celle[id(x, y)] === R3
  const muri = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!roccia(x, y)) continue
    let tocca = false
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!roccia(x + dx, y + dy)) tocca = true
    if (tocca) muri.push({ x, y })
  }
  // le torce: sui muri a nord delle stanze, una ogni cinque celle circa (il motore non le ha: sono luce del renderer)
  const torce = []
  for (const s of L.stanze) for (let x = s.x + 1; x < s.x + s.w - 1; x += 5) if (roccia(x, s.y - 1) && pav(x, s.y)) torce.push({ x, y: s.y - 1 })
  const arredi = [], bracieri = []
  for (const r of L.robe) {
    if (r.che !== 'arredo' || !r.pezzo) continue
    ;(r.arde ? bracieri : arredi).push({ x: r.x, y: r.y, pezzo: r.pezzo })
  }
  const fonte = L.robe.find(r => r.che === 'fonte')
  return {
    W, H, celle, stanze: L.stanze, muri, colonne: [], torce, bracieri, arredi, mostri: [],
    partenza: { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) },
    fontana: fonte ? { x: fonte.x, y: fonte.y, roba: fonte } : null,
    id, pav, roccia, vera: true,
  }
}

// la figura di un mostro: quella della sua scheda (dati/mostri.js), se no il suo tipo
export const figuraDelMostro = m => (MOSTRI[m.tipo] && MOSTRI[m.tipo].sprite) || m.tipo
