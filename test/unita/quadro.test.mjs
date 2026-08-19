/* ═══════════════════════════════════════════════════════════════════
   IL QUADRO DI UN'ETÀ — cosa promette la manopola dei grandi.

   La manopola dell'età mostra un riassunto: quante carte in home, come
   si spartiscono le domande, cosa cambia spostandosi di mezzo anno. Il
   guasto da temere qui **non è un errore**: è una bugia. Un riassunto
   che dice «entra La bancarella» e poi in home la bancarella non c'è
   non fa cadere niente e non scrive niente in console — fa solo
   decidere un genitore guardando un numero falso, che è il contrario
   esatto del motivo per cui il riassunto esiste.

   Perciò qui si prova soprattutto **che il quadro dica la stessa cosa
   che fanno le regole vere**: le stesse funzioni di `data/portata.js`,
   le stesse eccezioni di `data/partenze.js`, gli stessi confini di
   `quiz/nucleo/catalogo.js`.

   Le classi di domande arrivano leggendo la cartella dei moduli con
   `fs`, come fa `unita/quiz`: il registro vero gira solo sotto Vite, e
   un test che non le carica proverebbe metà del quadro senza
   accorgersene.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { quadroDi, giochiDiUnEta, differenzaFra } from '../../src/data/quadro.js'
import { classiDelModulo, FASCE_ETA, doveCadeCon } from '../../src/quiz/nucleo/catalogo.js'
import { PARTENZE, partenzaPerEta, eccezioniPerEta, eccezioniDi } from '../../src/data/partenze.js'
import { TAPPE_DEL_GIOCO } from '../../src/data/portata-giochi.js'
import { giocoDaOffrire } from '../../src/data/portata.js'
import { GIOCHI } from '../../src/data/giochi.js'
import { SAPERI } from '../../src/data/saperi.js'
import { sorgentiDi } from '../../src/quiz/nucleo/esempi.js'
import { finestraDi } from '../../src/quiz/nucleo/classi.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

const classi = []
const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) { moduli.push(mod); classi.push(...classiDelModulo(mod)) }
  }
controlla('le classi di domande si caricano dalla cartella', classi.length > 20,
          `${classi.length} classi`)

/* ── la fascia più vicina ──
   È la sola cosa che l'età non sa dire da sé — quali giochi mettere in
   casa e cosa dare per scontato — e il confine fra due fasce è dove si
   sbaglia: il pari deve andare alla più piccola. */
uguale('a 4 anni si parte dai piccoli', partenzaPerEta(4).chiave, 'piccoli')
uguale('a 5,75 il pari va alla fascia più piccola', partenzaPerEta(5.75).chiave, 'piccoli')
uguale('a 6 si è in prima', partenzaPerEta(6).chiave, 'prima')
uguale('a 8 si è in terza', partenzaPerEta(8).chiave, 'terza')
uguale('a 12 si resta in quarta, che è l\'ultima', partenzaPerEta(12).chiave, 'quarta')
uguale('un\'età che non è un numero non sceglie niente', partenzaPerEta('boh'), null)

/* Ogni fascia deve ritrovare se stessa passando dalla propria età: se
   no la manopola, ferma sull'età di una partenza, scriverebbe le
   eccezioni di un'altra. */
for (const p of PARTENZE)
  uguale(`«${p.nome}» si ritrova partendo dai suoi ${p.anni} anni`,
         partenzaPerEta(p.anni).chiave, p.chiave)

/* `eccezioniPerEta` è `eccezioniDi` della fascia vicina, ma con l'età
   FINE: 7 anni sta nella fascia dei 6,5 e deve restare 7. Sbagliare
   qui vorrebbe dire che la manopola si riporta indietro da sola. */
const e7 = eccezioniPerEta(7)
uguale('l\'età fine non si riallinea a quella della fascia', e7.eta, 7)
uguale('le eccezioni sono quelle della fascia vicina',
       Object.keys(e7.sa).sort().join(','),
       Object.keys(eccezioniDi('prima').sa).sort().join(','))

/* ── i giochi ──
   Il quadro deve dire quello che direbbe la home, non una sua
   approssimazione: stesso `giocoDaOffrire`, stesse eccezioni. */
