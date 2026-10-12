/* La forza dell'eroe (docs/sotterraneo/forza.md): il livello a cui «vale» con la roba e le abilità di adesso, e da lì i
   colori delle discese. Qui: la formula e i suoi pezzi, il controllo di sanità (l'eroe atteso a ogni livello vale il suo
   livello), la roba che alza e toglie, le due abilità forti, il colpo uguale a quello di Corsa, i colori dalla forza, la
   rinascita che non torna indietro, e il campo che manca nei salvataggi di prima.
   `node test/esegui.mjs unita/sotterraneo-forza --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI, eroeDi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { NODI, RAMI, aGrado, colpisce, inVita } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { aLivello } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { OSSA_PER_PIANO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { zonaPotenziata, forzaDellaZona, spintaDellaZona } from '../../src/giochi/sotterraneo/dati/zone.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { impara, metti } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { fasciaDi, coloreDi, coloreNellaStoria, potenzaDi, zoneDi, rinascitaDi, zoneConForza, zoneConSentita, notiziaDi }
  from '../../src/giochi/sotterraneo/motore/zone.js'
import { eroeAtteso, robaDelLivello, livelloDiForza, forzaDi, forzaDelCorredo, mostroDiRiferimento, offesa, colpoContro,
         dannoDell, resistenza, riparo, dannoPerTurno, rapporto, abilitaDelloScontro, TETTO, ABILITA_A_SCONTRO }
  from '../../src/giochi/sotterraneo/motore/forza.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CHIAVI = EROI.map(e => e.chiave)
const NUDA = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const indiceDi = k => CAMPAGNA.findIndex(t => t.chiave === k)

// un eroe del livello L con la roba che gli si dà (o quella attesa) e le abilità imparate, ognuna una volta
function eroe(chi, L, { roba = null, abilita = false } = {}) {
  let cr = crescitaA(eroeDi(chi), L)
  if (abilita) for (let giro = 0; giro < 12; giro++) {
    let fatto = false
    for (const r of RAMI[chi]) for (const n of r.nodi) {
      if ((cr.albero[n.id] || 0) >= 1) continue
      const x = impara(cr, chi, n.id)
      if (x) { cr = x; fatto = true }
    }
    if (!fatto) break
  }
  const c = new Corredo({ eroe: chi, roba: roba || robaDelLivello(chi, L), crescita: cr })
  c.sistemaIlCorredo()
  if (abilita) {
    // le tre caselle, come le riempirebbe un bambino che sa quello che fa: le due che fanno più danno con l'arma che ha in
    // mano, e la cura o lo scudo che sa
    const m = mostroDiRiferimento(L)
    const sa = Object.keys(c.crescita.albero).map(id => NODI[id]).filter(n => !n.sempre && c.haLArma(n.arma))
    const forti = sa.filter(colpisce).sort((x, y) => dannoDell(c, y, m) - dannoDell(c, x, m)).slice(0, 2)
    const riparo = sa.filter(n => !colpisce(n) && (n.cura || n.scudo))[0]
    ;[...forti, riparo].filter(Boolean).forEach((n, i) => { c.crescita = metti(c.crescita, i, n.id) })
  }
  return c
}
const forza = (chi, L, o) => livelloDiForza(eroe(chi, L, o))

/* ══════════ 1. il controllo di sanità ══════════
   L'eroe atteso a ogni livello (la roba con cui il gioco lo aspetta, senza abilità) vale il suo livello, al più uno di
   differenza: se non torna, è la formula da sistemare, non il test */
