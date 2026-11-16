import { validateContent } from "../src/validate";
import { readData } from "./read-data";

const errors = validateContent(readData());
if (errors.length > 0) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  console.error(`\n${errors.length} erreur(s) de validation.`);
  process.exit(1);
}
console.log("Contenu valide.");
