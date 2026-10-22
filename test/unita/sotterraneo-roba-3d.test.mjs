/* ═══════════════════════════════════════════════════════════════════
   LA ROBA IN 3D DEL SOTTERRANEO — docs/sotterraneo/roba-3d.md

   La mappa oggetto → figura → modello: la tabella generata (dati/figure3d.js, `npm run roba3d`) coincide con quello che lo
   strumento scriverebbe; ogni figura dei fogli ha una famiglia, e il modulo della famiglia la costruisce oppure il ripiego è
   dichiarato (modulo che non c'è ancora); ogni oggetto da impugnare ha figura o ripiego; quando un modulo manca si torna alla
   base; le chiavi composte; gli aloni.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three'
import { FIGURE3D, SPRITE_FIGURA, FIRMA } from '../../src/giochi/sotterraneo/dati/figure3d.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { UNICI } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { MODULI, modelloDiRoba, creaFigura, moduloDi, creaPezzo, vestiFigura, creaConsumabile } from '../../src/giochi/sotterraneo/scena3d/roba3d.js'
import { creaEroe } from '../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { chiaveDellaCosa } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { aggiungiAlone } from '../../src/giochi/sotterraneo/scena3d/roba3d/aloni.js'
import { creaDaId } from '../../src/giochi/sotterraneo/scena3d/eroi3d/collezione.js'
import { figuraDi, gettone, daGettone } from '../../src/giochi/sotterraneo/scena3d/roba3d-pura.js'
import { testo, FILE_FIGURE3D, FAMIGLIA_DEL_PREFISSO } from '../../strumenti/mappa-roba3d.mjs'
import { FAMIGLIE_ROBA } from '../../strumenti/promuovi-3d.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

// l'eroe disegna la faccia su una tela: in Node ne basta una finta (le vesti si provano addosso a lui)
const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
globalThis.document = globalThis.document || { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }

// la tabella generata: uguale a quella che lo strumento scriverebbe adesso, e la firma torna
controlla('dati/figure3d.js è quello di `npm run roba3d`', readFileSync(FILE_FIGURE3D, 'utf8') === testo())
uguale('la firma del file generato torna', FIRMA, createHash('sha1').update(JSON.stringify({ FIGURE3D, SPRITE_FIGURA })).digest('hex').slice(0, 12))
uguale('le 238 figure dei fogli', Object.keys(FIGURE3D).length, 238)

// ogni figura: una famiglia conosciuta; il modulo la costruisce, o la famiglia non ha ancora un modulo (ripiego dichiarato)
const mancano = FAMIGLIE_ROBA.filter(f => !MODULI[f])
nota(`moduli presenti: ${Object.keys(MODULI).join(', ') || 'nessuno'}; ripiegano sulla base: ${mancano.join(', ') || 'nessuno'}`)
for (const [id, f] of Object.entries(FIGURE3D)) {
  controlla(`${id}: famiglia ${f.famiglia} conosciuta`, FAMIGLIE_ROBA.includes(f.famiglia) && FAMIGLIA_DEL_PREFISSO[id.replace(/-\d+$/, '')] === f.famiglia)
  if (!moduloDi(id)) { controlla(`${id}: senza modulo, la sua famiglia è fra quelle che mancano`, mancano.includes(f.famiglia)); continue }
  if (f.famiglia === 'vesti') {
    const eroe = creaEroe('cavaliere'), togli = vestiFigura(eroe, id)
    controlla(`${id}: il modulo vesti la mette addosso all'eroe`, typeof togli === 'function')
    if (eroe.userData.animaArmatura) { try { eroe.userData.animaArmatura(0.7) } catch (e) { controlla(`${id}: la veste si anima`, false, e.message) } }
    if (togli) togli()
    continue
  }
  const g = creaFigura(id)
  controlla(`${id}: il modulo ${f.famiglia} la costruisce`, !!g && g.isObject3D)
  if (g && g.userData.anima) { try { g.userData.anima(0.7) } catch (e) { controlla(`${id}: anima non si rompe`, false, e.message) } }
}

// gli sprite col nome loro portano a una figura vera; i pezzi col nome hanno la loro
for (const [s, id] of Object.entries(SPRITE_FIGURA)) controlla(`${s} → ${id}: la figura c'è`, !!FIGURE3D[id])
for (const u of Object.keys(UNICI)) controlla(`${u}: il pezzo col nome ha una figura`, !!figuraDi(`${UNICI[u].base}@5.u.${u}`))

// i consumabili: un modello per chiave dal modulo pozioni; l'alone solo ai rarissimi
for (const [k, c] of Object.entries(COSE)) {
  if (c.dove || !c.usa) continue
  const m = modelloDiRoba(k)
  controlla(`${k}: un consumabile del modulo pozioni`, !!m && m.famiglia === 'pozioni' && m.consumabile === k)
  if (!MODULI.pozioni) continue
  const g = m.crea()
  controlla(`${k}: si costruisce`, !!g && g.isObject3D)
  uguale(`${k}: l'alone solo se è rarissimo`, !!g && g.children.some(o => o.isPoints), !!c.rarissimo)
  controlla(`${k}: nelle caselle è il suo modello`, chiaveDellaCosa({ chiave: k }) === `consumabile:${k}:${c.rarissimo ? 'r' : 'c'}`)
}
uguale('un consumabile sconosciuto al modulo', creaConsumabile('spada'), null)
uguale('senza il modulo pozioni niente consumabile (resta lo sprite)', creaConsumabile('pozione', {}), null)

// ogni oggetto da impugnare ha la figura o il ripiego della collezione; i gioielli senza figura restano sprite, e sono questi
const SPRITE_SOLO = ['amuleto-rosso', 'medaglione', 'amuleto-osso']
for (const [k, c] of Object.entries(COSE)) {
  if (!c.dove) continue
  const m = modelloDiRoba(k)
  if (c.dove === 'mano' || c.dove === 'mancina') controlla(`${k}: figura o ripiego`, !!m && (!!m.figura || !!m.ripiego))
  else if (c.dove === 'collo' || c.dove === 'dito') controlla(`${k}: un gioiello con la figura, o fra quelli dichiarati sprite`, (m && m.famiglia === 'gioielli') || SPRITE_SOLO.includes(k))
  else if (c.dove === 'corpo') controlla(`${k}: una veste dei fogli`, !!m && m.famiglia === 'vesti')
}

// le chiavi composte
{
  const m = modelloDiRoba('spada@7.m.fuoco')
  uguale('spada@7.m.fuoco: la figura dello sprite', m.figura, COSE['spada@7.m.fuoco'].sprite)
  uguale('…della famiglia lame', m.famiglia, 'lame')
  uguale('…magica', m.look.rarita, 'magico')
  uguale('…e il ripiego è la base', m.ripiego, 'spada-lunga')
  const r = modelloDiRoba('scudo-ferro@6.r.dif.vita')
  uguale('uno scudo raro', `${r.famiglia} ${r.look.rarita} ${r.ripiego}`, 'scudi raro scudo-rotondo')
  uguale('un leggendario', modelloDiRoba('spada@9.u.zanna-del-drago').look.rarita, 'leggendario')
  uguale('una chiave sconosciuta', modelloDiRoba('nessuna-cosa'), null)
  uguale('una chiave che non si legge', modelloDiRoba('spada@0.x'), null)
  for (const k of ['spada@7.m.fuoco', 'bastone-magico@4.m.fuoco', 'arco-lungo@3', 'scudo-crociato@2.m.dif']) {
    const g = modelloDiRoba(k).crea()
    controlla(`${k}: si costruisce (figura o ripiego)`, !!g && g.isObject3D)
  }
}

// il ripiego: senza il modulo della famiglia si torna al modello della base della collezione
{
  const m = modelloDiRoba('spada@7.m.fuoco', { moduli: {} })
  uguale('senza moduli: nessun modulo', m.modulo, null)
  const g = m.crea()
  uguale('…e il modello è la spada lunga della collezione', g && g.userData.id, 'spada-lunga')
  const rotto = { lame: { crea: () => { throw new Error('a metà') } } }
  const prima = console.warn; console.warn = () => {}
  const h = modelloDiRoba('spada@8.r.att.vita', { moduli: rotto }).crea()
  console.warn = prima
  uguale('un modulo che si rompe: di nuovo la base', h && h.userData.id, 'spada-lunga')
  uguale('un oggetto senza figura né ripiego non si costruisce', creaPezzo({ figura: null, id: null }), null)
}

// i gettoni delle chiavi
uguale('gettone e ritorno', JSON.stringify(daGettone(gettone({ figura: 'spada-28', id: 'spada-lunga', rarita: 'raro', elemento: 'fuoco' }))),
  JSON.stringify({ figura: 'spada-28', id: 'spada-lunga', rarita: 'raro', elemento: 'fuoco' }))
uguale('una figura sconosciuta nel gettone vale null', daGettone('spada-999.spada-lunga.c.nessuno').figura, null)

// gli aloni: comune senza elemento niente; gli altri un Points solo, che si anima e si toglie
{
  const g = creaDaId('spada-lunga')
  const figli = g.children.length
  aggiungiAlone(g, { rarita: 'comune', elemento: 'nessuno' })()
  uguale('comune senza elemento: niente alone', g.children.length, figli)
  for (const rarita of ['magico', 'raro', 'leggendario']) {
    for (const elemento of ['nessuno', 'fuoco', 'ghiaccio']) {
      const togli = aggiungiAlone(g, { rarita, elemento })
      const punti = g.children.filter(o => o.isPoints)
      controlla(`${rarita}/${elemento}: un Points solo`, punti.length === 1 && punti[0].geometry.attributes.position.count > 10)
      g.userData.animaAlone(2.5)
      uguale(`${rarita}/${elemento}: si anima`, g.userData.aloneUniformi.uT.value, 2.5)
      togli()
      uguale(`${rarita}/${elemento}: si toglie`, g.children.length, figli)
      controlla(`${rarita}/${elemento}: e non resta l'animazione`, !g.userData.animaAlone)
    }
  }
  const vuoto = new Group()
  uguale('un gruppo senza superficie: niente alone', (aggiungiAlone(vuoto, { rarita: 'raro' }), vuoto.children.length), 0)
  const scatola = new Group(); scatola.add(new Mesh(new BoxGeometry(1, 2, 0.2), new MeshStandardMaterial()))
  aggiungiAlone(scatola, { rarita: 'leggendario', elemento: 'arcano' })
  controlla('anche su un modello qualunque', scatola.children.some(o => o.isPoints))
}

riassunto('la roba in 3D del sotterraneo')
