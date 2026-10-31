/* Il rapporto degli inutilizzati (`strumenti/sprite/inutilizzati.mjs`, docs/core/sprite.md).

   Non è un cancello: oggi il rapporto elenca cose, e il test non conta quante. Guarda solo che lo
   strumento giri e che dica cose coerenti con le sorgenti:
     · ogni immagine elencata esiste, e ha uno stato che lo strumento conosce;
     · quello che sta in `non-usati/` non risulta mai «letto», e un foglio che ha il suo foglietto sì;
     · le voci «non nominate» sono voci vere dell'atlante, e una voce di cui un file di `src/` scrive il
       nome non c'è;
     · le figure della roba «fuori» sono figure di `roba.json`, e quelle col `pezzo` non ci sono;
     · l'euristica dei nomi composti (`campo_${coltura}${i}`) riconosce un modello e ne rifiuta uno
       con una parte variabile che non compare in nessun file.
   La fattoria è l'eccezione: lì chi disegna dice quali pezzi prende (`VIVI`), e il conto è un cancello —
   l'atlante ha tutti quei pezzi e nient'altro. */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { inventario, nominatoDa, moduloAtlante, pezziVivi, RADICE, SORGENTI } from '../../strumenti/sprite/inutilizzati.mjs'

const r = await inventario()
const STATI = ['letta', 'nessuno', 'allegato', 'schema', 'terzi']

nota(`${r.immagini.length} immagini, ${r.immagini.filter(i => i.stato === 'nessuno').length} che nessuno legge`)
for (const i of r.immagini) {
  controlla(`${i.percorso}: il file c'è`, existsSync(path.join(RADICE, i.percorso)))
  controlla(`${i.percorso}: lo stato «${i.stato}» è uno di quelli noti`, STATI.includes(i.stato))
  if (i.parcheggiata) controlla(`${i.percorso}: quello che sta in non-usati/ non è letto da nessuno`, i.stato !== 'letta')
}
// un foglio generato che ha il suo foglietto accanto è letto
for (const nome of ['scudi.png', 'bottino-e-arredo.png', 'armature-e-vesti.png']) {
  const i = r.immagini.find(x => x.nome === nome)
  controlla(`${nome} è letta dal suo foglietto`, i && i.stato === 'letta')
}

for (const [gioco, v] of Object.entries(r.voci)) {
  const A = await import('../../' + moduloAtlante(gioco))
  const ids = new Set(A.VOCI.map(x => x.id))
  nota(`${gioco}: ${v.nonNominate.length} voci su ${v.voci} che nessun file di src/ nomina`)
  uguale(`${gioco}: il totale delle voci è quello dell'atlante`, v.voci, A.VOCI.length)
  for (const x of v.nonNominate) controlla(`${gioco}: «${x.voce}» è una voce dell'atlante`, ids.has(x.voce))
}

// la fattoria: l'elenco esatto di chi disegna, contro l'atlante
{
  const { vivi, mancano } = await pezziVivi('fattoria')
  const A = await import('../../' + moduloAtlante('fattoria'))
  const morti = Object.keys(A.PEZZI).filter(n => !vivi.has(n))
  nota(`fattoria: ${vivi.size} pezzi disegnati, ${Object.keys(A.PEZZI).length} nell'atlante`)
  uguale('fattoria: ogni pezzo che il codice disegna è nell\'atlante', mancano.join(' '), '')
  uguale('fattoria: l\'atlante non tiene pezzi che nessuno disegna (si tolgono dal foglietto, docs/core/sprite.md)', morti.join(' '), '')
}

const roba = JSON.parse(readFileSync(path.join(SORGENTI, 'sotterraneo/generati/roba.json'), 'utf8')).figure
const perId = new Map(roba.map(f => [f.id, f]))
nota(`roba: ${r.roba.fuori.length} figure su ${r.roba.totale} che nessuno ritaglia né veste`)
uguale('roba: il totale è quello di roba.json', r.roba.totale, roba.length)
uguale('roba: in gioco più fuori fa il totale', r.roba.inGioco + r.roba.fuori.length, r.roba.totale)
for (const f of r.roba.fuori) {
  controlla(`roba: «${f.id}» è una figura del catalogo`, perId.has(f.id))
  controlla(`roba: «${f.id}» non ha un pezzo (se l'ha, è in gioco come aspetto)`, !perId.get(f.id).pezzo)
}

for (const c of r.creature.fuori) controlla(`creature: «${c.creatura}» non ha nessun gioco`, c.creatura && c.perche !== undefined)

// l'euristica dei nomi composti
const W = {
  parole: new Set(['campo', 'aglio', 'grano', 'dorme', 'recinto', 'galline', 'goblin']),
  modelli: [
    { re: /^campo_(.+?)$/, testo: 'campo_${c}${i}', file: 'prova.js' },
    { re: /^recinto_(.+?)_(.+?)$/, testo: 'recinto_${s}_${q}', file: 'prova.js' },
  ],
}
controlla('nominatoDa: una parola intera', !!nominatoDa('goblin', W))
controlla('nominatoDa: una parola con la cifra in coda', !!nominatoDa('goblin2', W))
controlla('nominatoDa: un modello con parti che compaiono', !!nominatoDa('campo_aglio3', W))
controlla('nominatoDa: un modello a due buchi', !!nominatoDa('recinto_galline_dorme', W))
controlla('nominatoDa: un modello con una parte che non compare in nessun file', !nominatoDa('recinto_pesci_nuota', W))
controlla('nominatoDa: un nome che nessuno scrive', !nominatoDa('cartello_riso', W))

riassunto('sprite/inutilizzati')
