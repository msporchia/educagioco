/* IL PROGRAMMA PIÙ CORTO — cerca il programma con meno carte che vince
   un posto, con le carte che si hanno in mano (`ripeti` i numeri, `fino`
   i colori, `casa`, `se`). Il risolutore trova la strada più corta in
   frecce; qui si contano le carte, come la quarta stella. Vedi
   docs/passo-passo/sentiero-finale.md.

   Ogni carta nasce nel momento in cui si esegue per la prima volta: il
   programma si scrive mentre il coniglio cammina, e una carta che lo fa
   sbattere taglia via tutti i programmi che cominciano così. Il corpo di
   una scatola si scrive al primo giro e poi resta quello; il numero (o il
   colore) in testa si sceglie alla fine dei giri; quello che sta dentro un
   «se» si scrive la prima volta che il se scatta. In cima alla fila due
   strade che arrivano allo stesso punto con più carte si buttano. */
import { MOSSE } from '../dati/mondo.js'
import { apri, apriSe, carteDi, FINE, VOLTE, CASA } from '../dati/carte.js'
import { mosseDi } from './risolutore.js'
import { esegui, TANA, eErrore, PASSI_MAX, Mondo } from './mondo.js'
import { MondoSvelto, vaBene } from './svelto.js'

const MAX_VOLTE = VOLTE.at(-1)

/* `tetto`: le carte al massimo (il programma trovato ne ha al più tante);
   `carota`: vince solo chi la prende; `scadenza`: un Date.now() oltre il
   quale si smette (torna `finito: false`). Torna { fila, carte, passi }
   del più corto trovato (o `fila: null`), e `finito` se la ricerca è
   arrivata in fondo: allora sotto `carte` (o sotto `tetto + 1`) non c'è
   niente. */
