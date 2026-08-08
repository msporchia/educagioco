/* ═══════════════════════════════════════════════════════════════════
   LE TRE SCENE — dirle a parole.

   Un livello si vince solo se il piano regge su tutte e tre le scene, e
   le tre scene **sono** diverse: è tutto il punto del gioco. Ma il
   bambino non lo vedeva: sembrava che il gioco gli facesse rifare tre
   volte la stessa identica partita, e allora il terzo tentativo pareva
   accanimento invece che la prova che il piano vale.

   Qui c'è la riga che dice cosa cambia. Nel caso normale è già scritta
   nei dati — una variante ha un `nome` che l'ha messo chi ha disegnato
   il livello, ed è meglio di qualunque frase generata («il cunicolo è
   franato» batte «due cose si sono spostate»). Se il nome non c'è, si
   guarda cosa dichiara la variante e si dice quello.
   ═══════════════════════════════════════════════════════════════════ */

const DIFFERENZE = [
  ['oggetti', 'le cose non sono dove erano'],
  ['posti',   'la meta si è spostata'],
  ['porte',   'le porte sono cambiate'],
  ['unita',   'non sono tutti al loro posto'],
  ['griglia', 'la mappa non è più quella'],
  ['zone',    'i posti da tenere sono altri'],
]

export function cosaCambia (liv, k) {
  const v = (liv?.varianti || [])[k]
  if (!v) return ''
  if (v.nome) return v.nome
  const dette = DIFFERENZE.filter(([campo]) => v[campo]).map(([, frase]) => frase)
  return dette.length ? dette.join(', ') : 'la scena è un\'altra'
}

/* i nomi delle scene giocate, per il velo di fine: quello che il piano
   ha superato, uno per riga */
export const nomiScene = (liv, quante) =>
  (liv?.varianti || []).slice(0, quante).map((v, k) => v.nome || 'scena ' + (k + 1))
