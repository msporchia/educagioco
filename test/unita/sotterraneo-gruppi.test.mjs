/* Lo scontro a gruppi (docs/sotterraneo/scontro.md): uno contro tanti, a turni, con l'iniziativa.

   Chi entra (il raggio, sei posti, il grosso ne vale due, nessun rinforzo), chi parte (l'agguato, la sorpresa), la fila dei
   turni (l'ordine, la parità all'eroe, il doppio turno), il bersaglio, il turno dell'eroe (giusto parte, sbagliato a vuoto,
   bere costa il turno), il colpo dei mostri che non dipende dalla risposta, le quattro forme dei colpi (con abilità finte),
   gli effetti contati nei turni di chi li porta, le abilità riscritte, la fuga a costo fisso, lo stop sulla somma dei colpi,
   la caratteristica per ramo, l'esperienza e il bottino, la sosta a metà di uno scontro.
   `node test/esegui.mjs sotterraneo-gruppi --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { NODI, FATTORE_DEL_SALTO } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { sogliaDi, ATT_PER_PUNTO } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { COLPO_DEL_MOSTRO, RAGGIO_SCONTRO, MOSTRI_IN_CAMPO, CALMA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { nuovaFila, chiAgisce, agisci, togli, prossimi, primaDelSuoProssimo } from '../../src/giochi/sotterraneo/motore/turni.js'
import { postiDi, velocitaDel } from '../../src/giochi/sotterraneo/motore/scontro.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// stanze lisce: niente relitti né nicchie (hanno il loro test, `sotterraneo-piani`), o uno sulla riga dell'eroe cambia la strada dei mostri
Livello.prototype.piazzaIRelitti = function () {}
Livello.prototype.scavaLeNicchie = function () {}

const roba = (mano = null, mancina = null) => ({ v: 1, gemme: 0, zaino: [], mano, mancina, corpo: null, dito: null, torcia: 0, torce: 0 })
// (con l'intelligenza messa: le abilità alte costano 8, 11 e 16, e senza il cavaliere e il nano (10 di energia) non le pagano: qui si prova cosa fanno)
const conAlbero = (livello, albero, altro = {}) =>
  ({ esp: sogliaDi(livello), albero, intelligenza: Math.min(5, livello - 1), caselle: Object.keys(albero).filter(id => !NODI[id].sempre).slice(0, 3), ...altro })

/* Una scena: una stanza larga della tappa 5 (seme 11), senza i mostri del piano, l'eroe a sinistra e i mostri messi a mano,
   ognuno con la sua distanza (dx, dy) dall'eroe. Tutti sveglia e veloci come l'eroe (a parità tocca all'eroe: un turno per
   uno), con le ossa e l'attacco che si dicono. */
function scena({ eroe = 'cavaliere', mano = 'spada', mancina = null, crescita = null, mostri = [], tutti = {} } = {}) {
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), eroe, roba: roba(mano, mancina), crescita })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true   // quelli del piano non ci sono (e gli indici restano)
  c.vitaPiu += 60   // tanta vita, o lo stop del pericolo si metterebbe in mezzo a ogni prova
  c.vita = c.vitaMax
  const st = c.livello.stanze.reduce((a, b) => (b.w > a.w ? b : a))
  c.eroe = { x: st.x + 0.5, y: st.y + 1.5 }
  c.verso = { dx: 1, dy: 0 }
  const fatti = mostri.map(d => {
    const m = c.livello.mostro(d.tipo || 'goblin', st.x + d.dx, st.y + 1 + (d.dy || 0))
    Object.assign(m, { ossa: 40, ossaMax: 40, att: 5, dif: 0, velocita: c.velocita, sveglio: true, stati: null }, tutti)
    const { dx, dy, tipo, ...resto } = d
    Object.assign(m, resto)
    c.livello.robe.push(m)
    return m
  })
  return { c, st, m: fatti }
}
const colpoDi = (c, m) => Math.max(1, Math.round(COLPO_DEL_MOSTRO * (m.att - c.dif)))

