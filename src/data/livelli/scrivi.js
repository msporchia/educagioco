/* ═══════════════════════════════════════════════════════════════════
   COME SI SCRIVE UN LIVELLO

   Tre famiglie, tre elenchi che l'editor ti mostra quando scrivi il
   punto:

     cose.*   quello che sta sul campo   (porte, tesori, leve, posti)
     chi.*    chi ci cammina dentro      (i nostri, i nemici, i terzi)
     fai.*    gli ordini e le domande    (vai, prendi, vedi, hai)

   ── perché tre nomi e non trenta import ──
   Perché la lista si vede. Scrivi `cose.` e sai cosa puoi mettere in
   una stanza, senza aprire nessun file. E perché toglie un'ambiguità
   vera: **`porta` in italiano è anche un verbo**, e `cose.porta()` non
   si confonde con niente.

   ── perché fabbriche e non `new` ──
   Un livello resta **dato**: nessuna istanza, nessuno stato. Tre
   ragioni, in ordine di forza:
     · l'editor deve poter **rileggere** un livello, disegnarlo col
       mouse e riscriverlo. Un dato si rilegge; una sequenza di `new`
       si può solo generare;
     · le varianti sono toppe stese sopra il dato;
     · un livello lo importano anche il validatore e l'editor, che non
       hanno il motore.
   Le classi ci sono e fanno il loro mestiere (`motore/generale/
   elementi/`): il `new` lo fa il motore, una volta per partita, a
   partire dal biglietto che queste fabbriche scrivono.

   ── la forma di una chiamata ──
   `fabbrica(id, nome?, opzioni?)` — l'id è la chiave con cui la cosa
   si nomina negli ordini, il nome è come si legge in una frase, e in
   coda le opzioni. Il nome è facoltativo: senza, si usa l'id.

       cose.porta('grata', 'la grata di levante', { chiave: 'rossa', forza: 6 })
       chi.nemico('orco', { corpo: 'orco', vista: 2, fa: [fai.attacca('eroe')] })
   ═══════════════════════════════════════════════════════════════════ */

/* ── I DEFAULT, CHE SONO METÀ DEL PUNTO ──
   Una chiamata scrive **solo quello che ha di suo**. `cose.tesoro()` è
   già l'id `tesoro`, il nome «il tesoro», il forziere per disegnarlo e
   il 💰 per nominarlo: sono le cose che sarebbero uguali nel 99% dei
   livelli, e ripeterle a ogni riga vuol dire solo poterle sbagliare.
   Si scrivono quando sono diverse — `cose.tesoro('bottino', 'il
   bottino dei banditi')` — e non prima.

   Tutti gli argomenti sono facoltativi e si riconoscono dal tipo:
       cose.tesoro()
       cose.tesoro('bottino')
       cose.tesoro('bottino', 'il bottino')
       cose.tesoro({ em: '💎' })
*/
/* ── UNA COSA SI PASSA, NON SI CITA ──
   `prendi(tesoro)` invece di `prendi('tesoro')`: la variabile la
   dichiari una volta e poi la usi, e un refuso diventa un errore
   subito invece di un ordine che non trova niente. Le stringhe restano
   ammesse — servono per riferirsi a qualcosa che sta in un altro file
   — ma non sono più il modo normale. */
export const idDi = x => (x && typeof x === 'object' ? x.id : x)

const fabbrica = (genere, fissi = {}) => (...arg) => {
  const testi = arg.filter(a => typeof a === 'string')
  const opz = arg.find(a => a && typeof a === 'object') || {}
  const id = testi[0] || fissi.id
  if (!id) throw new Error(`${genere}: senza id non si può nominare negli ordini`)
  return { ...fissi, genere, id, nome: testi[1] || opz.nome || fissi.nome || id, ...opz }
}

/* ── LA MAPPA E LA SUA LEGENDA SONO UNA COSA SOLA ──
   Erano due campi del livello, uno accanto all'altro e scorrelati: si
   poteva cambiare la mappa e lasciare indietro la legenda, o togliere
   una voce e non accorgersi che un token era rimasto orfano. Un token
   senza legenda non vuol dire niente — è la stessa cosa detta due
   volte solo se stanno separate.

       scena: campo([
         '##|##|##|##',
         '##|@@|T$|##',
       ], { '@@': eroe, 'T$': tesoro }),

   Una variante ridisegna la stanza e **eredita la legenda** se non ne
   passa una sua: gli attori sono gli stessi, cambia dove stanno. */
export const campo = (righe, legenda) => ({ righe, legenda })

