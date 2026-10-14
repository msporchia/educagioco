/* La roba con livello e rarità, i drop a tono, i mostri grossi e i
   leggendari (docs/sotterraneo/rarita.md e grossi.md): la chiave composta
   e i numeri che ne nascono, i nomi accordati, le probabilità delle
   rarità, i pezzi che cadono al livello del posto o dell'eroe, il mostro
   grosso in fondo a ogni discesa e il suo bottino sicuro, il leggendario
   che si festeggia e finisce fra i Tesori, i mercanti a tono, l'aspetto
   di un pezzo trovato (docs/sotterraneo/figure.md).
   `node test/esegui.mjs sotterraneo-rarita --niente-build` */
import { COSE, chiaveDelPezzo, aLivello, baseDi, livelloDelPezzo, raritaDi, nomeDelPezzo, guastiDelleCose } from '../../src/giochi/sotterraneo/dati/cose.js'
import { RARITA, ABILITA_DEI_PEZZI, LEGGENDARI, DEI_GROSSI, UNICI, TINTE_DELLE_ABILITA } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { ASPETTI } from '../../src/giochi/sotterraneo/dati/aspetti.js'
import { GROSSI, GROSSO_DELLA_DISCESA, GROSSO_OGNI, grossoDi, guastiDeiGrossi, figuraDelGrosso, spriteDelGrosso, EROE, LATO_DEL_GROSSO } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { CAMPAGNA, L_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { pezzoNuovo, pescaRarita, pescaAbilita, pezzoDelGrosso, guastiDelBottino, livelloDelBottino, livelloDelTrovato, VARIAZIONE_DEL_TROVATO, FUORI_LIVELLO_DEL_GROSSO }
  from '../../src/giochi/sotterraneo/motore/bottino.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo, rileggiRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { ABILITA_CONFRONTATE } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { ABILITA } from '../../src/giochi/sotterraneo/viste/pezzo.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { readFileSync } from 'node:fs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = [...guastiDelleCose(), ...guastiDelBottino(), ...guastiDeiGrossi(CAMPAGNA)]
  controlla('le cose, il bottino e i mostri grossi stanno in piedi', !g.length, g.join(' · '))
  stessaLista('quattro rarità coi colori di Diablo', Object.keys(RARITA), ['comune', 'magico', 'raro', 'leggendario'])
  uguale('una decina di abilità', Object.keys(ABILITA_DEI_PEZZI).length, 10)
  stessaLista('il confronto e le parole parlano delle stesse abilità', ABILITA.map(a => a.campo), ABILITA_CONFRONTATE)
}

/* ══════════ 2. la chiave composta ══════════ */
{
  uguale('la chiave di sempre resta: livello 1, comune', chiaveDelPezzo('spada'), 'spada')
  uguale('un livello in più', chiaveDelPezzo('spada', 7), 'spada@7')
  uguale('magico con le sue abilità', chiaveDelPezzo('spada', 7, 'magico', ['fuoco', 'att']), 'spada@7.m.fuoco.att')
  uguale('il pezzo di base si legge com\'era', COSE.spada.att, 2)
  controlla('il livello alza il numero principale anche a un comune', COSE['spada@11'].att > COSE.spada.att && COSE['corazza@16'].dif > COSE.corazza.dif)
  controlla('il livello e la rarità alzano il prezzo', COSE['spada@7'].prezzo > COSE.spada.prezzo &&
            COSE['spada@7.m.fuoco'].prezzo > COSE['spada@7'].prezzo && COSE['spada@7.r.fuoco.att'].prezzo > COSE['spada@7.m.fuoco'].prezzo)
  controlla('un raro rende più di un magico con la stessa abilità', COSE['spada@10.r.fuoco.vita'].fuoco >= COSE['spada@10.m.fuoco'].fuoco)
  for (const k of ['spada@0', 'spada@3.c.att', 'pozione@3', 'spada@3.m.volare', 'spada@3.m.att.att', 'spada@3.u.zanna-del-drago.x',
                   'ascia@3.u.zanna-del-drago', 'spada@3.l.att', 'nulla@3'])
    uguale(`«${k}» non si legge`, COSE[k], undefined)
  uguale('la base', baseDi('spada@7.m.fuoco'), 'spada')
  uguale('il livello', livelloDelPezzo('spada@7.m.fuoco'), 7)
  uguale('la rarità', raritaDi('spada@7.r.fuoco.att'), 'raro')
  uguale('un pezzo di base è comune e di livello 1', `${raritaDi('spada')}/${livelloDelPezzo('spada')}`, 'comune/1')
  // la roba salvata si rilegge con le chiavi nuove; una chiave storta si butta
  const r = rileggiRoba({ v: 1, gemme: 3, zaino: ['spada@4.m.att', 'spada@0', 'pozione'], mano: 'ascia@9.r.att.vita.fuoco',
                          mancina: null, corpo: 'bah@3', dito: null, torcia: 0, torce: 0 })
  stessaLista('lo zaino tiene le chiavi buone e butta le storte', r.zaino, ['spada@4.m.att', 'pozione'])
  controlla('e addosso uguale', r.mano === 'ascia@9.r.att.vita.fuoco' && r.corpo === null)
}