const inCasa = q => q.filter(g => g.stato === 'qui').map(g => g.chiave)
for (const eta of [5, 6.5, 8, 9.5]) {
  const ecc = eccezioniPerEta(eta)
  const visti = inCasa(giochiDiUnEta({ eta, ...ecc }))
  const attesi = GIOCHI
    .filter(g => !g.sperimentale)
    .filter(g => !(g.serve || []).some(s => ecc.sa[s] === false))
    .filter(g => ecc.giochi[g.chiave] !== false)
    .filter(g => {
      const t = TAPPE_DEL_GIOCO[g.chiave]
      return !t || giocoDaOffrire(t, { eta, spenti: Object.keys(ecc.sa), provato: false })
    })
    .map(g => g.chiave)
  uguale(`a ${eta} anni il quadro dice quello che direbbe la home`,
         visti.join(' '), attesi.join(' '))
  nota(`${eta} anni → ${visti.length} carte: ${visti.join(' ')}`)
}

/* ── L'ELENCO È INTERO, E OGNUNO HA IL SUO PERCHÉ ──
   La schermata non dice più «arriva X» / «non compare più Y»: mostra
   tutti i giochi con lo stato addosso. Quindi nessuno può restare senza
   stato, e soprattutto **`spento` deve voler dire una cosa sola**: l'ha
   spento un grande. Se ci finisse dentro anche quello che ha spento
   l'età, la schermata manderebbe qualcuno a cercare un interruttore che
   non ha mai premuto — è successo col laboratorio delle pozioni, che a
   otto anni è fuori perché a otto anni le conversioni non si sono
   ancora fatte. */
for (const eta of [4, 7, 9]) {
  const tutti = giochiDiUnEta({ eta, ...eccezioniPerEta(eta) })
  uguale(`a ${eta} anni l'elenco è intero`, tutti.length,
         GIOCHI.filter(g => !g.sperimentale).length)
  uguale(`e a ${eta} anni nessuno è «spento da te»: nessuno ha toccato niente`,
         tutti.filter(g => g.stato === 'spento').map(g => g.chiave).join(',') || '—', '—')
  nota(`${eta} anni → ` +
    ['qui', 'passato', 'avanti'].map(st =>
      `${st}: ${tutti.filter(g => g.stato === st).map(g => g.chiave).join(' ') || '—'}`).join(' | '))
}
/* e il contrario: quello che spegne un grande si vede come suo */
uguale('un gioco spento a mano si dichiara spento a mano',
  giochiDiUnEta({ eta: 9, giochi: { dungeon: false }, sa: {} })
    .find(g => g.chiave === 'dungeon').stato, 'spento')

/* Il caso che ha fatto nascere la conversazione: a sette anni la
   bancarella si vede. La sua prima giornata è tarata su 7 anni, e il
   flag `grandi` che la spegneva era una taratura sbagliata, non una
   scelta — se qualcuno lo rimette, questo test lo dice. */
controlla('a 7 anni la bancarella è in home',
          inCasa(giochiDiUnEta({ eta: 7, ...eccezioniPerEta(7) })).includes('bancarella'))
controlla('a 5 anni la bancarella non c\'è ancora',
          !inCasa(giochiDiUnEta({ eta: 5, ...eccezioniPerEta(5) })).includes('bancarella'))

/* ── UN POSTO NON SI NASCONDE ──
   La fattoria non è una scaletta: è il prato dove si spende quello che
   si guadagna altrove, e non si giudica per età **da nessuna delle due
   parti**. Il tranello è che le due direzioni si rompono con lo stesso
   flag e in versi opposti: dichiararla `piccoli` la farebbe comparire a
   quattro anni e sparire a nove, e non dichiarare niente la fa sparire
   a quattro. Per questo si prova a tutte e due le estremità, con le
   eccezioni della partenza addosso — che è il caso in cui è successo. */
for (const a of [4, 5, 5.5, 7, 9, 12])
  controlla(`a ${a} anni la fattoria c'è`,
            inCasa(giochiDiUnEta({ eta: a, ...eccezioniPerEta(a) })).includes('fattoria'))

/* ── le domande ──
   Ogni classe cade in un blocco e in uno solo, e i conti dei blocchi
   devono fare il totale: una riga persa non si vedrebbe da nessuna
   parte se non da qui. */
for (const eta of [5, 7, 9, 11]) {
  const q = quadroDi({ eta, ...eccezioniPerEta(eta) }, { classi })
  const somma = q.fasce.reduce((n, f) => n + f.quante, 0) + q.spente
  uguale(`a ${eta} anni nessuna classe si perde per strada`, somma, classi.length)
  nota(`${eta} anni → ` + q.fasce.map(f => `${f.nome}: ${f.quante}`).join(' · ') +
       ` · spente: ${q.spente}`)
}