for (const chi of CHIAVI) {
  for (const L of [1, 5, 12, 20, 30]) {
    const f = livelloDiForza(eroeAtteso(chi, L))
    controlla(`${chi}: l'eroe atteso al ${L} vale ${L} (±1)`, Math.abs(f - L) <= 1, `vale ${f}`)
  }
  const fuori = []
  for (let L = 1; L <= 45; L++) {
    const f = livelloDiForza(eroeAtteso(chi, L))
    if (Math.abs(f - L) > 1) fuori.push(`${L}→${f}`)
  }
  controlla(`${chi}: da 1 a 45 l'eroe atteso non sbaglia di più di uno`, !fuori.length, fuori.join(' '))
}
{
  // il mostro di riferimento sale in linea retta col livello, e non scende mai
  let su = true
  for (let L = 2; L <= 80; L++) {
    const a = mostroDiRiferimento(L - 1), b = mostroDiRiferimento(L)
    if (b.ossa < a.ossa - 1e-9 || b.att < a.att) su = false
  }
  controlla('il mostro di riferimento non si indebolisce mai col livello', su)
  const al20 = mostroDiRiferimento(20)
  uguale('al 20 le ossa sono quelle di una zona sullo scheletro al terzo piano', Math.round(al20.ossa * 100) / 100,
         Math.round(MOSTRI.scheletro.ossa * (1 + 3 * OSSA_PER_PIANO) * forzaDellaZona(20, null) * 100) / 100)
  uguale('e l\'attacco con la sua spinta', al20.att, MOSTRI.scheletro.att + 1 + spintaDellaZona(20))
}

/* ══════════ 2. i pezzi del calcolo ══════════ */
{
  const c = eroeAtteso('cavaliere', 20)
  const m = mostroDiRiferimento(20)
  const o = offesa(c, m)
  controlla('senza abilità l\'offesa è il colpo di sempre, e basta', o.forti.length === 0, o.forti.join())
  uguale('le risposte giuste sono le ossa diviso il colpo', Math.round(o.risposte * 1000) / 1000,
         Math.round(Math.max(1, m.ossa / o.colpo) * 1000) / 1000)
  uguale('i turni sono le risposte diviso quante se ne azzeccano (8 su 10)', Math.round(o.turni * 1000) / 1000,
         Math.round(o.risposte / 0.8 * 1000) / 1000)
  uguale('senza cure né scudi la resistenza è la vita con la roba', resistenza(c), c.vitaConLaRoba)
  const d = dannoPerTurno(c, m, o.turni)
  controlla('il danno a turno sta fra il graffio e il colpo pieno',
            d > Math.floor(Math.max(1, m.att - c.dif) / 2) * 0.5 && d < Math.max(1, m.att - c.dif), `${d}`)
  controlla('il rapporto è quanti turni regge per ogni turno che ci mette', Math.abs(rapporto(c, 20) - resistenza(c) / d / o.turni) < 1e-9)
  controlla('il livello di forza è un intero da 1 al tetto', Number.isInteger(livelloDiForza(c)) && livelloDiForza(c) >= 1 && livelloDiForza(c) <= TETTO)
  // una cura o uno scudo imparati e in casella alzano la resistenza: la migliore, una sola volta
  const mago = eroe('mago', 20, { abilita: true })
  const vm = mago.vitaConLaRoba
  const riparti = abilitaDelloScontro(mago).filter(n => !colpisce(n)).map(n =>
    (n.cura ? inVita(aGrado(n, 'cura', mago.grado(n.id)), vm) : 0) + (n.scudo ? inVita(aGrado(n, 'scudo', mago.grado(n.id)), vm) : 0) +
    (n.linfa ? Math.max(1, Math.round(vm / 10)) * aGrado(n, 'linfa', mago.grado(n.id)) : 0))
  controlla('il mago ha in casella una cura o uno scudo', riparti.some(x => x > 0), riparti.join())
  uguale('il riparo è quello della migliore, non la somma', riparo(mago), Math.max(...riparti))
  uguale('e si somma alla vita', resistenza(mago), vm + riparo(mago))
}

