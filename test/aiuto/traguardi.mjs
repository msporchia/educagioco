/* I cartelli dei traguardi (components/Traguardo.vue) coprono lo schermo 3,2 s l'uno, in fila: un tocco su un tasto lì sotto
   aspetta che spariscano da soli, e un giro di tappa ne fa scattare tre o quattro (una dozzina di secondi persi). Si chiudono
   come li chiude un bambino, toccandoli; torna quanti ne erano aperti. Il velo non ha un `data-…`: si riconosce dall'occhiello. */
export const chiudiTraguardi = page => page.evaluate(async () => {
  await new Promise(ok => requestAnimationFrame(() => ok()))   // il cartello nasce un fotogramma dopo il punto che lo fa scattare
  let n = 0
  document.querySelectorAll('.velo').forEach(v => { if (v.querySelector('.occhiello')) { v.click(); n++ } })
  return n
})

/* Da seminare insieme a un profilo già avanti: con `badgeInit: 0` la prima volta che il gioco guarda i traguardi registra in
   silenzio quelli già meritati (store/profile.js, `controllaTraguardi`), invece di festeggiarli tutti uno dopo l'altro. */
export const GIA_FESTEGGIATI = { badgeInit: 0 }