/* Il blocco di mezzo deve restare **leggibile**: se «Nel segno» si
   mangia tutto, i cinque blocchi sono uno solo con quattro etichette —
   ed è esattamente il difetto per cui il confine alto è stato stretto
   a mano invece che preso dalla mira. */
for (const eta of [6, 8, 10]) {
  const q = quadroDi({ eta, sa: {}, giochi: {} }, { classi })
  const nelSegno = q.fasce.find(f => f.chiave === 'medie').quante
  const vive = q.fasce.reduce((n, f) => n + f.quante, 0)
  controlla(`a ${eta} anni «Nel segno» non si mangia l'elenco`,
            nelSegno > 0 && nelSegno < vive * 0.6, `${nelSegno} su ${vive}`)
}

/* Le due estreme sono le domande **escluse**: quello che sta lì dentro
   non deve poter uscire. Il controllo è sul confine vero, quello di
   `doveCadeCon`, e serve a impedire che il riassunto e la pesca
   raccontino due storie diverse. */
{
  const eta = 8
  const dove = doveCadeCon(eta)
  const q = quadroDi({ eta, sa: {}, giochi: {} }, { classi })
  const sbagliate = q.righe.filter(r => r.dove !== 'spenta' &&
    r.dove !== dove(classi.find(c => c.chiave === r.chiave).livello))
  uguale('ogni riga sta dove la mette il classificatore condiviso', sbagliate.length, 0)
}

/* Una classe che dipende da un sapere spento è **tolta**, non «troppo
   facile»: metterla fra quelle sotto direbbe una cosa falsa su un
   bambino che quella roba non l'ha mai vista. */
{
  const conSpenti = quadroDi({ eta: 9, sa: { moltiplicazioni: false } }, { classi })
  const senza = quadroDi({ eta: 9, sa: {} }, { classi })
  controlla('spegnere un sapere sposta delle righe fra le spente',
            conSpenti.spente > senza.spente, `${senza.spente} → ${conSpenti.spente}`)
}

/* ── QUELLO CHE SI DÀ PER SCONTATO, AL POSITIVO ──
   La schermata lo dice così — «dà per scontato che sappia: le
   moltiplicazioni, le decine…» — e non più al negativo, per un motivo
   che vale la pena tenere fermo: al negativo il grande deve
   ricostruire per differenza le altre trenta cose, che non sono
   scritte da nessuna parte; al positivo scorre l'elenco e si ferma
   appena ci legge dentro qualcosa che il bambino non sa.

   Due cose devono reggere perché quell'elenco significhi qualcosa:
   che **cresca** con l'età, e che **cominci dalle ultime arrivate** —
   un elenco che parte da «i numeri e le quantità» dice la stessa cosa
   a quattro anni e a undici. */
{
  const a = quadroDi({ eta: 5, ...eccezioniPerEta(5) }, { classi })
  const b = quadroDi({ eta: 9, ...eccezioniPerEta(9) }, { classi })
  controlla('crescendo si dà per scontato di più',
            b.sa.length > a.sa.length, `${a.sa.length} → ${b.sa.length}`)
  controlla('il nome si legge, non è la chiave',
            b.sa.some(x => x.nome === 'Le moltiplicazioni'), b.sa.slice(0, 3).map(x => x.nome).join(', '))
  controlla('e in cima ci sono le ultime arrivate, non le eterne',
            b.sa[0].da >= b.sa[b.sa.length - 1].da,
            `${b.sa[0].nome} … ${b.sa[b.sa.length - 1].nome}`)
  nota(`a 9 anni dà per scontato, i primi: ${b.sa.slice(0, 4).map(x => x.nome).join(', ')}`)
  /* e spegnere a mano toglie dall'elenco: è la stessa lista che il
     grande sta guardando quando decide */
  const tolto = quadroDi({ eta: 9, sa: { moltiplicazioni: false } }, { classi })
  controlla('un sapere spento sparisce da quello che si dà per scontato',
            !tolto.sa.some(x => x.chiave === 'moltiplicazioni'))
}