/* ══════════ 3. il nome nasce dalle abilità, e si accorda ══════════ */
{
  uguale('magico, un\'abilità: l\'aggettivo', COSE['spada@4.m.fuoco'].nome, 'Spada fiammeggiante')
  uguale('magico, due: l\'aggettivo e il complemento', COSE['spada@4.m.fuoco.schivata'].nome, 'Spada fiammeggiante della volpe')
  uguale('al maschile', COSE['scudo-legno@4.m.dif'].nome, 'Scudo di legno corazzato')
  uguale('al femminile', COSE['corazza@4.m.dif'].nome, 'Corazza corazzata')
  uguale('raro: l\'aggettivo epico del suo livello e il complemento', COSE['spadone@15.r.att.vita'].nome, 'Spadone demoniaco del leone')
  uguale('raro di livello basso: temprato', COSE['ascia@3.r.vita.att'].nome, 'Ascia temprata dell\'orso')
  uguale('un pezzo col nome si chiama col suo nome', COSE['mazza@5.u.mazza-di-grumo'].nome, 'Mazza di Grumo')
  for (const [a, x] of Object.entries(ABILITA_DEI_PEZZI))
    controlla(`${a}: parole da bambino, senza trattini né numeri`, /^[a-zàèéìòù' ]+$/i.test(x.agg.join(' ') + ' ' + x.di), x.di)
  nota(`nomi: ${['spada@4.m.fuoco', 'arco-lungo@6.m.schivata.gemme', 'corazza@9.r.vita.rigenera', 'anello-verde@24.r.gemme.fortuna']
    .map(k => COSE[k].nome).join(' · ')}`)
}

/* ══════════ 4. le rarità: quanto spesso ══════════ */
{
  const conta = (chi, opz = {}) => {
    const rnd = seminato(99), n = { comune: 0, magico: 0, raro: 0, leggendario: 0 }
    for (let i = 0; i < 20000; i++) n[pescaRarita(chi, { rnd, ...opz })]++
    return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / 20000]))
  }
  const m = conta('mostro'), f = conta('forziere'), fort = conta('mostro', { fortuna: 10 }), giu = conta('mostro', { livello: 40 })
  nota(`dal mostro: ${JSON.stringify(m)}; dal forziere: ${JSON.stringify(f)}`)
  controlla('dal mostro il comune è la regola', m.comune > 0.65)
  controlla('un leggendario è raro davvero: meno di uno su cento', m.leggendario < 0.01 && m.leggendario > 0)
  controlla('il forziere dà meglio del mostro', f.raro > m.raro && f.magico > m.magico)
  controlla('la fortuna alza le rarità', fort.raro > m.raro && fort.leggendario > m.leggendario)
  controlla('e anche la profondità', giu.raro > m.raro)
  const g = conta('grosso')
  uguale('il mostro grosso lascia sempre un raro o meglio', g.comune + g.magico, 0)
  // le abilità nascono dove hanno senso: niente attacco al dito (al dito va quello che non picchia)
  let storte = 0
  const rnd = seminato(5)
  for (let i = 0; i < 400; i++) for (const b of ['anello-verde', 'corazza', 'spada', 'scudo-ferro'])
    for (const a of pescaAbilita(b, 3, rnd)) if (!ABILITA_DEI_PEZZI[a].dove.includes(COSE[b].dove)) storte++
  uguale('ogni abilità nasce nella sua casella', storte, 0)
}

