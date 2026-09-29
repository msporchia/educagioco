/* ═══════════════════════════════════════════════════════════════════
   LA VARIETÀ A MONETE — lo stesso gioco rende sempre meno

   Dopo venti minuti di oggi sullo stesso gioco le monete si dimezzano,
   dopo altri venti finiscono; domani tornano piene. I grandi spostano
   le soglie, per tutti o per un gioco, e possono ridare tempo; i giochi
   ⭐ consigliati valgono doppio nei primi venti minuti. Perché così:
   docs/genitori/varieta.md.

   Tre cose che questo test esiste per fermare:
     1. il giorno sbagliato: la partita delle 23:40 di ieri non è di oggi,
        e il salvadanaio torna pieno a mezzanotte di casa, non di Londra;
     2. la metà che non cala: un gioco che paga una moneta alla volta,
        arrotondato, a metà darebbe sempre una moneta (o sempre zero);
     3. un gioco che se ne dimentica: il filtro sta in `addCoins`, e un
        gioco nuovo lo attraversa senza saperlo — il cheat e i traguardi no.

   `node test/esegui.mjs varieta --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as V from '../../src/data/varieta.js'
import { GIOCHI } from '../../src/data/giochi.js'
import { state, init, creaGiocatore, addCoins } from '../../src/store/profile.js'
import { entra, esci, usaOrologio, scriviSessione, leggiSessioni } from '../../src/store/sessioni.js'
import { statoDi, incassa, ridaiTempo, consiglia, tettoDelGioco, scegliSoglie,
         accendiDormienti, avviso } from '../../src/store/varieta.js'
import { remove, chiavi } from '../../src/store/storage.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const alle = (giorno, ora, minuti = 0) => new Date(2026, 8, giorno, ora, minuti).getTime()
const OGGI = alle(29, 18)
const min = m => m * 60
const scheda = k => GIOCHI.find(g => g.chiave === k)
const R = V.regoleDi({})

/* ══════════ 1. le soglie ══════════ */
{
  const t = V.tettiDi(R, 'survivors')
  uguale('di difetto: venti minuti pieni', t.pieno, 20)
  uguale('e venti a metà', t.meta, 20)
  uguale('al minuto 0 è pieno', V.fase({ tetti: t, secondi: 0 }).fattore, 1)
  uguale('al minuto 19 ancora pieno', V.fase({ tetti: t, secondi: min(19) }).fase, 'pieno')
  uguale('al 20 si dimezza', V.fase({ tetti: t, secondi: min(20) }).fattore, 0.5)
  uguale('al 39 ancora metà', V.fase({ tetti: t, secondi: min(39) }).fase, 'meta')
  uguale('al 40 finite', V.fase({ tetti: t, secondi: min(40) }).fattore, 0)
  uguale('e restano i secondi al prossimo cambio',
         V.fase({ tetti: t, secondi: min(12) }).restano, min(8))
  uguale('senza tetto non cala mai', V.fase({ tetti: null, secondi: min(300) }).fattore, 1)
}

/* ══════════ 2. il giorno è quello di casa ══════════ */
{
  const voci = [
    { g: 'survivors', t: alle(28, 23, 40), s: min(50) },   // ieri sera tardi
    { g: 'survivors', t: alle(29, 9), s: min(15) },
    { g: 'survivors', t: alle(29, 15), s: min(10) },
    { g: 'dungeon', t: alle(29, 16), s: min(30) },
  ]
  uguale('conta solo oggi, e solo quel gioco',
         V.secondiContati({ voci, gioco: 'survivors', oggi: OGGI }), min(25))
  uguale('più la partita aperta',
         V.secondiContati({ voci, gioco: 'survivors', oggi: OGGI, inCorso: 60 }), min(26))
  const st = V.statoDelGioco({ regole: R, gioco: scheda('survivors'), voci, oggi: OGGI })
  uguale('a 25 minuti Survivors è a metà', st.fase, 'meta')
  const domani = V.statoDelGioco({ regole: R, gioco: scheda('survivors'), voci,
                                   oggi: alle(30, 0, 5) })
  uguale('e dopo mezzanotte torna pieno', domani.fase, 'pieno')
  uguale('«verbi» è lo stesso gioco di English',
         V.secondiContati({ voci: [{ g: 'verbi', t: alle(29, 9), s: 90 }], gioco: 'inglese', oggi: OGGI }), 90)
}

/* ══════════ 3. i numeri dei grandi ══════════ */
{
  const r = V.regoleDi({ pieno: 30, meta: 10,
                         giochi: { dungeon: 'libero', corsa: { pieno: 5, meta: 5 } } })
  uguale('le soglie di tutti', V.tettiDi(r, 'survivors').pieno, 30)
  uguale('un gioco senza tetto', V.tettiDi(r, 'dungeon'), null)
  uguale('un gioco coi suoi numeri', V.tettiDi(r, 'corsa').meta, 5)
  uguale('e la tacca lo legge', V.comeDi(r, 'corsa'), 'suoi')
  uguale('un numero storto torna al difetto', V.regoleDi({ pieno: 'boh' }).pieno, 20)
  uguale('uno enorme si ferma al tetto', V.regoleDi({ meta: 9999 }).meta, V.TETTO_MINUTI)
}