/* ── LE DOMANDE, IN QUATTRO ELENCHI ──
   I tre conti e la barra sono spariti: sapere che ce ne sono
   venticinque «nel segno» non fa decidere niente, perché non dice
   *quali*. Al loro posto quattro gruppi con dentro i nomi, e le due
   cose da tenere ferme sono le due che rendono un elenco leggibile
   invece che un dump del catalogo.

   **Niente doppioni**, e non solo dentro un gruppo: la stessa
   tipologia esce a più gradi (è giusto nel catalogo, dove ogni riga ha
   un suo peso) e a gradi lontani cade in due gruppi diversi. Lo stesso
   nome sotto due etichette opposte — «la ripassa» e «è difficile» — si
   legge come un errore. */
{
  const q = quadroDi({ eta: 8, ...eccezioniPerEta(8) }, { classi })
  const chiavi = q.gruppi.map(g => g.chiave)
  uguale('i gruppi sono quattro, dal ripasso a quello che non si chiede più',
         chiavi.join(' '), 'facili medie toste sotto')
  const nomi = q.gruppi.flatMap(g => g.righe.map(r => r.nome))
  uguale('e nessun nome compare due volte', nomi.length - new Set(nomi).size, 0)
  controlla('a otto anni sta studiando qualcosa',
            q.gruppi.find(g => g.chiave === 'medie').righe.length > 0)
  for (const g of q.gruppi)
    nota(`8 anni · ${g.chiave}: ${g.righe.length} — ${g.righe.slice(0, 2).map(r => r.nome).join(' · ')}`)
}

/* **Crescendo la fila scorre**: quello che era da studiare diventa
   ripasso, e alla fine non si chiede più. Se i gruppi non si
   svuotassero e riempissero in quest'ordine vorrebbe dire che l'età
   non sta spostando niente — che è il difetto che questa schermata
   esiste per rendere visibile. */
{
  const quanti = (eta, k) => quadroDi({ eta, sa: {} }, { classi })
    .gruppi.find(g => g.chiave === k).righe.length
  controlla('a sei anni non c\'è quasi niente di già superato', quanti(6, 'sotto') === 0)
  controlla('a undici invece sì', quanti(11, 'sotto') > 10, String(quanti(11, 'sotto')))
  controlla('e le difficili si assottigliano crescendo',
            quanti(11, 'toste') < quanti(6, 'toste'),
            `${quanti(6, 'toste')} → ${quanti(11, 'toste')}`)
}

/* ── la differenza ──
   Fermi sulla stessa età non deve muoversi niente: è il caso che dice
   alla schermata di andare dritta senza chiedere conferma. */
{
  const q = quadroDi({ eta: 8, ...eccezioniPerEta(8) }, { classi })
  const d = differenzaFra(q, q)
  uguale('la stessa età non muove nessun gioco', d.cambiati.length, 0)
  uguale('e non cambia niente di quello che si dà per scontato',
         d.imparati.length + d.dimenticati.length, 0)
  uguale('e nessuna domanda', d.piuFacili.length + d.piuToste.length, 0)
}

/* Mezzo anno dentro la stessa fascia non tocca giochi né saperi — è la
   promessa su cui poggia la conferma della schermata: si chiede solo
   quando c'è davvero qualcosa da riscrivere. */
{
  const [a, b] = [8, 8.5]
  uguale('8 e 8,5 stanno nella stessa fascia',
         partenzaPerEta(a).chiave, partenzaPerEta(b).chiave)
  const d = differenzaFra(quadroDi({ eta: a, ...eccezioniPerEta(a) }, { classi }),
                          quadroDi({ eta: b, ...eccezioniPerEta(b) }, { classi }))
  uguale('dentro la stessa fascia non si tocca nessun sapere',
         d.imparati.length + d.dimenticati.length, 0)
  controlla('ma le domande si spostano lo stesso',
            d.piuFacili.length + d.piuToste.length > 0)
}

/* Salire d'età rende le domande **più facili**, non più difficili: il
   bambino cresce, la stessa domanda scende di blocco. Verso opposto
   vuol dire che i confini sono stati invertiti da qualche parte, che è
   il difetto che si vede peggio a occhio. */
{
  const d = differenzaFra(quadroDi({ eta: 7, sa: {} }, { classi }),
                          quadroDi({ eta: 9, sa: {} }, { classi }))
  controlla('crescendo le domande scendono di blocco', d.piuFacili.length > 0)
  uguale('e nessuna sale', d.piuToste.length, 0)
}

