#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  BORDGROEPEN, CBR_WOORDENLIJST, NIVEAU_UITLEG, VRAGEN_GEMAAKT,
  alleBorden, begrip, begrippen, bord, bron, hoofdstuk, hoofdstukken,
  oefenvragen, regelingen,
} from './data.js';
import { zoek } from './zoek.js';

const VERSIE = '0.1.0';

function antwoord(waarde: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(waarde, null, 2) }] };
}

function fout(bericht: string) {
  return { content: [{ type: 'text' as const, text: bericht }], isError: true };
}

/** De wetsartikelen achter een verwijzing, met de wettekst erbij. */
function bronnen(verwijzingen: string[] | undefined) {
  return (verwijzingen ?? []).map((v) => bron(v) ?? { label: v, tekst: null });
}

const server = new McpServer(
  { name: 'theorie-mcp', version: VERSIE },
  {
    instructions:
      'De volledige theorie voor het autorijbewijs B in Nederland: elf hoofdstukken met de '
      + 'stof, alle verkeersborden uit bijlage 1 van het RVV 1990, een begrippenlijst en de '
      + 'wetsartikelen waar elke regel op rust.\n\n'
      + 'Antwoord op een theorievraag met de regel én de bron. Bij vrijwel elk stuk zit een '
      + 'verwijzing naar een wetsartikel, met de letterlijke wettekst erbij. Gebruik die: '
      + 'een theorieantwoord zonder artikel is niet na te kijken, en verkeersregels veranderen.\n\n'
      + 'Verzin geen verkeersborden of artikelnummers. Vind je een bord of artikel niet, zeg '
      + 'dat dan. Dit zijn de officiële borden uit bijlage 1; een code die er niet in staat '
      + 'bestaat niet.\n\n'
      + 'Dit is lesstof, geen CBR-examen. De oefenvragen zijn door Ribba geschreven en zijn '
      + 'geen examenvragen van het CBR.',
  },
);

// ── De cursus ─────────────────────────────────────────────────────────

server.registerTool(
  'hoofdstukken',
  {
    title: 'Alle hoofdstukken',
    description:
      'De elf hoofdstukken van de theoriecursus, met per hoofdstuk de samenvatting, het '
      + 'aantal paragrafen, de bijbehorende verkeersborden en het niveau dat het CBR vraagt.',
    inputSchema: {},
  },
  async () => antwoord({
    aantal: hoofdstukken().length,
    niveaus: NIVEAU_UITLEG,
    hoofdstukken: hoofdstukken().map((h) => ({
      nummer: h.nummer,
      slug: h.slug,
      titel: h.titel,
      niveau: h.niveau,
      cbr_omschrijving: h.cbrOmschrijving,
      samenvatting: h.samenvatting,
      paragrafen: h.paragrafen.length,
      verkeersborden: h.borden,
      pagina: `https://ribba.nl/gratis-theorie-leren/${h.slug}`,
    })),
  }),
);

server.registerTool(
  'hoofdstuk',
  {
    title: 'Eén hoofdstuk',
    description:
      'De volledige tekst van één hoofdstuk: alle paragrafen met hun kernregel en uitleg, en '
      + 'per paragraaf de wetsartikelen waar de regel op rust, met de letterlijke wettekst.',
    inputSchema: {
      slug: z.string().describe('Slug van het hoofdstuk, bijvoorbeeld "voorrang-en-voor-laten-gaan".'),
      met_wetteksten: z.boolean().optional()
        .describe('De letterlijke wettekst per artikel erbij, standaard aan.'),
    },
  },
  async ({ slug, met_wetteksten = true }) => {
    const h = hoofdstuk(slug);
    if (!h) {
      return fout(
        `Geen hoofdstuk "${slug}". Kies uit: ${hoofdstukken().map((x) => x.slug).join(', ')}.`,
      );
    }

    return antwoord({
      nummer: h.nummer,
      slug: h.slug,
      titel: h.titel,
      niveau: h.niveau,
      niveau_uitleg: NIVEAU_UITLEG[h.niveau],
      cbr_omschrijving: h.cbrOmschrijving,
      samenvatting: h.samenvatting,
      verkeersborden: h.borden,
      begrippen: h.termen,
      paragrafen: h.paragrafen.map((p) => ({
        kop: p.kop,
        kern: p.kern,
        tekst: p.tekst,
        artikelen: met_wetteksten
          ? bronnen(p.artikelen)
          : (p.artikelen ?? []).map((v) => ({ label: v })),
      })),
      pagina: `https://ribba.nl/gratis-theorie-leren/${h.slug}`,
    });
  },
);

