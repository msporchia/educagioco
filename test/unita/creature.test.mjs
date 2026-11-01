/* Il catalogo comune delle creature (`strumenti/sprite/sorgenti/creature/creature.json`, docs/core/creature.md).

   Una creatura sta in un posto solo e ogni gioco porta nel suo atlante **tutte e sole** quelle che
   dicono il suo nome fra i `giochi`:
     · le coordinate stanno dentro il foglio e i fotogrammi di una creatura hanno la stessa altezza
       (i piedi non ballano), la scheda ha tutto quello che il catalogo descritto racconta;
     · l'atlante del castello porta esattamente le creature del catalogo col castello, e quello del
       sotterraneo quelle col sotterraneo (col nome di `alias` se c'è), con i loro fotogrammi
       (o quelli di `scelta`) e, per chi ha i passi dai video, la corsa di lato e quella di fronte;
     · i mostri, gli eroi e le persone del sotterraneo non hanno sprite (il modello, o la sua sagoma:
       docs/sotterraneo/sagome-3d.md): nell'atlante del sotterraneo restano solo le creature che
       Survivors prende da lì (`sot:` del suo bestiario) e il cavaliere di 0x72 (il castello);
     · i passi in passi/ sono di creature del catalogo;
     · il catalogo descritto (docs/core/creature-catalogo-1.md e -2.md, uno per foglio) ha una voce per creatura. */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { readFileSync, readdirSync } from 'node:fs'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { BESTIARIO } from '../../src/giochi/survivors/scena/figure.js'
import { PEZZI as PEZZI_SOT } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { CREATURE, PEZZI as PEZZI_CAS } from '../../src/giochi/castello/dati/figure.js'

const SORG = new URL('../../strumenti/sprite/sorgenti/creature/', import.meta.url)
const cat = JSON.parse(readFileSync(new URL('creature.json', SORG), 'utf8'))
const ELEMENTI = ['fisico', 'fuoco', 'gelo', 'fulmine', 'veleno', 'sacro']
const [W, H] = cat.dimensione
const chiavi = Object.keys(cat.creature)
nota(`${chiavi.length} creature`)

const passi = readdirSync(new URL('passi/', SORG)).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)).sort()
for (const p of passi) controlla(`passi/${p}.png: «${p}» è nel catalogo`, !!cat.creature[p])

const nomeIn = (gioco, k) => ((cat.creature[k].alias || {})[gioco]) || k
const dei = gioco => chiavi.filter(k => cat.creature[k].giochi.includes(gioco))
const frames = (gioco, k) => {
  const v = cat.creature[k]
  const scelta = (v.scelta || {})[gioco]
  return scelta ? scelta.map(i => v.fotogrammi[i]) : v.fotogrammi
}

