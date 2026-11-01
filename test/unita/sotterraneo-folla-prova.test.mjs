/* La folla finta delle misure (scena3d/mondo/folla-prova.js, docs/sotterraneo/limiti-3d.md): `&folla=`, `&branco3d=`, `&specie=`,
   `&tetto3d=` dall'indirizzo, e i personaggi posati attorno all'eroe senza sovrapporsi. Senza browser.
   `node test/esegui.mjs sotterraneo-folla-prova`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { leggiFolla, personeFinte, mostriFinti } from '../../src/giochi/sotterraneo/scena3d/mondo/folla-prova.js'

const vuota = leggiFolla('#sotterraneo=mondo&eroe=cavaliere')
controlla('senza cheat nessuna folla e nessun tetto', vuota.folla === 0 && vuota.branco === 0 && vuota.tetto === null)
const f = leggiFolla('#sotterraneo=mondo&folla=12&branco3d=8&specie=lupo,orco&tetto3d=24')
uguale('si leggono folla, branco, tetto e specie', [f.folla, f.branco, f.tetto, f.specie.join()].join('|'), '12|8|24|lupo,orco')
uguale('un numero esagerato si ferma a 64', leggiFolla('#folla=900').folla, 64)

const p = personeFinte(24, 10, 20), m = mostriFinti(16, ['lupo', 'orco'], 10, 20, 1)
uguale('ventiquattro persone', p.length, 24)
controlla('ognuna ha un modello e una chiave sua', new Set(p.map(x => x.chiave)).size === 24 && p.every(x => x.modello))
const tutti = [...p, ...m]
let vicini = 0
for (let a = 0; a < tutti.length; a++) for (let b = a + 1; b < tutti.length; b++) if (Math.hypot(tutti[a].x - tutti[b].x, tutti[a].z - tutti[b].z) < 0.3 && a < p.length === b < p.length) vicini++
controlla('nello stesso gruppo nessuno sta addosso a un altro', vicini === 0, `${vicini} coppie`)
controlla('tutti fra 2 e 10 celle dall\'eroe', tutti.every(x => { const d = Math.hypot(x.x - 10, x.z - 20); return d > 1.9 && d < 10 }))
uguale('le specie a giro', m.slice(0, 4).map(x => x.tipo).join(), 'lupo,orco,lupo,orco')
controlla('i mostri hanno la misura del posto e la scala, sono svegli e pieni', m.every(x => x.alto > 0 && x.scala > 0 && x.alfa === 1 && x.sveglio && x.i >= 900000))

riassunto('la folla finta delle misure')
