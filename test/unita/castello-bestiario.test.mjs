/* Il bestiario del castello: quale creatura fa le veci di quale
   mostro, vestito per vestito (`src/giochi/castello/scena/bestiario.js`).

   Si prova quello che, sbagliato, si vede a schermo come un guasto:
     · ogni mostro ha la sua figura in ogni vestito che si gioca — se no
       il pittore ripiega sulla prima creatura, e una tappa di draghi
       diventa una tappa di melme;
     · chi vola nel gioco vola anche nel disegno: una bestia a quattro
       zampe sospesa sopra la strada;
     · a figura uguale, immunità uguali: la figura è quello che il
       bambino guarda per scegliere la torre, e se lo scorpione nel bosco
       volesse dire «niente frecce» e nella neve «niente bombe» avrebbe
       imparato una cosa falsa;
     · le figure che il bestiario nomina sono **esattamente** quelle che
       l'atlante porta (`dati/figure.js`, `vesti.py --atlante`): una in
       meno è un buco, una in più è peso che nessuno disegna;
     · ogni figura ha un nome da leggere, e delle pose;
     · il piano degli sprite (`strumenti/sprite/DA-GENERARE.md`) nomina
       ogni mostro. */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { readFileSync } from 'node:fs'
import { MOSTRI, firmaImmunita } from '../../src/data/mostri.js'
import { BESTIARIO, NOMI, VOLANO, FIGURE_NOMINATE, figuraDi } from '../../src/giochi/castello/scena/bestiario.js'
import { VESTITO_DI } from '../../src/giochi/castello/scena/vestito.js'
import { CREATURE, PEZZI } from '../../src/giochi/castello/dati/figure.js'

const vestiti = [...new Set(Object.values(VESTITO_DI))].sort()
nota(`${vestiti.length} vestiti, ${FIGURE_NOMINATE.length} figure`)

stessaLista('il bestiario ha tutti e soli i vestiti che si giocano', Object.keys(BESTIARIO).sort(), vestiti)
for (const v of vestiti)
  for (const [id, m] of Object.entries(MOSTRI)) {
    const f = BESTIARIO[v][id]
    controlla(`${v} · ${id}: ha una figura`, !!f)
    if (m.vola) controlla(`${v} · ${id}: vola, e la sua figura vola`, VOLANO.includes(f), f)
  }

/* chi fa chi, figura per figura: tutti i mostri che una figura fa, in
   qualunque vestito, hanno le stesse immunità */
const profili = {}
for (const v of vestiti)
  for (const id of Object.keys(MOSTRI)) (profili[BESTIARIO[v][id]] ||= new Set()).add(firmaImmunita(id))
for (const [f, p] of Object.entries(profili))
  controlla(`${f}: fa sempre mostri con le stesse immunità`, p.size === 1, [...p].join(' · '))

stessaLista("l'atlante porta tutte e sole le figure nominate", [...CREATURE].sort(), FIGURE_NOMINATE)
for (const f of FIGURE_NOMINATE) {
  controlla(`${f}: ha un nome`, !!NOMI[f])
  const pose = Object.keys(PEZZI).filter(k => k.startsWith(`mostro:${f}:`))
  controlla(`${f}: ha almeno tre pose`, pose.length >= 3, `${pose.length}`)
}
uguale('un mostro sconosciuto ripiega su una figura vera', figuraDi('bosco', 'nessuno'), 'melma')

/* il piano degli sprite ha una riga per mostro (`| slime | …`), con la
   creatura di ogni vestito com'è descritta nel foglio: è quella che i
   prompt dei fogli del cammino ricopiano, quindi un mostro che manca lì
   è un mostro che nessuno farà camminare */
const piano = readFileSync(new URL('../../strumenti/sprite/DA-GENERARE.md', import.meta.url), 'utf8')
for (const id of Object.keys(MOSTRI))
  controlla(`il piano degli sprite nomina ${id}`, new RegExp(`^\\| ${id} \\|`, 'm').test(piano))

riassunto('il bestiario del castello')
