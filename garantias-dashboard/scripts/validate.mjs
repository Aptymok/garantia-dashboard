import fs from "node:fs";
const required = [
  "index.html",
  "assets/css/styles.css",
  "assets/js/app.js",
  "assets/js/config.js",
  "dax/garantias_operational_export.template.dax",
  "office-scripts/writeRowsToTable.ts",
  "power-automate/request-schema.json"
];
let ok = true;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Falta: ${file}`);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log("Validación OK.");
