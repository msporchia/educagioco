/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — nove tappe in tre scalini

   L'ingresso non è una schermata con «scegli la difficoltà»: è un
   percorso. Una tappa è **lo stesso motore con altri numeri e un altro
   vestito** — non c'è nessun codice che sappia distinguere la prima
   dall'ultima.

   Cosa si vince: **restare vivi fino allo scadere**. `durata` è tutto
   quello che serve sapere per capire quanto dura una partita, e cresce
   piano — tre quarti di minuto la prima volta, tre minuti e mezzo
   l'ultima. Una tappa che non finisce non si può nemmeno vincere, ed è
   per questo che il traguardo c'è: ma chi ci arriva può **restare in
   campo** (vedi `Partita.continua`), e allora la marea sale finché non lo
   prende. La campagna insegna, il tempo dopo il traguardo è il gioco.

   Le tre leve della difficoltà moltiplicano le curve di `taratura.js`:

     ritmo    quanti mostri nascono al secondo
     vigore   quanta vita hanno
     fretta   quanto corrono

   Attenzione a come si leggono: le curve corrono sul **tempo vero**
   (`Regole.marea`), quindi una tappa lunga è già più dura di una corta a
   parità di leve — ed è per questo che i moltiplicatori delle ultime
   tappe sono più *bassi* di quelli delle prime. Chi li ritocca non guarda
   il numero ma la piena al traguardo, che il validatore qui sotto
   pretende crescente, e poi rilancia `unita/survivors`.

   `squadra` è chi può comparire (ognuno entra alla sua quota di tappa,
   vedi `mostri.js`), `rincaro` è quanto si alza il prezzo delle domande
   andando avanti, `premio` sono le monete per stella.

   Finite le nove tappe si apre il **gioco libero**: comincia con tutto in
   campo e non finisce, e il punteggio è quanto si è resistito.
   ═══════════════════════════════════════════════════════════════════ */

import { CFG } from './taratura.js'

export const SCALINI = [
  { chiave: 'prati',  nome: 'I primi passi', icona: '🌿',
    dritta: 'Poche melme lente: si impara a schivare.' },
  { chiave: 'fitto',  nome: 'Il bosco fitto', icona: '🌲',
    dritta: 'Arrivano i funghi duri e gli spettri veloci.' },
  { chiave: 'lontano', nome: 'Le terre lontane', icona: '🏔️',
    dritta: 'Tutte le bestie insieme, e tre minuti da resistere.' },
]

const TUTTI = ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno',
               'spettro', 'cinghiale', 'roccia', 'colosso']