/* ══════════ 1. la fila dei turni (pura) ══════════ */
{
  const E = { id: 'eroe', lato: 'eroe', velocita: 10 }, A = { id: 'A', lato: 'mostri', velocita: 8 }, B = { id: 'B', lato: 'mostri', velocita: 5 }
  stessaLista('ordine: chi aspetta meno agisce prima, a parità l\'eroe', prossimi(nuovaFila([E, A, B])), ['eroe', 'A', 'eroe', 'B', 'A', 'eroe', 'A'])
  stessaLista('anche se l\'eroe sta dopo nell\'array', prossimi(nuovaFila([B, A, E]), 4), ['eroe', 'A', 'eroe', 'B'])
  // il doppio turno nasce da sé: un eroe veloce più del doppio gioca due volte prima del mostro
  const veloce = nuovaFila([{ ...E, velocita: 24 }, { id: 'M', lato: 'mostri', velocita: 10 }])
  stessaLista('doppio turno', prossimi(veloce, 7), ['eroe', 'eroe', 'M', 'eroe', 'eroe', 'M', 'eroe'])
  // la sorpresa e il primo tiro: il primo turno arriva prima di tutta la fila
  const prima = nuovaFila([{ ...E, velocita: 5, fatti: -1 }, { id: 'M', lato: 'mostri', velocita: 50 }])
  uguale('con il primo turno a tempo zero gioca prima anche di un mostro velocissimo', chiAgisce(prima).id, 'eroe')
  stessaLista('e poi si va di iniziativa', prossimi(prima, 4), ['eroe', 'M', 'M', 'M'])
  // chi cade esce dalla fila, e i colpi prima del prossimo turno dell'eroe
  const f = nuovaFila([E, A, B])
  stessaLista('chi arriva prima del prossimo turno dell\'eroe', primaDelSuoProssimo(f, 'eroe'), ['A'])
  stessaLista('tolto A, resta B', prossimi(togli(f, 'A'), 3), ['eroe', 'eroe', 'B'])
  stessaLista('un\'azione fa aspettare', prossimi(agisci(f, 'eroe'), 3), ['A', 'eroe', 'B'])
  stessaLista('da solo, nessuno prima', primaDelSuoProssimo(nuovaFila([E]), 'eroe'), [])
}

