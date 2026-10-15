/* Gli abitanti di ogni posto (docs/sotterraneo/mostri.md, «Gli abitanti»; il file si chiama ancora «coppie»: erano due, ora sono da due
   a quattro). Ogni discesa e ogni tratto dell'abisso ha le sue creature scelte per ambientazione, un caporale e il suo mostro grosso, e per
   strada ci sono solo quelle; una creatura sta in un posto solo; una zona (la discesa dopo la storia, con un volto nuovo) tiene i suoi
   abitanti per sempre. La forza viene dal livello e non dalla specie: dentro un posto le creature costano più o meno lo stesso in
   risposte (entro il 15%), e il guardiano della chiave è il caporale del posto.
   `node test/esegui.mjs sotterraneo-coppie --niente-build` */
import { CAMPAGNA, L_ABISSO, TRATTI_DELL_ABISSO, PIANI_PER_TRATTO, brancoDi, caporaleDi, guardianoDi, guastiDellaCampagna, guastiDegliAbitanti, postiDelleCreature }
  from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI, CAPORALE, costoInRisposte, guastiDeiMostri } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI, GROSSO_DELLA_DISCESA } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { zonaPotenziata, ORDINE_DELLE_ZONE } from '../../src/giochi/sotterraneo/dati/zone.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { numeriAttesi } from '../../src/giochi/sotterraneo/motore/storia.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

controlla('i mostri non hanno guasti', guastiDeiMostri().length === 0, guastiDeiMostri().join(' · '))
controlla('le discese non hanno guasti', guastiDellaCampagna().length === 0, guastiDellaCampagna().join(' · '))

/* ══════════ 1. gli abitanti, per ambientazione ══════════ */
const ATTESI = {
  altare: { mostri: ['scheletro', 'zombie', 'fantasma'], caporale: 'scheletro-scudo' },
  cantine: { mostri: ['ratto', 'goblin', 'melma'], caporale: 'orco' },
  torre: { mostri: ['pipistrello', 'diavoletto', 'vespa', 'spirito-fuoco'], caporale: 'golem-magma' },
  gallerie: { mostri: ['ragno', 'fungo', 'pianta', 'melma-rosa'], caporale: 'mostro-verde' },
  cisterna: { mostri: ['granchio', 'piranha', 'polpo', 'fantasma-azzurro'], caporale: 'tartaruga' },
  labirinto: { mostri: ['lupo', 'cinghiale', 'serpente', 'ent'], caporale: 'golem-muschio' },
  fondo: { mostri: ['scorpione', 'golem', 'spirito-elettrico'], caporale: 'golem-lava' },
}
for (const t of CAMPAGNA) {
  stessaLista(`${t.chiave}: i suoi abitanti`, t.mostri, ATTESI[t.chiave].mostri)
  uguale(`${t.chiave}: il suo caporale`, t.caporale, ATTESI[t.chiave].caporale)
  controlla(`${t.chiave}: da due a quattro abitanti`, t.mostri.length >= 2 && t.mostri.length <= 4)
  stessaLista(`${t.chiave}: brancoDi dice gli stessi abitanti a ogni piano`, [0, 1, 2].map(p => brancoDi(t, p).join()).filter((x, i, v) => v.indexOf(x) === i), [t.mostri.join()])
  uguale(`${t.chiave}: caporaleDi dice lo stesso caporale a ogni piano`, [0, 1, 2].map(p => caporaleDi(t, p)).filter((x, i, v) => v.indexOf(x) === i).join(), t.caporale)
}
stessaLista('l\'abisso, per tratto', TRATTI_DELL_ABISSO.map(t => t.mostri), [['melma-viola', 'mostro-viola', 'pipistrello-occhio', 'ombra'], ['ghoul', 'teschio-azzurro', 'mummia'],
                                                                           ['draghetto', 'occhio', 'golem-pietra', 'grifone'], ['bestia-cornuta', 'negromante', 'troll-clava']])
stessaLista('e i suoi caporali', TRATTI_DELL_ABISSO.map(t => t.caporale), ['golem-ghiaccio', 'mietitore', 'drago', 'drago-lava'])
controlla('ogni tratto ha da due a quattro abitanti', TRATTI_DELL_ABISSO.every(t => t.mostri.length >= 2 && t.mostri.length <= 4))
controlla('nessun capo per strada', CAMPAGNA.every(t => t.mostri.every(k => !MOSTRI[k].capo)))
controlla('un posto che non va è un guasto: un capo, una creatura che non esiste, una sola creatura, cinque, il caporale anche per strada',
          guastiDegliAbitanti('x', ['gigante', 'ratto'], 'orco').length > 0 && guastiDegliAbitanti('x', ['unicorno', 'ratto'], 'orco').length > 0 &&
          guastiDegliAbitanti('x', ['ratto'], 'orco').length > 0 && guastiDegliAbitanti('x', ['ratto', 'melma', 'goblin', 'lupo', 'fungo'], 'orco').length > 0 &&
          guastiDegliAbitanti('x', ['ratto', 'melma'], 'ratto').length > 0 && guastiDegliAbitanti('x', ['ratto', 'melma'], 'orco').length === 0)