/* ══════════ 3. la roba alza e toglie ══════════ */
const esempi = []
for (const chi of CHIAVI) {
  for (const L of [12, 20]) {
    const atteso = forza(chi, L)
    const nudo = forza(chi, L, { roba: NUDA })
    const meglio = forza(chi, L, { roba: robaDelLivello(chi, L + 12) })
    const arma = forza(chi, L, { roba: { ...robaDelLivello(chi, L), mano: robaDelLivello(chi, L + 12).mano } })
    const abil = forza(chi, L, { abilita: true })
    esempi.push(`${chi} ${L}: atteso ${atteso}, nudo ${nudo}, arma+12 ${arma}, roba+12 ${meglio}, con abilità ${abil}`)
    controlla(`${chi} ${L}: nudo vale meno dell'atteso`, nudo < atteso - 3, `${nudo} contro ${atteso}`)
    controlla(`${chi} ${L}: con la roba di dodici livelli più su vale di più`, meglio >= atteso + 2, `${meglio} contro ${atteso}`)
    controlla(`${chi} ${L}: con la sola arma migliore non vale di meno`, arma >= atteso, `${arma} contro ${atteso}`)
    controlla(`${chi} ${L}: con le abilità imparate vale di più`, abil >= atteso, `${abil} contro ${atteso}`)
  }
}
for (const e of esempi) nota(e)
{
  // più livello, a parità di roba, non vale di meno; e più vita non fa male
  const poca = eroe('nano', 12), tanta = eroe('nano', 18, { roba: robaDelLivello('nano', 12) })
  controlla('lo stesso equipaggiamento con più livello vale di più', livelloDiForza(tanta) > livelloDiForza(poca))
  const piuVita = eroe('nano', 12)
  piuVita.crescita = { ...piuVita.crescita, tempra: piuVita.crescita.tempra + 6 }
  controlla('più tempra non abbassa la forza', livelloDiForza(piuVita) >= livelloDiForza(poca))
}
{
  // un eroe «mal vestito» è più debole del suo livello, e lo dice: livello 20 a mani nude vale meno di uno attesto al 12
  const nudo20 = forza('cavaliere', 20, { roba: NUDA })
  controlla('un cavaliere del 20 a mani nude vale meno di quello atteso al 20', nudo20 < 20 - 5, `${nudo20}`)
  uguale('e senza niente di niente il minimo è 1', livelloDiForza(eroe('mago', 1, { roba: NUDA })), 1)
}

/* ══════════ 4. due abilità forti alzano la forza ══════════ */
{
  // col suo scettro in mano: la Lama del cavaliere e il Fuoco del mago non servono a chi ha in mano altro
  const scettro = { ...robaDelLivello('mago', 20), mano: aLivello('scettro', 19), mancina: null }
  const senza = eroe('mago', 20, { roba: scettro }), con = eroe('mago', 20, { abilita: true, roba: scettro })
  const m = mostroDiRiferimento(20)
  const o = offesa(con, m)
  uguale('si contano due abilità a scontro', o.forti.length, ABILITA_A_SCONTRO)
  const danni = o.forti.map(id => dannoDell(con, NODI[id], m))
  controlla('e sono le due che toglieranno di più, la prima davanti', danni[0] >= danni[1] &&
            abilitaDelloScontro(con).filter(n => !o.forti.includes(n.id)).every(n => dannoDell(con, n, m) <= danni[1]),
            `${o.forti.join('+')} ${danni.join('/')}`)
  controlla('con le due abilità il mostro costa meno turni', o.turni < offesa(senza, m).turni, `${o.turni} contro ${offesa(senza, m).turni}`)
  controlla('con una sola abilità ne costa di più che con due', offesa(con, m, { quante: 1 }).turni >= o.turni)
  controlla('con le abilità la forza è più alta', livelloDiForza(con) > livelloDiForza(senza) + 2, `${livelloDiForza(con)} contro ${livelloDiForza(senza)}`)
  // il veleno conta i suoi turni a metà colpo
  const elfa = eroe('elfa', 20, { abilita: true })
  const veleno = NODI['dardo-avvelenato']
  const colpo = colpoContro(elfa, m)
  uguale('il veleno brucia metà colpo per i suoi turni, oltre al colpo', dannoDell(elfa, veleno, m),
         colpoContro(elfa, m, veleno) + Math.max(1, Math.ceil(colpo / 2)) * aGrado(veleno, 'veleno', elfa.grado('dardo-avvelenato')))
}
{
  // un'abilità che vuole un'arma che non c'è non si conta: il cavaliere col martello del grosso non usa la Lama
  const cavaliere = chi => {
    const base = robaDelLivello(chi, 20)
    return eroe(chi, 20, { abilita: true, roba: { ...base, mano: 'martello@19', mancina: null } })
  }
  const sbagliato = cavaliere('cavaliere')
  const giusto = eroe('cavaliere', 20, { abilita: true, roba: { ...robaDelLivello('cavaliere', 20), mano: aLivello('spada', 19), mancina: null } })
  controlla('senza la lama in mano le abilità della Lama non entrano nello scontro',
            !abilitaDelloScontro(sbagliato).some(n => n.ramo === 'lama'))
  controlla('con la spada sì', abilitaDelloScontro(giusto).some(n => n.ramo === 'lama'))
}

