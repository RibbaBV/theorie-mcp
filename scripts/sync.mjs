#!/usr/bin/env node
/**
 * De theorie in data/ vervangen door een verse kopie.
 *
 * Onderhoudsscript. Het verwacht één argument: de map met de bronbestanden.
 *
 *   node scripts/sync.mjs <map>
 */
import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = resolve(HIER, '..', 'data');

const BESTANDEN = [
  'theorie-cursus.json',
  'verkeersborden.json',
  'borden-uitleg.json',
  'borden-voorschriften.json',
  'begrippen.json',
  'wetsartikelen.json',
  'examenvragen.json',
  'cbr-woordenlijst.json',
];

if (!process.argv[2]) {
  console.error('Geef de map met de bronbestanden mee: node scripts/sync.mjs <map>');
  process.exit(1);
}

// De bestanden staan onder de bron in website/src/data, of rechtstreeks in de
// meegegeven map. Zo werkt zowel een checkout als een losse map met JSON.
const kandidaten = [
  resolve(process.argv[2], 'website', 'src', 'data'),
  resolve(process.argv[2]),
];

let bron = null;
for (const kandidaat of kandidaten) {
  try {
    await stat(join(kandidaat, BESTANDEN[0]));
    bron = kandidaat;
    break;
  } catch { /* volgende proberen */ }
}

if (!bron) {
  console.error(`Geen ${BESTANDEN[0]} gevonden in ${kandidaten.join(' of ')}`);
  process.exit(1);
}

await mkdir(DOEL, { recursive: true });
for (const naam of BESTANDEN) {
  await cp(join(bron, naam), join(DOEL, naam));
  console.log(`bijgewerkt  ${naam}`);
}
console.log(`\n${BESTANDEN.length} bestanden uit ${bron}`);
