/* ═══════════════════════════════════════════════════════════════════
   LA TERRA DI SOPRA DEL SOTTERRANEO — la maschera e la strada

   La maschera (dove si cammina sulla mappa) è corretta a mano nel
   foglietto, e una cella sbagliata non dà errori: dà una discesa che
   l'eroe non raggiunge mai, o un tocco sull'acqua che non porta da
   nessuna parte. Qui si prova che da casa si arriva a ogni posto, che
   la strada non taglia gli angoli, che la nebbia torna com'era, e che
   il modulo generato è quello del foglietto (si è rilanciato lo
   strumento). docs/sotterraneo/terra-di-sopra.md
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { MASCHERA, CELLA, POSTI, PARTENZA, MINATORE, CARTELLO, LARGO, ALTO, MERCANTI, PORTALE, PERSONAGGI }
  from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { MERCANTI as CHI_VENDE } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { POSTO_DI, LUOGHI } from '../../src/giochi/sotterraneo/dati/terra.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { creaTerra, scopri, nebbiaNuova, nebbiaInCodice, nebbiaDaCodice }
  from '../../src/giochi/sotterraneo/motore/terra.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const [px, py] = PARTENZA.piede
// chi sta fermo non si attraversa: il minatore, i mercanti e chi dà le missioni (Terra.vue li passa a `ostacoli`)
const FERMI = [MINATORE.piede, ...Object.values(MERCANTI).map(m => m.piede), ...Object.values(PERSONAGGI).map(m => m.piede)]
const terra = creaTerra(MASCHERA, { ostacoli: FERMI })
const casa = { x: px, y: py }

/* ── il modulo è quello del foglietto ── */
const fg = JSON.parse(readFileSync(new URL('../../strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json',
  import.meta.url), 'utf8'))
stessaLista('la maschera del gioco è quella del foglietto (rilancia strumenti/sprite/terra-di-sopra.py)',
            MASCHERA, fg.maschera)
