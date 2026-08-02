/* Verbi inglesi con il loro significato italiano.
   A differenza di `words.js`, qui la risposta NON è un'emoji ma la parola
   italiana scritta: così entrano anche azioni e concetti che nessuna singola
   emoji saprebbe illustrare. L'emoji, quando c'è, è solo un aiuto visivo sul
   lato inglese; molti verbi ne fanno a meno e va benissimo.

   Ogni voce è [inglese, italiano, emoji]. L'emoji può essere '' (vuota).
   I distrattori (le risposte sbagliate) sono altri verbi italiani di questa
   stessa lista, quindi bastano una dozzina di voci perché il gioco funzioni. */
export const VERBI = [
  // ---- movimento e corpo ----
  ['run', 'correre', '🏃'], ['walk', 'camminare', '🚶'], ['jump', 'saltare', '🤸'],
  ['swim', 'nuotare', '🏊'], ['fly', 'volare', '🕊️'], ['dance', 'ballare', '💃'],
  ['climb', 'arrampicarsi', '🧗'], ['fall', 'cadere', ''], ['sit', 'sedersi', '🪑'],
  ['stand', 'stare in piedi', '🧍'], ['clap', 'applaudire', '👏'], ['kick', 'calciare', '🦵'],
  // ---- ogni giorno ----
  ['eat', 'mangiare', '🍽️'], ['drink', 'bere', '🥤'], ['sleep', 'dormire', '😴'],
  ['wash', 'lavare', '🧼'], ['cook', 'cucinare', '🍳'], ['open', 'aprire', ''],
  ['close', 'chiudere', ''], ['clean', 'pulire', '🧹'], ['wear', 'indossare', '👕'],
  // ---- comunicare e sensi ----
  ['read', 'leggere', '📖'], ['write', 'scrivere', '✍️'], ['speak', 'parlare', '🗣️'],
  ['listen', 'ascoltare', '👂'], ['look', 'guardare', '👀'], ['sing', 'cantare', '🎤'],
  ['draw', 'disegnare', '🎨'], ['ask', 'chiedere', ''], ['answer', 'rispondere', ''],
  ['count', 'contare', '🔢'],
  // ---- sentimenti e insieme ----
  ['cry', 'piangere', '😢'], ['laugh', 'ridere', '😄'], ['smile', 'sorridere', '🙂'],
  ['love', 'amare', '❤️'], ['help', 'aiutare', '🤝'], ['hug', 'abbracciare', '🤗'],
  ['play', 'giocare', '🎲'], ['win', 'vincere', '🏆'],
  // ---- mani e azioni ----
  ['give', 'dare', ''], ['take', 'prendere', ''], ['throw', 'lanciare', ''],
  ['catch', 'afferrare', ''], ['push', 'spingere', ''], ['pull', 'tirare', ''],
  ['carry', 'portare', ''], ['build', 'costruire', '🔨'], ['find', 'trovare', '🔎'],
  ['buy', 'comprare', '🛒'],
  // ---- verbi indispensabili ----
  ['go', 'andare', ''], ['come', 'venire', ''], ['want', 'volere', ''],
  ['make', 'fare', ''], ['know', 'sapere', ''], ['see', 'vedere', ''],
]