/* E il verso dei giochi: crescendo si guadagnano le carte dei grandi e
   si perdono quelle dei piccolissimi. Che se ne perda qualcuna è
   giusto; che non se ne guadagni nessuna vorrebbe dire che l'età non
   sta più aprendo niente. */
{
  const d = differenzaFra(quadroDi({ eta: 6, ...eccezioniPerEta(6) }, { classi }),
                          quadroDi({ eta: 9, ...eccezioniPerEta(9) }, { classi }))
  const entrati = d.cambiati.filter(g => g.stato === 'qui')
  controlla('da 6 a 9 anni entrano dei giochi', entrati.length > 0,
            entrati.map(g => g.nome).join(', '))
  controlla('e qualcuno risulta già passato',
            d.cambiati.some(g => g.stato === 'passato'))
  nota(`da 6 a 9 anni: ${d.cambiati.map(g => `${g.nome} ${g.prima}→${g.stato}`).join(' · ')}`)
}

/* ── LE DOMANDE CHE NESSUNO CHIEDE ──
   Il guasto peggiore di un riassunto non è sbagliare un numero: è
   descrivere una cosa che non succede. Da quattro a cinque anni e mezzo
   in casa ci sono tre giochi — Conta gli animali, Prima e dopo, la
   fattoria — e nessuno pesca dai moduli di quiz: i quattro blocchi
   elencavano lo stesso undici classi col tastino per provarle. Qui si
   prova che il quadro lo dica, e che lo dica **guardando i giochi**
   invece di una soglia scritta a mano. */
{
  for (const eta of [4, 4.5, 5, 5.5]) {
    const q = quadroDi({ eta, ...eccezioniPerEta(eta) }, { classi })
    uguale(`a ${eta} anni nessun gioco in casa chiede le domande`,
           q.domande.chiedono, false)
    uguale('e si sa da quando arriveranno', q.domande.da, 6)
    controlla('con i nomi di chi le porterà', q.domande.quali.length > 0,
              q.domande.quali.join(', '))
  }
  const sei = quadroDi({ eta: 6, ...eccezioniPerEta(6) }, { classi })
  uguale('a 6 anni invece qualcuno le chiede', sei.domande.chiedono, true)
  controlla('e sono i giochi che pescano da src/quiz/',
            sei.domande.quali.length >= 3, sei.domande.quali.join(', '))
  /* La riga che dice che il conto guarda i giochi e non un numero: chi
     è in casa a quell'età deve dichiarare `quiz`, e almeno uno di quei
     giochi deve essere davvero fra le carte accese. */
  const accesi = new Set(sei.giochi.filter(g => g.stato === 'qui').map(g => g.nome))
  controlla('e sono carte davvero in home',
            sei.domande.quali.every(n => accesi.has(n)))
}