export function cercaProgramma(liv, { carte = liv.carte, tetto = 12, carota = false, scadenza = Infinity,
                                      limite = Infinity, scatolePrima = false } = {}) {
  const frecce = mosseDi(liv)
  for (const m of frecce) if (!MOSSE[m]) throw new Error(`mossa sconosciuta: ${m}`)
  const colori = [...new Set(liv.lastra.filter(Boolean))]
  const numeri = carte.includes('ripeti')
  const fino = carte.includes('fino') ? colori : []
  const casa = carte.includes('casa')
  const conSe = carte.includes('se') && colori.length > 0
  const conRipeti = numeri || fino.length > 0 || casa

  let tettoOra = tetto
  let usate = 0
  let migliore = null
  let conti = 0
  let fermo = false
  const cima = { items: [], chiusa: false }
  const visti = new Map()

  const scrivi = seq => seq.items.flatMap(n => {
    if (n.t === 'm') return [n.m]
    if (n.t === 'se') return n.sub.items.length ? [apriSe(n.c), ...scrivi(n.sub), FINE] : []
    return [apri(n.h != null ? n.h : testaDi(n)), ...scrivi(n.sub), FINE]
  })
  /* una scatola ancora senza testa quando il coniglio arriva: va bene
     qualunque testa che la faccia girare fin lì */
  const testaDi = n => {
    if (numeri && n.g <= MAX_VOLTE) return Math.max(2, n.g)
    const c = fino.find(x => !n.visti.has(x))
    if (c) return c
    return CASA
  }
  function vinto() {
    const fila = scrivi(cima)
    const r = esegui(liv, fila, { eventi: false })
    if (r.esito !== TANA || (carota && !r.carota)) return
    const n = carteDi(fila)
    if (n > tettoOra) return
    migliore = { fila, carte: n, passi: r.passi.length, primo: migliore ? migliore.primo : conti }
    tettoOra = n - 1
  }
  const basta = () => {
    if (fermo) return true
    if (++conti % 4096 === 0 && (Date.now() > scadenza || conti > limite)) fermo = true
    return fermo
  }

  /* esegue `seq` dalla carta `i`, poi chiama `k` con dove si è arrivati */
  function corri(seq, i, w, p, k) {
    if (basta()) return
    if (i < seq.items.length) return carta(seq, i, w, p, k)
    if (seq.chiusa) return k(w, p)
    /* la fila è ancora aperta: o si chiude qui, o ci va un'altra carta */
    if (seq === cima) {
      const key = w.chiave()
      const v = visti.get(key)
      if (v !== undefined && v <= usate) return
      visti.set(key, usate)
    } else if (seq.items.length) {
      seq.chiusa = true
      k(w, p)
      seq.chiusa = false
    }
    if (scatolePrima) { scatola(seq, i, w, p, k); unSe(seq, i, w, p, k); frecceA(seq, i, w, p, k) }
    else { frecceA(seq, i, w, p, k); unSe(seq, i, w, p, k); scatola(seq, i, w, p, k) }
  }
  function frecceA(seq, i, w, p, k) {
    for (const m of frecce) {
      if (usate + 1 > tettoOra || fermo) return
      seq.items.push({ t: 'm', m }); usate++
      carta(seq, i, w, p, k)
      seq.items.pop(); usate--
    }
  }
  /* un se in cima alla fila non serve: o scatta, e la sua carta è di
     troppo, o non scatta e non fa niente */
  function unSe(seq, i, w, p, k) {
    if (!conSe || seq === cima) return
    for (const c of colori) {
      if (usate + 2 > tettoOra || fermo) return
      if (seq.se === c && i === 0) continue
      const sub = { items: [], chiusa: false, se: c }
      seq.items.push({ t: 'se', c, sub }); usate++
      carta(seq, i, w, p, k)
      seq.items.pop(); usate--
    }
  }
  function scatola(seq, i, w, p, k) {
    if (!conRipeti || usate + 2 > tettoOra || fermo) return
    seq.items.push({ t: 'r', h: null, sub: { items: [], chiusa: false }, g: 0, visti: null }); usate++
    carta(seq, i, w, p, k)
    seq.items.pop(); usate--
  }

  function carta(seq, i, w, p, k) {
    const n = seq.items[i]
    const dopo = (w2, p2) => corri(seq, i + 1, w2, p2, k)
    if (n.t === 'm') {
      if (p >= PASSI_MAX) return
      const w2 = w.clona()
      const e = w2.mossa(n.m)
      if (e === TANA) { if (!carota || w2.presa) vinto(); return }
      if (eErrore(e)) return
      return dopo(w2, p + 1)
    }
    if (n.t === 'se') {
      if (w.lastra() === n.c) return corri(n.sub, 0, w, p, dopo)
      return dopo(w, p)
    }
    /* una scatola con la testa già scelta */
    if (n.h != null) {
      if (typeof n.h === 'number') {
        const giro = (g, w1, p1) => (g > n.h ? dopo(w1, p1) : corri(n.sub, 0, w1, p1, (w2, p2) => giro(g + 1, w2, p2)))
        return giro(1, w, p)
      }
      const giro = (w1, p1) => corri(n.sub, 0, w1, p1, (w2, p2) => {
        if (n.h !== CASA && w2.lastra() === n.h) return dopo(w2, p2)
        if (p2 === p1) return
        return giro(w2, p2)
      })
      return giro(w, p)
    }
    /* una scatola nuova: il corpo si scrive al primo giro, e alla fine di
       ogni giro si prova a uscire con la testa che esce lì */
    const giri = new Set([w.chiave()])
    const giro = (g, w1, p1, visti) => {
      n.g = g
      n.visti = visti
      corri(n.sub, 0, w1, p1, (w2, p2) => {
        if (p2 === p1) return
        const key = w2.chiave()
        if (giri.has(key)) return
        const lastra = w2.lastra()
        const h0 = n.h
        if (lastra && fino.includes(lastra) && !visti.has(lastra)) { n.h = lastra; dopo(w2, p2); n.h = h0 }
        if (numeri && g >= 2 && g <= MAX_VOLTE) { n.h = g; dopo(w2, p2); n.h = h0 }
        const ancora = lastra && !visti.has(lastra) ? new Set([...visti, lastra]) : visti
        if ((numeri && g < MAX_VOLTE) || casa || fino.some(c => !ancora.has(c))) {
          giri.add(key)
          giro(g + 1, w2, p2, ancora)
          giri.delete(key)
        }
        n.g = g
        n.visti = visti
      })
    }
    return giro(1, w, p, new Set())
  }

  /* i posti del cane senza massi né salti: il mondo in un numero, cinque volte più svelto */
  corri(cima, 0, vaBene(liv) ? new MondoSvelto(liv) : new Mondo(liv, { eventi: false }), 0, () => {})
  return { fila: migliore ? migliore.fila : null, carte: migliore ? migliore.carte : null,
           passi: migliore ? migliore.passi : null, primo: migliore ? migliore.primo : null, finito: !fermo, conti }
}

/* le domande che il sentiero si fa su un posto con lo zaino: il programma
   più corto con le carte in mano, e se si vince dentro lo zaino senza il
   ciclo, senza il se, senza il «fino a» (sempre arrivando a casa, anche
   senza la carota). `scadenza` in millisecondi per ogni domanda */
export function esamina(liv, { carte = liv.carte, zaino = liv.zaino, ms = 2000, carota = false } = {}) {
  const fra = () => Date.now() + ms
  const minimo = cercaProgramma(liv, { carte, tetto: zaino, carota, scadenza: fra() })
  const senza = via => {
    const r = cercaProgramma(liv, { carte: carte.filter(c => !via.includes(c)), tetto: zaino, scadenza: fra() })
    return { vince: !!r.fila, finito: r.finito, fila: r.fila }
  }
  return {
    minimo,
    senzaCiclo: senza(['ripeti', 'fino', 'casa']),
    senzaSe: carte.includes('se') ? senza(['se']) : null,
    senzaFino: carte.includes('fino') ? senza(['fino']) : null,
  }
}