/* ══════════ 5. i drop a tono ══════════ */
{
  uguale('il bottino ha il livello del posto, o dell\'eroe se è più alto', livelloDelBottino(3, 20), 20)
  uguale('e del posto se l\'eroe è sotto', livelloDelBottino(14, 9), 14)
  // un eroe di livello 20 nella cripta: i pezzi cadono a tono con lui
  const c = new Corsa(CAMPAGNA[0], { seme: 8, rnd: seminato(8), crescita: { esp: sogliaDi(20) } })
  for (let i = 0; i < 40; i++) c.posaPezzo(pezzoNuovo({ livello: c.livelloDelBottino, rnd: () => c.rnd() }), { x: 2, y: 2 })
  const livelli = new Set(c.livello.robe.filter(r => r.che === 'cosa' && COSE[r.cosa].dove).map(r => livelloDelPezzo(r.cosa)))
  stessaLista('livello 20 nella cripta: drop al livello 20', [...livelli], [20])
  // anche i mostri qualunque lasciano a volte un pezzo
  let pezzi = 0, mostri = 0
  for (let s = 0; s < 40; s++) {
    const d = new Corsa(CAMPAGNA[1], { seme: 300 + s, rnd: seminato(s + 1) })
    for (const m of d.livello.robe.filter(r => r.che === 'mostro' && !r.chiave)) { d.cade(m); mostri++ }
    pezzi += d.livello.robe.filter(r => r.che === 'cosa' && COSE[r.cosa].dove).length
  }
  controlla('un mostro qualunque lascia a volte un pezzo', pezzi > 0 && pezzi < mostri * 0.2, `${pezzi} su ${mostri}`)
  // un pezzo trovato nasce al livello dell'eroe, con una variazione da −1 a +2 pesata verso il livello giusto
  const conta = (chi, eroe, n = 4000) => {
    const q = {}
    const r = seminato(77)
    for (let i = 0; i < n; i++) { const l = livelloDelTrovato(eroe, chi, r(), r()); q[l - eroe] = (q[l - eroe] || 0) + 1 }
    return q
  }
  const q = conta('forziere', 12)
  const fra = Object.keys(q).map(Number)
  controlla('un trovato sta fra −1 e +2 livelli dall\'eroe', fra.every(d => d >= -1 && d <= 2) && fra.length === 4, JSON.stringify(q))
  controlla('e il livello giusto è il più frequente', q[0] > q[1] && q[0] > q[-1] && q[0] > q[2], JSON.stringify(q))
  for (const [d, p] of VARIAZIONE_DEL_TROVATO) controlla(`la variazione ${d} pesa come scritto`, Math.abs(q[d] / 4000 - p) < 0.03, `${q[d] / 4000} contro ${p}`)
  uguale('al livello 1 non si scende sotto 1', Math.min(...Object.keys(conta('mostro', 1)).map(Number)), 0)
  const gro = conta('grosso', 12, 8000)
  const su = (gro[3] || 0) + (gro[4] || 0)
  controlla('il grosso ogni tanto lascia un pezzo fuori livello, 3 o 4 sopra', Math.abs(su / 8000 - FUORI_LIVELLO_DEL_GROSSO.probabilita) < 0.03 && gro[3] > 0 && gro[4] > 0, JSON.stringify(gro))
  controlla('ma non sempre: il resto è come per gli altri', gro[0] > gro[3] && gro[-1] > 0 && gro[2] > 0 && Math.max(...Object.keys(gro).map(Number)) === 4, JSON.stringify(gro))
  // in discesa: deterministico dal seme, e il livello del posto non c'entra
  {
    const lv = seme => {
      const d = new Corsa(CAMPAGNA[6], { seme, rnd: seminato(seme), crescita: { esp: sogliaDi(5) } })
      return [d.livelloDelTrovato('forziere', 4, 9), d.livelloDelTrovato('grosso', 4, 9), d.livelloDelTrovato('forziere', 4, 9)]
    }
    stessaLista('lo stesso seme dà gli stessi livelli, in due discese', lv(11), lv(11))
    uguale('e lo stesso posto lo stesso', lv(11)[0], lv(11)[2])
    const d = new Corsa(CAMPAGNA[6], { seme: 3, rnd: seminato(3), crescita: { esp: sogliaDi(5) } })
    const visti = new Set()
    for (let i = 0; i < 200; i++) visti.add(d.livelloDelTrovato('mostro', i, 3))
    controlla('in fondo alla discesa con un eroe di livello 5 i trovati stanno intorno a 5, non al livello del posto', [...visti].every(l => l >= 4 && l <= 7), [...visti].join(','))
  }
  // nell'abisso, senza tetto: il bottino del piano 40 è del livello 40 e oltre
  const a = new Corsa(L_ABISSO, { seme: 3, rnd: seminato(3) })
  a.piano = 39
  uguale('nell\'abisso il livello del posto non ha tetto', a.livelloDelBottino, 51)
}