stessaLista('e anche i posti', POSTI, fg.posti)
stessaLista('e i mercanti', MERCANTI, fg.mercanti)
stessaLista('e il portale', PORTALE, fg.portale)
stessaLista('e chi dà le missioni', PERSONAGGI, fg.personaggi)
uguale('la maschera copre tutta la mappa, in larghezza', MASCHERA[0].length * CELLA, LARGO)
uguale('e in altezza', MASCHERA.length * CELLA, ALTO)
controlla('solo . e #', MASCHERA.every(r => /^[.#]+$/.test(r) && r.length === MASCHERA[0].length))

/* ── da casa si arriva dappertutto ── */
controlla('si parte da una cella dove si cammina', terra.passa(px, py))
uguale('otto posti: sette discese più l\'abisso', Object.keys(POSTI).length, CAMPAGNA.length + 1)
for (const t of CAMPAGNA)
  controlla(`${t.nome} sta su un posto della mappa`, !!POSTI[POSTO_DI[t.chiave]], POSTO_DI[t.chiave])
controlla('anche l\'abisso', !!POSTI[POSTO_DI.abisso])
uguale('una discesa per posto', new Set(Object.values(POSTO_DI)).size, Object.keys(POSTO_DI).length)
for (const [nome, p] of Object.entries(POSTI)) {
  const [x, y] = p.piede
  controlla(`${nome}: si sta in piedi davanti`, terra.passa(x, y))
  const via = terra.strada(casa, { x, y })
  controlla(`${nome}: da casa ci si arriva`, Array.isArray(via), `${x},${y}`)
  controlla(`${nome}: il minatore sa spiegare dov'è`, !!LUOGHI[nome])
}
/* i mercanti: stanno fermi dove si cammina, ci si arriva da casa, e ci si
   ferma accanto a loro come al minatore (Terra.vue li passa a `ostacoli`) */
{
  const fermi = creaTerra(MASCHERA, { ostacoli: FERMI })
  for (const m of CHI_VENDE) {
    const dove = MERCANTI[m.chiave]
    controlla(`${m.chiave}: ha un posto sulla mappa`, !!dove)
    if (!dove) continue
    controlla(`${m.chiave}: sta su una cella dove si cammina`, creaTerra(MASCHERA).passa(...dove.piede))
    controlla(`${m.chiave}: non gli si passa attraverso`, !fermi.passa(...dove.piede))
    const [ax, ay] = dove.accanto
    controlla(`${m.chiave}: da casa si arriva accanto a lui`, !!fermi.strada(casa, { x: ax, y: ay }), `${ax},${ay}`)
    controlla(`${m.chiave}: accanto vuol dire a due celle, sulla stessa fila`,
              Math.abs(ax - dove.piede[0]) === 2 && ay === dove.piede[1], `${ax},${ay}`)
  }
}
/* la mappa è due pezzi accostati (docs/sotterraneo/terra-di-sopra.md): il villaggio sta nel pezzo di destra, e i
   mercanti stanno ognuno davanti al suo banco. I banchi sono i riquadri in pixel della tela (i riquadri stanno
   qui, non nel foglietto: non sono dati del gioco ma quello che l'occhio vede nell'immagine) */
{
  const A = MASCHERA.length, Lm = MASCHERA[0].length
  uguale('la tela è due pezzi larghi uguali', LARGO, 2048)
  uguale('e la maschera la copre tutta: 64 celle', Lm, 64)
  const fermi = creaTerra(MASCHERA, { ostacoli: FERMI })
  const dist = fermi.raggiungibili(casa)
  const banchi = {              // dove sta il banco, in celle: [colonna, riga] del suo centro
    armaiolo: [41, 40],         // l'incudine sotto la tettoia
    erborista: [50, 41],        // il banco con le boccette e i mazzi d'erbe
    rigattiere: [56, 43],       // il carretto di cianfrusaglie
  }
  for (const [chi, [bx, by]] of Object.entries(banchi)) {
    const [px, py] = MERCANTI[chi].piede
    controlla(`${chi}: sta nel villaggio, a destra della giunta`, px >= 32, `${px},${py}`)
    controlla(`${chi}: accanto al suo banco (a non più di due celle di lato, tre sotto)`,
              Math.abs(px - bx) <= 2 && py >= by && py - by <= 3, `${px},${py} contro ${bx},${by}`)
  }
  /* chi sta fermo non chiude la strada a nessuno: togliendolo, non si raggiunge niente di più. Il rigattiere
     stava in fondo a un passaggio largo una cella fra il carretto e i cespugli, e lo chiudeva */
  for (const [chi, piede] of [['minatore', MINATORE.piede], ...Object.entries(MERCANTI).map(([k, m]) => [k, m.piede]),
                              ...Object.entries(PERSONAGGI).map(([k, m]) => [k, m.piede])]) {
    const senza = creaTerra(MASCHERA, { ostacoli: FERMI.filter(x => x !== piede) })
    const con = fermi.raggiungibili(casa), via = senza.raggiungibili(casa)
    uguale(`${chi}: non chiude la strada (togliendolo si arriva solo dove sta lui)`, via.size - con.size, 1)
  }
  /* il portale gemello: compare con una discesa lasciata a metà, nel villaggio; ci si ferma accanto e lì si
     sbuca risalendo. Non è un ostacolo (Terra.vue non lo passa a `ostacoli`) */
  {
    const [gx, gy] = PORTALE.piede, [ax, ay] = PORTALE.accanto
    controlla('il portale sta nel villaggio, a destra della giunta', gx >= 32, `${gx},${gy}`)
    controlla('su una cella dove si cammina', fermi.passa(gx, gy))
    controlla('e ci si arriva accanto da casa', !!fermi.strada(casa, { x: ax, y: ay }), `${ax},${ay}`)
    controlla('accanto vuol dire a due celle, sulla stessa fila', Math.abs(ax - gx) === 2 && ay === gy)
    controlla('fra i mercanti (a meno di sei celle dal più vicino)',
              Math.min(...Object.values(MERCANTI).map(m => Math.hypot(gx - m.piede[0], gy - m.piede[1]))) < 6)
  }
  // dalla partenza si arriva a ogni cella dove si cammina, tranne dove chi sta fermo le chiude (il piede suo
  // e il tratto stretto dietro al rigattiere) e le tre del vecchio angolo in alto a sinistra
  const chiuse = []
  MASCHERA.forEach((riga, y) => [...riga].forEach((c, x) => { if (x >= 32 && c === '.' && !dist.has(y * Lm + x)) chiuse.push(`${x},${y}`) }))
  stessaLista('nel pezzo di destra ogni cella dove si cammina si raggiunge da casa (tranne i piedi di chi sta fermo)',
              chiuse.sort(), FERMI.filter(([x]) => x >= 32).map(p => p.join(',')).sort())
  // la giunta: il sentiero che esce dal pezzo di sinistra entra in quello di destra senza interrompersi
  const uscita = MASCHERA.map((r, y) => [y, r[31], r[32]]).filter(([, a, b]) => a === '.' && b === '.')
  controlla('il sentiero attraversa la giunta (almeno una riga con terreno su tutti e due i lati)', uscita.length >= 1,
            JSON.stringify(uscita))
  // il fiume si passa solo sul ponte: dalla riva di sinistra a quella di destra c'è strada, ma ogni strada passa dal ponte
  const ponte = [45, 46, 47, 48, 49, 50].map(x => [x, 23])
  controlla('il ponte si cammina', ponte.every(([x, y]) => fermi.passa(x, y)))
  controlla('il fiume no, sopra e sotto il ponte', [[46, 21], [47, 22], [46, 26], [47, 28], [46, 30]].every(([x, y]) => !fermi.passa(x, y)))
  const senzaPonte = creaTerra(MASCHERA.map((r, y) => y === 23 || y === 24
    ? r.slice(0, 45) + '#'.repeat(6) + r.slice(51) : r), { ostacoli: [] })
  controlla('dalla riva di sinistra a quella di destra, senza ponte, non si va',
            senzaPonte.strada({ x: 44, y: 23 }, { x: 52, y: 23 }) === null)
  controlla('col ponte sì', !!fermi.strada({ x: 44, y: 23 }, { x: 52, y: 23 }))
  // la torre e l'altare sono solo disegno: non ci si entra e non ci si cammina sopra
  controlla('la torre in rovina non si attraversa', [[42, 5], [43, 6], [42, 7], [43, 8]].every(([x, y]) => !fermi.passa(x, y)))
  controlla('e nemmeno l\'altare di pietra', [[55, 6], [57, 7], [56, 8], [58, 5]].every(([x, y]) => !fermi.passa(x, y)))
  controlla('ma ci si arriva davanti', fermi.passa(56, 9) && !!fermi.strada(casa, { x: 56, y: 9 }))
  // le case e la piazza
  controlla('le case del villaggio non si attraversano', [[58, 37], [60, 38], [56, 36], [38, 28], [55, 29]].every(([x, y]) => !fermi.passa(x, y)))
  controlla('il pozzo della piazza (quello per bere) non si attraversa', !fermi.passa(47, 36) && !fermi.passa(47, 37))
  controlla('la piazza di terra battuta sì', [[44, 36], [50, 38], [46, 40]].every(([x, y]) => fermi.passa(x, y)))
}
const [cx, cy] = CARTELLO.piede
controlla('al cartello ci si arriva', !!terra.strada(casa, { x: cx, y: cy }))
const [mx, my] = MINATORE.piede
controlla('il minatore sta fermo: non gli si passa attraverso', !terra.passa(mx, my))
const accanto = terra.arrivo(casa, { x: mx, y: my })
controlla('toccandolo in mezzo al prato si va vicino a lui', !!accanto
          && Math.max(Math.abs(accanto.x - mx), Math.abs(accanto.y - my)) === 1, JSON.stringify(accanto))
const [ax, ay] = MINATORE.accanto
controlla('e per parlargli ci si ferma al suo fianco, dove ci si arriva',
          !!terra.strada(casa, { x: ax, y: ay }) && Math.abs(ax - mx) === 2 && ay === my)

/* ── la grande storia: si parte dal villaggio, e le discese sono in fila per strada ──
   docs/sotterraneo/la-grande-storia.md. La partenza e il minatore stanno nel
   pezzo di destra, fra le case; la discesa k è più lontana da casa della k−1;
   l'abisso è il posto più lontano di tutti. */
{
  controlla('si parte nel villaggio, a destra della giunta', px >= 32, `${px},${py}`)
  controlla('e il minatore sta lì', MINATORE.piede[0] >= 32 && Math.hypot(MINATORE.piede[0] - px, MINATORE.piede[1] - py) < 14)
  const dist = terra.raggiungibili(casa)
  const passi = k => dist.get(POSTI[POSTO_DI[k]].piede[1] * MASCHERA[0].length + POSTI[POSTO_DI[k]].piede[0])
  const fila = [...CAMPAGNA.map(t => t.chiave), 'abisso']
  nota('passi da casa: ' + fila.map(k => `${k} ${passi(k)}`).join(' · '))
  for (let i = 1; i < fila.length; i++)
    controlla(`${fila[i]} è più lontana da casa di ${fila[i - 1]}`, passi(fila[i]) > passi(fila[i - 1]),
              `${passi(fila[i])} contro ${passi(fila[i - 1])}`)
  controlla('il pozzo dal tetto rosso non è più una discesa', !POSTI['pozzo-di-casa'])
  for (const [chi, m] of Object.entries(PERSONAGGI)) {
    controlla(`${chi}: sta dove si cammina`, creaTerra(MASCHERA).passa(...m.piede))
    controlla(`${chi}: da casa si arriva accanto a lui`, !!terra.strada(casa, { x: m.accanto[0], y: m.accanto[1] }))
    controlla(`${chi}: accanto vuol dire a due celle, sulla stessa fila`,
              Math.abs(m.accanto[0] - m.piede[0]) === 2 && m.accanto[1] === m.piede[1])
  }
}

/* ── la strada ── */
const lontano = POSTI['pozzo-vecchio'].piede
const via = terra.strada(casa, { x: lontano[0], y: lontano[1] })
let angoli = 0, prima = casa
for (const c of via) {
  const dx = c.x - prima.x, dy = c.y - prima.y
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) angoli += 100
  if (dx && dy && (!terra.passa(prima.x + dx, prima.y) || !terra.passa(prima.x, prima.y + dy))) angoli++
  prima = c
}
uguale('la strada va di cella in cella e non taglia gli angoli', angoli, 0)
const liscia = terra.liscia(casa, via)
controlla('lisciata, gira molte meno volte', liscia.length < via.length / 2, `${liscia.length} su ${via.length}`)
stessaLista('e arriva nello stesso posto', liscia.at(-1), via.at(-1))

// la cisterna è una scala che scende sott'acqua con l'apertura verso sud: ci si arriva da sotto, dalla riva sud
{
  const { piede: [sx, sy], riquadro: [, ry, , rh], ingresso: [, iy, , ih] } = POSTI.stagno
  controlla('la scala sommersa: si sta sulla riva sud, sotto i gradini',
            sy * CELLA >= ry + rh && sy * CELLA >= iy + ih, `${sx},${sy}`)
  const verso = terra.strada(casa, { x: sx, y: sy })
  controlla('e ci si arriva', Array.isArray(verso) && verso.length > 0)
  const celle = [casa, ...verso]
  controlla('la strada non passa mai più a nord del punto d\'arrivo: non gira attorno allo stagno',
            celle.every(c => c.y >= sy), JSON.stringify(celle.find(c => c.y < sy)))
  const ultimo = celle.at(-1), penultimo = celle.at(-2)
  controlla('l\'ultimo passo viene da sotto (o dal fianco, sulla riva), mai dall\'alto', penultimo.y >= ultimo.y,
            `${penultimo.x},${penultimo.y} → ${ultimo.x},${ultimo.y}`)
  // lisciata, la strada resta fuori dall'acqua: ogni segmento si vede dritto passando solo per celle libere
  const lisc = [casa, ...terra.liscia(casa, verso)]
  controlla('lisciata, non taglia dall\'acqua dello stagno', lisc.every(c => c.y >= sy))
}
for (const [nome, p] of Object.entries(POSTI)) {
  const [x, y, w, h] = p.ingresso
  controlla(`${nome}: il cerchietto sta dentro la mappa e attorno al posto`,
            x >= 0 && y >= 0 && x + w <= LARGO && y + h <= ALTO && w > 0 && h > 0
            && x + w > p.riquadro[0] && x < p.riquadro[0] + p.riquadro[2]
            && y + h > p.riquadro[1] && y < p.riquadro[1] + p.riquadro[3])
}

// l'acqua dello stagno: un tocco là in mezzo porta alla riva, non a niente
const acqua = { x: 4, y: 17 }
controlla('nello stagno non si cammina', !terra.passa(acqua.x, acqua.y))
const riva = terra.arrivo(casa, acqua)
controlla('toccando l\'acqua si va alla riva più vicina', !!riva && terra.passa(riva.x, riva.y)
          && Math.hypot(riva.x - acqua.x, riva.y - acqua.y) < 8, JSON.stringify(riva))
stessaLista('toccando un posto raggiungibile si va lì', terra.arrivo(casa, { x: cx, y: cy }), { x: cx, y: cy })

/* ── la nebbia ── */
const L = MASCHERA[0].length, A = MASCHERA.length
const n = nebbiaNuova(L, A)
const nuove = scopri(n, L, A, px + 0.5, py + 0.5, 8)
controlla('attorno a casa si vede', nuove.length > 150 && n[py * L + px] === 1, `${nuove.length}`)
uguale('una cella vista non si scopre due volte', scopri(n, L, A, px + 0.5, py + 0.5, 8).length, 0)
const codice = nebbiaInCodice(n)
uguale('in archivio è corta', codice.length, L * A / 4)
stessaLista('e torna uguale', [...nebbiaDaCodice(codice, L, A)], [...n])
uguale('un codice che non torna è nebbia nuova', nebbiaDaCodice('zz', L, A), null)
{
  // chi giocava quando la mappa era larga 32 celle (384 cifre) ritrova la nebbia dov'era, nel pezzo di sinistra
  const vecchia = new Uint8Array(32 * A)
  for (let y = 30; y < 44; y++) for (let x = 10; x < 24; x++) vecchia[y * 32 + x] = 1
  const nuova = nebbiaDaCodice(nebbiaInCodice(vecchia), L, A)
  controlla('la nebbia della mappa stretta si rimette nel pezzo di sinistra', !!nuova)
  let uguali = true, destra = 0
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    if (x < 32 && nuova[y * L + x] !== vecchia[y * 32 + x]) uguali = false
    if (x >= 32) destra += nuova[y * L + x]
  }
  controlla('cella per cella com\'era', uguali)
  uguale('e il pezzo di destra è tutto nebbia', destra, 0)
  uguale('un codice lungo come quello vecchio ma con cifre che non sono esadecimali è nebbia nuova',
         nebbiaDaCodice('z'.repeat(384), L, A), null)
}

riassunto('la terra di sopra')