// ── Verkeersborden ────────────────────────────────────────────────────

server.registerTool(
  'verkeersborden',
  {
    title: 'Verkeersborden',
    description:
      'Alle verkeersborden uit bijlage 1 van het RVV 1990, met code, naam en groep. Filter op '
      + 'groep om alleen de snelheidsborden of alleen de voorrangsborden te krijgen.',
    inputSchema: {
      groep: z.string().optional()
        .describe(`Groepsletter: ${BORDGROEPEN.map((g) => `${g.letter} (${g.naam.toLowerCase()})`).join(', ')}.`),
      met_uitleg: z.boolean().optional()
        .describe('De betekenis per bord erbij, standaard uit. Zet aan bij een klein aantal borden.'),
    },
  },
  async ({ groep, met_uitleg = false }) => {
    const letter = groep?.trim().toUpperCase().charAt(0);
    if (letter && !BORDGROEPEN.some((g) => g.letter === letter)) {
      return fout(`Onbekende groep "${groep}". Kies uit: ${BORDGROEPEN.map((g) => g.letter).join(', ')}.`);
    }

    const borden = alleBorden().filter((b) => !letter || b.groep === letter);
    return antwoord({
      groepen: BORDGROEPEN,
      groep: letter ?? 'alle',
      aantal: borden.length,
      borden: borden.map((b) => ({
        code: b.code,
        naam: b.naam,
        groep: b.groep,
        groep_naam: b.groep_naam,
        ...(met_uitleg ? { betekenis: b.uitleg?.betekenis ?? null } : {}),
        afbeelding: b.afbeelding,
        pagina: b.pagina,
      })),
    });
  },
);

server.registerTool(
  'verkeersbord',
  {
    title: 'Eén verkeersbord',
    description:
      'Alles over één verkeersbord: wat het betekent, wat je moet doen, waar je het tegenkomt, '
      + 'de fouten die er het vaakst mee gemaakt worden, de borden waar het mee verward wordt, '
      + 'het plaatsingsvoorschrift en de wetsartikelen.',
    inputSchema: {
      code: z.string().describe('Bordcode, bijvoorbeeld "B6", "A1" of "j37".'),
    },
  },
  async ({ code }) => {
    const b = bord(code);
    if (!b) {
      return fout(
        `Geen verkeersbord met code "${code}" in bijlage 1 van het RVV 1990. `
        + 'Gebruik verkeersborden om te zien welke codes er wel zijn.',
      );
    }

    return antwoord({
      code: b.code,
      naam: b.naam,
      groep: b.groep,
      groep_naam: b.groep_naam,
      betekenis: b.uitleg?.betekenis ?? null,
      wat_doe_jij: b.uitleg?.watdoejij ?? null,
      waar_zie_je_het: b.uitleg?.waarzieje ?? null,
      uitleg: b.uitleg?.uitleg ?? [],
      veelgemaakte_fouten: b.uitleg?.fouten ?? [],
      niet_verwarren_met: b.uitleg?.verwar ?? [],
      op_het_examen: b.uitleg?.examen ?? null,
      plaatsingsvoorschrift: b.voorschrift
        ? {
            kop: b.voorschrift.kop,
            plaatsing: b.voorschrift.plaatsing,
            onderborden: b.voorschrift.onderborden,
            bron: b.voorschrift.bron,
          }
        : null,
      artikelen: bronnen(b.uitleg?.artikelen),
      afbeelding: b.afbeelding,
      pagina: b.pagina,
    });
  },
);

