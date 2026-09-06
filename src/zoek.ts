import { alleBorden, begrippen, hoofdstukken, oefenvragen } from './data.js';

/**
 * Zoeken door de hele theorie, zonder zoekmachine.
 *
 * Een index optuigen voor een paar duizend stukken tekst is meer werk dan het
 * oplevert. Wat wel telt is de volgorde: een treffer in een kop of in de naam
 * van een bord weegt zwaarder dan een treffer ergens midden in een alinea, en
 * zonder dat onderscheid staat het antwoord op vraag drie onderaan.
 */

export type Treffer = {
  soort: 'hoofdstuk' | 'paragraaf' | 'verkeersbord' | 'begrip' | 'oefenvraag';
  titel: string;
  /** Waar je het volledige stuk ophaalt: slug, bordcode of vraag-id. */
  sleutel: string;
  fragment: string;
  pagina: string;
  score: number;
};

function normaliseer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Het stukje tekst rond de eerste treffer, zodat je ziet waaróm iets past. */
function fragment(tekst: string, term: string, breedte = 220): string {
  const i = normaliseer(tekst).indexOf(term);
  if (i < 0) return tekst.slice(0, breedte).trim();
  const van = Math.max(0, i - Math.floor(breedte / 3));
  const stuk = tekst.slice(van, van + breedte).trim();
  return (van > 0 ? '... ' : '') + stuk + (van + breedte < tekst.length ? ' ...' : '');
}

function telt(tekst: string, term: string): number {
  const plat = normaliseer(tekst);
  let n = 0;
  let i = plat.indexOf(term);
  while (i >= 0) {
    n++;
    i = plat.indexOf(term, i + term.length);
  }
  return n;
}

export function zoek(vraag: string, limiet = 15): Treffer[] {
  const term = normaliseer(vraag).trim();
  if (!term) return [];

  const uit: Treffer[] = [];

  for (const h of hoofdstukken()) {
    const kop = telt(`${h.titel} ${h.cbrOmschrijving}`, term);
    const samen = telt(h.samenvatting, term);
    if (kop || samen) {
      uit.push({
        soort: 'hoofdstuk',
        titel: h.titel,
        sleutel: h.slug,
        fragment: fragment(h.samenvatting || h.cbrOmschrijving, term),
        pagina: `https://ribba.nl/gratis-theorie-leren/${h.slug}`,
        score: kop * 12 + samen * 4,
      });
    }

    for (const p of h.paragrafen) {
      const lopend = `${p.kern} ${p.tekst.join(' ')}`;
      const inKop = telt(p.kop, term);
      const inTekst = telt(lopend, term);
      if (!inKop && !inTekst) continue;
      uit.push({
        soort: 'paragraaf',
        titel: `${h.titel}: ${p.kop}`,
        sleutel: h.slug,
        fragment: fragment(lopend, term),
        pagina: `https://ribba.nl/gratis-theorie-leren/${h.slug}`,
        score: inKop * 8 + inTekst * 2,
      });
    }
  }

  for (const b of alleBorden()) {
    const naam = telt(`${b.code} ${b.naam ?? ''}`, term);
    const lopend = b.uitleg
      ? `${b.uitleg.betekenis} ${b.uitleg.watdoejij} ${b.uitleg.waarzieje} ${b.uitleg.uitleg.join(' ')}`
      : '';
    const inTekst = telt(lopend, term);
    if (!naam && !inTekst) continue;
    uit.push({
      soort: 'verkeersbord',
      titel: `${b.code}: ${b.naam ?? 'verkeersbord'}`,
      sleutel: b.code,
      fragment: fragment(b.uitleg?.betekenis ?? b.naam ?? b.code, term),
      pagina: b.pagina,
      score: naam * 14 + inTekst * 2,
    });
  }

  for (const b of begrippen()) {
    const naam = telt(b.term, term);
    const lopend = `${b.kort} ${b.uitleg.join(' ')} ${b.regels.join(' ')}`;
    const inTekst = telt(lopend, term);
    if (!naam && !inTekst) continue;
    uit.push({
      soort: 'begrip',
      titel: b.term,
      sleutel: b.slug,
      fragment: fragment(b.kort || lopend, term),
      pagina: `https://ribba.nl/begrippen/${b.slug}`,
      score: naam * 14 + inTekst * 2,
    });
  }

  for (const v of oefenvragen()) {
    const lopend = `${v.vraag} ${v.situatie} ${v.antwoorden.join(' ')} ${v.uitleg}`;
    const raak = telt(lopend, term);
    if (!raak) continue;
    uit.push({
      soort: 'oefenvraag',
      titel: v.situatie || v.vraag,
      sleutel: v.id,
      fragment: fragment(v.uitleg, term),
      pagina: 'https://ribba.nl/gratis-theorie-leren',
      score: raak,
    });
  }

  return uit.sort((a, b) => b.score - a.score).slice(0, limiet);
}