/* ══════════ 4. il tempo ridato ══════════ */
{
  const voci = [{ g: 'survivors', t: alle(29, 9), s: min(45) }]
  const r = V.regoleDi({ ridato: { g: '2026-09-29', s: { survivors: min(45) } } })
  const st = V.statoDelGioco({ regole: r, gioco: scheda('survivors'), voci, oggi: OGGI })
  uguale('ridato il tempo, si riparte pieni', st.fase, 'pieno')
  const ieri = V.regoleDi({ ridato: { g: '2026-09-28', s: { survivors: min(45) } } })
  uguale('ma quello ridato ieri non vale oggi',
         V.statoDelGioco({ regole: ieri, gioco: scheda('survivors'), voci, oggi: OGGI }).fase, 'vuoto')
}

/* ══════════ 5. il ×2 ══════════ */
{
  const r = V.regoleDi({ consigliati: { mate: true } })
  const gioca = s => V.statoDelGioco({ regole: r, gioco: scheda('mate'),
                                      voci: [{ g: 'mate', t: alle(29, 9), s }], oggi: OGGI })
  uguale('un consigliato vale doppio all\'inizio', gioca(min(5)).fattore, 2)
  uguale('fino al ventesimo minuto', gioca(min(19)).fase, 'doppio')
  uguale('poi valgono le soglie normali', gioca(min(20)).fase, 'meta')
  uguale('un gioco che non paga non si consiglia',
         V.doppioDi({ regole: V.regoleDi({ consigliati: { fattoria: true } }), gioco: scheda('fattoria') }), null)

  // i dormienti: da cinque giorni fermo, ma solo per chi gioca da almeno cinque
  const vecchio = [{ g: 'survivors', t: alle(10, 10), s: 600 }, { g: 'mate', t: alle(23, 10), s: 600 }]
  const acceso = V.regoleDi({ dormienti: true })
  uguale('spento di partenza', V.doppioDi({ regole: R, gioco: scheda('mate'), voci: vecchio, oggi: OGGI }), null)
  uguale('acceso: sei giorni senza asteroidi è un ×2',
         V.doppioDi({ regole: acceso, gioco: scheda('mate'), voci: vecchio, oggi: OGGI }), 'dormiente')
  uguale('anche un gioco di scuola mai aperto',
         V.doppioDi({ regole: acceso, gioco: scheda('inglese'), voci: vecchio, oggi: OGGI }), 'dormiente')
  uguale('ma non uno che non è di scuola',
         V.doppioDi({ regole: acceso, gioco: scheda('survivors'), voci: vecchio, oggi: OGGI }), null)
  uguale('e aprirlo oggi non lo spegne a metà giornata',
         V.doppioDi({ regole: acceso, gioco: scheda('mate'),
                      voci: [...vecchio, { g: 'mate', t: alle(29, 9), s: 60 }], oggi: OGGI }), 'dormiente')
  uguale('quattro giorni non bastano',
         V.doppioDi({ regole: acceso, gioco: scheda('mate'),
                      voci: [...vecchio, { g: 'mate', t: alle(25, 9), s: 60 }], oggi: OGGI }), null)
  uguale('un bambino arrivato ieri non ha giochi addormentati',
         V.doppioDi({ regole: acceso, gioco: scheda('mate'),
                      voci: [{ g: 'survivors', t: alle(28, 9), s: 60 }], oggi: OGGI }), null)
}

/* ══════════ 6. la metà che cala davvero ══════════ */
{
  let resto = 0, tot = 0
  for (let i = 0; i < 10; i++) { const x = V.incasso(1, 0.5, resto); resto = x.resto; tot += x.dato }
  uguale('dieci monetine a metà sono cinque', tot, 5)
  uguale('24 a metà sono 12', V.incasso(24, 0.5).dato, 12)
  uguale('a zero, zero', V.incasso(24, 0).dato, 0)
  uguale('al doppio, il doppio', V.incasso(7, 2).dato, 14)
  uguale('una spesa non si tocca', V.incasso(-50, 0).dato, -50)
}

