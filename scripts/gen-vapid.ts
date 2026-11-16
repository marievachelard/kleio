import { generateVapidKeys } from "../src/vapidKeys";

const k = await generateVapidKeys();
console.log("Copie ces valeurs ; ne les écris dans aucun fichier du dépôt.\n");
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${k.privateKey}`);
