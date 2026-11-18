// Le pagine attorno agli Asteroidi, che a scuola non si aprono (docs/asteroidi/scuola.md). Percorsi dalla radice del repo.
export default {
  sostituti: {
    'src/components/RottaAsteroidi.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/components/MappaTabelline.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/components/MappaConcetti.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/components/HangarAsteroidi.vue': 'src/scuola/sostituti/Vuoto.vue',
    'src/components/RegaloHangar.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // cosa del gioco di casa può entrare nel pacchetto dei bambini (la guardia vieta gli altri giochi)
  ammessi: ['src/views/MathGame.vue'],
}