/* ══════════ 7. le parole ══════════ */
{
  uguale('la carta a metà', V.sullaCarta({ paga: true, fase: 'meta', restano: 61, secondi: 1 }).testo,
         'a metà · ancora 2′')
  uguale('un gioco non ancora aperto oggi non dice niente',
         V.sullaCarta({ paga: true, fase: 'pieno', restano: 1200, secondi: 0 }), null)
  uguale('il premio dimezzato',
         V.premioInParole({ chiesto: 24, dato: 12, nome: 'Survivors' }),
         '🪙 24 → 12 · Survivors: il salvadanaio è stanco, domani torna pieno')
  controlla('a zero propone un altro gioco',
            V.premioInParole({ chiesto: 24, dato: 0, nome: 'Survivors', prova: 'Asteroidi' })
              .endsWith('prova Asteroidi'))
  const p = V.suggerisci([
    { nome: 'A', stato: { fase: 'vuoto' } },
    { nome: 'B', stato: { fase: 'pieno', restano: 300 } },
    { nome: 'C', stato: { fase: 'doppio', restano: 60 } },
  ])
  uguale('si propone prima un ×2', p.nome, 'C')
}

/* ══════════ 8. chi non paga, non paga davvero ══════════
   L'elenco NON_PAGANO è scritto a mano: qui si guarda nei sorgenti che
   dica il vero, così il giorno che il Generale comincia a pagare la sua
   carta non resta senza salvadanaio. */
{
  const radice = resolve(import.meta.dirname, '../..')
  const app = readFileSync(resolve(radice, 'src/App.vue'), 'utf8')
  const nuovi = readFileSync(resolve(radice, 'src/giochi/schermate.js'), 'utf8')
  const fileDi = k => {
    const vista = new RegExp(`\\b${k}: (\\w+)`).exec(app) || new RegExp(`\\b${k}: (\\w+)`).exec(nuovi)
    if (!vista) return null
    const imp = new RegExp(`import ${vista[1]} from '([^']+)'`)
    const da = imp.exec(app) ? ['src', imp.exec(app)[1]] : ['src/giochi', imp.exec(nuovi)?.[1]]
    return da[1] ? resolve(radice, da[0], da[1]) : null
  }
  for (const g of GIOCHI) {
    if (g.posto) continue
    const f = fileDi(g.chiave)
    if (!f) { controlla(`trovo la schermata di ${g.chiave}`, false); continue }
    const paga = /\baddCoins\(|\bincassa\(/.test(readFileSync(f, 'utf8'))
    uguale(`${g.chiave}: ${paga ? 'paga' : 'non paga'}, e NON_PAGANO lo sa`, V.paga(g), paga)
  }
}

/* ══════════ 9. il filtro, dentro addCoins ══════════ */
for (const k of await chiavi('')) await remove(k)
state.giocatori = []; state.player = ''
await init()
await creaGiocatore('Uno')
const id = state.player
let adesso = OGGI
usaOrologio(() => adesso)

{
  await scriviSessione(id, { gioco: 'survivors', quando: alle(29, 9), secondi: min(25) })
  await leggiSessioni(id)
  const prima = state.profile.coins
  addCoins(10)
  uguale('fuori da un gioco le monete non si toccano', state.profile.coins - prima, 10)

  entra('survivors', id)
  uguale('dentro, a 25 minuti, Survivors è a metà', statoDi('survivors', adesso).fase, 'meta')
  const a = state.profile.coins
  addCoins(24)
  uguale('e un premio di 24 ne dà 12', state.profile.coins - a, 12)
  controlla('dicendolo nella scritta piccola', avviso.testo.includes('24 → 12'), avviso.testo)

  const p = incassa(24)
  uguale('incassa dice quanto è arrivato', p.dato, 12)
  controlla('e con che parole', p.frase.includes('stanco'), p.frase)

  adesso += min(16) * 1000   // la partita va avanti: 41 minuti
  uguale('passati i quaranta, finite', statoDi('survivors', adesso).fase, 'vuoto')
  const b = state.profile.coins
  addCoins(24)
  uguale('e non arriva niente', state.profile.coins, b)
  esci()

  entra('dungeon', id)
  const c = state.profile.coins
  addCoins(24)
  uguale('un altro gioco paga pieno', state.profile.coins - c, 24)
  esci()

  ridaiTempo('survivors', adesso)
  uguale('ridato il tempo, Survivors torna pieno', statoDi('survivors', adesso).fase, 'pieno')

  tettoDelGioco('dungeon', 'libero')
  uguale('un gioco senza tetto', statoDi('dungeon', adesso).fase, 'libero')
  tettoDelGioco('dungeon', 'tutti')
  scegliSoglie({ pieno: 1, meta: 0 })
  uguale('una soglia di un minuto', statoDi('dungeon', adesso).fase, 'pieno')
  entra('dungeon', id); adesso += min(2) * 1000
  uguale('dopo due minuti di partita è finito', statoDi('dungeon', adesso).fase, 'vuoto')
  esci()

  consiglia('mate', true)
  uguale('un gioco consigliato vale doppio', statoDi('mate', adesso).fase, 'doppio')
  accendiDormienti(true)
  uguale('e i dormienti si salvano', state.profile.settings.varieta.dormienti, true)
  nota('regole salvate:', JSON.stringify(state.profile.settings.varieta))
}
usaOrologio(null)

riassunto('la varietà a monete')