/* ═══════════ cose — quello che sta sul campo ═══════════ */
export const cose = {
  /* un punto con un nome: non si prende e non si apre, ci si va */
  posto: fabbrica('posto'),

  /* un varco. Le tre proprietà si combinano fra loro:
       chiave  senza quella chiave in zaino non si apre
       forza   si sfonda: n battiti di spallate, con o senza serratura
       aMano   se `false`, non si apre camminandoci: serve un congegno
     Lo `stile` è come si vede (legno, ferro, saracinesca, arco,
     pietra) e non cambia niente di come funziona. */
  porta: fabbrica('porta', { id: 'porta', nome: 'la porta', stile: 'legno' }),
  grata: fabbrica('porta', { id: 'grata', nome: 'la grata', stile: 'ferro' }),
  saracinesca: fabbrica('porta', { id: 'saracinesca', nome: 'la saracinesca', stile: 'saracinesca' }),
  botola: fabbrica('porta', { id: 'botola', nome: 'la botola', stile: 'pietra' }),

  /* le cose da raccogliere. Sono tutte oggetti, ma ognuna sa già come
     si disegna e come si chiama: è quello che toglie di mezzo la
     tabella dei ripieghi («se non lo conosco disegno una chiave»). */
  oggetto: fabbrica('oggetto'),
  tesoro: fabbrica('oggetto', { id: 'tesoro', nome: 'il tesoro', pittore: 'forziere', em: '💰' }),
  chiave: fabbrica('oggetto', { id: 'chiave', nome: 'la chiave', pittore: 'chiave', em: '🔑' }),
  lanterna: fabbrica('oggetto', { id: 'lanterna', nome: 'la lanterna', pittore: 'lanterna', em: '🏮' }),
  osso: fabbrica('oggetto', { id: 'osso', nome: "l'osso", pittore: 'ossa', em: '🦴' }),
  pane: fabbrica('oggetto', { id: 'pane', nome: 'il pane', pittore: 'pane', em: '🍞' }),
  corda: fabbrica('oggetto', { id: 'corda', nome: 'la corda', pittore: 'corda', em: '🪢' }),

  /* ── UN POSTO PREPARATO, E PER ORA VUOTO ──
     La mappa segna con `o1`…`o4` i quattro angoli da cui l'orco può
     arrivare, e ogni scena ne riempie uno: gli altri restano prato.
     Si dichiara come tutto il resto — non è «un token che nessuno
     spiega», è **un posto che aspetta qualcuno**, e la differenza si
     vede quando sbagli a scrivere un token: quello resta un errore. */
  segnaposto: fabbrica('segnaposto', { id: 'segnaposto', nome: 'un posto libero' }),

  /* ── QUELLO CHE NON STA SULLA MAPPA ──
     Un segnale non ha una posizione: non si disegna, si dice. Sta
     quindi nella lista `segnali` del livello e non nella legenda — ed
     è il livello a dargli nome, faccia e colore, invece di pescarli da
     una tabella globale che non sapeva niente di questa storia. */
  segnale: fabbrica('segnale', { em: '📣', col: '#8b97b4' }),

  /* i congegni: si premono, e quello che succede lo dice `collegata` */
  leva: fabbrica('leva', { id: 'leva', nome: 'la leva' }),
  /* conta le pressioni, e quando arriva a `tacche` manda il comando */
  totem: fabbrica('totem', { id: 'totem', nome: 'il totem', tacche: 3 }),
}

/* ═══════════ chi — le unità ═══════════

   ── l'emoji viene dal corpo ──
   `corpo` dice come si disegna (`grafica/personaggi/`), e da lì esce
   anche la faccina con cui la si nomina negli ordini e nelle frecce di
   chi è fuori campo. Erano due dati da tenere allineati a mano, e la
   seconda volta che si sbagliava nessuno se ne accorgeva. Si scrive
   `emoji` solo quando quel personaggio ha una faccia sua — nelle
   storie ce l'hanno quasi tutti, ed è giusto così: sono qualcuno.

   ── e la vista ──
   È **quante celle vede camminando**: un muro in mezzo toglie la vista
   senza bisogno di tracciare raggi, perché la distanza è quella del
   cammino. Serve per `vai [qualcuno]` (ci vai solo se l'hai visto),
   per `vedi` nelle domande, e per il grido di chi ti scopre. Quattro è
   la misura normale — mezza stanza — e si scrive solo quando è
   particolare: l'orco con `vista: 2` guarda la sua porta e un metro
   più in là no, ed è quello che rende onesto un bivio. */
const CORPI = {
  cavaliere: '🦸', capitano: '🎖️', guardia: '🗡️', ladra: '🥷', mago: '🧙',
  elfo: '🧝', orco: '👹', goblin: '👺', scheletro: '💀',
  gatto: '🐈', lupo: '🐺', orso: '🐻', papera: '🦆',
}

/* ── LA SCHIERA HA UN ID E UN NOME ──
   L'id è la chiave con cui la si nomina in un ordine («attacca gli
   orchi» si scrive `attacca('orchi')`), il nome è come si legge in una
   frase. Erano la stessa stringa, e siccome il nome ha gli spazi la
   chiave diventava `gli-orchi`: nessun ordine la trovava più. */
