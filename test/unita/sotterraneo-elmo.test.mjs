/* L'elmo come casella sua (docs/sotterraneo/elmo.md), senza browser: la casella `testa` e chi porta cosa, i numeri a frazione di
   un'armatura, i salvataggi di prima senza il campo, il bottino (un pezzo trovato su sette diventa un copricapo, solo dove sono
   accesi, e spenti non cambia niente), le linguette del fabbro e dell'incantatrice, le chiavi delle anteprime 3D.
   `node test/esegui.mjs sotterraneo-elmo --niente-build` */
import { COSE, CASELLE, CASELLE_DEL_TIPO, COPRICAPI, IN_VENDITA, A_SORTE, PEZZI_DI_BASE, chiaveDelPezzo, guastiDelleCose } from '../../src/giochi/sotterraneo/dati/cose.js'
import { DIF_OGNI_LIVELLI, DIF_TESTA_OGNI_LIVELLI, ABILITA_DEI_PEZZI, UNICI } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { EROI, eroeDi, portaLa } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corredo, ROBA_VUOTA, rileggiRoba, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { copricapoDalTrovato, QUOTA_DEL_COPRICAPO, pezzoDelGrosso } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { GROSSI } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { tappaDelMondo } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { L_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { mercanteDi, schedeDi, schedaDi, guastiDeiMercanti } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { COPRICAPI_3D, copricapoDi, chiaveDellaCosa, chiaveDellEroe, leggiChiave, dotazioneDi } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { CATALOGO_TESTA } from '../../src/giochi/sotterraneo/scena3d/eroi3d/copricapi.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la casella e il catalogo ══════════ */
controlla('la testa è una casella, in coda', CASELLE[CASELLE.length - 1] === 'testa' && CASELLE.length === 7, CASELLE.join())
stessaLista('un posto solo', CASELLE_DEL_TIPO.testa, ['testa'])
uguale('il catalogo è senza guasti', guastiDelleCose().join(' | '), '')
uguale('i mercanti sono senza guasti', guastiDeiMercanti().join(' | '), '')
stessaLista('sei copricapi', COPRICAPI.slice().sort(), ['cappello-mago', 'cappuccio', 'cerchietto', 'cuffia', 'elmo', 'elmo-cornuto'])
for (const k of COPRICAPI) {
  controlla(`${k}: fuori dal bottino e dai banchi di sempre`, !PEZZI_DI_BASE.includes(k) && !IN_VENDITA.includes(k) && !A_SORTE.includes(k))
  controlla(`${k}: senza sprite (lo disegna il 3D), con l'emoji`, !COSE[k].sprite && !!COSE[k].em)
}
for (const e of EROI) {
  const suoi = COPRICAPI.filter(k => portaLa(e, COSE[k]))
  controlla(`${e.chiave}: porta la cuffia e almeno due copricapi della sua famiglia`, suoi.includes('cuffia') && suoi.length >= 3, suoi.join())
}
controlla('il cavaliere e il nano portano gli elmi, non i cappelli', ['cavaliere', 'nano'].every(e => portaLa(eroeDi(e), COSE.elmo) && !portaLa(eroeDi(e), COSE['cappello-mago'])))
controlla('l\'elfa e il mago i cappelli, non gli elmi', ['elfa', 'mago'].every(e => portaLa(eroeDi(e), COSE.cerchietto) && !portaLa(eroeDi(e), COSE['elmo-cornuto'])))
controlla('le abilità che nascono in testa sono quelle del corpo', Object.values(ABILITA_DEI_PEZZI).every(a => a.dove.includes('testa') === a.dove.includes('corpo')))

/* ══════════ 2. i numeri: una frazione di un'armatura ══════════ */
uguale('cresce a metà passo', DIF_TESTA_OGNI_LIVELLI, 2 * DIF_OGNI_LIVELLI)
for (const L of [1, 7, 15, 31, 60]) {
  const elmo = COSE[chiaveDelPezzo('elmo', L)], corazza = COSE[chiaveDelPezzo('corazza', L)], panciotto = COSE[chiaveDelPezzo('panciotto', L)]
  controlla(`al livello ${L} l'elmo para meno della corazza e non più del panciotto`, elmo.dif < corazza.dif && elmo.dif <= panciotto.dif, `${elmo.dif} ${corazza.dif} ${panciotto.dif}`)
  controlla(`al livello ${L} costa meno della corazza`, elmo.prezzo < corazza.prezzo)
}
uguale('l\'elmo al 31 para 2', COSE['elmo@31'].dif, 2)
uguale('un elmo magico si chiama come gli altri pezzi', COSE[chiaveDelPezzo('elmo-cornuto', 5, 'magico', ['vita'])].nome, 'Elmo cornuto robusto')

/* ══════════ 3. addosso ══════════ */
{
  const c = new Corredo({ eroe: 'nano', roba: { ...ROBA_VUOTA(), zaino: ['elmo-cornuto', 'cappello-mago'] } })
  const prima = { dif: c.dif, vita: c.vitaConLaRoba }
  uguale('il confronto parla di difesa', c.confronto('elmo-cornuto').campo, 'dif')
  uguale('e la casella è la testa', c.confronto('elmo-cornuto').dove, 'testa')
  controlla('un elmo meglio di niente si mette da sé', c.vaAddosso('elmo-cornuto'))
  uguale('il cappello no: il nano non porta la stoffa', c.perchéNo('cappello-mago'), 'Il nano non veste la stoffa')
  c.indossaDallaTasca(0)
  uguale('indossato sta in testa', c.testa, 'elmo-cornuto')
  uguale('para un punto in più', c.dif, prima.dif + 1)
  uguale('e tre di vita', c.vitaConLaRoba, prima.vita + 3)
  uguale('si salva', c.roba.testa, 'elmo-cornuto')
  uguale('la scheda lo dice', schedaConLaRoba('nano', c.roba).testa, 'elmo-cornuto')
  c.riponi('testa')
  controlla('riposto torna in tasca', !c.testa && c.zaino.includes('elmo-cornuto'))
  const m = new Corredo({ eroe: 'mago', roba: { ...ROBA_VUOTA(), testa: 'elmo' } })
  m.sistemaIlCorredo()
  controlla('un elmo in testa al mago torna nello zaino', !m.testa && m.zaino.includes('elmo'))
}

/* ══════════ 4. i salvataggi di prima ══════════ */
{
  const vecchio = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada', mancina: 'scudo-legno', corpo: 'corazza', collo: 'medaglione', dito: 'anello-verde', dito2: null, torcia: 0, torce: 0 }
  const r = rileggiRoba(vecchio)
  uguale('senza il campo: niente in testa', r.testa, null)
  uguale('e il resto com\'era', JSON.stringify({ ...r, testa: undefined }), JSON.stringify({ ...vecchio, testa: undefined }))
  const c = new Corredo({ eroe: 'cavaliere', roba: vecchio })
  const s = new Corredo({ eroe: 'cavaliere', roba: { ...vecchio, testa: null } })
  uguale('i numeri sono quelli di prima', `${c.att}|${c.dif}|${c.vitaConLaRoba}`, `${s.att}|${s.dif}|${s.vitaConLaRoba}`)
  const storto = rileggiRoba({ ...vecchio, testa: 'spada-corta' })
  controlla('una cosa che non va in testa torna in tasca', storto.testa === null && storto.zaino.includes('spada-corta'))
  uguale('un id sparito vale niente', rileggiRoba({ ...vecchio, testa: 'elmo-di-nessuno' }).testa, null)
}

/* ══════════ 5. il bottino ══════════ */
{
  uguale('sopra la quota resta il pezzo', copricapoDalTrovato('spada@5.m.att', { tiro: 0.9 }), 'spada@5.m.att')
  const k = copricapoDalTrovato('spada@5.m.att.vita', { tiro: 0, sorte: seminato(3) })
  controlla('sotto la quota un copricapo dello stesso livello e rarità, con altrettante abilità',
    COSE[k].dove === 'testa' && COSE[k].liv === 5 && COSE[k].rarita === 'magico' && Object.keys(COSE[k].abilita).length === 2, k)
  uguale('un leggendario resta quello che è', copricapoDalTrovato('spada@5.u.zanna-del-drago', { tiro: 0 }), 'spada@5.u.zanna-del-drago')
  uguale('una cosa da bere anche', copricapoDalTrovato('pozione', { tiro: 0 }), 'pozione')
  // i forzieri dell'abisso, coi copricapi spenti e accesi: gli stessi pezzi, uno su sette (circa) cambiato in un copricapo
  let tutti = 0, cambiati = 0, guasti = 0, suoi = 0
  for (let seme = 1; seme <= 300; seme++) {
    const giro = cop => {
      const c = new Corsa(L_ABISSO, { seme, rnd: seminato(seme), eroe: 'cavaliere', copricapi: cop })
      return c.livello.robe.filter(r => r.che === 'forziere').map(f => c.rispostaForziere(f, true).cosa)
    }
    const a = giro(false), b = giro(true)
    if (a.length !== b.length) guasti++
    a.forEach((x, i) => {
      if (!COSE[x] || !COSE[x].dove) { if (x !== b[i]) guasti++; return }
      tutti++
      if (x === b[i]) return
      cambiati++
      const p = COSE[x], q = COSE[b[i]]
      if (q.dove !== 'testa' || (q.liv || 1) !== (p.liv || 1) || (q.rarita || 'comune') !== (p.rarita || 'comune')) guasti++
      if (portaLa(eroeDi('cavaliere'), q)) suoi++
    })
  }
  uguale('accesi o spenti, gli stessi forzieri danno le stesse cose (e i copricapi al posto dei pezzi)', guasti, 0)
  dentro('un pezzo su sette, più o meno, diventa un copricapo', cambiati / tutti, QUOTA_DEL_COPRICAPO * 0.5, QUOTA_DEL_COPRICAPO * 1.7)
  dentro('e di solito uno che il cavaliere porta (gli altri a un terzo, come il resto del bottino)', suoi / cambiati, 0.55, 0.95)
  nota(`${tutti} pezzi dai forzieri dell'abisso, ${cambiati} diventati copricapi (${suoi} del cavaliere)`)
  const spenta = new Corsa(L_ABISSO, { seme: 4, rnd: seminato(4) })
  uguale('una corsa li ha spenti di difetto', spenta.copricapi, false)
  uguale('e spenti `trovato` non tocca niente', spenta.trovato('spada@3', 1, 1), 'spada@3')
}

/* ══════════ 5b. il copricapo col nome di un grosso ══════════ */
{
  const g = GROSSI.piumanera, u = UNICI[g.copricapo]
  controlla('Piumanera ha il suo copricapo col nome: da testa, senza famiglia, col modello', !!u && COSE[u.base].dove === 'testa' && !COSE[u.base].famiglia && !!u.modello)
  controlla('il modello c\'è fra quelli dei copricapi', CATALOGO_TESTA.some(d => d.id === u.modello))
  const k = pezzoDelGrosso(g.copricapo, 12)
  controlla('la chiave si rilegge, col nome, senza sprite', COSE[k].unico === g.copricapo && COSE[k].nome === u.nome && !COSE[k].sprite, k)
  uguale('il 3D lo disegna col suo modello', copricapoDi(k).id, u.modello)
  controlla('lo porta chiunque', EROI.every(e => portaLa(e, COSE[k])))
  uguale('il catalogo resta senza guasti', guastiDelleCose().join(' | '), '')
  const cade = cop => {
    const t = tappaDelMondo('corvaia', { eroe: 'mago' })
    const c = new Corsa(t, { seme: 41, rnd: seminato(41), copricapi: cop })
    c.piano = t.piani - 1
    c.nuovoPiano()
    const m = c.livello.robe.find(r => r.che === 'mostro' && r.grosso)
    const prima = c.livello.robe.length
    c.cade(m)
    return c.livello.robe.slice(prima).filter(r => r.che === 'cosa').map(r => r.cosa)
  }
  const spenti = cade(false), accesi = cade(true)
  controlla('spenti, Piumanera lascia solo il suo medaglione', !spenti.some(x => COSE[x].unico === g.copricapo) && spenti.some(x => COSE[x].unico === g.pezzo), spenti.join())
  controlla('accesi, in più il suo copricapo', accesi.some(x => COSE[x].unico === g.copricapo) && accesi.some(x => COSE[x].unico === g.pezzo), accesi.join())
  uguale('e il resto è lo stesso', accesi.filter(x => COSE[x].unico !== g.copricapo).join(), spenti.join())
}

/* ══════════ 6. le botteghe ══════════ */
{
  const fabbro = mercanteDi('armaiolo'), incantatrice = mercanteDi('incantatrice')
  const vede = (m, e, cop) => schedeDi(m, eroeDi(e), null, { copricapi: cop }).map(s => s.chiave)
  controlla('spenti, nessuna linguetta di copricapi', !vede(fabbro, 'cavaliere', false).includes('elmi') && !vede(incantatrice, 'mago', false).includes('cappelli'))
  controlla('accesi, il fabbro ha gli elmi per chi veste il ferro', vede(fabbro, 'cavaliere', true).includes('elmi') && vede(fabbro, 'nano', true).includes('elmi') && !vede(fabbro, 'elfa', true).includes('elmi'))
  controlla('e l\'incantatrice i cappelli per chi veste la stoffa', vede(incantatrice, 'elfa', true).includes('cappelli') && !vede(incantatrice, 'cavaliere', true).includes('cappelli'))
  for (const [eroe, chi, scheda] of [['cavaliere', 'armaiolo', 'elmi'], ['nano', 'armaiolo', 'elmi'], ['elfa', 'incantatrice', 'cappelli'], ['mago', 'incantatrice', 'cappelli']]) {
    const m = mercanteDi(chi), sc = m.schede.find(s => s.chiave === scheda)
    const b = new Bottega({ eroe, finite: 3, crescita: crescitaA(eroeDi(eroe), 6), rnd: seminato(7), copricapi: true })
    b.prepara(chi)
    const qui = b.vistaDi(chi).filter(r => schedaDi(m, r.chiave) === sc)
    controlla(`${eroe} da ${chi}: la linguetta ${scheda} si riempie di copricapi suoi`, qui.length >= 5 && qui.every(r => COSE[r.chiave].dove === 'testa' && b.porta(r.chiave)), qui.map(r => r.chiave).join())
    controlla(`${eroe}: e ce n'è almeno uno da mettersi adesso`, qui.some(r => b.posso(r.chiave)))
    const spenta = new Bottega({ eroe, finite: 3, crescita: crescitaA(eroeDi(eroe), 6), rnd: seminato(7) })
    spenta.prepara(chi)
    uguale(`${eroe}: spenti, niente copricapi sul banco`, spenta.vistaDi(chi).filter(r => COSE[r.chiave].dove === 'testa').length, 0)
    const conto = x => JSON.stringify(x.vistaDi(chi).filter(r => COSE[r.chiave].dove !== 'testa').map(r => r.chiave))
    uguale(`${eroe}: e le altre linguette sono le stesse, accesi o spenti`, conto(b), conto(spenta))
  }
  // comprato si mette da sé, come il resto
  const b = new Bottega({ eroe: 'cavaliere', roba: { ...ROBA_VUOTA(), gemme: 500 }, finite: 3, rnd: seminato(9), copricapi: true })
  b.prepara('armaiolo')
  const elmo = b.vistaDi('armaiolo').find(r => COSE[r.chiave].dove === 'testa' && b.posso(r.chiave))
  b.compraDa('armaiolo', elmo.chiave)
  uguale('l\'elmo comprato va in testa', b.testa, elmo.chiave)
}

/* ══════════ 7. le anteprime 3D ══════════ */
{
  const modelli = new Set(CATALOGO_TESTA.map(d => d.id))
  for (const [base, l] of Object.entries(COPRICAPI_3D)) {
    controlla(`${base}: è un copricapo`, COPRICAPI.includes(base))
    for (const [id] of l) controlla(`${base}: il modello ${id} c'è`, modelli.has(id))
  }
  for (const k of COPRICAPI) controlla(`${k}: ha i suoi modelli`, !!COPRICAPI_3D[k])
  for (const r of ['comune', 'magico', 'raro']) {
    for (const k of COPRICAPI) {
      const p = copricapoDi(chiaveDelPezzo(k, 5, r, r === 'comune' ? [] : ['dif']))
      controlla(`${k} ${r}: un modello del suo pregio`, !!p && COPRICAPI_3D[k].some(m => m[0] === p.id), JSON.stringify(p))
    }
  }
  uguale('lo stesso pezzo, lo stesso modello', copricapoDi('elmo@9.r.dif.vita').id, copricapoDi('elmo@9.r.dif.vita').id)
  const ch = chiaveDellaCosa({ chiave: 'elmo@9.r.dif.vita' }, 'nano')
  uguale('la chiave della casella', ch, `copricapo:${copricapoDi('elmo@9.r.dif.vita').id}:r`)
  uguale('e si rilegge', JSON.stringify(leggiChiave(ch)), JSON.stringify({ tipo: 'copricapo', id: copricapoDi('elmo@9.r.dif.vita').id, rarita: 'raro' }))
  uguale('un modello che non c\'è vale null', leggiChiave('copricapo:pentola:c'), null)
  const roba = { mano: 'ascia', corpo: 'corazza' }
  controlla('l\'eroe senza copricapo ha la chiave di prima (sei campi)', chiaveDellEroe('nano', roba).split(':').length === 6)
  const con = chiaveDellEroe('nano', { ...roba, testa: 'elmo-cornuto' })
  uguale('col copricapo un campo in coda', con, `${chiaveDellEroe('nano', roba)}:${copricapoDi('elmo-cornuto').id}`)
  uguale('e la dotazione lo legge', leggiChiave(con).testa.id, dotazioneDi({ ...roba, testa: 'elmo-cornuto' }).testa.id)
  uguale('niente testa, niente copricapo nella dotazione', dotazioneDi(roba).testa, null)
}

riassunto('l\'elmo come casella sua')