/* ══════════ 2. chi entra ══════════ */
{
  // entrano tutti quelli entro il raggio, anche chi dorme; chi è lontano no
  const { c, m } = scena({ mostri: [{ dx: 1 }, { dx: 2, dy: 1 }, { dx: 3, sveglio: false }, { dx: 6 }] })
  c.scontro(m[0])
  const f = c.foglio
  uguale('in campo sono i tre vicini', f.campo.length, 3)
  controlla('il quarto è oltre il raggio e resta fuori', !f.campo.includes(m[3]) && Math.hypot(6, 0) > RAGGIO_SCONTRO)
  controlla('chi dormiva si sveglia', m[2].sveglio === true)
  uguale('il bersaglio è chi ha aperto lo scontro', f.chi, m[0])
  stessaLista('nell\'ordine della distanza', f.campo.map(x => x.x), [...f.campo.map(x => x.x)].sort((a, b) => a - b))
  // nessun rinforzo: quello lontano non si unisce mai, e lo scontro finisce quando cadono i tre
  m[3].sveglio = true
  for (let i = 0; i < 80 && c.foglio; i++) { f.campo.forEach(x => { x.ossa = Math.min(x.ossa, 1) }); c.rispondi(true) }
  uguale('lo scontro è chiuso anche se uno è rimasto fuori', c.foglio, null)
  controlla('il lontano è intatto', !m[3].morto && m[3].ossa === 40)
}
{
  // i morti non entrano; il più vicino a chi ha aperto non è per forza il primo dell'array
  const { c, m } = scena({ mostri: [{ dx: 1 }, { dx: 2, morto: true }, { dx: 2, dy: -1 }] })
  c.scontro(m[0])
  uguale('un morto non entra', c.foglio.campo.length, 2)
}
{
  // al più sei: se il raggio ne prende di più, i sei più vicini
  const posti = [[1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [4, 1], [3, -1]]
  const { c, m } = scena({ mostri: posti.map(([dx, dy]) => ({ dx, dy })) })
  c.scontro(m[0])
  const campo = c.foglio.campo
  uguale('sei in campo', campo.length, MOSTRI_IN_CAMPO)
  const d = x => Math.hypot(x.x - Math.floor(c.eroe.x), x.y - Math.floor(c.eroe.y))
  const fuori = m.filter(x => !campo.includes(x))
  controlla('sono i sei più vicini', Math.max(...campo.map(d)) <= Math.min(...fuori.map(d)),
            `${Math.max(...campo.map(d))} contro ${Math.min(...fuori.map(d))}`)
}
{
  // il grosso vale due posti: con lui, un mostro in meno
  const { c, m } = scena({ mostri: [{ dx: 1 }, { dx: 1, dy: 1, grosso: 'grumo', tipo: 'orco' }, { dx: 2 }, { dx: 2, dy: 1 }, { dx: 3 }, { dx: 3, dy: 1 }] })
  uguale('il grosso occupa due posti', postiDi(m[1]), 2)
  c.scontro(m[0])
  const campo = c.foglio.campo
  uguale('con il grosso i posti sono sei: cinque mostri', campo.length, 5)
  uguale('il sesto resta fuori', campo.includes(m[5]), false)
  uguale('e i posti occupati sono sei', campo.reduce((n, x) => n + postiDi(x), 0), MOSTRI_IN_CAMPO)
}

/* ══════════ 3. chi parte ══════════ */
{
  // l'agguato: arriva dalla metà dietro il verso dell'eroe, colpisce solo lui, una volta, prima di tutto
  const { c, m } = scena({ mostri: [{ dx: 1 }, { dx: 2 }] })
  c.eroe.x += 3   // il mostro 0 sta dietro (l'eroe guarda a destra)
  c.scontro(m[0])
  controlla('è un agguato', c.foglio.agguato === true)
  const e = c.foglio.apertura[0]
  controlla('il primo evento è il suo colpo', e && e.agguato && e.chi === m[0] && e.preso === colpoDi(c, m[0]), JSON.stringify(e && e.preso))
  uguale('l\'altro mostro non ha colpito per l\'agguato', c.foglio.apertura.filter(x => x.agguato).length, 1)
  controlla('la vita è scesa di quel colpo almeno', c.vita <= c.vitaMax - colpoDi(c, m[0]))
}
{
  // davanti non è un agguato; di lato (perpendicolare) neanche
  const { c, m } = scena({ mostri: [{ dx: 2 }] })
  c.scontro(m[0])
  uguale('davanti: niente agguato', c.foglio.agguato, false)
  const s2 = scena({ mostri: [{ dx: 1, dy: 1 }] })
  s2.c.eroe.x += 1
  s2.c.eroe.y -= 1
  s2.c.verso = { dx: 1, dy: 0 }
  s2.c.eroe.x = s2.m[0].x + 0.5   // stessa colonna: il mostro è sotto, perpendicolare al verso
  s2.c.scontro(s2.m[0])
  uguale('perpendicolare: niente agguato', s2.c.foglio.agguato, false)
}
{
  // arrivando davvero: il mostro sveglio che raggiunge l'eroe da dietro, col passo
  const { c, m } = scena({ mostri: [{ dx: 1 }] })
  c.eroe.x += 4   // il mostro è tre celle e mezza dietro, l'eroe guarda a destra
  c.verso = { dx: 1, dy: 0 }
  for (let i = 0; i < 60 && !c.foglio; i++) c.passo(0.05)
  controlla('un mostro che ti raggiunge da dietro apre lo scontro con un agguato', c.foglio && c.foglio.che === 'scontro' && c.foglio.agguato === true)
  void m
}
{
  // la sorpresa: tocchi tu un mostro che dorme, e il tuo primo turno arriva prima di tutto
  const dorme = scena({ mostri: [{ dx: 1, sveglio: false, velocita: 100 }] })
  dorme.c.interagisci(dorme.m[0])
  controlla('è una sorpresa', dorme.c.foglio.sorpresa === true)
  uguale('nessuno ha agito prima di te', dorme.c.foglio.apertura.length, 0)
  uguale('e tocca a te', dorme.c.foglio.turni[0].chi, 'eroe')
  // un mostro sveglio e velocissimo, toccato, agisce prima
  const sveglio = scena({ mostri: [{ dx: 1, velocita: 30 }] })
  sveglio.c.interagisci(sveglio.m[0])
  uguale('sveglio: niente sorpresa', sveglio.c.foglio.sorpresa, false)
  controlla('e agisce prima di te', sveglio.c.foglio.apertura.length > 0)
}

/* ══════════ 4. il turno dell'eroe ══════════ */
{
  // il bersaglio: lo stesso se è in piedi, se no il più ferito in proporzione; si può cambiare
  const { c, m } = scena({ mostri: [{ dx: 1, ossa: 1 }, { dx: 2, ossa: 4, ossaMax: 10 }, { dx: 2, dy: 1, ossa: 9, ossaMax: 10 }] })
  c.scontro(m[0])
  uguale('all\'inizio è chi ha aperto lo scontro', c.foglio.chi, m[0])
  controlla('cambiarlo si può', c.scegliBersaglio(m[2]) && c.foglio.chi === m[2])
  uguale('un mostro che non è in campo non si sceglie', c.scegliBersaglio({ ...m[0] }), false)
  c.scegliBersaglio(m[0])
  c.rispondi(true)
  uguale('caduto il bersaglio, passa al più ferito in proporzione', c.foglio.chi, m[1])
  c.scegliBersaglio(m[2])
  c.rispondi(true)
  uguale('se è ancora in piedi resta lo stesso', c.foglio.chi, m[2])
}
{
  // giusto parte, sbagliato va a vuoto (e l'abilità resta pronta e non costa); una domanda per turno
  const { c, m } = scena({ eroe: 'mago', mano: 'verga', crescita: conAlbero(4, { 'dardo-di-fuoco': 1 }), mostri: [{ dx: 1, ossa: 100, ossaMax: 100 }, { dx: 2, ossa: 100, ossaMax: 100 }] })
  c.scontro(m[0])
  const id = c.chiesta.id
  c.prepara('dardo-di-fuoco')
  const energia = c.energia
  c.rispondi(false)
  uguale('sbagliato: nessun mostro è stato toccato', m[0].ossa + m[1].ossa, 200)
  controlla('l\'abilità resta pronta e non costa', c.pronta === 'dardo-di-fuoco' && c.energia === energia)
  uguale('una domanda per turno: la successiva è una sola', c.chiesta.id, id + 1)
  const solito = c.colpo(m[0], NODI['dardo-di-fuoco'])
  c.rispondi(true)
  uguale('giusto: parte il colpo dell\'abilità sul bersaglio', 100 - m[0].ossa, solito)
  uguale('e solo su di lui', m[1].ossa, 100)
  uguale('e si paga', c.energia, energia - NODI['dardo-di-fuoco'].costo)
}
{
  // bere la pozione rossa costa il turno: i mostri colpiscono; la blu no
  const { c, m } = scena({ mostri: [{ dx: 1 }, { dx: 2 }] })
  c.scontro(m[0])
  c.vita = c.vitaMax - 8
  c.zaino = ['pozione-piccola']
  const prima = c.vita
  const cura = c.curaDi('pozione-piccola')
  const e = c.beviNelloScontro()
  uguale('bevuta', e.che, 'bevuto')
  uguale('la vita sale della cura e scende dei colpi di entrambi i mostri', c.vita, Math.min(c.vitaMax, prima + cura) - colpoDi(c, m[0]) - colpoDi(c, m[1]))
  uguale('nessun mostro è stato toccato', m[0].ossa + m[1].ossa, 80)
  uguale('senza pozioni non si beve', c.beviNelloScontro(), null)
  c.zaino = ['pozione-blu']
  c.energia = 0
  const v = c.vita
  c.usa(0)
  controlla('la blu non costa il turno', c.vita === v && c.energia > 0)
}

/* ══════════ 5. il colpo dei mostri non dipende dalla risposta ══════════ */
{
  const prova = giusto => {
    const { c, m } = scena({ mostri: [{ dx: 1, att: 8, ossa: 500, ossaMax: 500 }, { dx: 2, att: 6, ossa: 500, ossaMax: 500 }] })
    c.scontro(m[0])
    c.rispondi(giusto)
    return { c, m }
  }
  const a = prova(true), b = prova(false)
  uguale('la vita dopo un giro è la stessa, giusto o sbagliato', a.c.vita, b.c.vita)
  uguale('ed è la somma dei due colpi', a.c.vitaMax - a.c.vita, colpoDi(a.c, a.m[0]) + colpoDi(a.c, a.m[1]))
  controlla('ogni colpo è almeno uno', colpoDi(a.c, { att: 0 }) >= 1 && a.c.danno({ att: 0 }) >= 1)
  uguale('e la formula è COLPO_DEL_MOSTRO × (attacco − difesa)', a.c.danno({ att: 11 }), Math.max(1, Math.round(COLPO_DEL_MOSTRO * (11 - a.c.dif))))
}

/* ══════════ 6. le quattro forme dei colpi ══════════ */
{
  // abilità finte, una per forma: il motore le sa fare subito, le vere arrivano con l'albero più ricco
  const finta = (id, forma, extra = {}) => {
    NODI[id] = { id, nome: id, glifo: 'spada', costo: 1, per: [1, 1, 1], forma, arma: null, ramo: 'prova', classe: 'cavaliere',
                 gradino: 0, dal: 2, fa: () => id, debole: [2, 2, 2], ...extra }
  }
  finta('prova-uno', 'uno'); finta('prova-vicini', 'vicini'); finta('prova-catena', 'catena', { salti: [2, 2, 2] }); finta('prova-tutti', 'tutti')
  const messi = (id, bersaglio) => {
    const cr = conAlbero(4, {})
    cr.albero[id] = 1
    cr.caselle = [id, null, null]
    // cinque mostri in fila: l'ordine dei posti è quello della distanza
    const s = scena({ crescita: cr, mostri: [{ dx: 1 }, { dx: 2 }, { dx: 3 }, { dx: 4 }, { dx: 3, dy: 1 }].map(d => ({ ...d, ossa: 500, ossaMax: 500, att: 1 })) })
    s.c.scontro(s.m[0])
    const campo = s.c.foglio.campo
    s.c.scegliBersaglio(campo[bersaglio])
    s.c.prepara(id)
    s.c.energia = s.c.energiaMax
    const colpiti = s.c.foglio.colpiti.map(x => campo.indexOf(x.chi))
    const prima = campo.map(x => x.ossa)
    const e = s.c.rispondi(true)
    const toccati = campo.map((x, i) => (x.ossa < prima[i] ? i : -1)).filter(i => i >= 0)
    return { s, campo, colpiti, e, toccati, prima }
  }
  let r = messi('prova-uno', 2)
  stessaLista('uno: solo il bersaglio', r.toccati, [2])
  stessaLista('e l\'anteprima lo sa', r.colpiti, [2])
  r = messi('prova-vicini', 2)
  stessaLista('vicini: il bersaglio e i due accanto', r.toccati, [1, 2, 3])
  stessaLista('e l\'anteprima lo sa', r.colpiti.sort(), [1, 2, 3])
  r = messi('prova-vicini', 0)
  stessaLista('vicini al bordo: il bersaglio e uno solo', r.toccati, [0, 1])
  r = messi('prova-tutti', 1)
  stessaLista('tutti: tutti in campo', r.toccati, [0, 1, 2, 3, 4])
  r = messi('prova-catena', 2)
  uguale('catena: il bersaglio e due salti', r.toccati.length, 3)
  const ordine = r.colpiti
  uguale('il primo è il bersaglio', ordine[0], 2)
  const colpo = r.s.c.colpo(r.campo[2], NODI['prova-catena'])
  const dati = ordine.map(i => r.prima[i] - r.campo[i].ossa)
  uguale('il bersaglio prende il colpo intero', dati[0], colpo)
  uguale('il primo salto ×0,7', dati[1], Math.max(1, Math.round(r.s.c.colpo(r.campo[ordine[1]], NODI['prova-catena']) * FATTORE_DEL_SALTO)))
  uguale('il secondo salto ×0,49', dati[2], Math.max(1, Math.round(r.s.c.colpo(r.campo[ordine[2]], NODI['prova-catena']) * FATTORE_DEL_SALTO ** 2)))
  controlla('i salti vanno su mostri diversi', new Set(ordine).size === 3)
  // gli effetti vanno a tutti quelli presi, e solo a loro
  r = messi('prova-vicini', 2)
  stessaLista('gli effetti vanno ai presi (il gelo)', r.campo.map(x => ((x.stati || {}).debole || 0) > 0), [false, true, true, true, false])
  r = messi('prova-tutti', 2)
  stessaLista('e a tutti con la forma «tutti»', r.campo.map(x => ((x.stati || {}).debole || 0) > 0), [true, true, true, true, true])
  uguale('il Grido di guerra è «tutti»', NODI.grido.forma, 'tutti')
  uguale('le abilità di oggi sono «uno»', NODI.fendente.forma, 'uno')
  for (const id of ['prova-uno', 'prova-vicini', 'prova-catena', 'prova-tutti']) delete NODI[id]
}

/* ══════════ 7. gli effetti si contano nei turni di chi li porta ══════════ */
{
  // un mostro lento e avvelenato brucia solo al suo turno; uno veloce agisce più spesso e brucia più spesso
  const { c, m } = scena({ mostri: [{ dx: 1, velocita: 14, att: 1, ossa: 500, ossaMax: 500 }, { dx: 2, velocita: 5, ossa: 500, ossaMax: 500, stati: { veleno: { quanto: 2, scambi: 3 } } }] })
  c.scontro(m[0])
  let bruciato = 0, giri = 0
  while (giri++ < 20 && m[1].stati && m[1].stati.veleno) {
    const e = c.rispondi(false)
    bruciato += e.azioni.filter(a => a.che === 'veleno' && a.chi === m[1]).length
  }
  uguale('brucia tre volte, una a ogni suo turno', bruciato, 3)
  uguale('e ha perso quanto doveva', 500 - m[1].ossa, 6)
  controlla('i turni del lento sono pochi rispetto ai giri dell\'eroe', giri >= 3)
}
{
  // lo stordito salta i suoi prossimi N turni, non quelli degli altri
  const { c, m } = scena({ mostri: [{ dx: 1, ossa: 500, ossaMax: 500, att: 6, stati: { fermo: 2 } }, { dx: 2, ossa: 500, ossaMax: 500, att: 6 }] })
  c.scontro(m[0])
  const salti = [], colpi = []
  for (let i = 0; i < 4; i++) {
    const e = c.rispondi(false)
    salti.push(e.azioni.filter(a => a.che === 'salta' && a.chi === m[0]).length)
    colpi.push(e.azioni.filter(a => a.che === 'colpo' && a.chi === m[0]).length)
  }
  stessaLista('salta due turni', salti, [1, 1, 0, 0])
  stessaLista('poi colpisce', colpi, [0, 0, 1, 1])
}

/* ══════════ 8. le abilità riscritte ══════════ */
{
  // Testa dura: i primi N colpi di ogni scontro fanno metà
  const cr = conAlbero(12, { 'pelle-di-pietra': 1, rune: 1, 'testa-dura': 2 })
  const { c, m } = scena({ eroe: 'nano', mano: 'ascia', crescita: cr, mostri: [{ dx: 1, ossa: 900, ossaMax: 900, att: 14 }] })
  c.vita = c.vitaMax
  c.scontro(m[0])
  const pieno = c.danno(m[0])
  const prese = []
  for (let i = 0; i < 3; i++) { const v = c.vita; c.rispondi(false); prese.push(v - c.vita) }
  stessaLista('i primi due colpi fanno metà, il terzo no', prese, [Math.ceil(pieno / 2), Math.ceil(pieno / 2), pieno])
}
{
  // Freccia mirata: il bersaglio salta il suo prossimo turno
  const cr = conAlbero(12, { 'dardo-avvelenato': 1, 'freccia-mirata': 1 })
  const { c, m } = scena({ eroe: 'elfa', mano: 'arco-corto', crescita: cr, mostri: [{ dx: 1, ossa: 900, ossaMax: 900, att: 9 }] })
  c.scontro(m[0])
  c.prepara('freccia-mirata')
  const v = c.vita
  const e = c.rispondi(true)
  uguale('il bersaglio salta il turno: nessun colpo', c.vita, v)
  controlla('lo dice l\'azione', e.azioni.some(a => a.che === 'salta' && a.chi === m[0]))
  c.rispondi(false)
  controlla('e poi colpisce di nuovo', c.vita < v)
}

/* ══════════ 9. scappare costa un colpo, del più forte ══════════ */
{
  const { c, m } = scena({ mostri: [{ dx: 1, att: 4 }, { dx: 2, att: 9 }, { dx: 2, dy: 1, att: 6 }] })
  c.scontro(m[0])
  c.vita = c.vitaMax
  const costo = c.costoFuga()
  uguale('il costo è il colpo del più forte, non la somma', costo, colpoDi(c, m[1]))
  const e = c.scappa()
  uguale('scappato', e.che, 'scappato')
  uguale('si perde quel colpo', c.vitaMax - c.vita, costo)
  controlla('tutti quelli in campo si calmano e tornano a dormire', m.every(x => x.calmo === CALMA && x.sveglio === false))
  uguale('lo scontro è chiuso', c.foglio, null)
}
{
  // se quel colpo farebbe svenire, la fuga non si offre
  const { c, m } = scena({ mostri: [{ dx: 1, att: 30 }] })
  c.scontro(m[0])
  c.vita = colpoDi(c, m[0])
  uguale('non si offre', c.puoScappare(), false)
  c.vita = colpoDi(c, m[0]) + 1
  uguale('con un punto in più sì', c.puoScappare(), true)
}

/* ══════════ 10. lo stop sulla somma dei colpi ══════════ */
{
  // due mostri veloci come l'eroe: prima del suo prossimo turno arrivano tutti e due
  const { c, m } = scena({ mostri: [{ dx: 1, att: 5, ossa: 900, ossaMax: 900 }, { dx: 2, att: 5, ossa: 900, ossaMax: 900 }] })
  c.zaino = ['pozione-piccola']
  const male = colpoDi(c, m[0])
  c.vita = 2 * male * 2
  c.scontro(m[0])
  uguale('la somma dei colpi in arrivo', c.colpiInArrivo(), 2 * male)
  uguale('altri due giri lo farebbero cadere: si ferma subito', c.foglio.pericolo, 'duro')
  // con un mostro solo gli stessi punti vita non bastano a fermarsi
  const uno = scena({ mostri: [{ dx: 1, att: 5, ossa: 900, ossaMax: 900 }] })
  uno.c.zaino = ['pozione-piccola']
  uno.c.vita = 2 * male * 2
  uno.c.scontro(uno.m[0])
  controlla('con un mostro solo no (al più è poca vita)', uno.c.foglio.pericolo !== 'duro')
}
{
  // un eroe velocissimo gioca due volte prima del mostro: prima del suo prossimo turno non arriva niente
  const { c, m } = scena({ mostri: [{ dx: 1, att: 9, velocita: 8 }] })
  c.crescita = { ...c.crescita, destrezza: 14 }
  c.zaino = ['pozione-piccola']
  uguale('la velocità è 6 più uno e mezzo a punto di destrezza', c.velocita, 6 + 1.5 * c.car('destrezza'))
  m[0].velocita = 8
  c.scontro(m[0], { tocco: true })
  controlla('più veloce del doppio del mostro', c.velocita >= 16)
  uguale('prima del suo prossimo turno non arriva nessun colpo', c.colpiInArrivo(), 0)
  const turni = c.foglio.turni.map(t => (t.chi === 'eroe' ? 'E' : 'M')).join('')
  controlla('la fila mostra il doppio turno prima che succeda', turni.startsWith('EE'), turni)
}

/* ══════════ 11. la caratteristica per ramo ══════════ */
{
  // il mago con la spada in mano e la bacchetta nella mancina: attacca di spada (forza), incanta di bacchetta (intelligenza)
  const cr = conAlbero(8, { 'dardo-di-fuoco': 1 }, { forza: 4, intelligenza: 0 })
  const { c } = scena({ eroe: 'mago', mano: null, crescita: cr })
  c.mano = 'spada'
  c.mancina = 'verga'
  const sopra = c.piu.sopra
  uguale('attacca con l\'attacco solito (spada, forza)', c.attDelRamo(null), c.att)
  const fuoco = c.attDelRamo(NODI['dardo-di-fuoco'])
  uguale('incanta con la bacchetta intera, e l\'intelligenza', fuoco, c.io.att + sopra.intelligenza * ATT_PER_PUNTO + COSE.verga.att)
  controlla('la bacchetta nella mancina conta intera, non a metà', fuoco - (c.io.att + sopra.intelligenza * ATT_PER_PUNTO) === COSE.verga.att)
  controlla('e l\'attacco solito usa la forza della spada', c.att === c.io.att + sopra.forza * ATT_PER_PUNTO + COSE.spada.att + Math.ceil(COSE.verga.att / 2))
  // con la bacchetta in mano è l'attacco solito
  c.mano = 'verga'; c.mancina = null
  uguale('con la bacchetta in mano è l\'attacco solito', c.attDelRamo(NODI['dardo-di-fuoco']), c.att)
}
{
  // un ramo senz'arma colpisce con la sua caratteristica, qualunque arma abbia in mano
  const cr = conAlbero(12, { fulmine: 1 }, { forza: 3, intelligenza: 2 })
  const a = scena({ eroe: 'mago', mano: 'verga', crescita: cr }).c
  const nodo = NODI.fulmine
  uguale('Arcano è l\'intelligenza', nodo.car, 'intelligenza')
  const senzaArma = c => c.attDelRamo(nodo) - c.addosso('att')
  uguale('con la bacchetta', senzaArma(a), a.io.att + a.piu.sopra.intelligenza * ATT_PER_PUNTO)
  a.mano = 'spada'
  uguale('e con una spada in mano è la stessa caratteristica', senzaArma(a), a.io.att + a.piu.sopra.intelligenza * ATT_PER_PUNTO)
  uguale('Bosco è la destrezza', NODI.rovi.car, 'destrezza')
  uguale('Giuramento è la forza', NODI.preghiera.car, 'forza')
  uguale('Pietra è la forza', NODI['pelle-di-pietra'].car, 'forza')
  uguale('un ramo con l\'arma non ha una sua caratteristica', NODI.fendente.car, null)
  // la destrezza dà la velocità
  const b = scena({ eroe: 'elfa', mano: 'arco-corto' }).c
  const v = b.velocita
  b.crescita = { ...b.crescita, destrezza: (b.crescita.destrezza || 0) + 1 }
  uguale('un punto di destrezza, uno e mezzo di velocità', b.velocita, v + 1.5)
}

/* ══════════ 12. esperienza e bottino per ogni mostro che cade ══════════ */
{
  const { c, m } = scena({ mostri: [{ dx: 1, ossa: 1 }, { dx: 2, ossa: 1 }] })
  c.scontro(m[0])
  const esp = c.espPresa
  for (let i = 0; i < 10 && c.foglio; i++) c.rispondi(true)
  uguale('due mostri battuti', c.mostriBattuti, 2)
  controlla('l\'esperienza di entrambi', c.espPresa > esp)
  uguale('le gemme di entrambi per terra', c.livello.robe.filter(r => r.che === 'gemme' && r.x >= m[0].x - 1).length >= 2, true)
  controlla('e lo scontro è chiuso', c.foglio === null)
}

/* ══════════ 13. cosa legge la vista ══════════ */
{
  const { c, m } = scena({ eroe: 'mago', mano: 'verga', crescita: conAlbero(4, { 'dardo-di-fuoco': 1 }), mostri: [{ dx: 1 }, { dx: 2 }, { dx: 3 }] })
  c.scontro(m[0])
  const f = c.foglio
  uguale('chi è il bersaglio', f.chi, m[0])
  uguale('il campo', f.campo.length, 3)
  controlla('i prossimi turni sono al più sette', f.turni.length === 7 && f.turni.every(t => t.chi === 'eroe' || f.campo.includes(t.chi)))
  uguale('chi verrebbe colpito', f.colpiti.length, 1)
  uguale('quanto picchia ognuno', f.minaccia.length, 3)
  controlla('ogni mostro dice cosa fa', f.minaccia.every(x => x.colpisce === colpoDi(c, x.chi)))
  controlla('la somma in arrivo', typeof f.inArrivo === 'number')
  const e = c.rispondi(true)
  controlla('l\'esito dice le azioni in ordine', Array.isArray(e.azioni) && e.azioni[0].chi === 'eroe' && e.azioni.slice(1).every(a => a.chi !== 'eroe'))
  controlla('con chi agisce e chi prende', e.azioni[0].colpiti[0].chi === m[0] && e.azioni.some(a => a.che === 'colpo' && a.contro === 'eroe'))
  controlla('i mostri hanno una velocità', f.campo.every(x => velocitaDel(x) > 0) && Object.values(MOSTRI).every(x => x.velocita > 0))
}

/* ══════════ 14. uscire a metà di uno scontro ══════════ */
{
  // la sosta salva i mostri come sono (ossa, stati), non lo scontro: riprendendo tornano a casa, tutti
  const { c, m } = scena({ mostri: [{ dx: 1, ossa: 100, ossaMax: 100 }, { dx: 2, ossa: 100, ossaMax: 100 }] })
  c.scontro(m[0])
  c.rispondi(true)
  c.scegliBersaglio(m[1])
  c.rispondi(true)
  const ossa = m.map(x => x.ossa)
  const dato = scrivi(c, 5)
  const r = leggi(dato, CAMPAGNA[5], roba('spada'), [], null)
  controlla('si legge', !!r)
  uguale('niente scontro aperto', r.foglio, null)
  const ritrovati = r.livello.robe.filter(x => x.che === 'mostro')
  const vivi = ritrovati.filter(x => !x.morto)
  stessaLista('i mostri sono feriti come prima', vivi.map(x => x.ossa).sort((a, b) => a - b), [...ossa].sort((a, b) => a - b))
  controlla('e a casa loro, calmi', vivi.every(x => x.calmo === CALMA))
}

riassunto('lo scontro a gruppi')
