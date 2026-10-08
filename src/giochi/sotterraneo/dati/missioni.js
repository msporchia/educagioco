// Chi dà le missioni sulla terra di sopra, e cosa chiede (docs/sotterraneo/missioni.md). Ogni missione è legata a
// una discesa e a un piano: **trova** (una cosa col nome proprio, in un forziere che si riconosce) o **sconfiggi**
// (un mostro col nome, più duro di quelli del suo piano). Formano un albero: ognuna dichiara i suoi `richiede`
// (una discesa finita, un'altra missione consegnata) e si sblocca da sola quando ci sono tutti. Non bloccano
// niente; il premio è in gemme o in roba (un piccolo vantaggio, mai un passo intero della storia, dati/storia.js),
// e a volte in monete, quante sono le domande in più che chiede. Dove stanno lo dice il foglietto (PERSONAGGI in
// dati/terra-mappa.js).
import { COSE } from './cose.js'
import { MOSTRI } from './mostri.js'
import { CAMPAGNA } from './campagna.js'

// `chi` in mezzo a una frase («portala alla ragazza del pozzo»); quello che dicono sta in dati/dialoghi.js
export const PERSONAGGI = {
  ragazza: { nome: 'La ragazza del pozzo', chi: 'la ragazza del pozzo', sprite: 'ragazza' },
  mugnaio: { nome: 'Il mugnaio', chi: 'il mugnaio', sprite: 'mugnaio' },
  // la chiave resta `eremita` (salvataggi, sprite): sullo schermo è il frate, una parola che un bambino conosce
  eremita: { nome: 'Il frate', chi: 'il frate dell\'altare', sprite: 'eremita' },
  guardia: { nome: 'La guardia della torre', chi: 'la guardia della torre', sprite: 'guardia' },
  pescatore: { nome: 'Il pescatore', chi: 'il pescatore dello stagno', sprite: 'pescatore' },
  boscaiolo: { nome: 'Il boscaiolo', chi: 'il boscaiolo', sprite: 'boscaiolo' },
}
// il vecchio minatore sta sulla mappa per conto suo (viste/Terra.vue), non fra i personaggi: dà la sua missione
// come gli altri, e il diario deve poterlo nominare
const IL_MINATORE = { nome: 'Il vecchio minatore', chi: 'il vecchio minatore' }
export const personaDi = da => PERSONAGGI[da] || (da === 'minatore' ? IL_MINATORE : null)

// quante missioni al massimo sono aperte insieme (prese, fatte da consegnare, o offerte con il «!»): oltre non se
// ne propone un'altra finché non se ne consegna una (decisione dell'utente: «non proporgliele se sono troppe»)
export const TETTO = 3

