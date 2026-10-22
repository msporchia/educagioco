/* Ogni gioco dice cosa chiede o cosa insegna: o ha i saperi (domande-dei-giochi), o ha una riga in cosa-insegna. Docs: docs/genitori/giochi.md */
import { GIOCHI } from '../../src/data/giochi.js'
import { DOMANDE } from '../../src/data/domande-dei-giochi.js'
import { INSEGNA, insegnaDi } from '../../src/data/cosa-insegna.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

for (const g of GIOCHI) {
  const dice = !!DOMANDE[g.chiave] || (g.chiede || []).length > 0 || (g.serve || []).length > 0 || !!insegnaDi(g.chiave)
  controlla(`${g.nome} dice cosa chiede o cosa insegna`, dice)
}
for (const [k, v] of Object.entries(INSEGNA)) {
  controlla(`${k}: titolo e testo`, ['Cosa chiede', 'Cosa si impara'].includes(v.titolo) && v.testo.length > 60)
  controlla(`${k} è un gioco che esiste`, GIOCHI.some(g => g.chiave === k))
}
uguale('un gioco sconosciuto non ha niente', insegnaDi('non-esiste'), null)
riassunto('cosa chiede e cosa insegna')