// ── Begrippen ─────────────────────────────────────────────────────────

server.registerTool(
  'begrippen',
  {
    title: 'Begrippenlijst',
    description:
      'De begrippen die je voor het theorie-examen moet kennen, met een korte omschrijving. '
      + 'Een deel komt uit de woordenlijst van het CBR zelf.',
    inputSchema: {
      zoekwoord: z.string().optional().describe('Beperk tot begrippen waar dit woord in voorkomt.'),
      alleen_cbr: z.boolean().optional()
        .describe('Alleen de begrippen uit de officiële CBR-woordenlijst.'),
    },
  },
  async ({ zoekwoord, alleen_cbr = false }) => {
    const term = zoekwoord?.trim().toLowerCase();
    const lijst = begrippen()
      .filter((b) => !alleen_cbr || b.bron === 'CBR-woordenlijst')
      .filter((b) => !term || b.term.toLowerCase().includes(term) || b.kort.toLowerCase().includes(term));

    if (lijst.length === 0) {
      return fout(`Geen begrippen gevonden voor "${zoekwoord}". Probeer zoek voor een bredere zoekopdracht.`);
    }

    return antwoord({
      // Alleen de verantwoording van de CBR-lijst, niet de lijst zelf: die
      // termen staan hieronder al, en twee keer dezelfde woorden maakt het
      // antwoord alleen langer.
      cbr_woordenlijst: {
        bron: CBR_WOORDENLIJST.bron,
        regeling: CBR_WOORDENLIJST.regeling,
        toelichting: CBR_WOORDENLIJST.toelichting,
      },
      aantal: lijst.length,
      begrippen: lijst.map((b) => ({
        term: b.term,
        slug: b.slug,
        kort: b.kort,
        bron: b.bron,
        pagina: `https://ribba.nl/begrippen/${b.slug}`,
      })),
    });
  },
);

server.registerTool(
  'begrip',
  {
    title: 'Eén begrip',
    description:
      'De volledige uitleg van één begrip: wat het is, welke regels erbij horen, welke fouten '
      + 'ermee gemaakt worden, waar het mee verward wordt en op welke wetsartikelen het rust.',
    inputSchema: {
      term: z.string().describe('Het begrip of de slug, bijvoorbeeld "voorrangsweg".'),
    },
  },
  async ({ term }) => {
    const b = begrip(term);
    if (!b) {
      return fout(
        `Geen begrip "${term}" in de lijst. Gebruik begrippen met een zoekwoord, of zoek voor `
        + 'een zoekopdracht door de hele theorie.',
      );
    }

    return antwoord({
      term: b.term,
      slug: b.slug,
      bron: b.bron,
      kort: b.kort,
      uitleg: b.uitleg,
      regels: b.regels,
      veelgemaakte_fouten: b.fouten,
      niet_verwarren_met: b.verwar,
      artikelen: bronnen(b.artikelen),
      pagina: `https://ribba.nl/begrippen/${b.slug}`,
    });
  },
);

// ── De wet ────────────────────────────────────────────────────────────

server.registerTool(
  'wetsartikel',
  {
    title: 'Wetsartikel opzoeken',
    description:
      'De letterlijke tekst van een artikel uit het RVV 1990, de Wegenverkeerswet of een van '
      + 'de andere regelingen waar de theorie op rust, met een verwijzing naar wetten.overheid.nl. '
      + 'Zonder verwijzing krijg je de lijst met regelingen.',
    inputSchema: {
      verwijzing: z.string().optional()
        .describe('Regeling en artikelnummer, bijvoorbeeld "RVV 15" of "WVW 5".'),
    },
  },
  async ({ verwijzing }) => {
    if (!verwijzing) {
      return antwoord({
        regelingen: regelingen(),
        gebruik: 'Geef verwijzing mee, bijvoorbeeld "RVV 15".',
      });
    }

    const b = bron(verwijzing);
    if (!b) {
      return fout(
        `Kan "${verwijzing}" niet lezen. Gebruik de vorm "RVV 15". `
        + `Beschikbare regelingen: ${regelingen().map((r) => r.code).join(', ')}.`,
      );
    }
    if (b.tekst == null) {
      return fout(`${b.label} staat niet in de opgenomen tekst van ${b.regeling}. Kijk op ${b.url}.`);
    }

    return antwoord(b);
  },
);