// `piano` da 0, come nel motore; `dice` è la richiesta, `ritorno` quello che dice vedendoti tornare a cosa fatta,
// `grazie` la consegna (docs/sotterraneo/dialoghi.md). La cosa da trovare ha la sua faccia
// (`em`); il mostro col nome ha `tipo` (dal bestiario), e il motore lo fa più duro.
// `richiede`: tutto questo insieme, e la sua discesa aperta, sblocca la missione da sola: `{ fatta: <discesa> }` la
// discesa è finita, `{ consegnata: <id> }` quella missione è consegnata. Un requisito riguarda sempre una discesa
// più avanti nella fila di quella della missione: chi arriva alla discesa ha già avuto modo di averlo (guasti sotto).
// `premio.monete`: le domande in più che la missione chiede (docs/sotterraneo/missioni.md, il conto)
export const MISSIONI = [
  { id: 'badessa', da: 'eremita', discesa: 'altare', piano: 1, tipo: 'sconfiggi',
    mostro: { tipo: 'fantasma', nome: 'La Dama Grigia' },
    richiede: [],
    dice: 'Nella cripta, al secondo piano, si aggira la Dama Grigia: un fantasma che non trova pace. Battila, e potrà riposare.',
    grazie: 'Stanotte la cripta dorme tranquilla. Tieni: le offerte dei pellegrini servono più a te che a me.',
    ritorno: 'Stanotte, dalla cripta, nessun lamento. Sei stato tu?',
    premio: { gemme: 12, monete: 1 } },

  { id: 'collana', da: 'ragazza', discesa: 'cantine', piano: 0, tipo: 'trova',
    cosa: { nome: 'La collana della nonna', em: '📿' },
    richiede: [{ fatta: 'altare' }],
    dice: 'Un goblin mi ha rubato la collana della nonna ed è scappato giù per la scalinata antica. Non può essere andato lontano: è al primo piano!',
    grazie: 'La collana della nonna! Non so come ringraziarti. Ecco le gemme che avevo messo da parte.',
    ritorno: 'Quella che ti luccica in mano… è la collana della nonna?',
    premio: { gemme: 15 } },

  { id: 'rosicchione', da: 'mugnaio', discesa: 'torre', piano: 1, tipo: 'sconfiggi',
    mostro: { tipo: 'ratto', nome: 'Rosicchione' },
    richiede: [{ fatta: 'cantine' }],
    dice: 'Un ratto grosso come un cane mi ruba la farina e scappa sotto la torre in rovina. Si chiama Rosicchione, e sta al secondo piano.',
    grazie: 'Niente più farina rubata! Questo amuleto me l\'ha lasciato un viandante: a te servirà più che a me.',
    ritorno: 'Stamattina nel mulino non manca un chicco. Che ne è stato di Rosicchione?',
    premio: { cosa: 'amuleto-azzurro', monete: 2 } },

  { id: 'chiavi', da: 'guardia', discesa: 'torre', piano: 2, tipo: 'trova',
    cosa: { nome: 'Il mazzo di chiavi della torre', em: '🔑' },
    richiede: [{ fatta: 'cantine' }],
    dice: 'Ho perso il mazzo di chiavi della torre. Mi è caduto giù per le scale, fino al terzo piano: io là sotto non ci scendo.',
    grazie: 'Le chiavi della torre! Adesso posso chiudere a chiave. Prendi, è la mia paga di una settimana.',
    ritorno: 'Sento un tintinnio. Sono le chiavi della torre?',
    premio: { gemme: 20 } },

  // il seguito della collana: il goblin non si è fermato
  { id: 'goblin', da: 'ragazza', discesa: 'torre', piano: 0, tipo: 'sconfiggi',
    mostro: { tipo: 'goblin', nome: 'Grattanaso, il goblin ladro' },
    richiede: [{ consegnata: 'collana' }],
    dice: 'Il goblin che mi ha rubato la collana non ha smesso: adesso fa il ladro sotto la torre in rovina, al primo piano. Lo chiamano Grattanaso. Fermalo, ti prego.',
    grazie: 'Grattanaso non ruberà più niente al villaggio! Prendi queste gemme: le tenevo da parte per la nonna.',
    ritorno: 'Al villaggio non sparisce più niente. Grattanaso?',
    premio: { gemme: 10, monete: 2 } },

  { id: 'ascia', da: 'boscaiolo', discesa: 'gallerie', piano: 3, tipo: 'trova',
    cosa: { nome: 'L\'ascia di mio padre', em: '🪓' },
    richiede: [{ fatta: 'torre' }],
    dice: 'Mio padre ha perso la sua ascia nella grotta della scaletta, al quarto piano. È vecchia, ma a lui è cara.',
    grazie: 'L\'ascia di mio padre! Gli verranno le lacrime agli occhi. Queste gemme le avevo trovate fra le radici.',
    ritorno: 'Quel manico lo riconoscerei fra mille. È l\'ascia di mio padre!',
    premio: { gemme: 25 } },

  // il seguito della Dama Grigia (id `badessa`, il nome di prima): i pellegrini che la pregavano si sono perduti più in basso
  { id: 'libro', da: 'eremita', discesa: 'gallerie', piano: 2, tipo: 'trova',
    cosa: { nome: 'Il libro dei nomi', em: '📖' },
    richiede: [{ consegnata: 'badessa' }],
    dice: 'I pellegrini che scesero nella grotta della scaletta portavano il libro dei nomi, per scriverci chi non è tornato. Lo persero al terzo piano. Riportamelo: ogni nome ha diritto di essere ricordato.',
    grazie: 'Il libro dei nomi! Adesso nessuno resterà senza nome. Tieni, sono le offerte di un anno.',
    ritorno: 'Quel libro che porti… è il libro dei nomi?',
    premio: { gemme: 20 } },

  { id: 'chela', da: 'pescatore', discesa: 'cisterna', piano: 1, tipo: 'sconfiggi',
    mostro: { tipo: 'granchio', nome: 'Chela, il granchio gigante' },
    richiede: [{ fatta: 'gallerie' }],
    dice: 'Un granchio gigante mi taglia le reti, e poi si nasconde nella scala sommersa, al secondo piano. Lo chiamano Chela.',
    grazie: 'Le mie reti sono salve! Tieni quest\'anello: l\'ho pescato io, e al buio brilla.',
    ritorno: 'Le mie reti sono intere da due notti. Chela?',
    premio: { cosa: 'anello-ambra', monete: 1 } },

  { id: 'canna', da: 'pescatore', discesa: 'cisterna', piano: 2, tipo: 'trova',
    cosa: { nome: 'La canna d\'oro', em: '🎣' },
    richiede: [{ fatta: 'gallerie' }],
    dice: 'La mia canna d\'oro è scivolata nell\'acqua ed è finita giù nella scala sommersa, al terzo piano. Con quella i pesci abboccavano sempre.',
    grazie: 'La canna d\'oro! Domani abboccano di sicuro. Ecco, questo è per te.',
    ritorno: 'Cos\'è che brilla lì? La mia canna d\'oro!',
    premio: { gemme: 25 } },

  { id: 'zannagrigia', da: 'guardia', discesa: 'labirinto', piano: 1, tipo: 'sconfiggi',
    mostro: { tipo: 'lupo', nome: 'Zannagrigia' },
    richiede: [{ fatta: 'cisterna' }],
    dice: 'Sotto la botola segreta vive un lupo vecchio e furbo, Zannagrigia: al secondo piano. Di notte esce e ulula sotto la torre.',
    grazie: 'Stanotte niente ululati! Prendi queste gemme: le tenevo per una spada nuova, ma la spada la usi meglio tu.',
    ritorno: 'Stanotte niente ululati sotto la torre. Zannagrigia?',
    premio: { gemme: 30, monete: 2 } },

  // il seguito di Rosicchione: la farina che il ratto non ha rosicchiato è finita più lontano
  { id: 'sacco', da: 'mugnaio', discesa: 'labirinto', piano: 0, tipo: 'trova',
    cosa: { nome: 'Il sacco di farina buona', em: '🌾' },
    richiede: [{ consegnata: 'rosicchione' }],
    dice: 'Dopo Rosicchione, un sacco della mia farina migliore è caduto dal carro ed è rotolato dentro la botola segreta del prato. Dev\'essere al primo piano: aiutami a ritrovarlo.',
    grazie: 'Il mio sacco! Con questa farina il pane torna buono. Prendi, per il disturbo.',
    ritorno: 'Sento odore di farina buona. Il mio sacco!',
    premio: { gemme: 20 } },

  { id: 'lanterna', da: 'minatore', discesa: 'fondo', piano: 2, tipo: 'trova',
    cosa: { nome: 'La lanterna di mio nonno', em: '🏮' },
    richiede: [{ fatta: 'labirinto' }],
    dice: 'La lanterna di mio nonno è rimasta nella miniera, al terzo piano. Lui diceva che faceva luce anche sulle cose nascoste.',
    grazie: 'La lanterna del nonno! È come averlo qui. Questo teschio l\'ho trovato in miniera da ragazzo: le gemme gli piacciono.',
    ritorno: 'Quella luce… è la lanterna del nonno. L\'hai trovata davvero.',
    premio: { cosa: 'teschio-cercatore' } },
]

