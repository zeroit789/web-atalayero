/*
  arranque.js · Conservas Atalayero
  Marca <html> con la clase "js" antes de pintar, para la llegada animada del héroe (acaba siempre
  visible). Lo que se oculta hasta entrar en pantalla depende de la clase que pone principal.js, así
  que si ese script falla todo se ve. Va en un fichero propio porque la CSP no permite scripts en línea.
  Flags <html> with the "js" class before paint, for the animated hero arrival (it always ends
  visible). Whatever stays hidden until it enters the screen depends on the class set by principal.js,
  so if that script fails everything shows. It lives in its own file because the CSP blocks inline scripts.
*/
document.documentElement.classList.add('js');