/* ══════════ 6. il mostro grosso ══════════ */
{
  for (const t of CAMPAGNA) {
    uguale(`${t.chiave}: in fondo c'è il suo mostro grosso`, grossoDi(t, t.piani - 1), GROSSO_DELLA_DISCESA[t.chiave])
    uguale(`${t.chiave}: e non prima`, grossoDi(t, t.piani - 2), null)
  }
  controlla(`nell'abisso uno ogni ${GROSSO_OGNI} piani`, grossoDi(L_ABISSO, GROSSO_OGNI - 1) && !grossoDi(L_ABISSO, GROSSO_OGNI) &&
            grossoDi(L_ABISSO, 2 * GROSSO_OGNI - 1))
  for (const [k, t] of CAMPAGNA.entries()) {
    const c = new Corsa(t, { seme: 20 + k, rnd: seminato(20 + k) })
    c.piano = t.piani - 1
    c.nuovoPiano()
    const g = c.livello.robe.find(r => r.che === 'mostro' && r.grosso)
    controlla(`${t.chiave}: il mostro grosso c'è, porta la chiave e ha il suo nome`, g && g.chiave && g.nome === GROSSI[g.grosso].nome,
              g && g.nome)
    const st = g && c.livello.stanzaDi(g.x, g.y), scala = c.livello.robe.find(r => r.che === 'scala')
    controlla(`${t.chiave}: sta nella stanza della scala`, st && st === c.livello.stanzaDi(scala.x, scala.y))
    const comune = c.livello.mostro(GROSSI[g.grosso].tipo, 0, 0)
    controlla(`${t.chiave}: è più grosso del suo simile`, g.ossa > comune.ossa)
    // battuto: di sicuro un pezzo raro o meglio, e il suo pezzo col nome
    const prima = c.livello.robe.length
    c.cade(g)
    const caduti = c.livello.robe.slice(prima).filter(r => r.che === 'cosa' && COSE[r.cosa].dove).map(r => r.cosa)
    controlla(`${t.chiave}: lascia il suo pezzo col nome`, caduti.some(x => COSE[x].unico === GROSSI[g.grosso].pezzo), caduti.join(', '))
    controlla(`${t.chiave}: e un raro o meglio`, caduti.some(x => ['raro', 'leggendario'].includes(COSE[x].rarita) && COSE[x].unico !== GROSSI[g.grosso].pezzo),
              caduti.join(', '))
  }
  uguale('il pezzo di Grumo è la sua mazza, col nome', COSE[pezzoDelGrosso('mazza-di-grumo', 3)].nome, 'Mazza di Grumo')
  controlla('i pezzi dei grossi li porta chiunque', Object.values(DEI_GROSSI).every(u => !COSE[u.base].famiglia))
  // la figura: la creatura che veste (`figura`: il ragno di Zannaverde, il drago di lava di Carbonchio…, senza, la specie di `tipo`), del
  // catalogo comune, ingrandita a coprire due caselle di altezza (con la corona), a meno che l'atlante abbia il suo dipinto
  // (`grosso-<chiave>-fermo-0`), che prende il posto del ripiego da solo
  const FIGURA = { ossuto: 'negromante', grumo: 'orco', fiammetta: 'spirito-fuoco', zannaverde: 'ragno', gorgo: 'polpo', minotto: 'bestia-cornuta', carbonchio: 'drago-lava' }
  for (const [k, x] of Object.entries(GROSSI)) {
    const f = figuraDelGrosso(k)
    controlla(`${k}: ha una figura`, !!f)
    uguale(`${k}: senza dipinto, è la creatura giusta`, x.figura || x.tipo, FIGURA[k])
    uguale(`${k}: e lo sprite è il suo`, f.sprite, (MOSTRI[FIGURA[k]] || { sprite: FIGURA[k] }).sprite)
    // la scatola: né più alto di 1,9 eroi né più largo di 3, e grande davvero (almeno un eroe e mezzo di lato più lungo)
    const [, , largo, alto] = PEZZI[`${f.sprite}-fermo-0`]
    controlla(`${k}: ingrandito dentro la sua scatola, grosso ma senza debordare`,
              alto * f.k <= 1.9 * EROE.alto + 0.01 && largo * f.k <= 3 * EROE.largo + 0.01 && Math.max(alto * f.k, largo * f.k) >= 1.25 * EROE.alto, `${largo}×${alto} × ${f.k}`)
    controlla(`${k}: e il suo fotogramma c'è nell'atlante, da fermo, da sveglio e nello scontro`, !!PEZZI[spriteDelGrosso(f, false)] && !!PEZZI[spriteDelGrosso(f, true, 3)] && !!PEZZI[spriteDelGrosso(f, 'scontro')])
    controlla(`${k}: la tinta è un colore`, /^#[0-9a-f]{6}$/i.test(x.tinta))
  }
  // chi ha i passi cammina da sveglio e nello scontro sta fermo sulla posa di lato; chi non li ha respira; il drago (respiro rotto) usa i passi anche da fermo
  controlla('Zannaverde (il ragno) cammina da sveglio e nello scontro usa la posa di lato', /-corsa-\d$/.test(spriteDelGrosso(figuraDelGrosso('zannaverde'), true, 3)) &&
            spriteDelGrosso(figuraDelGrosso('zannaverde'), 'scontro') === 'ragno-corsa-0' && /-fermo-\d$/.test(spriteDelGrosso(figuraDelGrosso('zannaverde'), false)))
  controlla('Gorgo (il polpo) non ha i passi: respira, anche nello scontro', /-fermo-/.test(spriteDelGrosso(figuraDelGrosso('gorgo'), true, 2)) && /-fermo-/.test(spriteDelGrosso(figuraDelGrosso('gorgo'), 'scontro')))
  controlla('Grumo (l\'orco) cammina', /-corsa-/.test(spriteDelGrosso(figuraDelGrosso('grumo'), true, 1)))
  const drago = { sprite: 'drago', unaPosa: false, fermoDaiPassi: true }
  controlla('il drago, anche fermo, usa i passi e non il suo respiro rotto', spriteDelGrosso(drago, false) === 'drago-corsa-0' && /^drago-corsa-\d$/.test(spriteDelGrosso(drago, true, 7)))
  // il dipinto vince: una chiave `grosso-ossuto-fermo-0` nell'atlante lo prende al posto del ripiego, a misura vera e senza corona
  PEZZI['grosso-ossuto-fermo-0'] = [0, 0, 32, 32]
  try {
    const d = figuraDelGrosso('ossuto')
    controlla('con il suo dipinto nell\'atlante, ossuto usa quello', d.dipinto && d.sprite === 'grosso-ossuto' && d.k === 1, JSON.stringify(d))
    uguale('e il fotogramma è il suo', spriteDelGrosso(d, true, 5), 'grosso-ossuto-fermo-0')
    controlla('gli altri restano al ripiego', !figuraDelGrosso('grumo').dipinto)
  } finally { delete PEZZI['grosso-ossuto-fermo-0'] }
}

/* ══════════ 7. i leggendari ══════════ */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 9, rnd: seminato(9) })
  const k = chiaveDelPezzo('spada', 4, 'leggendario', [], 'zanna-del-drago')
  const dove = c.posaPezzo(k, { x: Math.floor(c.eroe.x) + 1, y: Math.floor(c.eroe.y) })
  controlla('un leggendario che cade si festeggia', c.eventi.some(e => e.che === 'leggendario' && e.cosa === k))
  controlla('ha il nome, la sua riga di storia e il colore oro', COSE[k].nome === 'Zanna del drago' && COSE[k].storia && COSE[k].rarita === 'leggendario')
  c.trovata(c.livello.robe.find(r => r.cosa === k && r.x === dove.x))
  controlla('preso, finisce fra i trovati (i Tesori)', c.trovati.has('zanna-del-drago'))
  controlla('ogni leggendario ha la sua storia', Object.values(LEGGENDARI).every(l => l.storia && l.storia.length > 20))
  uguale('undici leggendari', Object.keys(LEGGENDARI).length, 11)
  controlla('ogni classe ne può portare almeno quattro', ['cavaliere', 'elfa', 'mago', 'nano'].every(e =>
    Object.values(LEGGENDARI).filter(l => new Corredo({ eroe: e }).posso(l.base)).length >= 4))
}