// il mostro col nome è più duro di quelli del suo piano: più ossa e un colpo in più (il motore lo applica). Era una volta
// e mezza: da quando i mostri delle discese di fondo hanno tante ossa (contano anche i livelli dell'eroe) chiedeva venti
// risposte di fila, e un quarto in più basta a farlo notare
export const PIU_DURO = { ossa: 1.25, att: 1 }

export const missioneDi = id => MISSIONI.find(m => m.id === id) || null
export const missioniDi = chi => MISSIONI.filter(m => m.da === chi)

// quello che il premio dice, per il fumetto e la riga: «💎 15», «Amuleto azzurro», «💎 12 · 🪙 1»
export function premioDetto(p) {
  const parti = []
  if (p.gemme) parti.push(`💎 ${p.gemme}`)
  if (p.cosa && COSE[p.cosa]) parti.push(COSE[p.cosa].nome)
  if (p.monete) parti.push(`🪙 ${p.monete}`)
  return parti.join(' · ')
}

// il posto della discesa nella fila (dati/campagna.js): la storia va in questo ordine
export const posto = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)

export function guastiDelleMissioni(chiDaFuori = []) {
  const g = []
  const viste = new Set()
  for (const m of MISSIONI) {
    if (viste.has(m.id)) g.push(`due missioni "${m.id}"`)
    viste.add(m.id)
    if (!personaDi(m.da)) g.push(`${m.id}: la dà "${m.da}", che non c'è`)
    const t = CAMPAGNA.find(x => x.chiave === m.discesa)
    if (!t) { g.push(`${m.id}: la discesa "${m.discesa}" non c'è`); continue }
    if (!(m.piano >= 0 && m.piano < t.piani)) g.push(`${m.id}: piano ${m.piano + 1}, e ${t.nome.toLowerCase()} ne ha ${t.piani}`)
    if (!['trova', 'sconfiggi'].includes(m.tipo)) g.push(`${m.id}: tipo "${m.tipo}"`)
    if (m.tipo === 'trova' && !(m.cosa && m.cosa.nome && m.cosa.em)) g.push(`${m.id}: cosa trovare, senza nome o faccia`)
    if (m.tipo === 'sconfiggi' && !(m.mostro && MOSTRI[m.mostro.tipo] && m.mostro.nome)) g.push(`${m.id}: il mostro non c'è o non ha nome`)
    if (m.tipo === 'sconfiggi' && MOSTRI[m.mostro.tipo] && MOSTRI[m.mostro.tipo].capo) g.push(`${m.id}: un capo non si ruba alla tappa`)
    if (!m.dice || !m.grazie || !m.ritorno) g.push(`${m.id}: senza richiesta, ritorno o grazie`)
    const p = m.premio || {}
    if (!(p.gemme > 0) && !(p.cosa && COSE[p.cosa])) g.push(`${m.id}: senza premio, o con un premio che non esiste`)
    if (p.gemme > 40) g.push(`${m.id}: ${p.gemme} gemme, è un passo della storia e non un vantaggio`)
    if (p.cosa && COSE[p.cosa] && COSE[p.cosa].dove && COSE[p.cosa].dove !== 'dito')
      g.push(`${m.id}: un premio da impugnare o indossare salterebbe un passo della storia (solo gioielli)`)
    // le monete sono le domande in più (il conto sta in unita/sotterraneo-missioni): intere, poche, e solo dove si combatte
    if (p.monete != null && !(Number.isInteger(p.monete) && p.monete >= 1 && p.monete <= 10))
      g.push(`${m.id}: ${p.monete} monete (da 1 a 10, intere)`)
    if (p.monete && m.tipo !== 'sconfiggi') g.push(`${m.id}: le monete si misurano sui colpi in più, e qui non ce ne sono`)
    // l'albero: ogni requisito è una cosa nota e riguarda una discesa prima della sua (si sblocca prima di scendere)
    if (!Array.isArray(m.richiede)) { g.push(`${m.id}: senza "richiede" (anche vuoto)`); continue }
    for (const r of m.richiede) {
      if (r.fatta) {
        if (posto(r.fatta) < 0) g.push(`${m.id}: richiede la discesa "${r.fatta}", che non c'è`)
        else if (posto(r.fatta) >= posto(m.discesa)) g.push(`${m.id}: richiede ${r.fatta} finita, ma non è prima della sua discesa`)
      } else if (r.consegnata) {
        const padre = missioneDi(r.consegnata)
        if (!padre) g.push(`${m.id}: richiede "${r.consegnata}", che non c'è`)
        else if (posto(padre.discesa) >= posto(m.discesa)) g.push(`${m.id}: richiede ${r.consegnata} consegnata, ma la sua discesa non è prima`)
      } else g.push(`${m.id}: un requisito che non conosco (${JSON.stringify(r)})`)
    }
  }
  for (const k of Object.keys(PERSONAGGI)) {
    if (!missioniDi(k).length) g.push(`${k}: sta sulla mappa ma non chiede niente`)
    if (chiDaFuori.length && !chiDaFuori.includes(k)) g.push(`${k}: non ha un posto sulla mappa`)
  }
  // ogni discesa ha almeno una missione che non aspetta nessun'altra: chi non ne consegna mai una la trova lo stesso
  for (const t of CAMPAGNA) {
    const quelle = MISSIONI.filter(m => m.discesa === t.chiave)
    if (!quelle.length) g.push(`${t.chiave}: nessuna missione la riguarda`)
    else if (!quelle.some(m => Array.isArray(m.richiede) && !m.richiede.some(r => r.consegnata)))
      g.push(`${t.chiave}: tutte le sue missioni aspettano un'altra missione`)
  }
  return g
}
