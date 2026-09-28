/* La forma di una domanda: la sola cosa che un modulo di quiz consegna a un
   gioco (vedi docs/apprendimento/quiz-moduli.md).

     {
       testo:    'Quale parola è scritta giusta?',   // la consegna
       soggetto: { testo: '…' } | { scena: {…} },   // opzionale: la cosa da guardare
       risposte: [ Risposta, … ],                    // da 2 a 6
       giusta:   1,                                  // indice della buona
       chiave:   'orto:gn',                          // il CONCETTO, non l'istanza
       aiuto:    'gn si scrive senza i',             // il metodo, dopo l'errore
       dritta:   '6 × 6 = 36: lato per lato',        // la scorciatoia, anche a risposta giusta
     }

   Una risposta è { testo }, { emoji } o { scena }, mai due insieme, con un
   `perche` opzionale che si legge solo se il bambino sceglie proprio quella.
   `aiuto`/`perche` e `dritta` sono spiegati in docs/apprendimento/la-domanda.md;
   `conNome` e la frase con `evidenzia` in quiz-moduli.md. */

export const testo = (t, perche) => perche ? { testo: String(t), perche } : { testo: String(t) }
export const emoji = (e, perche) => perche ? { emoji: e, perche } : { emoji: e }
export const scena = (s, perche) => perche ? { scena: s, perche } : { scena: s }
export const conNome = (risposta, nome) => ({ ...risposta, nome: String(nome) })