/* ══════════ 5. il colpo è quello di Corsa ══════════
   La formula rifà il conto di Corsa.colpo senza una discesa: se i due si separano, il livello di forza racconta un altro
   gioco. `passa` si legge come numero da 0 a 1 (true vale 1) */
{
  const z = zonaPotenziata(indiceDi('torre'), 20)
  for (const chi of ['mago', 'elfa', 'cavaliere', 'nano']) {
    const c = eroe(chi, 20, { abilita: true })
    const corsa = new Corsa(z, { seme: 3, eroe: chi, rnd: seminato(3), roba: c.roba, crescita: c.crescita })
    const m = { ossa: 100, att: 20, dif: 1, stati: {} }
    uguale(`${chi}: il colpo semplice è quello di Corsa`, colpoContro(c, m), corsa.colpo(m))
    for (const id of Object.keys(c.crescita.albero)) {
      const nodo = NODI[id]
      if (nodo.sempre || nodo.seStordito) continue
      uguale(`${chi}: ${id} colpisce come Corsa`, colpoContro(c, m, nodo, { rotto: !!nodo.rompe }),
             corsa.colpo({ ...m, stati: nodo.rompe ? { rotto: true } : {} }, nodo))
    }
  }
  const mago = eroe('mago', 20, { abilita: true })
  const m = { ossa: 100, att: 20, dif: 6 }
  const pieno = colpoContro(mago, m, { ...NODI.fulmine, passa: true }), nulla = colpoContro(mago, m, { ...NODI.fulmine, passa: false })
  const meta = colpoContro(mago, m, { ...NODI.fulmine, passa: 0.5 })
  controlla('passa a metà è fra niente e tutto', nulla < meta && meta < pieno, `${nulla} < ${meta} < ${pieno}`)
  uguale('passa true vale uno', colpoContro(mago, m, { ...NODI.fulmine, passa: 1 }), pieno)
  uguale('il Fulmine ignora metà della difesa', colpoContro(mago, m, NODI.fulmine), meta)
}

/* ══════════ 6. i colori seguono la forza ══════════ */
{
  const storia = { tappa: 3, libera: false, stelle: {} }
  const finita = { tappa: 7, libera: true, stelle: {} }
  const k = indiceDi('fondo')
  uguale('senza la forza i colori sono quelli del livello (come prima)', coloreDi(finita, k, 14), coloreDi(finita, k, 14, 14))
  uguale('livello 12 ma forza 5: la miniera 14–17 è rossa', coloreDi(finita, k, 12, 5), 'rosso')
  uguale('livello 12 e forza 12: è arancio', coloreDi(finita, k, 12, 12), 'arancio')
  uguale('livello 12 ma forza 16: è verde', coloreDi(finita, k, 12, 16), 'verde')
  uguale('livello 12 ma forza 18: è grigia', coloreDi(finita, k, 12, 18), 'grigio')
  uguale('forza 22: la miniera è rinata più su (28–31), e per lui è rossa', `${potenzaDi(finita, k, 12, 22)} ${coloreDi(finita, k, 12, 22)}`, '28 rosso')
  uguale('nella storia un livello 12 a mani nude (forza 5) trova rossa la miniera', coloreDi(storia, k, 12, 5), 'rosso')
  uguale('nella storia i gradini si contano dalla forza', coloreNellaStoria(10, 5), 'rosso')
  uguale('e con la forza del livello è quello di sempre', coloreNellaStoria(10, 10), 'verde')
}