/* ══════════ 2. una creatura sta in un posto solo ══════════
   Né in due discese né fra le discese e l'abisso (l'utente, 12 ottobre: «il ragno solo nella grotta, il vespone fuori dalla botola, il
   pipistrello solo nella torre, la pianta solo nella grotta»). I sette mostri grossi sono nomi e non abitanti: tornano nell'abisso, più forti */
{
  const posti = postiDelleCreature()
  const doppi = Object.entries(posti).filter(([, v]) => v.length > 1).map(([k, v]) => `${k} (${v.join(', ')})`)
  controlla('nessuna creatura in due posti', !doppi.length, doppi.join(' · '))
  for (const k of ['ragno', 'vespa', 'pipistrello', 'pianta']) uguale(`${k}: un posto solo`, (posti[k] || []).length, 1)
  uguale('il ragno sta nella grotta', posti.ragno[0], 'gallerie')
  uguale('il vespone non sta nella botola', posti.vespa[0], 'torre')
  uguale('il pipistrello sta nella torre', posti.pipistrello[0], 'torre')
  uguale('la pianta sta nella grotta', posti.pianta[0], 'gallerie')
  // la cripta è il posto degli scheletri (e lo scheletro non sta altrove)
  uguale('lo scheletro sta nella cripta', posti.scheletro[0], 'altare')
  // ogni abitante e ogni caporale ha il suo sprite e le sue misure: otto ossa, difesa 0 o 1
  for (const k of Object.keys(posti)) controlla(`${k}: otto ossa e difesa 0 o 1 (la forza viene dal livello)`, MOSTRI[k].ossa === 8 && MOSTRI[k].dif <= 1 || !!MOSTRI[k].capo)
}

/* ══════════ 3. per strada ci sono solo loro ══════════
   Mostri di strada, branchi, appostati, caporali e il guardiano: nessun altro. Il grosso e quelli delle missioni hanno il loro nome */
const stradaDi = (tappa, semi = [3, 8, 21], piani = null) => {
  const visti = new Set()
  for (const seme of semi) {
    const c = new Corsa(tappa, { seme, rnd: seminato(seme) })
    for (let p = 0; p < (piani || Math.min(tappa.piani, 6)); p++) {
      c.piano = p
      c.nuovoPiano()
      for (const r of c.livello.robe) if (r.che === 'mostro' && !r.grosso && !r.missione) visti.add(r.tipo)
    }
  }
  return [...visti].sort()
}
for (const t of CAMPAGNA) {
  const visti = stradaDi(t, [3, 8, 21, 34, 55])
  const ammessi = new Set([...t.mostri, t.caporale])
  controlla(`${t.chiave}: per strada solo i suoi abitanti e il suo caporale`, visti.every(k => ammessi.has(k)), visti.join())
  controlla(`${t.chiave}: e se ne vedono almeno due`, visti.filter(k => t.mostri.includes(k)).length >= 2, visti.join())
}

/* ══════════ 4. una zona tiene i suoi abitanti, rinascendo ══════════ */
for (const [k, t] of CAMPAGNA.entries())
  for (const L of [6, 12, 20, 34, 61]) {
    const z = zonaPotenziata(k, L)
    stessaLista(`${t.chiave} zona al ${L}: gli stessi abitanti della discesa`, z.mostri, t.mostri)
    uguale(`${t.chiave} zona al ${L}: lo stesso caporale`, z.caporale, t.caporale)
  }
controlla('e le sette zone hanno sette insiemi di abitanti diversi', new Set(ORDINE_DELLE_ZONE.map(ch => CAMPAGNA.find(t => t.chiave === ch).mostri.join())).size === 7)
for (const k of [1, 4]) for (const L of [12, 40]) {
  const visti = stradaDi(zonaPotenziata(k, L), [5, 9], 5)
  controlla(`${CAMPAGNA[k].chiave} al ${L}, giocata: per strada solo i suoi`, visti.every(x => CAMPAGNA[k].mostri.includes(x) || x === CAMPAGNA[k].caporale), visti.join())
}

