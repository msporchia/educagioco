/* ═══════════════════════════════════════════════════════════════════
   PORTA — chi ricevi «apri»/«chiudi» prima ancora che esista un verbo

   Qui non gira nessun `Ordine`: si chiama `ricevi` a mano, con un
   `Contesto` vero (da `banco()`, aiuto/finto.js) ma senza livello né
   partita intorno. `mondoFinto` non porta `livello` né
   `comandiPendenti` — servono solo a `Elemento.nomeIn` e ai congegni,
   e nessun altro test finto ne ha mai avuto bisogno prima di questo —
   quindi li si aggiunge qui, non nella impalcatura condivisa.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, chiFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Porta } from '../../../../src/motore/generale/elementi/porta.js'

function bancoPorta (opts) {
  const q = banco(opts)
  q.mondo.livello = {}          // basta a nomeIn(): niente nomi dichiarati, si legge l'id
  q.mondo.comandiPendenti = []  // solo le leve/i totem lo riempiono, ma nomeIn lo ignora
  return q
}

{
  /* «era già aperta»: chi chiede non perde il turno per scoprirlo */
  const porta = new Porta('porta', { x: 0, y: 0, aperta: true })
  const q = bancoPorta({ chi: chiFinto() })
  const risposta = porta.ricevi('apri', q.chi, q.contesto)
  controlla('porta: già aperta risponde finitoSubito',
            risposta.esito.finito && !risposta.esito.speso)
}
{
  /* con la chiave in zaino, si apre in un colpo solo */
  const porta = new Porta('porta', { x: 0, y: 0, chiave: 'chiave-oro' })
  const eroe = chiFinto({ zaino: ['chiave-oro'] })
  const q = bancoPorta({ chi: eroe })
  const risposta = porta.ricevi('apri', eroe, q.contesto)
  controlla('porta: con la chiave si apre, e il battito è speso',
            risposta.esito.finito && risposta.esito.speso)
  controlla('porta: ed è aperta davvero', porta.aperta)
  nota('dice:', risposta.penso)
}
{
  /* senza la chiave in zaino, resta chiusa e dice perché — ma con
     `Esito.finito()`: il battito è speso lo stesso, e chi ha chiesto
     prosegue con l'ordine dopo (non è un `rotto()`, che fermerebbe
     tutto il ramo) */
  const porta = new Porta('porta', { x: 0, y: 0, chiave: 'chiave-oro' })
  const eroe = chiFinto({ zaino: [] })
  const q = bancoPorta({ chi: eroe })
  const risposta = porta.ricevi('apri', eroe, q.contesto)
  controlla('porta: senza la chiave resta chiusa', !porta.aperta)
  controlla('porta: il battito è comunque speso', risposta.esito.finito && risposta.esito.speso)
  controlla('porta: e spiega che manca la chiave', risposta.penso.includes('chiave'))
  /* ── E LO DICHIARA NON RIUSCITO ──
     Non è pignoleria: `Contesto.consegna` scrive col canale verde
     (`registro.fatto`) tutto quello che non porta `riuscito: false`, e
     il `motivo` — l'unica cosa che un bambino rilegge dopo per capire
     perché il piano non ha retto — lo portano solo le righe non
     riuscite. Senza questa parola la porta rispondeva «è chiuso a
     chiave, e la chiave non ce l'ho» e il registro la scriveva come
     un'apertura riuscita, senza motivo: la frase che spiega il
     fallimento c'era, e non arrivava a nessuno. */
  controlla('porta: e la marca come NON riuscita, se no la riga esce verde e senza motivo',
            risposta.riuscito === false)
}
{
  /* la stessa regola per gli altri due rifiuti della porta: quello che
     non si apre a mano, e quello che non si chiude addosso a qualcuno */
  const grata = new Porta('grata', { x: 0, y: 0, aMano: false })
  const q = bancoPorta({ chi: chiFinto() })
  const r1 = grata.ricevi('apri', q.chi, q.contesto)
  controlla('porta: «ci vuole un congegno» è un rifiuto, non una riuscita',
            r1.riuscito === false && !grata.aperta)

  const soglia = new Porta('soglia', { x: 3, y: 3, aperta: true })
  const chiCiSta = chiFinto({ x: 3, y: 3 })
  const q2 = bancoPorta({ chi: chiCiSta })
  const r2 = soglia.ricevi('chiudi', chiCiSta, q2.contesto)
  controlla('porta: «c\'è qualcuno sulla soglia» è un rifiuto, non una riuscita',
            r2.riuscito === false && soglia.aperta)
}
{
  /* si sfonda in più battiti: il primo colpo non basta, il secondo sì —
     e ogni colpo è un `inCorso()`, non un `finito()`, finché non arriva
     alla soglia */
  const porta = new Porta('porta', { x: 0, y: 0, forza: 2 })
  const eroe = chiFinto({ id: 'eroe' })
  const q = bancoPorta({ chi: eroe })
  const primo = porta.ricevi('apri', eroe, q.contesto)
  controlla('porta: la prima spallata non basta', !primo.esito.finito && primo.esito.speso)
  controlla('porta: e resta chiusa', !porta.aperta)
  const secondo = porta.ricevi('apri', eroe, q.contesto)
  controlla('porta: la seconda la sfonda', secondo.esito.finito && secondo.esito.speso)
  controlla('porta: ed è aperta', porta.aperta)
}
{
  /* due che spingono la stessa porta in fili diversi non sommano le
     forze: ognuna fa il suo conto, per id di chi spinge */
  const porta = new Porta('porta', { x: 0, y: 0, forza: 2 })
  const uno = chiFinto({ id: 'uno' })
  const due = chiFinto({ id: 'due' })
  const q = bancoPorta({ chi: uno })
  porta.ricevi('apri', uno, q.contesto)   // 1 spallata di «uno»
  const rispostaDue = porta.ricevi('apri', due, q.contesto)  // 1 spallata di «due», non la 2ª di «uno»
  controlla('porta: la spallata di un altro non fa sommare il conto',
            !rispostaDue.esito.finito && !porta.aperta)
}
{
  /* `aMano: false` — non si apre camminandoci: ci vuole un congegno.
     Il battito è speso (ci si è provato), la porta resta chiusa. */
  const porta = new Porta('porta', { x: 0, y: 0, aMano: false })
  const eroe = chiFinto()
  const q = bancoPorta({ chi: eroe })
  const risposta = porta.ricevi('apri', eroe, q.contesto)
  controlla('porta a comando: chi cammina non la apre', !porta.aperta)
  controlla('porta a comando: e lo dice', risposta.penso.includes('congegno'))
}
{
  /* un congegno (leva, totem) la apre sempre: qui non è arrivato
     nessuno camminando, il segnale è `chi === null` */
  const porta = new Porta('porta', { x: 0, y: 0, aMano: false, chiave: 'chiave-oro' })
  const q = bancoPorta({})
  const risposta = porta.ricevi('apri', null, q.contesto)
  controlla('porta: un congegno la apre sempre, chiave o no',
            porta.aperta && risposta.esito.finito && risposta.esito.speso)
}
{
  /* aprire con la chiave fa comunque rumore: piccolo, un cigolio — non
     un fracasso, ma non silenzio. È il rumore che chi ha la chiave o
     cammina lascia dietro di sé, diverso da chi sfonda. */
  const porta = new Porta('porta', { x: 2, y: 3, chiave: 'chiave-oro' })
  const eroe = chiFinto({ id: 'eroe', zaino: ['chiave-oro'] })
  const q = bancoPorta({ chi: eroe })
  porta.ricevi('apri', eroe, q.contesto)
  const rumore = q.mondo.pendenti.find(p => p.tipo === 'rumore')
  controlla('porta: con la chiave fa un cigolio', !!rumore && rumore.segnale === 'cigolio')
  controlla('porta: e il cigolio parte da chi ha aperto', !!rumore && rumore.da === 'eroe')
}
{
  /* sfondare fa un rumore grande, quello dichiarato dalla porta stessa
     (`rumore`) — non un secondo cigolio in più: un gesto solo, un
     suono solo, e quello grosso. */
  const porta = new Porta('porta', { x: 2, y: 3, forza: 1, rumore: 'fracasso' })
  const eroe = chiFinto({ id: 'eroe' })
  const q = bancoPorta({ chi: eroe })
  porta.ricevi('apri', eroe, q.contesto)
  const rumori = q.mondo.pendenti.filter(p => p.tipo === 'rumore')
  controlla('porta: sfondare fa un fracasso', rumori.length === 1 && rumori[0].segnale === 'fracasso')
}
{
  /* un congegno apre in silenzio? No: un cigolio anche lì — parte dalla
     porta stessa, perché non è arrivato nessuno camminando */
  const porta = new Porta('porta', { x: 4, y: 4, aMano: false })
  const q = bancoPorta({})
  porta.ricevi('apri', null, q.contesto)
  const rumore = q.mondo.pendenti.find(p => p.tipo === 'rumore')
  controlla('porta: un congegno che apre fa un cigolio', !!rumore && rumore.segnale === 'cigolio')
  controlla('porta: e parte dalla porta, non da un\'unità', !!rumore && rumore.da === 'porta')
}
{
  /* chiudersi: non davanti a chi ci sta sopra */
  const porta = new Porta('porta', { x: 3, y: 3, aperta: true })
  const eroe = chiFinto({ x: 3, y: 3 })
  const q = bancoPorta({ chi: eroe })
  const risposta = porta.ricevi('chiudi', eroe, q.contesto)
  controlla('porta: non si chiude su chi ci sta sopra', porta.aperta)
  controlla('porta: e dice perché', risposta.penso.includes('soglia'))

  eroe.x = 5; eroe.y = 5   // si sposta via dalla soglia
  const chiusa = porta.ricevi('chiudi', eroe, q.contesto)
  controlla('porta: libera la soglia e si chiude', !porta.aperta)
  controlla('porta: e il battito è speso', chiusa.esito.finito && chiusa.esito.speso)
}
{
  /* un comando che non la riguarda: non risponde niente */
  const porta = new Porta('porta', { x: 0, y: 0 })
  const q = bancoPorta({ chi: chiFinto() })
  uguale('porta: un comando estraneo torna null', porta.ricevi('premi', q.chi, q.contesto), null)
}

riassunto('porta')
