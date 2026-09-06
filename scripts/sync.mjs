#!/usr/bin/env node
/**
 * De theorie uit ribba.app hierheen halen.
 *
 * De cursus, de borden, de begrippen en de wetsartikelen worden onderhouden in
 * de website-repo. Deze server draagt er een kopie van, zodat hij werkt zonder
 * netwerk en zonder database. Die kopie moet wel bij te werken zijn zonder acht
 * bestanden met de hand over te tikken, en dat doet dit script.
 *
 * Gebruik:
 *   node scripts/sync.mjs [pad-naar-ribba.app]
 *
 * Zonder pad wordt ../ribba.app aangenomen.
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

const bron = resolve(process.argv[2] ?? join(HIER, '..', '..', 'ribba.app'), 'website', 'src', 'data');

try {
  await stat(bron);
} catch {
  console.error(`Kan de bron niet vinden: ${bron}`);
  console.error('Geef het pad naar ribba.app mee: node scripts/sync.mjs ../ribba.app');
  process.exit(1);
}

await mkdir(DOEL, { recursive: true });
for (const naam of BESTANDEN) {
  await cp(join(bron, naam), join(DOEL, naam));
  console.log(`bijgewerkt  ${naam}`);
}
console.log(`\n${BESTANDEN.length} bestanden uit ${bron}`);
