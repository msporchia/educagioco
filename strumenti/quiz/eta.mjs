// chi-vede-cosa: a differenza del banco (forma), qui si guarda A CHI ARRIVANO le domande — i buchi (età/materia con poche domande) e cosa vede davvero un bambino a una carta facile/media/tosta. Ammissione e mira sono due larghezze diverse (vedi docs/apprendimento/quiz-livelli.md).
//   node strumenti/quiz/eta.mjs                tutte le età
//   node strumenti/quiz/eta.mjs --eta 7        una sola, con più esempi
//   node strumenti/quiz/eta.mjs --quante 5     quanti esempi per manopola
//   npm run quiz:eta
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { classiDi, pescaClasse, finestraDi, bersaglio, anniDelLivello,
         livelloDegliAnni, MIRA_SOTTO, MIRA_SOPRA } from '../../src/quiz/nucleo/classi.js'
import { catalogoDi } from '../../src/quiz/nucleo/catalogo.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const CARTELLA = resolve(QUI, '../../src/quiz/moduli')

// mezzo anno alla volta dove i bambini ci sono davvero, più gli estremi per vedere dove il mazzo finisce
const ETA = [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11]
const MANOPOLE = [['facile', 0.15], ['media', 0.5], ['tosta', 0.85]]
const MATERIE = ['matematica', 'italiano', 'spazio', 'tempo', 'logica', 'scienze']

const MAGRA = 3 // sotto questa soglia una materia è assente: una o due classi fanno sempre la stessa domanda

const args = process.argv.slice(2)
const numero = (nome, difetto) => {
  const i = args.indexOf(nome)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : difetto
}
const unaSola = numero('--eta', null)
const QUANTE = numero('--quante', unaSola ? 4 : 2)

const moduli = []
for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
  const m = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
  if (m) moduli.push(m)
}

const righe = catalogoDi(moduli).flatMap(m => m.classi)

// 1. dove stanno le domande
if (!unaSola) {
  console.log('\n══ DOVE STANNO LE DOMANDE ══')
  console.log('   (una riga per anno: quante classi hanno il centro lì)\n')
  for (let a = 4; a <= 11; a++) {
    const qui = righe.filter(r => r.anni >= a && r.anni < a + 1)
    const per = MATERIE.map(m => [m, qui.filter(r => r.materia === m).length])
      .filter(([, n]) => n).map(([m, n]) => `${m} ${n}`).join(' · ')
    console.log(`${String(a).padStart(3)} anni ${String(qui.length).padStart(3)} ` +
                `${'█'.repeat(Math.round(qui.length / 2)).padEnd(20)} ${per}`)
  }
  console.log(`\n   in tutto: ${righe.length} classi da ${moduli.length} moduli`)
}

// 2. cosa vede un bambino, età per età
console.log('\n══ COSA VEDE UN BAMBINO ══')
const buchi = []
for (const eta of (unaSola ? [unaSola] : ETA)) {
  const classi = classiDi(moduli, { regole: { eta } })
  const sua = finestraDi(eta)
  const qui = livelloDegliAnni(eta)
  const sotto = classi.filter(c => c.livello <= qui).length // quante sa già fare: se poche, "facile" smette di voler dire qualcosa
  // quante cadono nella MIRA: quelle che vede spesso, il resto capita ogni tanto
  const mirate = classi.filter(c => c.livello >= qui - MIRA_SOTTO &&
                                    c.livello <= qui + MIRA_SOPRA).length
  const perMateria = MATERIE.map(m => [m, classi.filter(c => c.modulo.materia === m).length])

  console.log(`\n── ${eta} anni ` + '─'.repeat(46))
  console.log(`   ammesse ${sua[0].toFixed(0)}–${sua[1].toFixed(0)} ` +
              `(${anniDelLivello(sua[0]).toFixed(1)}–${anniDelLivello(sua[1]).toFixed(1)} anni)` +
              `  ·  mira ${(qui - MIRA_SOTTO).toFixed(0)}–${(qui + MIRA_SOPRA).toFixed(0)}`)
  console.log(`   ${classi.length} classi · ` +
              perMateria.filter(([, n]) => n).map(([m, n]) => `${m} ${n}`).join(' · '))
  console.log(`   ${mirate} nella mira, ${sotto} già alla sua portata`)

  if (classi.length < 20) buchi.push(`${eta} anni: solo ${classi.length} classi ammesse`)
  if (mirate < 12) buchi.push(`${eta} anni: solo ${mirate} classi nella mira ` +
                              '(quelle che vede spesso)')
  // il buco che i conteggi nascondono: la finestra è piena, ma tutto quello che c'è dentro sta sopra di lui
  if (classi.length && sotto / classi.length < 0.2)
    buchi.push(`${eta} anni: tutto in salita — solo ${sotto} classi su ${classi.length} ` +
               'sono alla sua portata, il mazzo comincia sopra di lui')
  for (const [m, n] of perMateria) {
    if (n < MAGRA && righe.some(r => r.materia === m))
      buchi.push(`${eta} anni: ${m} ${n === 0 ? 'non compare' : `solo ${n}`}`)
  }

  // le domande vere, quelle che il bambino si troverebbe davanti
  for (const [nome, manopola] of MANOPOLE) {
    const sorte = new Sorte(Math.round(eta * 100) + Math.round(manopola * 100))
    const viste = []
    for (let i = 0; i < QUANTE * 6 && viste.length < QUANTE; i++) {
      const c = pescaClasse(sorte, classiDi(moduli, { difficolta: manopola, regole: { eta } }))
      if (!c) break
      let d
      try { d = c.modulo.chiedi(c.grado, sorte) } catch { continue }
      const testo = (d.testo || '').replace(/\s+/g, ' ').slice(0, 62)
      const chi = `${c.modulo.icona} ${String(c.livello).padStart(2)}`
      if (!viste.some(v => v.startsWith(chi))) viste.push(`${chi}  ${testo}`)
    }
    const punto = bersaglio(manopola, eta)
    console.log(`   ┌ carta ${nome} → mira ${punto.toFixed(0)} ` +
                `(${anniDelLivello(punto).toFixed(1)} anni)`)
    for (const v of viste) console.log(`   │ ${v}`)
  }
}

// 3. i buchi, tutti insieme
if (!unaSola) {
  console.log('\n══ I BUCHI ══')
  console.log('   (non sono guasti: sono le cose da riempire quando servono a qualcuno)\n')
  if (!buchi.length) console.log('   nessuno: ogni età ha abbastanza domande di ogni materia')
  else for (const b of buchi) console.log('   · ' + b)

  /* e il rovescio: le materie che non arrivano mai in cima o in fondo */
  console.log('\n   materie e dove arrivano:')
  for (const m of MATERIE) {
    const mie = righe.filter(r => r.materia === m)
    if (!mie.length) continue
    const da = Math.min(...mie.map(r => r.anni)), a = Math.max(...mie.map(r => r.anni))
    console.log(`   · ${m.padEnd(11)} ${String(mie.length).padStart(3)} classi, ` +
                `da ${da.toFixed(1)} a ${a.toFixed(1)} anni`)
  }
}
console.log()