/* ══════════ 5. l'abisso: gli abitanti del tratto ══════════ */
{
  const fuori = []
  for (const seme of [7, 41]) {
    const c = new Corsa(L_ABISSO, { seme, rnd: seminato(seme) })
    for (let p = 0; p < PIANI_PER_TRATTO * TRATTI_DELL_ABISSO.length + 4; p++) {
      c.piano = p
      c.nuovoPiano()
      const ammessi = [...brancoDi(L_ABISSO, p), caporaleDi(L_ABISSO, p)]
      for (const r of c.livello.robe)
        if (r.che === 'mostro' && !r.grosso && !ammessi.includes(r.tipo)) fuori.push(`${r.tipo} al piano ${p + 1} (${ammessi.join(', ')})`)
    }
  }
  controlla('nell\'abisso per strada solo gli abitanti e il caporale del tratto', !fuori.length, fuori.slice(0, 3).join(' · '))
}

/* ══════════ 6. la forza viene dal livello: il costo in risposte dentro un posto ══════════
   Con la roba attesa di ogni eroe, gli abitanti di una discesa costano entro il 15% uno dall'altro (ossa diviso quello che passa della
   difesa, `costoInRisposte`), a ogni piano. Sono i caporali e il grosso i picchi, non la specie */
{
  const male = []
  for (const [k, t] of CAMPAGNA.entries()) {
    if (k === 0) continue   // la cripta si scende a mani nude: la difesa pesa sull'attacco di 3 (e ci sono tutti a difesa 1)
    for (const e of EROI) {
      const att = numeriAttesi(e.chiave, k).att
      const c = t.mostri.map(m => costoInRisposte(MOSTRI[m], att))
      if (Math.max(...c) / Math.min(...c) > 1.15) male.push(`${t.chiave} ${e.chiave}: ${c.map(x => x.toFixed(2)).join(' contro ')}`)
    }
  }
  controlla('dentro una discesa gli abitanti costano entro il 15%, con la roba attesa di ogni eroe', !male.length, male.slice(0, 3).join(' · '))
  controlla('la cripta: tutti alla stessa difesa, a mani nude', new Set(CAMPAGNA[0].mostri.concat(CAMPAGNA[0].caporale).map(m => MOSTRI[m].dif)).size === 1)
  // e nel piano vero, con le ossa che crescono col livello: lo stesso rapporto, specie per specie
  const peggio = []
  for (const t of CAMPAGNA) {
    const c = new Corsa(t, { seme: 11, rnd: seminato(11) })
    const media = {}
    for (const p of [0, t.piani - 1]) {
      c.piano = p; c.nuovoPiano()
      for (const r of c.livello.robe) if (r.che === 'mostro' && !r.grosso && !r.caporale && !r.chiave && t.mostri.includes(r.tipo) && (!r.grado || r.grado === 'comune'))
        (media[`${p}|${r.tipo}`] = media[`${p}|${r.tipo}`] || []).push(r.ossa / MOSTRI[r.tipo].ossa)
    }
    for (const [chiave, v] of Object.entries(media)) if (new Set(v.map(x => x.toFixed(3))).size > 1) peggio.push(`${t.chiave} ${chiave}`)
  }
  controlla('a ogni piano tutti i mostri della stessa specie hanno le stesse ossa (la forza è del piano, non del singolo; una variante non le tocca, e un grado solo dal magico in su)', !peggio.length, peggio.slice(0, 3).join(' · '))
}

/* ══════════ 7. il guardiano, i caporali e i grossi ══════════ */
for (const t of CAMPAGNA) {
  uguale(`${t.chiave}: il guardiano dei primi piani è il suo caporale`, guardianoDi(t, 0), t.piani > 1 ? t.caporale : t.capo)
  controlla(`${t.chiave}: in fondo c'è il suo mostro grosso`, !!GROSSI[GROSSO_DELLA_DISCESA[t.chiave]])
}
{
  const c = new Corsa(CAMPAGNA[3], { seme: 6, rnd: seminato(6) })
  const g = c.livello.robe.find(r => r.che === 'mostro' && r.chiave)
  const base = c.livello.mostro(g.tipo, 0, 0)
  uguale('il guardiano della grotta è il suo caporale', g.tipo, 'mostro-verde')
  controlla('il guardiano è un caporale: più ossa, un colpo in più, un nome, un grado che non è mai comune', g.caporale && g.ossa >= Math.round(base.ossa * (c.livello.crescita.caporali || CAPORALE.ossa)) &&
            g.att >= base.att + CAPORALE.att && /caporale$/.test(g.nome) && g.grado && g.grado !== 'comune', JSON.stringify([g.caporale, g.ossa, base.ossa, g.att, g.nome, g.grado]))
}

riassunto('gli abitanti dei posti')
