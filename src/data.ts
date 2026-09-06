import { readFileSync } from 'node:fs';

/**
 * De theorie zit in het pakket, niet achter een netwerkverbinding.
 *
 * Deze inhoud verandert een paar keer per jaar en is een paar megabyte groot.
 * Hem meesturen maakt de server offline bruikbaar en scheelt bij elke vraag een
 * ronde over het net. Bijwerken gaat met scripts/sync.mjs.
 */
function laad<T>(naam: string): T {
  const pad = new URL(`../data/${naam}.json`, import.meta.url);
  return JSON.parse(readFileSync(pad, 'utf8')) as T;
}

export type Paragraaf = {
  kop: string;
  kern: string;
  tekst: string[];
  artikelen: string[];
};

export type Hoofdstuk = {
  slug: string;
  nummer: number;
  titel: string;
  /** K is kennis, K+ is kennis en inzicht. */
  niveau: 'K' | 'K+';
  borden: string[];
  termen: string[];
  /** Zoals het CBR het onderwerp zelf omschrijft in het examenplan. */
  cbrOmschrijving: string;
  samenvatting: string;
  paragrafen: Paragraaf[];
};

export type BordUitleg = {
  betekenis: string;
  watdoejij: string;
  waarzieje: string;
  uitleg: string[];
  fouten: string[];
  verwar: { bord: string; verschil: string }[];
  examen: string;
  artikelen: string[];
};

export type Voorschrift = {
  geldt_voor: string[];
  kop: string;
  bron: string;
  plaatsing: string | null;
  onderborden: string | null;
};

export type Begrip = {
  term: string;
  slug: string;
  bron: string;
  kort: string;
  uitleg: string[];
  regels: string[];
  fouten: string[];
  verwar: { term: string; verschil: string }[];
  artikelen: string[];
};

export type Regeling = {
  url: string;
  regeling: string;
  artikelen: Record<string, string>;
};

export type Vraag = {
  id: string;
  vraag: string;
  situatie: string;
  antwoorden: string[];
  juist: number;
  uitleg: string;
  artikelen: string[];
  toetst: string;
  borden: string[];
  onderwerp: string;
  soort: string;
  vorm: string;
};

const cursus = laad<Record<string, Record<string, Hoofdstuk>>>('theorie-cursus');
const bordnamen = laad<Record<string, string | null>>('verkeersborden');
const borduitleg = laad<Record<string, BordUitleg>>('borden-uitleg');
const voorschriften = laad<Record<string, Voorschrift>>('borden-voorschriften');
const begripdata = laad<Record<string, Begrip>>('begrippen');
const wetten = laad<Record<string, Regeling>>('wetsartikelen');
const vragen = laad<{ gemaakt: string; aantal: number; vragen: Vraag[] }>('examenvragen');
const woordenlijst = laad<{ bron: string; regeling: string; toelichting: string; woorden?: string[] }>(
  'cbr-woordenlijst',
);

export const BRONTAAL = 'nl';

/** De elf bordgroepen uit bijlage 1 van het RVV, in de volgorde van de bijlage. */
export const BORDGROEPEN = [
  { letter: 'A', naam: 'Snelheid' },
  { letter: 'B', naam: 'Voorrang' },
  { letter: 'C', naam: 'Geslotenverklaring' },
  { letter: 'D', naam: 'Rijrichting' },
  { letter: 'E', naam: 'Parkeren en stilstaan' },
  { letter: 'F', naam: 'Overige geboden en verboden' },
  { letter: 'G', naam: 'Verkeersregels' },
  { letter: 'H', naam: 'Bebouwde kom' },
  { letter: 'J', naam: 'Waarschuwing' },
  { letter: 'K', naam: 'Bewegwijzering' },
  { letter: 'L', naam: 'Informatie' },
] as const;

export const NIVEAU_UITLEG: Record<'K' | 'K+', string> = {
  K: 'Kennis: je moet de regel kennen en kunnen benoemen.',
  'K+': 'Kennis en inzicht: je moet de regel toepassen op een situatie die je nog niet gezien hebt.',
};

export function hoofdstukken(): Hoofdstuk[] {
  return Object.values(cursus[BRONTAAL]).sort((a, b) => a.nummer - b.nummer);
}

export function hoofdstuk(slug: string): Hoofdstuk | undefined {
  return cursus[BRONTAAL][slug];
}

function bordNummer(code: string): number {
  return parseInt(code.slice(1).replace(/\D/g, ''), 10) || 0;
}

export type Bord = {
  code: string;
  naam: string | null;
  groep: string;
  groep_naam: string;
  uitleg: BordUitleg | null;
  voorschrift: Voorschrift | null;
  afbeelding: string;
  pagina: string;
};

function maakBord(code: string): Bord {
  const letter = code.charAt(0);
  const groep = BORDGROEPEN.find((g) => g.letter === letter);
  return {
    code,
    naam: bordnamen[code] ?? null,
    groep: letter,
    groep_naam: groep?.naam ?? 'Onbekend',
    uitleg: borduitleg[code] ?? null,
    voorschrift: voorschriften[code] ?? null,
    afbeelding: `https://ribba.nl/borden/${code}.png`,
    pagina: `https://ribba.nl/verkeersborden/${code.toLowerCase()}`,
  };
}

export function alleBorden(): Bord[] {
  return Object.keys(bordnamen)
    .map(maakBord)
    .sort((a, b) => a.groep.localeCompare(b.groep) || bordNummer(a.code) - bordNummer(b.code));
}

export function bord(code: string): Bord | undefined {
  const sleutel = code.trim().toUpperCase();
  return sleutel in bordnamen ? maakBord(sleutel) : undefined;
}

export function begrippen(): Begrip[] {
  return Object.values(begripdata).sort((a, b) => a.term.localeCompare(b.term, 'nl'));
}

export function begrip(slug: string): Begrip | undefined {
  const sleutel = slug.trim().toLowerCase();
  return (
    begripdata[sleutel]
    ?? Object.values(begripdata).find((b) => b.term.toLowerCase() === sleutel)
  );
}

export type Bron = {
  label: string;
  regeling: string;
  nummer: string;
  tekst: string | null;
  url: string;
};

/** Zet "RVV 15" om in een citeerbare bron met de wettekst erbij. */
export function bron(verwijzing: string): Bron | null {
  const [code, nummer] = verwijzing.trim().split(/\s+/);
  const w = wetten[code?.toUpperCase()];
  if (!w || !nummer) return null;
  return {
    label: `${code.toUpperCase()} ${nummer}`,
    regeling: w.regeling,
    nummer,
    tekst: w.artikelen[nummer] ?? null,
    url: `${w.url}#Artikel${nummer}`,
  };
}

export function regelingen(): { code: string; regeling: string; url: string; artikelen: number }[] {
  return Object.entries(wetten).map(([code, w]) => ({
    code,
    regeling: w.regeling,
    url: w.url,
    artikelen: Object.keys(w.artikelen).length,
  }));
}

export function oefenvragen(): Vraag[] {
  return vragen.vragen;
}

export const VRAGEN_GEMAAKT = vragen.gemaakt;
export const CBR_WOORDENLIJST = woordenlijst;
