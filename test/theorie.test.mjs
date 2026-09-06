import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './client.mjs';

let server;
before(async () => { server = await startServer(); });
after(async () => { await server?.stop(); });

describe('protocol', () => {
  test('geeft negen gereedschappen met een beschrijving en een schema', async () => {
    const lijst = await server.gereedschappen();
    assert.equal(lijst.length, 9);
    for (const g of lijst) {
      assert.ok(g.description?.length > 40, `${g.name} heeft een te dunne beschrijving`);
      assert.equal(g.inputSchema.type, 'object');
    }
  });

  test('een onbekend gereedschap geeft een fout en geen crash', async () => {
    const r = await server.roep('bestaat-niet');
    assert.ok(r.fout);
  });
});

describe('cursus', () => {
  test('elf hoofdstukken, doorlopend genummerd', async () => {
    const { data } = await server.roep('hoofdstukken');
    assert.equal(data.aantal, 11);
    assert.deepEqual(data.hoofdstukken.map((h) => h.nummer), [1,2,3,4,5,6,7,8,9,10,11]);
    for (const h of data.hoofdstukken) {
      assert.ok(h.samenvatting.length > 50, `${h.slug} mist een samenvatting`);
      assert.ok(['K', 'K+'].includes(h.niveau));
    }
  });

  test('een hoofdstuk levert paragrafen met de wettekst erbij', async () => {
    const { data } = await server.roep('hoofdstuk', { slug: 'voorrang-en-voor-laten-gaan' });
    assert.ok(data.paragrafen.length > 0);
    const metWet = data.paragrafen.filter((p) => p.artikelen.length > 0);
    assert.ok(metWet.length > 0, 'geen enkele paragraaf verwijst naar de wet');
    const bron = metWet[0].artikelen[0];
    assert.ok(bron.tekst?.length > 20, 'de wettekst zelf ontbreekt');
    assert.match(bron.url, /^https:\/\/wetten\.overheid\.nl\//);
  });

  test('met_wetteksten uit laat de tekst weg maar houdt het label', async () => {
    const { data } = await server.roep('hoofdstuk', { slug: 'wetgeving', met_wetteksten: false });
    const artikelen = data.paragrafen.flatMap((p) => p.artikelen);
    assert.ok(artikelen.length > 0);
    for (const a of artikelen) {
      assert.ok(a.label);
      assert.ok(!('tekst' in a), 'de wettekst kwam toch mee');
    }
  });

  test('een onbekend hoofdstuk noemt de geldige slugs', async () => {
    const r = await server.roep('hoofdstuk', { slug: 'kaas' });
    assert.ok(r.fout);
    assert.match(r.tekst, /gebruik-van-de-weg/);
  });
});

describe('verkeersborden', () => {
  test('alle borden uit bijlage 1, in elf groepen', async () => {
    const { data } = await server.roep('verkeersborden');
    assert.equal(data.aantal, 175);
    assert.equal(data.groepen.length, 11);
    const letters = new Set(data.borden.map((b) => b.groep));
    assert.ok(letters.size >= 10);
  });

  test('filteren op groep geeft alleen die groep', async () => {
    const { data } = await server.roep('verkeersborden', { groep: 'B' });
    assert.ok(data.aantal > 0 && data.aantal < 175);
    assert.ok(data.borden.every((b) => b.code.startsWith('B')));
  });

  test('een onbekende groep wordt geweigerd', async () => {
    const r = await server.roep('verkeersborden', { groep: 'Z' });
    assert.ok(r.fout);
  });

  test('een bord heeft betekenis, valkuilen en artikelen', async () => {
    const { data } = await server.roep('verkeersbord', { code: 'b6' });
    assert.equal(data.code, 'B6');
    assert.ok(data.betekenis.length > 30);
    assert.ok(Array.isArray(data.veelgemaakte_fouten));
    assert.match(data.afbeelding, /\/borden\/B6\.png$/);
    assert.match(data.pagina, /\/verkeersborden\/b6$/);
  });

  test('een verzonnen bordcode wordt niet stilzwijgend geaccepteerd', async () => {
    const r = await server.roep('verkeersbord', { code: 'Z99' });
    assert.ok(r.fout);
    assert.match(r.tekst, /RVV 1990/);
  });
});

describe('begrippen en wet', () => {
  test('de begrippenlijst is doorzoekbaar', async () => {
    const { data } = await server.roep('begrippen', { zoekwoord: 'rotonde' });
    assert.ok(data.aantal > 0);
    assert.ok(data.begrippen.some((b) => b.term.includes('rotonde')));
  });

  test('een begrip levert uitleg en bronnen', async () => {
    const { data } = await server.roep('begrip', { term: 'voorrangsweg' });
    assert.equal(data.term, 'voorrangsweg');
    assert.ok(data.uitleg.length > 0);
  });

  test('een wetsartikel geeft de letterlijke tekst', async () => {
    const { data } = await server.roep('wetsartikel', { verwijzing: 'RVV 15' });
    assert.equal(data.nummer, '15');
    assert.ok(data.tekst.length > 20);
    assert.match(data.url, /#Artikel15$/);
  });

  test('zonder verwijzing krijg je de regelingen', async () => {
    const { data } = await server.roep('wetsartikel');
    assert.ok(data.regelingen.length >= 5);
    assert.ok(data.regelingen.every((r) => r.artikelen > 0));
  });

  test('een niet-bestaand artikel liegt geen tekst', async () => {
    const r = await server.roep('wetsartikel', { verwijzing: 'RVV 9999' });
    assert.ok(r.fout);
  });
});

describe('oefenen en zoeken', () => {
  test('overhoren laat het antwoord weg', async () => {
    const { data } = await server.roep('oefenvragen', { met_antwoord: false, limiet: 3 });
    assert.equal(data.vragen.length, 3);
    for (const v of data.vragen) {
      assert.ok(v.antwoorden.length >= 2);
      assert.ok(!('juiste_antwoord' in v), 'het antwoord lekte weg');
      assert.ok(!('uitleg' in v));
    }
  });

  test('met antwoord komt de uitleg en de wet mee', async () => {
    const { data } = await server.roep('oefenvragen', { limiet: 1 });
    const v = data.vragen[0];
    assert.equal(typeof v.juiste_antwoord, 'number');
    assert.ok(v.juiste_antwoord >= 0 && v.juiste_antwoord < v.antwoorden.length);
    assert.ok(v.uitleg.length > 10);
  });

  test('zoeken zet de meest gerichte treffer bovenaan', async () => {
    const { data } = await server.roep('zoek', { vraag: 'rotonde', limiet: 5 });
    assert.ok(data.gevonden > 0);
    const eerste = data.treffers[0];
    assert.ok(['begrip', 'verkeersbord'].includes(eerste.soort),
      `een losse alinea stond boven het begrip zelf: ${eerste.soort}`);
    const scores = data.treffers.map((t) => t.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'niet op score gesorteerd');
  });

  test('zoeken vindt over de soorten heen', async () => {
    const { data } = await server.roep('zoek', { vraag: 'voorrang', limiet: 30 });
    const soorten = new Set(data.treffers.map((t) => t.soort));
    assert.ok(soorten.size >= 3, `maar één soort gevonden: ${[...soorten]}`);
  });

  test('niets gevonden geeft een bruikbare fout', async () => {
    const r = await server.roep('zoek', { vraag: 'zdkfjhqwlkejrh' });
    assert.ok(r.fout);
  });
});

describe('samenhang van de inhoud', () => {
  test('elk bord dat een hoofdstuk noemt bestaat ook echt', async () => {
    const { data } = await server.roep('hoofdstukken');
    const { data: alle } = await server.roep('verkeersborden');
    const bestaat = new Set(alle.borden.map((b) => b.code));
    const ontbreekt = data.hoofdstukken
      .flatMap((h) => h.verkeersborden.map((c) => ({ h: h.slug, c })))
      .filter((x) => !bestaat.has(x.c));
    assert.deepEqual(ontbreekt, [], 'hoofdstukken verwijzen naar borden die niet bestaan');
  });

  test('elke wetsverwijzing in de cursus is op te lossen', async () => {
    const { data } = await server.roep('hoofdstukken');
    const zonderTekst = [];
    for (const h of data.hoofdstukken) {
      const { data: vol } = await server.roep('hoofdstuk', { slug: h.slug });
      for (const p of vol.paragrafen) {
        for (const a of p.artikelen) {
          if (a.tekst == null) zonderTekst.push(`${h.slug}: ${a.label}`);
        }
      }
    }
    assert.deepEqual(zonderTekst, [], 'verwijzingen zonder wettekst');
  });
});
