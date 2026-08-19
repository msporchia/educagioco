/* ═══════════════════════════════════════════════════════════════════
   CHI SCENDE — quattro, e si sceglie una volta

   Il foglio 0x72 disegna otto personaggi giocabili con le stesse pose
   dell'eroe di prima; quattro sono diventati i quattro modi di scendere
   qua sotto. Non è varietà per la varietà: **la scelta cambia i conti**,
   e li cambia in un modo che si legge in due numeri.

   ── LA DIFFERENZA STA IN VITA E BRACCIO, E BASTA ──────────────────
   Niente tratti nascosti, niente abilità da ricordare: quanto reggi e
   quanto fai male. Sono le due colonne che compaiono nella scelta, e un
   bambino di sette anni le confronta da solo. Un tratto in più — «vede
   al buio», «trova più gemme» — sarebbe una cosa da spiegare, e una cosa
   da spiegare in un gioco che non si spiega la sanno solo i grandi.

   ── I NUMERI, E PERCHÉ PROPRIO QUESTI ─────────────────────────────
   Il costo di un mostro è le sue ossa diviso il tuo braccio, quindi
   l'attacco è la manopola **velenosa**: fra 3 e 5 il gigante passa da
   nove risposte a cinque. Per questo chi picchia di più regge di meno, e
   per questo nessuno scende sotto braccio 3 — con 2 l'orco costerebbe
   dodici risposte di fila, che non è difficile: è lungo. La difesa
   invece si muove piano (toglie 1 al danno di ogni sbaglio) ed è la
   moneta con cui si paga la vita bassa del mago.

   Chi vince con chi lo dice il banco di prova, non l'occhio:
   `unita/sotterraneo` gioca la campagna con tutti e quattro e controlla
   che nessuno esca dalla seduta.
   ═══════════════════════════════════════════════════════════════════ */

export const EROI = [
  { chiave: 'cavaliere', nome: 'Cavaliere', em: '🛡️', sprite: 'cavaliere',
    vita: 24, att: 3, dif: 1,
    dice: 'Tiene botta. Se non sai chi scegliere, è questo.' },

  { chiave: 'elfa', nome: 'Elfa', em: '🧝', sprite: 'elfa',
    vita: 20, att: 4, dif: 1,
    dice: 'Colpisce più forte, e regge un po\' meno.' },

  { chiave: 'mago', nome: 'Mago', em: '🧙', sprite: 'mago',
    vita: 16, att: 5, dif: 0,
    dice: 'I mostri cadono in metà risposte. Ma ogni sbaglio fa malissimo.' },

  { chiave: 'nano', nome: 'Nano', em: '🧔', sprite: 'nano',
    vita: 26, att: 3, dif: 2,
    dice: 'Sbagliare gli fa quasi il solletico. Non cade quasi mai.' },
]

export const DI_PARTENZA = 'cavaliere'

export const eroeDi = chiave => EROI.find(e => e.chiave === chiave) || EROI[0]

export function guastiDegliEroi() {
  const g = []
  const viste = new Set()
  for (const e of EROI) {
    if (viste.has(e.chiave)) g.push(`due eroi con la chiave "${e.chiave}"`)
    viste.add(e.chiave)
    if (!e.nome || !e.em || !e.dice) g.push(`${e.chiave}: senza nome, emoji o frase`)
    if (!e.sprite) g.push(`${e.chiave}: senza sprite, e a schermo sarebbe un buco`)
    /* Il pavimento: sotto braccio 3 il colpo sull'orco scende a 1 e
       abbatterlo costa dodici risposte di fila. Non è difficile, è lungo
       — ed è il modo di far chiudere il gioco. */
    if (e.att < 3) g.push(`${e.chiave}: braccio ${e.att}, i mostri diventano lunghi invece che duri`)
    if (e.vita < 14) g.push(`${e.chiave}: ${e.vita} di vita, si sviene al terzo sbaglio`)
    if (e.dif < 0) g.push(`${e.chiave}: difesa sotto zero`)
  }
  if (!EROI.some(e => e.chiave === DI_PARTENZA))
    g.push(`chi si parte (${DI_PARTENZA}) non è fra gli eroi`)
  return g
}
