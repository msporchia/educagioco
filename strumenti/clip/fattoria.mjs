/* La fattoria 3D: una fattoria già giocata (`#fattoria3d-tipo=30`, `fattoria3d/motore/tipo.js`: campi a
   stadi diversi, macchine al lavoro, bestie nei recinti) che si guarda vivere. Quello che ha da mostrare è
   che **è viva**: roba che cresce, animali che si muovono, le macchine in moto. Niente tocchi: la clip non
   dipende da nessun punto dello schermo, che col mondo in 3D cambierebbe a ogni modifica della telecamera.
   Il cheat butta la fattoria del bambino nel cestino: qui è il bambino finto di `scatti.mjs`. */
export default {
  file: 'clip-fattoria', dove: 'fattoria3d-tipo=30', attesa: '[data-f3="campo"]',
  passi: [async page => { await page.waitForTimeout(4000) }],           // il mondo si disegna, il fumetto d'avvio se ne va
  clip: { secondi: 8 },
}
