// Il racconto di un turno (docs/sotterraneo/scontro.md, «La vista»): il motore fa tutto dentro `rispondi` e consegna le azioni
// in ordine (`esito.azioni`); qui si rifanno una alla volta, perché chi guarda capisca chi ha fatto cosa a chi. Non calcola
// niente: ogni numero è già nell'azione. Quello che si vede passa da `fx`, un oggetto reattivo che `Scontro.vue` legge:
// le ossa mostrate (le vere sono già scese), chi è caduto, chi scatta e chi prende, i numeri che salgono, il glifo che vola,
// e la fila dei turni che scorre. Un tocco accorcia (`accorcia`); la domanda dopo compare a racconto finito (`fx.attivo`).
import { reactive } from 'vue'

// i tempi, in ms (un mostro ~0,45 s, come da progetto)
export const TEMPI = { eroe: 620, volo: 380, passo: 170, mostro: 450, nota: 300, veleno: 380, bevi: 520, riga: 1100 }
const VELOCE = 6   // quante volte più in fretta, dopo un tocco

const nuovo = () => ({
  attivo: false, veloce: false,
  ossa: {}, morti: {},            // per posto: le ossa mostrate, chi è caduto
  effetto: {},                    // per posto o 'eroe': { tipo, n } (scatta, colpito, protegge…): riavvia l'animazione di quella figura
  numeri: [], voli: [],           // { id, su, testo, tipo } · { id, glifo, tinta, a, ritardo }
  nome: null,                     // l'abilità che l'eroe sta usando { glifo, nome, tinta }
  fila: null,                     // la fila dei turni mentre si racconta (null: quella vera)
  riga: null,                     // la riga d'apertura («Alle spalle!»)
})

