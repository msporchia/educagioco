/* ═══════════════════════════════════════════════════════════════════
   IL COPRICAPO DI SERIE — docs/sotterraneo/elmo.md, «Quello di serie»

   Quello che l'eroe ha in testa dal primo giorno è un pezzo vero: un
   eroe nuovo lo ha addosso, un salvataggio di prima lo riceve alla
   lettura (in tasca se la testa porta già un elmo, mai in più), si toglie
   e si rimette, non si vende, non vale numeri e non entra né nel bottino
   né sui banchi. In 3D lo disegna il modello dell'eroe: la testa nuda ha
   la sua chiave, e quello di serie senza tinta lascia le chiavi di prima.
   ═══════════════════════════════════════════════════════════════════ */
import { COSE, COPRICAPI, DI_SERIE, PEZZI_DI_BASE, IN_VENDITA, diSerieDi } from '../../src/giochi/sotterraneo/dati/cose.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { dotazioneDi, chiaveDellEroe, leggiChiave, copricapoDi } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { controlla, uguale as ugualeStretto, riassunto } from '../aiuto/verifica.mjs'

// valori composti: si confrontano come testo
const uguale = (cosa, avuto, atteso) => (typeof atteso === 'object' && atteso !== null ? ugualeStretto(cosa, JSON.stringify(avuto), JSON.stringify(atteso)) : ugualeStretto(cosa, avuto, atteso))

// i dati: uno per eroe, senza numeri e senza prezzo, fuori da bottino e banchi
for (const e of EROI) {
  const k = diSerieDi(e.chiave), c = COSE[k]
  controlla(`${e.chiave}: ha il suo copricapo di serie`, !!c && c.dove === 'testa' && c.diSerie)
  controlla(`${e.chiave}: senza numeri e senza prezzo`, c && !c.dif && !c.vita && !c.luce && !c.prezzo)
}
uguale('uno per eroe', DI_SERIE.length, EROI.length)
controlla('non è nel bottino né sui banchi', DI_SERIE.every(k => !COPRICAPI.includes(k) && !PEZZI_DI_BASE.includes(k) && !IN_VENDITA.includes(k)))

// il corredo
for (const e of EROI) {
  const c = new Corredo({ eroe: e.chiave })
  uguale(`${e.chiave}: parte con il suo in testa`, c.testa, diSerieDi(e.chiave))
  uguale(`${e.chiave}: e lo zaino è vuoto`, c.zaino.length, 0)
}
const c = new Corredo({ eroe: 'mago' })
const k = 'serie-mago'
c.riponi('testa')
controlla('si toglie: va in tasca', c.testa === null && c.zaino.includes(k))
uguale('e non si vende', c.vendi(c.zaino.indexOf(k)), null)
c.indossaDallaTasca(c.zaino.indexOf(k))
controlla('si rimette', c.testa === k && !c.zaino.includes(k))
// una testa nuda salvata e riletta: lo zaino ce l'ha, non se ne fa un secondo
c.riponi('testa')
const r = new Corredo({ eroe: 'mago', roba: c.roba })
uguale('riletto non si duplica', r.zaino.filter(x => x === k).length + (r.testa === k ? 1 : 0), 1)
// un salvataggio di prima: testa vuota, o con un elmo vero
const vecchia = new Corredo({ eroe: 'cavaliere', roba: { v: 1, gemme: 5, zaino: [], mano: null, mancina: null, corpo: null, collo: null, dito: null, dito2: null, testa: null, torcia: 0, torce: 0 } })
uguale('un salvataggio senza testa lo riceve addosso', vecchia.testa, 'serie-cavaliere')
const conElmo = new Corredo({ eroe: 'cavaliere', roba: { v: 1, gemme: 0, zaino: [], testa: 'elmo' } })
uguale('con un elmo in testa lo riceve in tasca, e l\'elmo resta', [conElmo.testa, conElmo.zaino.includes('serie-cavaliere')], ['elmo', true])
const nuovo = new Corredo({ eroe: 'mago' })
const conLui = new Corredo({ eroe: 'mago', roba: { v: 1, gemme: 0, zaino: [], testa: 'serie-mago' } })
uguale('i numeri non si muovono', [conLui.dif, conLui.att, conLui.vitaConLaRoba], [nuovo.dif, nuovo.att, nuovo.vitaConLaRoba])

// il 3D: assente è quello di serie, null la testa nuda, e una tinta si legge
const serie = dotazioneDi({ testa: 'serie-mago' }), nuda = dotazioneDi({ testa: null }), assente = dotazioneDi({})
controlla('quello di serie non è un copricapo da montare', serie.testa === null && assente.testa === null)
uguale('la testa nuda ha il suo id', nuda.testa && nuda.testa.id, 'nuda')
uguale('le chiavi di prima restano le stesse', chiaveDellEroe('mago', { testa: 'serie-mago' }), chiaveDellEroe('mago', {}))
controlla('la testa nuda si legge dalla chiave', (leggiChiave(chiaveDellEroe('mago', { testa: null })) || {}).testa.id === 'nuda')
const tinto = dotazioneDi({ testa: 'serie-mago', tinte: { 'serie-mago': 'rosso' } })
uguale('ritinto: la tinta sta al posto della testa', tinto.tinte && tinto.tinte.testa, 'rosso')
uguale('la sua foto da solo è del copricapo di serie', copricapoDi('serie-mago'), { id: 'serie-mago', rarita: 'comune' })
riassunto('il copricapo di serie')