export const CAMPAGNA = [
  /* ── scalino 1: si impara a muoversi ── */
  { chiave: 'prato', nome: 'Il prato verde', scenario: 'prato', scalino: 'prati',
    durata: 45, ritmo: 1.44, vigore: 1.15, fretta: 1.20, rincaro: 0,
    squadra: ['melma'], premio: 3,
    racconto: 'Melme lente e niente altro. Basta non farsi toccare.' },
  { chiave: 'radura', nome: 'La radura', scenario: 'bosco', scalino: 'prati',
    durata: 60, ritmo: 1.30, vigore: 1.21, fretta: 0.95, rincaro: 0,
    squadra: ['melma', 'pipistrello'], premio: 3,
    racconto: 'I pipistrelli sono svelti, ma vanno giù con una freccia.' },
  { chiave: 'lucciole', nome: 'La notte delle lucciole', scenario: 'notte', scalino: 'prati',
    durata: 75, ritmo: 1.30, vigore: 1.31, fretta: 0.97, rincaro: 0.03,
    squadra: ['melma', 'pipistrello', 'moscerino'], premio: 4,
    racconto: 'Al buio arrivano gli sciami. Non stare fermo.' },

  /* ── scalino 2: il bosco chiede qualcosa ── */
  { chiave: 'pantano', nome: 'Il pantano', scenario: 'palude', scalino: 'fitto',
    durata: 90, ritmo: 1.24, vigore: 1.43, fretta: 0.99, rincaro: 0.05,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo'], premio: 5,
    racconto: 'I funghi hanno la pelle dura: serve qualcosa che picchi.' },
  { chiave: 'grotta', nome: 'La grotta', scenario: 'grotta', scalino: 'fitto',
    durata: 105, ritmo: 1.14, vigore: 1.70, fretta: 1.00, rincaro: 0.05,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno', 'spettro'], premio: 6,
    racconto: 'I ragni ti raggiungono: scappare dritto non basta più.' },
  { chiave: 'dune', nome: 'Le dune', scenario: 'deserto', scalino: 'fitto',
    durata: 125, ritmo: 1.04, vigore: 1.70, fretta: 1.01, rincaro: 0.08,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno', 'spettro', 'cinghiale'],
    premio: 6,
    racconto: 'Due minuti e mezzo sotto il sole, e arrivano i cinghiali.' },

  /* ── scalino 3: tutti insieme ── */
  { chiave: 'ghiacciaio', nome: 'Il ghiacciaio', scenario: 'neve', scalino: 'lontano',
    durata: 145, ritmo: 0.97, vigore: 1.82, fretta: 1.02, rincaro: 0.10,
    squadra: TUTTI, premio: 7, cuori: 4,
    racconto: 'Le rocce camminano piano ma non muoiono quasi mai.' },
  { chiave: 'fonda', nome: 'La palude fonda', scenario: 'palude', scalino: 'lontano',
    durata: 165, ritmo: 0.90, vigore: 1.98, fretta: 1.03, rincaro: 0.12,
    squadra: TUTTI, premio: 8, cuori: 4,
    racconto: 'Qui non basta scappare: bisogna aver scelto bene le carte.' },
  { chiave: 'tana', nome: 'La tana', scenario: 'grotta', scalino: 'lontano',
    durata: 185, ritmo: 0.85, vigore: 2.06, fretta: 1.04, rincaro: 0.15,
    squadra: TUTTI, premio: 10, cuori: 4,
    racconto: 'Quasi quattro minuti, e in fondo c\'è il colosso.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

/* Il gioco libero: non finisce, e ha tutto dentro dal primo minuto. Non è
   una tappa e non sta nella campagna — è quello che resta dopo. */
export const LIBERO = {
  chiave: 'libero', nome: 'Sopravvivenza', scenario: 'notte', scalino: null,
  durata: Infinity, ritmo: 1.20, vigore: 1.90, fretta: 1.05, rincaro: 0.08,
  squadra: TUTTI, premio: 4,
  racconto: 'Non finisce: si va avanti finché si resiste.',
}

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

export function guastiDellaCampagna(campagna = CAMPAGNA, scenari, mostri) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (scenari && !scenari[t.scenario]) guasti.push(`${dove}: lo scenario "${t.scenario}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: scalino "${t.scalino}" sconosciuto`)
    /* il tetto è quello che un bambino regge senza posare il telefono: da
       lì in poi la partita non si allunga più — si resta in campo dopo il
       traguardo, che è una scelta sua e finisce quando vuole lui */
    if (!(t.durata >= 20 && t.durata <= 240))
      guasti.push(`${dove}: ${t.durata} secondi non sono una partita per un bambino`)
    for (const k of ['ritmo', 'vigore', 'fretta'])
      if (!(t[k] > 0)) guasti.push(`${dove}: ${k} vale ${t[k]}`)
    if (!(t.rincaro >= 0 && t.rincaro <= 0.3))
      guasti.push(`${dove}: rincaro ${t.rincaro} — le domande diventano un'altra cosa`)
    if (!(t.premio > 0)) guasti.push(`${dove}: premio ${t.premio}`)
    if (!(t.squadra?.length)) guasti.push(`${dove}: nessun mostro in squadra`)
    if (mostri) for (const k of t.squadra || [])
      if (!mostri[k]) guasti.push(`${dove}: il mostro "${k}" non esiste`)
    /* qualcuno deve esserci dal primo istante, o la tappa comincia vuota */
    if (mostri && !(t.squadra || []).some(k => mostri[k]?.da === 0))
      guasti.push(`${dove}: nessun mostro comincia insieme alla tappa`)
  }
  /* ── la campagna deve salire ──
     Non si guardano più i moltiplicatori uno per uno: da quando la marea
     corre sul tempo vero (`Regole.marea`), una tappa più lunga è più dura
     **a parità di leve**, e infatti le leve delle ultime tappe sono più
     basse di quelle delle prime. Quello che deve crescere è la piena che
     si trova addosso al traguardo: quanti nascono e quanto sono duri. */
  const marea = t => t.durata / CFG.tappaTipo
  const piena = t => CFG.natePerSecondo(marea(t)) * t.ritmo
  const durezza = t => CFG.vitaNemico(marea(t)) * t.vigore
  for (let i = 1; i < campagna.length; i++) {
    if (campagna[i].durata < campagna[i - 1].durata)
      guasti.push(`tappa ${i + 1}: dura meno della precedente`)
    if (piena(campagna[i]) <= piena(campagna[i - 1]))
      guasti.push(`tappa ${i + 1}: al traguardo ne nascono ${piena(campagna[i]).toFixed(2)} al secondo, ` +
                  `meno della precedente (${piena(campagna[i - 1]).toFixed(2)})`)
    if (durezza(campagna[i]) <= durezza(campagna[i - 1]))
      guasti.push(`tappa ${i + 1}: al traguardo i mostri sono più molli della tappa prima`)
    if (campagna[i].scenario === campagna[i - 1].scenario)
      guasti.push(`tappa ${i + 1}: stesso vestito della precedente ("${campagna[i].scenario}")`)
    if ((campagna[i].squadra || []).length < (campagna[i - 1].squadra || []).length)
      guasti.push(`tappa ${i + 1}: la squadra dei mostri si è ristretta`)
  }
  /* gli scalini arrivano in fila e nessuno resta vuoto */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  /* la prima tappa deve essere davvero la prima: una sola bestia, lenta */
  if (campagna[0].squadra.length > 1)
    guasti.push('la prima tappa comincia già con due mostri diversi')
  return guasti
}
