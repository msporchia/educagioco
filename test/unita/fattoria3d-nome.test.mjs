/* Il nome della fattoria: si dà, si pulisce, sopravvive al salvataggio e passa all'amico nella fattoria in comune.
   Docs: docs/fattoria3d/nome.md.
   `node test/esegui.mjs fattoria3d-nome`
   tempo: 1 */
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { registra, rifai, mossaInForma } from '../../src/giochi/fattoria3d/motore/registro.js'
import { normalizza, pulisciNomeFattoria, NOME_FATTORIA_MAX } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const nuova = () => new Fattoria3d({ stato: null, borsa: { quante: () => 0, paga: () => true }, ora: () => 1_000_000 })

const f = nuova()
uguale('una fattoria nuova non ha nome', f.nome(), '')
controlla('rinominare riesce, gratis', f.rinomina('Il Regno di Melody').ok)
uguale('il nome sta', f.nome(), 'Il Regno di Melody')
uguale('sopravvive al salvataggio', new Fattoria3d({ stato: JSON.parse(JSON.stringify(f.serializza())), borsa: { quante: () => 0, paga: () => true } }).nome(), 'Il Regno di Melody')
f.rinomina('')
uguale('vuoto lo toglie', f.nome(), '')

uguale('spazi e a capo si ripuliscono', pulisciNomeFattoria('  Orto \n  Felice  '), 'Orto Felice')
uguale('il tetto è rispettato', pulisciNomeFattoria('x'.repeat(100)).length, NOME_FATTORIA_MAX)
controlla('niente tag', !/[<>]/.test(pulisciNomeFattoria('<b>Ciao</b>')))
uguale('uno stato senza nome (di ieri) si legge', normalizza({}).nome, '')
uguale('un nome storto da fuori si ripulisce', normalizza({ nome: 42 }).nome, '42')

// la fattoria in comune: la mossa passa all'amico
const A = nuova(), B = nuova(), inviate = []
registra(A, x => inviate.push(x), { corsia: 0 })
A.rinomina('Casa nostra')
uguale('una mossa registrata: rinomina', inviate.map(x => x.n).join(), 'rinomina')
for (const x of inviate) rifai(B, mossaInForma(JSON.parse(JSON.stringify(x))))
uguale('l\'amico vede il nome', B.nome(), 'Casa nostra')

riassunto()
