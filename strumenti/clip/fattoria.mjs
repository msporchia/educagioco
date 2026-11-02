/* La fattoria 3D: una fattoria già giocata (`#fattoria3d-tipo=30`, `fattoria3d/motore/tipo.js`: campi a
   stadi diversi, macchine al lavoro, bestie nei recinti) che si guarda vivere. Quello che ha da mostrare è
   che **è viva**: roba che cresce, animali che si muovono, le macchine in moto. Niente tocchi: la clip non
   dipende da nessun punto dello schermo, che col mondo in 3D cambierebbe a ogni modifica della telecamera.
   Il cheat butta la fattoria del bambino nel cestino: qui è il bambino finto di `scatti.mjs`. */
/* Il contadino al lavoro: la camera si avvicina e `quanti` campi maturi si raccolgono uno dopo l'altro (la coda di «Raccogli»), come
   col dito. Nella fattoria del cheat il magazzino è pieno e il contadino direbbe «il fienile è pieno»: lo si vuota. Va dopo che il mondo
   si è disegnato; `dopo` ms più tardi (la falce a metà colpo) la foto. Usato anche da `scatti.mjs` (`fattoria-gioco`). */
export const alLavoro = (quanti, dopo = 0) => async page => {
  await page.waitForTimeout(3500)                                         // il mondo si disegna, il fumetto d'avvio se ne va
  const preso = await page.evaluate(n => {
    const { motore: m, mondo } = window.__fattoria3d
    m.s.merci = {}                                                        // il magazzino pieno fermerebbe la falce
    const maturi = m.s.cose.filter(c => c.tipo === 'campo' && m.campoMaturo(c)).slice(0, n)
    mondo.camera.zoom = 0.62
    mondo.cmd.modo = 'raccogli'
    for (const c of maturi) mondo.coda.push(c.id)
    return maturi.length
  }, quanti)
  if (!preso) throw new Error('nessun campo maturo da raccogliere')
  await page.waitForTimeout(dopo)
}

export default {
  file: 'clip-fattoria', dove: 'fattoria3d-tipo=30', attesa: '[data-f3="campo"]', giorno: '2026-06-15',
  passi: [alLavoro(3)],
  clip: { secondi: 8 },
}