/* ══════════ 7. la rinascita non torna indietro ══════════ */
{
  const k = indiceDi('torre')
  let a = { tappa: 7, libera: true, stelle: {} }
  uguale('un salvataggio di prima non ha il campo: vale zero', zoneDi({ ...a, zone: { sentita: 'cantine:20' } }).forza, 0)
  uguale('e la rinascita è il livello dell\'eroe', rinascitaDi({ ...a, zone: { sentita: 'cantine:20' } }, 14), 14)
  uguale('anche senza `zone`', rinascitaDi(a, 14), 14)
  uguale('un campo storto vale zero', zoneDi({ zone: { forza: 'tanta' } }).forza, 0)
  uguale('le fasce, senza campo e senza forza, sono quelle del livello', potenzaDi(a, k, 14), fasciaDi('torre', 14).da)
  // un eroe del 14 con una forza di 26 fa ruotare le zone come uno del 26
  uguale('la forza di adesso fa ruotare le zone', potenzaDi(a, k, 14, 26), fasciaDi('torre', 26).da)
  controlla('e sono davvero più alte', potenzaDi(a, k, 14, 26) > potenzaDi(a, k, 14))
  // si scrive il massimo, solo quando serve
  uguale('se la forza non supera il livello non si scrive niente', zoneConForza(a, 14, 14), null)
  uguale('né quando è più bassa del massimo già scritto', zoneConForza({ ...a, zone: { forza: 26 } }, 20, 14), null)
  const z = zoneConForza(a, 26, 14)
  uguale('quando la supera si scrive', z.forza, 26)
  a = { ...a, zone: z }
  // il bambino vende l'arma: la forza cala a 12, ma la zona rinata non torna indietro
  uguale('il massimo resta', rinascitaDi(a, 14, 12), 26)
  uguale('le zone non tornano indietro vendendo l\'arma', potenzaDi(a, k, 14, 12), fasciaDi('torre', 26).da)
  uguale('e la notizia è sempre quella della zona nuova', notiziaDi(a, 14, 12).da, notiziaDi(a, 14, 26).da)
  // ma i colori sì: debole com'è, quelle zone sono rosse
  uguale('i colori seguono la forza di adesso: la torre rinata è rossa', coloreDi(a, k, 14, 12), 'rosso')
  // la notizia sentita non cancella il massimo, e il massimo non cancella la notizia
  const sentita = zoneConSentita(a, 'cantine:40')
  uguale('la notizia sentita tiene il massimo', sentita.forza, 26)
  uguale('e il massimo tiene la notizia', zoneConForza({ ...a, zone: sentita }, 40, 14).sentita, 'cantine:40')
  uguale('un livello dell\'eroe più alto del massimo comanda', rinascitaDi(a, 30, 12), 30)
  uguale('la sosta dentro una zona tiene la sua potenza', potenzaDi({ ...a, sosta: { tappa: k, potenza: 12 } }, k, 14, 26), 12)
}

/* ══════════ 8. la memoria ══════════ */
{
  const c = eroe('elfa', 12)
  const a = forzaDelCorredo(c), b = forzaDi('elfa', c.roba, c.crescita)
  uguale('forzaDi e forzaDelCorredo dicono la stessa cosa', a, b)
  const cambiato = { ...c.roba, mano: null }
  controlla('toglierle l\'arma la cambia (la memoria non si inganna)', forzaDi('elfa', cambiato, c.crescita) < a)
}

riassunto('la forza dell\'eroe')
