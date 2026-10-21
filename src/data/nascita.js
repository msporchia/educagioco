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

/* l'età su cui tarare, dato lo scarto che i grandi hanno voluto (un anno più avanti = +1) */
export function etaVoluta(nascita, scarto = 0, oggi = new Date()) {
  const e = etaAnagrafica(nascita, oggi)
  return e ? dentroGliEstremi(e.anni + (Number.isInteger(scarto) ? scarto : 0)) : null
}

/* il prossimo compleanno: a che età, e fra quanti mesi (0 = è questo mese) */
export function prossimoCompleanno(nascita, oggi = new Date()) {
  const e = etaAnagrafica(nascita, oggi)
  if (!e) return null
  return { anni: e.anni + 1, fra: 12 - e.mesi, mese: MESI[nascita.m] }
}

export const inParole = e => `${e.anni} ${e.anni === 1 ? 'anno' : 'anni'}${e.mesi ? ` e ${e.mesi} ${e.mesi === 1 ? 'mese' : 'mesi'}` : ''}`