/* ══════════ 8. i mercanti a tono ══════════ */
{
  const b = new Bottega({ eroe: 'cavaliere', finite: 3, crescita: { esp: sogliaDi(7) }, rnd: seminato(4) })
  const roba = [...b.banco('armaiolo').roba, ...b.vetrina('armaiolo').map(v => v.chiave)]
  // al livello dell'eroe, o più sotto se lì il requisito non si raggiunge: un'arma da impugnare, non da guardare
  controlla('l\'armaiolo porta la roba al livello dell\'eroe', roba.length && roba.every(k => livelloDelPezzo(k) === 7 ||
            (b.posso(k) && !b.posso(aLivello(k, 7)))), roba.join(', '))
  let magici = 0, tutti = 0
  for (let s = 0; s < 40; s++) {
    const x = new Bottega({ eroe: 'nano', finite: 2, crescita: { esp: sogliaDi(5) }, rnd: seminato(s + 1) })
    for (const k of x.banco('armaiolo').roba) { tutti++; if (raritaDi(k) === 'magico') magici++ }
  }
  controlla('e qualche pezzo magico in mezzo', magici > 0 && magici < tutti / 2, `${magici}/${tutti}`)
  const p = new Bottega({ eroe: 'cavaliere', crescita: { esp: sogliaDi(10) } })
  const piccolo = new Bottega({ eroe: 'cavaliere' })
  controlla('le pozioni costano e curano uguale a ogni livello', p.quantoCosta('pozione') === COSE.pozione.prezzo &&
            p.curaDi('pozione') === COSE.pozione.cura && piccolo.curaDi('pozione') === COSE.pozione.cura &&
            piccolo.quantoCosta('pozione') === p.quantoCosta('pozione'))
  uguale('il rigattiere compra a metà del prezzo vero', new Corredo().quantoVale('spada@7.m.fuoco'), Math.floor(COSE['spada@7.m.fuoco'].prezzo / 2))
}

