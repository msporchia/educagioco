/* La data di nascita di un bambino, per tenere l'età aggiornata (docs/genitori/riordino.md). Solo mese e anno, solo sul telefono:
   non viaggia mai verso il servizio. Il compleanno è il primo del mese di nascita (con il mese basta e non si chiede il giorno).
   Dato puro: il profilo e le schermate la usano, qui non c'è Vue. */
export const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
export const ETA_MIN = 3        // gli estremi che il profilo accetta (`etaDelBambino`)
export const ETA_MAX = 14

export const nascitaValida = (n, oggi = new Date()) =>
  !!n && Number.isInteger(n.m) && n.m >= 0 && n.m <= 11 && Number.isInteger(n.a) && n.a >= oggi.getFullYear() - 18 && n.a <= oggi.getFullYear()

/* quanti anni e mesi ha adesso; null se la data non c'è o è nel futuro */
export function etaAnagrafica(nascita, oggi = new Date()) {
  if (!nascitaValida(nascita, oggi)) return null
  const mesi = (oggi.getFullYear() - nascita.a) * 12 + (oggi.getMonth() - nascita.m)
  if (mesi < 0) return null
  return { anni: Math.floor(mesi / 12), mesi: mesi % 12, totale: mesi }
}

export const dentroGliEstremi = anni => Math.max(ETA_MIN, Math.min(ETA_MAX, anni))

/* ── La scuola italiana ──
   Si entra in prima elementare nell'anno in cui si compiono 6 anni, e si passa di classe a settembre, non al compleanno: un bambino
   nato a novembre 2018 è in terza nell'anno scolastico 2026/27, prima ancora di compiere 8 anni. L'età su cui i giochi sono tarati è
   quella *di classe*: gli anni che si compiono durante l'anno scolastico (terza = 8, prima media = 11). Per i regolari è anno
   scolastico meno anno di nascita; lo scarto dice di quanto i grandi se ne sono allontanati (un anticipatario, una classe ripetuta). */
export const annoScolastico = (oggi = new Date()) => (oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1)

/* l'età su cui tarare un bambino regolare di quella data (null se la data non c'è), non ancora dentro gli estremi */
export function etaDiClasse(nascita, oggi = new Date()) {
  if (!nascitaValida(nascita, oggi) || !etaAnagrafica(nascita, oggi)) return null
  return annoScolastico(oggi) - nascita.a
}

/* l'età su cui tarare, dato lo scarto che i grandi hanno voluto (un anno più avanti della classe = +1) */
export function etaVoluta(nascita, scarto = 0, oggi = new Date()) {
  const e = etaDiClasse(nascita, oggi)
  return e == null ? null : dentroGliEstremi(e + (Number.isInteger(scarto) ? scarto : 0))
}

const ORDINALI = ['prima', 'seconda', 'terza', 'quarta', 'quinta']
/* la classe a parole per una età di classe (6 = prima elementare, 11 = prima media, 14 = terza superiore): «terza elementare» */
export function nomeClasse(eta) {
  const c = eta - 5
  if (c < 1) return 'scuola dell\'infanzia'
  if (c <= 5) return `${ORDINALI[c - 1]} elementare`
  if (c <= 8) return `${ORDINALI[c - 6]} media`
  return `${ORDINALI[Math.min(c - 9, 4)]} superiore`
}
/* dove sta nell'anno: da settembre a novembre «da poco», fino a marzo «a metà», poi «verso la fine»; luglio e agosto è finita */
export function momentoDellAnno(oggi = new Date()) {
  const m = oggi.getMonth()
  if (m >= 6 && m <= 7) return 'finita'
  if (m >= 8 && m <= 10) return 'inizio'
  if (m === 11 || m <= 2) return 'meta'
  return 'fine'
}
/* «è in terza elementare, a metà anno» / «ha finito la terza elementare»; null se non c'è la data */
export function inClasse(nascita, oggi = new Date()) {
  const eta = etaDiClasse(nascita, oggi)
  if (eta == null) return null
  if (eta < 6) return 'va alla scuola dell\'infanzia'
  const nome = nomeClasse(eta), mom = momentoDellAnno(oggi)
  if (mom === 'finita') return `ha finito la ${nome}`
  return `è in ${nome}` + { inizio: ', da poco cominciata', meta: ', a metà anno', fine: ', verso la fine' }[mom]
}

/* quando cambia classe: a settembre. `fra` in mesi (1-12), e la classe che comincia */
export function prossimaClasse(nascita, oggi = new Date()) {
  const eta = etaDiClasse(nascita, oggi)
  if (eta == null) return null
  const m = oggi.getMonth()
  const fra = m >= 8 ? 12 - m + 8 : 8 - m
  return { eta: eta + 1, nome: nomeClasse(eta + 1), fra }
}

export const inParole = e => `${e.anni} ${e.anni === 1 ? 'anno' : 'anni'}${e.mesi ? ` e ${e.mesi} ${e.mesi === 1 ? 'mese' : 'mesi'}` : ''}`