const persona = (parte, [schiera, comeSiChiama], fissi = {}) => (...arg) => {
  const v = fabbrica('unita', fissi)(...arg)
  return { ...v, parte,
           schiera: v.schiera || schiera,
           schieraNome: v.schieraNome || (v.schiera ? v.schiera : comeSiChiama),
           corpo: v.corpo || 'cavaliere',
           emoji: v.emoji || CORPI[v.corpo || fissi.corpo] || '🙂',
           vista: v.vista ?? 4 }
}

export const chi = {
  nostro: persona('giocatore', ['nostri', 'i nostri']),
  nemico: persona('livello', ['nemici', 'i nemici']),
  /* chi non è né dei tuoi né contro: la principessa da difendere, il
     cane che passa. Lo comanda il livello, ma non è un avversario. */
  terzo: persona('livello', ['altri', 'gli altri']),

  /* i tre che tornano in mezzo tutorial, già vestiti */
  eroe: persona('giocatore', ['nostri', 'i nostri'], { id: 'eroe', nome: "l'eroe", corpo: 'cavaliere' }),
  orco: persona('livello', ['orchi', 'gli orchi'], { id: 'orco', nome: "l'orco", corpo: 'orco' }),
  guardia: persona('livello', ['guardie', 'le guardie'], { id: 'guardia', nome: 'la guardia', corpo: 'guardia' }),
}

/* ═══════════ fai — ordini e domande ═══════════
   Un ordine è verbo + complemento. Prima si scriveva `o('vai', 'x')`,
   e un refuso nel verbo si scopriva giocando: `o('vaii', 'x')` è una
   stringa come un'altra. Qui il verbo è il nome della funzione, quindi
   sbagliarlo è un errore subito. */
const ordine = verbo => cosa => ({ verbo, complemento: idDi(cosa) })
const domanda = (cond, extra = {}) => (cosa, piu = {}) =>
  ({ cond, complemento: idDi(cosa), ...extra, ...piu })

export const fai = {
  vai: ordine('vai'),
  prendi: ordine('prendi'),
  posa: ordine('posa'),
  apri: ordine('apri'),
  chiudi: ordine('chiudi'),
  premi: ordine('premi'),
  attacca: ordine('attacca'),
  suona: ordine('suona'),
  aspetta: ordine('aspetta'),
  aspettaDiVedere: ordine('aspettaDiVedere'),
  esegui: nome => ({ verbo: 'esegui', complemento: nome }),
  /* parlare a qualcuno in particolare, invece di gridare a chiunque:
     funziona **solo con chi si vede**, se no cadrebbe il principio per
     cui quello che non vedi te lo deve dire qualcuno */
  parla: (a, segnale) => ({ verbo: 'parla', complemento: idDi(segnale), a: idDi(a) }),
  /* arma un ascolto e passa oltre: quando quel segnale arriva parte
     una fila nuova, ed è così che un piano ha due punti d'ingresso */
  quando: (segnale, ...allora) => ({ verbo: 'quando', complemento: idDi(segnale), allora }),
  /* fermarsi finché una cosa che si VEDE non cambia */
  aspettaChe: cond => ({ verbo: 'aspetta', cond }),

  /* ── i blocchi ── */
  bivio: (cond, vero, falso) =>
    ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] }),
  ripeti: (corpo, finche) => ({ blocco: 'ripeti', corpo, finche }),
  giro: (punti, finche) =>
    ({ blocco: 'ripeti', corpo: punti.map(p => ({ verbo: 'vai', complemento: idDi(p) })), finche }),
  azione: (nome, corpo) => ({ blocco: 'routine', nome, corpo }),

}


/* ═══════════ se — le domande ═══════════
   Stanno in un nome loro perché **non sono ordini**: un ordine si fa,
   una domanda si guarda. `se.ha(eroe, tesoro)` si legge come si legge,
   e `vince: [se.ha(eroe, tesoro)]` dice esattamente quello che è. */
export const se = {
  vedi: domanda('vedi'),
  nonVedi: domanda('vedi', { non: true }),
  ha: (chi, cosa) => ({ cond: 'hai', chi: idDi(chi), complemento: idDi(cosa) }),
  nonHa: (chi, cosa) => ({ cond: 'hai', chi: idDi(chi), complemento: idDi(cosa), non: true }),
  qui: (chi, dove) => ({ cond: 'qui', chi: idDi(chi), complemento: idDi(dove) }),
  aperto: domanda('aperta'),
  chiuso: domanda('aperta', { non: true }),
  sentito: domanda('segnale'),
  premuto: domanda('premuto'),
  almeno: (cosa, n) => ({ cond: 'almeno', complemento: idDi(cosa), n }),
  vivo: domanda('vivo'),
  caduto: domanda('vivo', { non: true }),
}

export { livello } from './livello.js'