// ── Oefenen en zoeken ─────────────────────────────────────────────────

server.registerTool(
  'oefenvragen',
  {
    title: 'Oefenvragen',
    description:
      'Oefenvragen met het juiste antwoord, de uitleg en de wetsartikelen erbij. Door Ribba '
      + 'geschreven en geen examenvragen van het CBR.',
    inputSchema: {
      onderwerp: z.string().optional().describe('Slug van een hoofdstuk, om alleen vragen daarover te krijgen.'),
      met_antwoord: z.boolean().optional()
        .describe('Het juiste antwoord en de uitleg erbij, standaard aan. Zet uit om te overhoren.'),
      limiet: z.number().int().min(1).max(50).optional().describe('Aantal vragen, standaard alles.'),
    },
  },
  async ({ onderwerp, met_antwoord = true, limiet }) => {
    const slug = onderwerp?.trim().toLowerCase();
    const lijst = oefenvragen().filter((v) => !slug || v.onderwerp === slug);

    if (lijst.length === 0) {
      return fout(
        `Geen oefenvragen over "${onderwerp}". Beschikbare onderwerpen: `
        + `${[...new Set(oefenvragen().map((v) => v.onderwerp))].join(', ')}.`,
      );
    }

    return antwoord({
      aantal: Math.min(limiet ?? lijst.length, lijst.length),
      gemaakt: VRAGEN_GEMAAKT,
      let_op: 'Door Ribba geschreven oefenvragen. Dit zijn geen examenvragen van het CBR.',
      vragen: lijst.slice(0, limiet ?? lijst.length).map((v) => ({
        id: v.id,
        onderwerp: v.onderwerp,
        situatie: v.situatie,
        vraag: v.vraag,
        antwoorden: v.antwoorden,
        verkeersborden: v.borden,
        ...(met_antwoord
          ? {
              juiste_antwoord: v.juist,
              uitleg: v.uitleg,
              toetst: v.toetst,
              artikelen: bronnen(v.artikelen),
            }
          : {}),
      })),
    });
  },
);

server.registerTool(
  'zoek',
  {
    title: 'Zoeken in de theorie',
    description:
      'Zoek door de hele theorie tegelijk: hoofdstukken, paragrafen, verkeersborden, begrippen '
      + 'en oefenvragen. Geeft per treffer een fragment en de sleutel waarmee je het volledige '
      + 'stuk ophaalt. Begin hier als je niet weet in welk hoofdstuk iets staat.',
    inputSchema: {
      vraag: z.string().describe('Waar je naar zoekt, bijvoorbeeld "voorrang op een rotonde".'),
      limiet: z.number().int().min(1).max(50).optional().describe('Aantal treffers, standaard 15.'),
    },
  },
  async ({ vraag, limiet = 15 }) => {
    const treffers = zoek(vraag, limiet);
    if (treffers.length === 0) {
      return fout(
        `Niets gevonden voor "${vraag}". Probeer een enkel woord in plaats van een hele zin, `
        + 'of gebruik hoofdstukken om te zien welke onderwerpen er zijn.',
      );
    }

    return antwoord({
      vraag,
      gevonden: treffers.length,
      vervolg:
        'Haal het volledige stuk op met hoofdstuk (slug), verkeersbord (code) of begrip (slug).',
      treffers,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