/* ══════════ l'aspetto di un pezzo trovato ══════════ */
{
  const tinta = s => Object.values(ASPETTI).flat().find(f => f.sprite === s)
  stessaLista('ogni abilità richiama qualche figura', Object.keys(TINTE_DELLE_ABILITA), Object.keys(ABILITA_DEI_PEZZI))
  uguale('il pezzo di base tiene la sua figura di sempre', COSE.spada.sprite, 'spada')
  uguale('lo stesso pezzo ha sempre la stessa figura', COSE['spada@9.m.fuoco'].sprite, COSE['spada@9.m.fuoco'].sprite)
  const fuoco = [3, 5, 8, 11, 14].map(L => COSE[`spada@${L}.m.fuoco`].sprite)
  controlla('una spada fiammeggiante è una spada del fuoco', fuoco.every(s => tinta(s).tinta === 'fuoco'), fuoco.join(', '))
  const comuni = [2, 3, 4, 5, 6, 7, 8, 9].map(L => COSE[`manto@${L}`].sprite)
  controlla('un mantello comune ha l\'aria da bottega', comuni.every(s => tinta(s).pregio <= 2), comuni.join(', '))
  controlla('e non sono tutti uguali', new Set(comuni).size > 2, comuni.join(', '))
  const rari = [4, 8, 12, 16].map(L => COSE[`corazza@${L}.r.vita.dif`].sprite)
  controlla('una corazza rara ha l\'aria preziosa', rari.every(s => tinta(s).pregio >= 3), rari.join(', '))
  uguale('il leggendario tiene la sua', COSE['spada@9.u.zanna-del-drago'].sprite, 'zanna-del-drago')
  const catalogo = JSON.parse(readFileSync(new URL('../../strumenti/sprite/sorgenti/sotterraneo/generati/roba.json', import.meta.url)))
  const conti = {}
  for (const f of catalogo.figure) if (f.pezzo) conti[f.pezzo] = (conti[f.pezzo] || 0) + 1
  const stantio = Object.keys({ ...conti, ...ASPETTI }).filter(b => conti[b] !== (ASPETTI[b] || []).length)
  controlla('dati/aspetti.js è quello del catalogo (se no: roba.py --gioco)', !stantio.length, stantio.join(', '))
}

riassunto('la roba con livello e rarità, e i mostri grossi')
