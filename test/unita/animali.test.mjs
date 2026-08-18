/* Le domande su dove vivono gli animali, e l'unica cosa che le può
   rendere ingiuste: **una seconda risposta vera fra i falsi**.

   Il gatto vive in città e in fattoria, il coniglio in fattoria e nel
   bosco, l'orso nel bosco e in montagna. Una domanda che mette due
   delle case di uno stesso animale nello stesso mazzo di risposte ha
   due risposte difendibili, e il bambino che sceglie quella che noi non
   avevamo in mente si prende un errore che non è suo. Il banco di prova
   (`npm run quiz:banco`) non la vede: la forma è ineccepibile, i falsi
   sono distinti, la varietà è alta. Si vede solo sapendo cosa vuol dire
   quella tabella, ed è per questo che il controllo sta qui.

   Le tre regole difese, una per verso della domanda:
     1. «dove vive?»      — la giusta è la PRIMA casa, e nessuna delle
                            altre sue case compare fra i falsi;
     2. «chi vive qui?»   — la giusta è uno di casa lì, e nessun falso
                            ha quel posto fra le sue case;
     3. «chi non c'entra» — l'intruso non ci vive in nessun modo.

   `node test/esegui.mjs animali --niente-build` */
import animali, { BESTIE, DOVE, caseDi, casa } from '../../src/quiz/moduli/animali.js'
import { AMBIENTI, NOMI_AMBIENTI } from '../../src/quiz/grafica/pittori/ambienti.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { guastiDi } from '../../src/quiz/nucleo/domanda.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const IDS = AMBIENTI.map(a => a.id)

/* ── la tabella prima delle domande ── */
const senzaPosto = BESTIE.filter(b => caseDi(b).some(id => !IDS.includes(id)))
uguale('ogni casa è un posto che esiste', senzaPosto.map(b => b.nome).join(' ') || '—', '—')

const doppie = BESTIE.filter(b => new Set(caseDi(b)).size !== caseDi(b).length)
uguale('nessun animale ripete una casa', doppie.map(b => b.nome).join(' ') || '—', '—')

const troppe = BESTIE.filter(b => caseDi(b).length > IDS.length - 3)
uguale('nessuno abita così tanti posti da non lasciare tre falsi',
  troppe.map(b => b.nome).join(' ') || '—', '—')

const emojiDoppie = BESTIE.filter((b, i) => BESTIE.findIndex(x => x.em === b.em) !== i)
uguale('nessuna emoji per due animali', emojiDoppie.map(b => b.nome).join(' ') || '—', '—')

const nomiDoppi = BESTIE.filter((b, i) => BESTIE.findIndex(x => x.nome === b.nome) !== i)
uguale('nessun nome per due animali', nomiDoppi.map(b => b.nome).join(' ') || '—', '—')

/* ── le domande, generate per davvero ──
   Il nome dell'animale è la sua etichetta a schermo senza articolo, e
   quello del posto è il nome del paesaggio: è così che dalla domanda si
   risale a chi è in scena. */
const perEtichetta = new Map(BESTIE.map(b => [b.nome.replace(/^(il |la |lo |l')/, ''), b]))
const postoDelNome = new Map(AMBIENTI.map(a => [a.nome, a.id]))
/* dalla consegna dell'intruso — «Tre di questi vivono nella savana» —
   si ricava il posto dalla preposizione, che è l'unica cosa che il
   testo porta */
const postoDellaFrase = t => IDS.find(id => t.includes(` ${DOVE[id]}.`))

let guasti = 0, viste = 0
const conta = { 'bio:dove-vive': 0, 'bio:chi-ci-vive': 0, 'bio:intruso': 0, 'bio:adattamento': 0 }

for (let grado = 1; grado <= animali.gradi; grado++) {
  for (let i = 0; i < 400; i++) {
    const d = animali.chiedi(grado, new Sorte(grado * 10000 + i))
    viste++
    conta[d.chiave] = (conta[d.chiave] ?? 0) + 1

    const g = guastiDi(d, { pittori: animali.pittori })
    if (g.length) { guasti++; if (guasti < 4) nota('forma:', d.testo, '—', g.join(' · ')); continue }

    const nomi = d.risposte.map(r => r.nome)
    const buona = d.risposte[d.giusta].nome

    if (d.chiave === 'bio:dove-vive') {
      const b = perEtichetta.get(d.soggetto.nome.replace(/^(il |la |lo |l')/, ''))
      if (!b) { guasti++; nota('soggetto sconosciuto:', d.soggetto.nome); continue }
      /* la giusta è la sua prima casa */
      if (postoDelNome.get(buona) !== casa(b)) {
        guasti++; nota(`${b.nome}: giusta «${buona}», ma la sua casa è ${NOMI_AMBIENTI[casa(b)]}`)
      }
      /* e nessun'altra delle sue case sta fra i falsi */
      const altre = caseDi(b).slice(1).map(id => NOMI_AMBIENTI[id])
      const intrusa = nomi.find((n, k) => k !== d.giusta && altre.includes(n))
      if (intrusa) { guasti++; nota(`${b.nome}: fra i falsi c'è ${intrusa}, dove vive davvero`) }
    }

    if (d.chiave === 'bio:chi-ci-vive') {
      const id = postoDelNome.get(d.soggetto.nome)
      const vera = perEtichetta.get(buona)
      if (casa(vera) !== id) {
        guasti++; nota(`${d.soggetto.nome}: la giusta è ${vera?.nome}, che è di casa altrove`)
      }
      const sbagliato = nomi.find((n, k) => k !== d.giusta && caseDi(perEtichetta.get(n) || {}).includes(id))
      if (sbagliato) { guasti++; nota(`${d.soggetto.nome}: fra i falsi c'è ${sbagliato}, che ci vive`) }
    }

    if (d.chiave === 'bio:intruso') {
      const id = postoDellaFrase(d.testo)
      if (!id) { guasti++; nota('posto non riconosciuto nella consegna:', d.testo); continue }
      const fuori = perEtichetta.get(buona)
      if (caseDi(fuori).includes(id)) {
        guasti++; nota(`«${d.testo}»: l'intruso ${fuori.nome} ci vive davvero`)
      }
      const dentro = nomi.filter((n, k) => k !== d.giusta).map(n => perEtichetta.get(n))
      const estraneo = dentro.find(b => !b || casa(b) !== id)
      if (estraneo) { guasti++; nota(`«${d.testo}»: ${estraneo?.nome} non è di casa lì`) }
    }
  }
}

uguale('nessuna domanda ingiusta', guasti, 0)
nota(viste, 'domande generate ·',
  Object.entries(conta).filter(([, n]) => n).map(([k, n]) => `${k.replace('bio:', '')} ${n}`).join(' · '))

/* ── che le case multiple servano a qualcosa ──
   Se un giorno la tabella tornasse a una casa per animale, i controlli
   qui sopra passerebbero tutti senza provare niente. */
const conDueCase = BESTIE.filter(b => caseDi(b).length > 1)
controlla('ci sono animali con più di una casa', conDueCase.length >= 5,
  `sono ${conDueCase.length}`)
nota('a due case:', conDueCase.map(b => `${b.nome} (${caseDi(b).map(id => NOMI_AMBIENTI[id]).join('/')})`).join(', '))

riassunto('gli animali e dove vivono')
