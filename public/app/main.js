// Point d'entrée de l'application. Les écrans sont ajoutés dans la tâche suivante.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