export function nuovoRacconto({ suono = () => {}, colpitoEroe = () => {}, finito = () => {} } = {}) {
  const fx = reactive(nuovo())
  let passi = [], i = 0, timer = 0, vel = 1, n = 0

  const reset = () => Object.assign(fx, nuovo())
  const tocca = (chi, tipo) => { fx.effetto[chi] = { tipo, n: ++n } }
  const numero = (su, testo, tipo) => fx.numeri.push({ id: ++n, su, testo, tipo })

  function avanti() {
    if (i >= passi.length) { chiudi(); return }
    const { dopo, fa } = passi[i++]
    timer = setTimeout(() => { fa(); avanti() }, dopo / vel)
  }
  function chiudi() {
    clearTimeout(timer)
    reset()
    finito()
  }
  const ferma = () => { clearTimeout(timer); passi = []; if (fx.attivo) reset() }

  // un tocco: il resto va in fretta (i passi restano, i tempi no)
  function accorcia() {
    if (!fx.attivo || fx.veloce) return
    fx.veloce = true
    vel = VELOCE
    clearTimeout(timer)
    avanti()
  }

  // Racconta le `azioni` di un turno. `campo`: i mostri in campo (gli indici sono i posti); `prima`: com'era prima, le ossa
  // di ognuno e la fila dei turni; `modo(a)`: come colpisce l'eroe in quell'azione { colpisce, lontano, volo }; `riga`: la riga d'apertura
  function racconta({ campo, prima, azioni, modo = () => ({ colpisce: true, lontano: false, volo: null }), riga = null }) {
    ferma()
    reset()
    vel = 1
    passi = []
    i = 0
    const posto = x => (x === 'eroe' ? 'eroe' : campo.indexOf(x))
    const p = (dopo, fa) => passi.push({ dopo, fa })
    p(0, () => {
      fx.attivo = true
      campo.forEach((m, k) => { fx.ossa[k] = prima.ossa[k]; fx.morti[k] = !!prima.morti[k] })
      fx.fila = prima.turni ? prima.turni.map((t, id) => ({ ...t, id })) : null
      fx.riga = riga
    })
    const fineTurno = chi => p(0, () => { if (fx.fila && fx.fila[0] && fx.fila[0].chi === chi) fx.fila = fx.fila.slice(1) })
    const cade = k => p(0, () => { fx.morti[k] = true; if (fx.fila) fx.fila = fx.fila.filter(t => t.chi !== k) })
    // un colpo che arriva su un mostro: scende la barra, sale il numero, trema; se cade, sparisce dopo
    const ferisci = (k, dato, tipo, caduto) => {
      p(0, () => { fx.ossa[k] = Math.max(0, fx.ossa[k] - dato); numero(k, `−${dato}`, tipo); tocca(k, 'colpito') })
      if (caduto) { p(300, () => suono('bottino')); cade(k) }
    }

    for (const a of azioni) {
      if (a.chi === 'eroe') {
        const m = modo(a)
        if (a.che === 'bevi') {
          p(0, () => { fx.nome = null; tocca('eroe', 'cura'); suono('bevuto') })
          p(TEMPI.bevi, () => {})
        } else if (a.che === 'sbaglia') {
          p(0, () => { tocca('eroe', 'vuoto'); if (a.bersaglio) numero(posto(a.bersaglio), 'a vuoto', 'nota'); suono('ahia') })
          p(TEMPI.eroe * 0.7, () => {})
        } else {
          const usata = a.usata
          p(0, () => { fx.nome = usata ? { glifo: usata.glifo, nome: usata.nome, tinta: m.tinta } : null })
          if (!m.colpisce) {
            // uno scudo o una cura non colpiscono: un alone sull'eroe
            p(0, () => tocca('eroe', 'protegge'))
            p(TEMPI.eroe, () => {})
          } else {
            const catena = a.forma === 'catena'
            p(0, () => tocca('eroe', m.lontano ? 'tira' : 'scatta'))
            const tutti = a.colpiti.map((c, k) => ({ c, k, ritardo: catena ? k * TEMPI.passo : 0 }))
            if (m.lontano && m.volo) {
              p(0, () => tutti.forEach(({ c, ritardo }) => fx.voli.push({ id: ++n, glifo: m.volo.glifo, tinta: m.volo.tinta, a: posto(c.chi), ritardo })))
            }
            const arrivo = m.lontano ? TEMPI.volo : TEMPI.passo + 60
            let ora = 0
            for (const { c, ritardo } of tutti) {
              const quando = arrivo + ritardo
              p(quando - ora, () => suono('colpo'))
              ora = quando
              ferisci(posto(c.chi), c.dato, 'dato', c.caduto)
            }
            p(300, () => {})
          }
        }
        p(0, () => { fx.nome = null })
        fineTurno('eroe')
        continue
      }
      // un mostro: veleno che brucia, turno saltato, colpo
      const k = posto(a.chi)
      if (a.che === 'veleno') {
        p(0, () => { numero(k, `−${a.dato}`, 'veleno'); fx.ossa[k] = Math.max(0, fx.ossa[k] - a.dato); tocca(k, 'colpito') })
        if (a.caduto) { p(TEMPI.nota, () => {}); cade(k); fineTurno(k) }
        else p(TEMPI.veleno, () => {})
      } else if (a.che === 'salta') {
        p(0, () => { numero(k, 'stordito', 'nota') })
        p(TEMPI.nota, () => {})
        fineTurno(k)
      } else {
        // il colpo: chi colpisce scatta verso l'eroe, e a metà scatto l'eroe incassa
        p(0, () => tocca(k, 'scatta'))
        p(TEMPI.passo, () => {
          if (a.preso > 0) { numero('eroe', `−${a.preso}`, 'preso'); tocca('eroe', 'colpito'); colpitoEroe(); suono('graffio') }
          else if (a.schivato) numero('eroe', 'schivato', 'nota')
          else if (a.assorbito > 0) { numero('eroe', 'parato', 'nota'); tocca('eroe', 'protegge') }
          else if (a.salvo) numero('eroe', '0', 'nota')
        })
        if (a.rimandato) {
          p(120, () => {})
          ferisci(k, a.rimandato, 'dato', a.caduto)
          p(250, () => {})
        } else p(TEMPI.mostro - TEMPI.passo, () => {})
        fineTurno(k)
      }
    }
    // la riga d'apertura resta un poco anche a colpi finiti; senza colpi (la sorpresa) è tutto quello che si vede
    if (riga) p(azioni.length ? 450 : TEMPI.riga, () => {})
    p(0, () => {})
    fx.attivo = true   // da subito: la domanda non deve comparire fra questa chiamata e il primo passo
    avanti()
  }

  return { fx, racconta, accorcia, ferma }
}
