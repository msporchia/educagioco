// Forma lunga → forma contratta, nell'ordine in cui si applicano: prima le
// negazioni (it is not → it isn't), poi pronome + verbo. Le righe con
// `seguita` si contraggono solo se dopo c'è un'altra parola: «yes, it is» in
// fondo alla frase non diventa mai «yes, it's». Vedi docs/lingue/mondi.md.
export const CONTRAZIONI = [
  ['is not', 'isn’t'], ['are not', 'aren’t'], ['do not', 'don’t'], ['does not', 'doesn’t'],
  ['have not', 'haven’t'], ['has not', 'hasn’t'], ['cannot', 'can’t'], ['was not', 'wasn’t'],
  ['were not', 'weren’t'], ['did not', 'didn’t'],
  ['I have got', 'I’ve got'], ['you have got', 'you’ve got'], ['we have got', 'we’ve got'],
  ['they have got', 'they’ve got'], ['he has got', 'he’s got'], ['she has got', 'she’s got'],
  ['it has got', 'it’s got'],
  ['I am', 'I’m', 'seguita'], ['you are', 'you’re', 'seguita'], ['we are', 'we’re', 'seguita'],
  ['they are', 'they’re', 'seguita'], ['it is', 'it’s', 'seguita'], ['he is', 'he’s', 'seguita'],
  ['she is', 'she’s', 'seguita'], ['that is', 'that’s', 'seguita'], ['what is', 'what’s', 'seguita'],
  ['where is', 'where’s', 'seguita'], ['there is', 'there’s', 'seguita'], ['let us', 'let’s'],
]