// pura (la condivide grafica/scheda.js). Il confine non è `\b`: l'apostrofo attacca («l'albero») e gli accenti no
const ATTACCATA = /[\p{L}\p{M}'’]/u

function doveCompare(frase, parola) {
  const dentro = c => c !== undefined && ATTACCATA.test(c)
  const punti = []
  for (let i = frase.indexOf(parola); i >= 0; i = frase.indexOf(parola, i + 1))
    if (!dentro(frase[i - 1]) && !dentro(frase[i + parola.length])) punti.push(i)
  return punti
}

export function evidenziando(frase, parola) {
  const f = String(frase ?? '')
  const p = String(parola ?? '')
  const punti = p ? doveCompare(f, p) : []
  if (punti.length !== 1) return { prima: f, parola: '', dopo: '', volte: punti.length }
  return { prima: f.slice(0, punti[0]), parola: p, dopo: f.slice(punti[0] + p.length), volte: 1 }
}

// mescola risposta giusta e falsi con la sorte, e tiene il conto di dov'è finita la buona
export function domanda({ testo: consegna, soggetto, buona, falsi, chiave, aiuto, dritta, sorte }) {
  const tutte = sorte.mescola([buona, ...falsi])
  const d = {
    testo: consegna,
    risposte: tutte,
    giusta: tutte.indexOf(buona),
    chiave,
  }
  if (soggetto) d.soggetto = soggetto
  if (aiuto) d.aiuto = aiuto
  if (dritta) d.dritta = dritta
  return d
}

// 12s: il tempo di contare a dito i quadretti di un 6×7, non di moltiplicare; vedi docs/apprendimento/la-domanda.md
export const LENTO = 12

export function serveLaDritta(d, { giusto, tempo }) {
  if (!d?.dritta) return false
  return giusto ? tempo > LENTO : true
}

// non si sa se ha tirato a caso, si sa se non ha avuto il tempo di leggere: vedi docs/apprendimento/la-domanda.md
export const FRETTA = 1.1            // secondi, il minimo per guardare qualunque cosa
export const A_PAROLA = 0.09         // e quanto costa leggere ogni parola
export const FRETTA_MAX = 4          // oltre non si sale: sarebbe un'accusa, non una misura

// quante parole ci sono da leggere, in un pezzo di testo o in tanti
const quanteParole = parti =>
  parti.filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length

// il soggetto conta se è scritto (una frase intera va letta anche lei); il soggetto disegnato no, guardare non è leggere
export function tempoDiLettura(d) {
  if (!d) return FRETTA
  return Math.min(FRETTA_MAX,
    FRETTA + quanteParole([d.testo, d.soggetto?.testo,
      ...(d.risposte || []).map(r => r?.testo)]) * A_PAROLA)
}

// perche e comeSiFa, sempre tutti e due (mai un `||`): vedi docs/apprendimento/la-domanda.md
export function spiegazioneDi(d, scelto) {
  if (!d || !(scelto >= 0) || scelto === d.giusta) return { perche: '', comeSiFa: '' }
  return {
    perche: d.risposte?.[scelto]?.perche || '',
    comeSiFa: d.aiuto || '',
  }
}

// il pavimento (PONDERA) cresce con le parole da leggere (A_CAPIRE), col tetto LEGGERE_MAX e TETTO: vedi la-domanda.md
export const PONDERA = 4000
export const A_CAPIRE = 0.25
export const LEGGERE_MAX = 7000
export const TETTO = 10000

// pavimento sotto il fermo-orologio di Domanda.vue: 2 minuti, oltre i quali nessun bambino pensa ancora a quella domanda
export const TEMPO_MAX = 120000

export function tempoDaAnnotare(ms) {
  return Math.min(TEMPO_MAX, Math.max(0, ms || 0)) / 1000
}

export function tempoDiCapire(righe = []) {
  return Math.min(LEGGERE_MAX, Math.round(quanteParole(righe) * A_CAPIRE * 1000))
}

// pavimento (PONDERA o il respiro della partita) + penale (la fretta): chi già aspettava di più continua ad aspettare quello
export function attesaDellEsito({ righe = [], pavimento = 0, penale = 0 } = {}) {
  return Math.min(TETTO, Math.max(pavimento, tempoDiCapire(righe)) + penale)
}

// sbagliata E più veloce del tempo di lettura; la giusta non è mai fretta, per veloce che sia
export function troppoDiFretta(d, { giusto, tempo }) {
  if (giusto) return false
  return tempo < tempoDiLettura(d)
}

// il controllo di forma, usato dal banco su ogni domanda generata: descrizione eseguibile del contratto, non un commento
export function guastiDi(d, { pittori = {} } = {}) {
  const g = []
  const dice = (c, m) => { if (!c) g.push(m) }

  dice(d && typeof d === 'object', 'non è un oggetto')
  if (!g.length) {
    dice(typeof d.testo === 'string' && d.testo.trim().length > 2, 'testo mancante o troppo corto')
    dice(typeof d.chiave === 'string' && /^[a-z0-9-]+:[a-z0-9-]+$/.test(d.chiave),
      `chiave malformata: ${JSON.stringify(d.chiave)} (serve «materia:concetto», minuscole e trattini)`)
    dice(Array.isArray(d.risposte) && d.risposte.length >= 2 && d.risposte.length <= 6,
      `le risposte devono essere da 2 a 6, sono ${d.risposte?.length}`)
    dice(Number.isInteger(d.giusta) && d.giusta >= 0 && d.giusta < (d.risposte?.length ?? 0),
      `«giusta» fuori dalla lista: ${d.giusta}`)

    // il nome sotto la figura non può stare su una risposta già di solo testo: sarebbe scritto due volte
    const guastiDelNome = (c, dove) => {
      if (c?.nome === undefined) return
      dice(typeof c.nome === 'string' && c.nome.trim().length > 0, `${dove}: nome vuoto`)
      dice(c.testo === undefined, `${dove}: «nome» su una risposta di solo testo — la parola ci sarebbe due volte`)
    }

    for (const r of d.risposte || []) {
      const forme = ['testo', 'emoji', 'scena'].filter(k => r && r[k] !== undefined)
      dice(forme.length === 1, `una risposta deve avere UNA fra testo/emoji/scena, ne ha ${forme.length}`)
      if (r?.scena) dice(!!pittori[r.scena.che], `nessun pittore per la scena «${r.scena?.che}»`)
      if (r?.testo !== undefined) dice(String(r.testo).length > 0, 'risposta con testo vuoto')
      guastiDelNome(r, 'risposta')
    }
    if (d.soggetto) {
      const forme = ['testo', 'emoji', 'scena'].filter(k => d.soggetto[k] !== undefined)
      dice(forme.length === 1, 'il soggetto deve avere UNA fra testo/emoji/scena')
      if (d.soggetto.scena) dice(!!pittori[d.soggetto.scena.che], `nessun pittore per la scena «${d.soggetto.scena.che}»`)
      guastiDelNome(d.soggetto, 'soggetto')

      // il solo controllo che si accorge di una frase scritta storta: la parola evidenziata dev'esserci una volta sola
      if (d.soggetto.evidenzia !== undefined) {
        dice(typeof d.soggetto.evidenzia === 'string' && d.soggetto.evidenzia.trim().length > 0,
          'soggetto: «evidenzia» vuoto')
        dice(typeof d.soggetto.testo === 'string',
          'soggetto: «evidenzia» senza una frase in cui evidenziare')
        if (typeof d.soggetto.testo === 'string' && typeof d.soggetto.evidenzia === 'string') {
          const { volte } = evidenziando(d.soggetto.testo, d.soggetto.evidenzia)
          dice(volte === 1,
            `soggetto: «${d.soggetto.evidenzia}» compare ${volte} volte in «${d.soggetto.testo}» — ne serve esattamente una`)
        }
      }
    }

    // due risposte identiche: la domanda ha due giuste o una buona nascosta fra i cloni
    const impronte = (d.risposte || []).map(r =>
      r.testo !== undefined ? 't:' + r.testo : r.emoji !== undefined ? 'e:' + r.emoji : 's:' + JSON.stringify(r.scena))
    dice(new Set(impronte).size === impronte.length, `risposte doppie: ${impronte.join(' | ')}`)

    // con figura + nome i lati sono due: due disegni uguali con nomi diversi passerebbero il controllo sopra
    const nomi = (d.risposte || []).map(r => r.nome).filter(n => n !== undefined)
    dice(new Set(nomi).size === nomi.length, `nomi doppi fra le risposte: ${nomi.join(' | ')}`)
  }
  return g
}