for (const k of chiavi) {
  const v = cat.creature[k]
  controlla(`${k}: la chiave è minuscola con trattini`, /^[a-z]+(-[a-z]+)*$/.test(k))
  controlla(`${k}: il foglio c'è`, !!cat.fogli[v.foglio])
  controlla(`${k}: almeno due fotogrammi`, v.fotogrammi.length >= 2)
  for (const [x, y, w, h] of v.fotogrammi)
    controlla(`${k}: un fotogramma sta dentro il foglio`, x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${[x, y, w, h]}`)
  controlla(`${k}: i fotogrammi hanno la stessa altezza`, new Set(v.fotogrammi.map(r => r[3])).size === 1)
  controlla(`${k}: tenuta o scartata col suo perché`, v.tenuta === true || (v.tenuta === false && !!v.perche))
  const s = v.scheda || {}
  for (const c of ['che', 'elemento', 'combatte', 'dove', 'ruolo']) controlla(`${k}: la scheda dice «${c}»`, !!s[c])
  controlla(`${k}: l'elemento è uno di quelli del gioco`, ELEMENTI.includes(s.elemento), s.elemento)
  for (const e of [...(s.resiste || []), ...(s.teme || [])]) controlla(`${k}: «${e}» è un elemento`, ELEMENTI.includes(e))
  for (const [g, quali] of Object.entries(v.scelta || {}))
    controlla(`${k}: la scelta per ${g} ha almeno due pose che esistono`, quali.length >= 2 && quali.every(i => i < v.fotogrammi.length))
  if (v.tenuta === false) controlla(`${k}: scartata non serve a nessun gioco`, v.giochi.length === 0)
  controlla(`${k}: un nome del catalogo non finisce con -fermo-N`, !/-(fermo|corsa|fronte)(-\d+)?$/.test(k))
}

// ── il castello: tutte e sole ──
stessaLista("l'atlante del castello porta le creature del catalogo con il castello", [...CREATURE].sort(), dei('castello').sort())
for (const k of dei('castello')) {
  const n = passi.includes(k)
    ? Object.keys(PEZZI_CAS).filter(p => p.startsWith(`mostro:${k}:lato:`)).length
    : Object.keys(PEZZI_CAS).filter(p => /^mostro:[^:]+:\d+$/.test(p) && p.startsWith(`mostro:${k}:`)).length
  controlla(`castello · ${k}: ha le sue pose`, n >= (passi.includes(k) ? 6 : cat.creature[k].fotogrammi.length), `${n}`)
}

// ── il sotterraneo: tutte e sole ──
const DI_0X72 = new Set(['cavaliere'])   // il castello lo disegna dall'atlante del sotterraneo (components/castello/Regno.vue)
const nomi = dei('sotterraneo').map(k => nomeIn('sotterraneo', k))
controlla('nel sotterraneo due creature non hanno lo stesso nome', new Set(nomi).size === nomi.length)
for (const n of nomi) controlla(`sotterraneo · «${n}» non è il cavaliere di 0x72`, !DI_0X72.has(n))
for (const k of dei('sotterraneo')) {
  const n = nomeIn('sotterraneo', k)
  const attesi = frames('sotterraneo', k).length
  const fermi = Object.keys(PEZZI_SOT).filter(p => new RegExp(`^${n}-fermo-\\d+$`).test(p)).length
  uguale(`sotterraneo · ${n}: i fotogrammi del respiro`, fermi, attesi)
}
// niente creature nell'atlante che il catalogo non dica: solo quelle e il cavaliere
const stelo = new Set(Object.keys(PEZZI_SOT).map(p => (p.match(/^(.+)-fermo-\d+$/) || [])[1]).filter(Boolean))
const permessi = new Set([...nomi, ...DI_0X72])
for (const s of stelo) controlla(`sotterraneo · «${s}» ha una posa «fermo» nell'atlante: è nel catalogo o il cavaliere`, permessi.has(s))
// nessun mostro, eroe o persona del sotterraneo ha più sprite: chi resta col sotterraneo serve a Survivors
const diSurvivors = new Set(Object.values(BESTIARIO).flatMap(b => Object.values(b)).filter(n => n.startsWith('sot:')).map(n => n.slice(4)))
stessaLista('le creature col sotterraneo sono quelle che Survivors prende da lì', [...nomi].sort(), [...diSurvivors].sort())
nota(`mostri del sotterraneo nel bestiario: ${Object.keys(MOSTRI).length}, tutti col modello (nessuno sprite)`)

// ── il catalogo descritto ──
const md = Object.keys(cat.fogli).map(n => readFileSync(new URL(`../../docs/core/creature-catalogo-${n.slice(-1)}.md`, import.meta.url), 'utf8')).join('\n')
for (const k of chiavi) controlla(`creature-catalogo-*.md: c'è la voce di ${k}`, md.includes(`### ${k} \``))
uguale('creature-catalogo-*.md: tutte le voci sono creature del catalogo',
       [...md.matchAll(/^### (\S+) `/gm)].map(m => m[1]).sort().join(' '), [...chiavi].sort().join(' '))

riassunto('il catalogo comune delle creature')
