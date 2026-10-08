/* ═══════════════════════════════════════════════════════════════════
   LE EMOJI DEL GIOCO, UNA VOLTA SOLA

   Due cose stanno qui perché le vogliono sia `npm run emoji` sia il
   test: trovare le emoji usate in `src/`, e dire se un font le sa
   disegnare. Il perché e le trappole: docs/core/emoji.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const FONTE = join(RADICE, 'strumenti/emoji/Twemoji.Mozilla.ttf')
export const ELENCO = join(RADICE, 'strumenti/emoji/elenco.json')
export const USCITA_FONT = join(RADICE, 'src/emoji/emoji.woff2')
export const USCITA_CSS = join(RADICE, 'src/emoji/emoji.css')
export const FAMIGLIA = 'Emoji Gioco'

/* ── TROVARE LE EMOJI ── */

/* Un'emoji è una di queste: una bandiera, un tasto (cifra + U+20E3), o un
   pittogramma con il suo selettore (FE0E testo, FE0F emoji) o il tono della
   pelle, che si possono unire con U+200D. */
const EMOJI = /\p{Regional_Indicator}{2}|[0-9#*]️?⃣|\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|[︎️])?(?:‍\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|[︎️])?)*/gu

/* I commenti non disegnano niente: un'emoji che sta solo lì non deve
   costare un glifo, né far scattare il test. Grossolano apposta (non è un
   parser), ma «://» negli indirizzi e le stringhe con «//» in mezzo a un
   testo si salvano. */
export function senzaCommenti (testo, nome) {
  testo = testo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  if (!nome.endsWith('.json')) testo = testo.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
  return testo
}

function* file (cartella) {
  for (const n of readdirSync(cartella).sort()) {
    const p = join(cartella, n)
    if (statSync(p).isDirectory()) yield* file(p)
    else if (/\.(js|mjs|vue|css|html|json)$/.test(n)) yield p
  }
}

const cp = c => c.codePointAt(0)
const esa = c => 'U+' + c.toString(16).toUpperCase()

/* Sopra U+1F000 sono tutti pittogrammi: anche scritti nudi, vogliono il
   colore. Sotto, un carattere come ▶ o ⚠ è testo finché non porta FE0F:
   lo scrive così chi vuole una freccia colorata di un bottone e chi vuole
   la bandierina gialla. */
function eEmoji (seq) {
  const c = [...seq]
  if (c.length > 1) return !(c.length === 2 && c[1] === '︎')
  const n = cp(c[0])
  return n >= 0x1F000 || /\p{Emoji_Presentation}/u.test(c[0])
}

/* Cosa c'è in `src/`: le emoji (sequenze intere), i punti di codice che il
   font deve coprire, e i caratteri che sono emoji in un posto e testo in un
   altro — quelli il font non li sa distinguere, e li decide chi scrive. */
export function trovaEmoji (radice = RADICE) {
  const emoji = new Map()      // sequenza → quante volte
  const testo = new Map()      // carattere da testo (▶) → quante volte
  const dove = new Map()       // carattere → un file in cui sta
  for (const p of file(join(radice, 'src'))) {
    if (p.endsWith('/src/emoji/emoji.css')) continue
    const t = senzaCommenti(readFileSync(p, 'utf8'), p)
    for (const m of t.matchAll(EMOJI)) {
      const s = m[0]
      const mappa = eEmoji(s) ? emoji : testo
      const chiave = mappa === emoji ? s : [...s][0]
      mappa.set(chiave, (mappa.get(chiave) || 0) + 1)
      if (!dove.has(chiave)) dove.set(chiave, p.slice(radice.length + 1))
    }
  }
  const punti = new Set()
  for (const s of emoji.keys()) for (const c of s) punti.add(cp(c))
  const conflitti = []
  for (const c of testo.keys()) if (punti.has(cp(c))) conflitti.push(c)
  return { emoji, testo, punti, conflitti, dove }
}

/* I punti di codice nel formato di `unicode-range`. Le cifre, il # e l'asterisco
   restano fuori: sono dentro i tasti (4️⃣), ma il font non deve prendersi tutte
   le cifre del gioco. */
export function intervalli (punti) {
  const v = [...punti].filter(n => !((n >= 0x30 && n <= 0x39) || n === 0x23 || n === 0x2A)).sort((a, b) => a - b)
  const fuori = []
  for (const n of v) {
    const u = fuori[fuori.length - 1]
    if (u && n === u[1] + 1) u[1] = n
    else fuori.push([n, n])
  }
  return fuori.map(([a, b]) => a === b ? esa(a) : `${esa(a)}-${b.toString(16).toUpperCase()}`).join(',')
}

export function cssDelFont (range) {
  return `/* GENERATO da \`npm run emoji\` — non si modifica a mano (docs/core/emoji.md) */
@font-face {
  font-family: '${FAMIGLIA}';
  src: url('./emoji.woff2') format('woff2');
  font-display: block;
  unicode-range: ${range};
}
`
}

/* ── LEGGERE UN FONT ──
   Quel tanto di sfnt che serve a rispondere «lo disegna?»: la cmap e le
   legature di GSUB (è lì che stanno le famiglie, le bandiere, i tasti).
   Niente forme, niente colori: quelli li giudica l'occhio e Chrome. */
export function leggiFont (buf) {
  const d = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const tabelle = {}
  for (let i = 0; i < d.getUint16(4); i++) {
    const o = 12 + i * 16
    tabelle[String.fromCharCode(...buf.subarray(o, o + 4))] = d.getUint32(o + 8)
  }

  const cmap = new Map()
  const conFE0F = new Set()      // i caratteri che la cmap 14 dichiara «con FE0F è il glifo di sempre»
  {
    const t = tabelle.cmap
    for (let i = 0; i < d.getUint16(t + 2); i++) {
      const o = t + d.getUint32(t + 4 + i * 8 + 4)
      const f = d.getUint16(o)
      if (f === 12) {
        for (let g = 0; g < d.getUint32(o + 12); g++) {
          const r = o + 16 + g * 12
          const a = d.getUint32(r), b = d.getUint32(r + 4), v = d.getUint32(r + 8)
          for (let c = a; c <= b; c++) cmap.set(c, v + c - a)
        }
      } else if (f === 14) {
        for (let r = 0; r < d.getUint32(o + 6); r++) {
          const rec = o + 10 + r * 11
          const sel = (d.getUint8(rec) << 16) | d.getUint16(rec + 1)
          const pred = d.getUint32(rec + 3), nonPred = d.getUint32(rec + 7)
          if (sel !== 0xFE0F) continue
          if (pred) for (let k = 0; k < d.getUint32(o + pred); k++) {
            const q = o + pred + 4 + k * 4
            const a = (d.getUint8(q) << 16) | d.getUint16(q + 1)
            for (let c = a; c <= a + d.getUint8(q + 3); c++) conFE0F.add(c)
          }
          if (nonPred) for (let k = 0; k < d.getUint32(o + nonPred); k++) {
            const q = o + nonPred + 4 + k * 5
            conFE0F.add((d.getUint8(q) << 16) | d.getUint16(q + 1))
          }
        }
      } else if (f === 4) {
        const n = d.getUint16(o + 6) / 2
        const fine = o + 14, inizio = fine + n * 2 + 2, delta = inizio + n * 2, scarto = delta + n * 2
        for (let s = 0; s < n; s++) {
          const e = d.getUint16(fine + s * 2), b = d.getUint16(inizio + s * 2)
          const dl = d.getInt16(delta + s * 2), sc = d.getUint16(scarto + s * 2)
          for (let c = b; c <= e && c < 0xFFFF; c++) {
            let g
            if (sc === 0) g = (c + dl) & 0xFFFF
            else { g = d.getUint16(scarto + s * 2 + sc + (c - b) * 2); if (g) g = (g + dl) & 0xFFFF }
            if (g) cmap.set(c, g)
          }
        }
      }
    }
  }

  const legature = []      // per ogni lookup: Map primo-glifo → [{ componenti, glifo }]
  if (tabelle.GSUB !== undefined) {
    const t = tabelle.GSUB
    const lista = t + d.getUint16(t + 8)
    for (let i = 0; i < d.getUint16(lista); i++) {
      const lk = lista + d.getUint16(lista + 2 + i * 2)
      const mappa = new Map()
      for (let s = 0; s < d.getUint16(lk + 4); s++) {
        let st = lk + d.getUint16(lk + 6 + s * 2)
        let tipo = d.getUint16(lk)
        if (tipo === 7) { tipo = d.getUint16(st + 2); st += d.getUint32(st + 4) }
        if (tipo !== 4) continue
        const cop = st + d.getUint16(st + 2)
        const primi = []
        if (d.getUint16(cop) === 1) for (let g = 0; g < d.getUint16(cop + 2); g++) primi.push(d.getUint16(cop + 4 + g * 2))
        else for (let r = 0; r < d.getUint16(cop + 2); r++) {
          const a = d.getUint16(cop + 4 + r * 6), b = d.getUint16(cop + 6 + r * 6)
          for (let g = a; g <= b; g++) primi.push(g)
        }
        for (let k = 0; k < d.getUint16(st + 4); k++) {
          const ins = st + d.getUint16(st + 6 + k * 2)
          const lista2 = []
          for (let l = 0; l < d.getUint16(ins); l++) {
            const lg = ins + d.getUint16(ins + 2 + l * 2)
            const n = d.getUint16(lg + 2)
            const comp = []
            for (let c = 0; c < n - 1; c++) comp.push(d.getUint16(lg + 4 + c * 2))
            lista2.push({ componenti: comp, glifo: d.getUint16(lg) })
          }
          mappa.set(primi[k], lista2)
        }
      }
      legature.push(mappa)
    }
  }

  function legaIn (glifi) {
    for (const mappa of legature) {
      for (let i = 0; i < glifi.length; i++) {
        for (const l of mappa.get(glifi[i]) || []) {
          if (l.componenti.every((g, j) => glifi[i + 1 + j] === g)) {
            glifi.splice(i, l.componenti.length + 1, l.glifo)
            break
          }
        }
      }
    }
    return glifi
  }

  return {
    punti: new Set(cmap.keys()),
    glifi: cmap.size,
    conFE0F,
    /* Il font disegna questa emoji? Come la vedrebbe Chrome: il selettore FE0F
       lo ingoia il carattere che lo precede (se la cmap 14 lo dice, e se non lo
       dice Chrome scarta il font), poi si cercano le legature. Una base sola
       vuole il suo glifo; una sequenza (famiglia, bandiera, tono) deve
       fondersi in un glifo solo, se no a schermo compaiono i pezzi.
       `senzaCmap14` è per il font intero, che quella tabella non ce l'ha. */
    disegna (seq, { senzaCmap14 = false } = {}) {
      const c = [...seq].map(cp)
      if (senzaCmap14) {
        const basi = c.filter(n => n !== 0xFE0F && n !== 0xFE0E)
        if (basi.length === 1) return cmap.has(basi[0])
        if (!c.every(n => cmap.has(n))) return false
        return legaIn(c.map(n => cmap.get(n))).length === 1
      }
      const glifi = []
      for (let i = 0; i < c.length; i++) {
        if (c[i] === 0xFE0F) {
          if (!conFE0F.has(c[i - 1])) return false
          continue
        }
        if (!cmap.has(c[i])) return false
        glifi.push(cmap.get(c[i]))
      }
      return glifi.length === 1 || legaIn(glifi).length === 1
    },
  }
}