/* ── UN GRUPPO DI SAPERE CHE A QUELL'ETÀ NON TOCCA NIENTE ──
   Acceso vuol dire «le sue domande non sono state tolte», non «gli
   arrivano tutte»: a tagliare è l'età, fino alla singola tipologia. Un
   gruppo che a quest'età non ha nemmeno una domanda dentro la finestra
   non si sta dando per scontato — e a quattro anni «com'è fatto un
   animale», la cui unica domanda è dichiarata otto anni, compariva
   fra le cose date per scontate. */
{
  const q4 = quadroDi({ eta: 4, ...eccezioniPerEta(4) }, { classi })
  const nomi4 = q4.sa.map(x => x.chiave)
  controlla('a 4 anni non si dà per scontato «com\'è fatto un animale»',
            !nomi4.includes('adattamento'), nomi4.join(' · '))
  controlla('ma i numeri e le quantità sì, che le domande ce le hanno',
            nomi4.includes('numeri'))

  /* ── E SI TAGLIA SOLO IL TETTO ──
     Il verso in basso è l'errore da non fare: a undici anni «leggere le
     parole» sta sotto la finestra — quelle domande non gliele chiediamo
     più — e toglierla dall'elenco direbbe l'opposto della verità. Sotto
     la finestra un sapere è dato per scontato più che mai. */
  const q11 = quadroDi({ eta: 11, sa: {} }, { classi })
  controlla('a 11 anni «leggere le parole» resta fra le cose date per scontate',
            q11.sa.some(x => x.chiave === 'lettura'), q11.sa.map(x => x.chiave).join(' · '))
  uguale('e a quell\'età non si toglie proprio niente',
         q11.sa.length, SAPERI.filter(x => x.difetto !== false).length)

  /* E crescendo se ne aggiungono, non se ne tolgono: la finestra sale. */
  const q8 = quadroDi({ eta: 8, sa: {} }, { classi })
  controlla('a 8 anni si dà per scontato più che a 4',
            q8.sa.length > quadroDi({ eta: 4, sa: {} }, { classi }).sa.length,
            `${quadroDi({ eta: 4, sa: {} }, { classi }).sa.length} → ${q8.sa.length}`)

  /* Ogni riga porta con sé come si disegna: icona e materia sono quello
     che mancava perché il blocco avesse la stessa forma degli altri. */
  controlla('ogni sapere elencato sa dire la sua icona e la sua materia',
            q8.sa.every(x => x.ico && x.materia))

  /* ── LO STESSO PEZZO DI SCUOLA IN DUE BLOCCHI ──
     È il punto di tutta la forma: un gruppo non ha *un* livello, ha le
     sue domande sparse su più fasce — le figure piane sono roba che sa
     già fare per due domande e roba tosta per una terza. Prima esisteva
     un blocco a parte, «dà per scontato che sappia», fatto di gruppi
     mentre gli altri erano fatti di classi: due unità di misura per la
     stessa roba, e nessuna delle due diceva l'altra.

     Se questo controllo diventasse rosso senza che nessuno l'abbia
     voluto, vorrebbe dire che il raggruppamento ha ricominciato a
     tenere ogni gruppo in un blocco solo — cioè che è tornato a
     mentire. */
  const doveSta = chiave => q8.gruppi
    .filter(g => g.saperi.some(s => s.chiave === chiave)).map(g => g.chiave)
  const sparsi = SAPERI.map(s => s.chiave).filter(k => doveSta(k).length > 1)
  controlla('a 8 anni almeno un pezzo di scuola sta in due blocchi',
            sparsi.length > 0, sparsi.map(k => `${k}: ${doveSta(k).join('+')}`).join(' · '))

  /* ── E NESSUNA DOMANDA SI PERDE PER STRADA ──
     Raggruppare è il momento in cui si perde roba senza accorgersene:
     una classe che non trova il suo gruppo sparisce dall'elenco e il
     conteggio in cima resta quello di prima, quindi il blocco dice 57 e
     ne mostra 55. Il conto dei pezzi deve fare il conto del blocco. */
  const buchi = []
  for (const eta of [6, 8, 10]) {
    const q = quadroDi({ eta, ...eccezioniPerEta(eta) }, { classi })
    for (const g of q.gruppi) {
      const dentro = g.saperi.reduce((n, s) => n + s.quante, 0)
      if (dentro !== g.quante) buchi.push(`${eta}a ${g.chiave}: ${dentro} di ${g.quante}`)
      /* e ogni classi elencata sotto un pezzo di scuola è una di quelle
         del blocco, non una pescata da un'altra fascia */
      const sue = new Set(g.righe.map(r => r.chiave))
      for (const s of g.saperi)
        for (const c of s.classi)
          if (!sue.has(c.chiave)) buchi.push(`${eta}a ${g.chiave}/${s.chiave}: ${c.chiave} è di un'altra fascia`)
    }
  }
  uguale('ogni domanda finisce sotto un pezzo di scuola, e nel blocco giusto',
         buchi.join(' · '), '')

  /* Il gruppo di una domanda è **il più specifico** che dichiara, come
     nella scheda delle domande: una conversione di pesi sta sotto
     «Metri, litri e chili» e sotto «Le conversioni», e quello che il
     grande ha in mente è il più stretto. */
  {
    const q = quadroDi({ eta: 10, ...eccezioniPerEta(10) }, { classi })
    const doppie = q.gruppi.flatMap(g => g.saperi.flatMap(s =>
      s.classi.filter(c => (c.sa || []).length > 1).map(c => ({ s: s.chiave, c }))))
    const larghe = doppie.filter(({ s, c }) => {
      const quante = k => classi.filter(x => (x.sa || []).includes(k)).length
      return c.sa.some(k => quante(k) < quante(s))
    })
    uguale('una domanda finisce sotto il gruppo più stretto che dichiara',
           larghe.map(({ s, c }) => `${c.nome} → ${s}`).join(' · '), '')
    nota(`domande che dichiarano più di un gruppo: ${doppie.length}`)
  }
}


riassunto('il quadro di un\'età')
