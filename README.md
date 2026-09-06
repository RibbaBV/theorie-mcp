# theorie-mcp

Een MCP-server met de volledige theorie voor het autorijbewijs B in Nederland: elf hoofdstukken met 134 paragrafen, alle 175 verkeersborden uit bijlage 1 van het RVV 1990, 182 begrippen en de wetsartikelen waar elke regel op rust. Gratis, zonder account en zonder sleutel.

De inhoud zit in het pakket. De server werkt dus zonder netwerk en zonder database.

Gemaakt door [Ribba](https://ribba.nl).

## Installeren

Voeg de server toe aan je MCP-client. Er is geen sleutel nodig.

### Claude Code

```bash
claude mcp add theorie -- npx -y @ribba/theorie-mcp
```

### Claude Desktop, Cursor, Windsurf en andere clients

In `claude_desktop_config.json` of het equivalent van je client:

```json
{
  "mcpServers": {
    "theorie": {
      "command": "npx",
      "args": ["-y", "@ribba/theorie-mcp"]
    }
  }
}
```

## Wat je kunt vragen

- Wat betekent bord B6, en waar wordt het het vaakst mee verward?
- Wie heeft er voorrang op een rotonde?
- Leg de regels voor stilstaan en parkeren uit, met de wetsartikelen erbij.
- Overhoor me over verkeerstekens en aanwijzingen, zonder de antwoorden te laten zien.
- Wat staat er letterlijk in artikel 15 van het RVV?
- Wat is het verschil tussen een voorrangsweg en een gelijkwaardig kruispunt?

## Gereedschappen

| Naam | Wat het teruggeeft |
| --- | --- |
| `zoek` | Zoekt door hoofdstukken, borden, begrippen en oefenvragen tegelijk. Begin hier als je niet weet waar iets staat. |
| `hoofdstukken` | De elf hoofdstukken met samenvatting, niveau en bijbehorende borden. |
| `hoofdstuk` | De volledige tekst van één hoofdstuk, per paragraaf met de wetsartikelen erbij. |
| `verkeersborden` | Alle borden uit bijlage 1, te filteren op groep. |
| `verkeersbord` | Eén bord: betekenis, wat je doet, veelgemaakte fouten, plaatsingsvoorschrift en artikelen. |
| `begrippen` | De begrippenlijst, doorzoekbaar, met de officiële CBR-woordenlijst apart te filteren. |
| `begrip` | Eén begrip in het volle: uitleg, regels, valkuilen en waar het mee verward wordt. |
| `wetsartikel` | De letterlijke tekst van een artikel, met verwijzing naar wetten.overheid.nl. |
| `oefenvragen` | Oefenvragen met antwoord en uitleg, of zonder antwoord om te overhoren. |

## De wet zit erbij

Bij 111 van de 134 paragrafen staat het wetsartikel waar de regel op rust, en de server geeft de letterlijke wettekst mee. Dat is het verschil tussen "je moet rechts houden" en artikel 3 van het RVV 1990, met een verwijzing naar wetten.overheid.nl waar het staat.

Dat is niet alleen netjes. Verkeersregels veranderen, en een theorieantwoord zonder bron is niet na te kijken. Zes regelingen zitten erin, met samen ruim tweeduizend artikelen: het RVV 1990, de Wegenverkeerswet 1994, de Regeling voertuigen, het BABW, het Reglement rijbewijzen en de Regeling eisen theorie-examen rijbewijscategorie B.

## Wat dit niet is

Dit is lesstof, geen CBR-examen. De oefenvragen zijn door Ribba geschreven en zijn geen examenvragen van het CBR. Ze zijn er om te toetsen of de stof zit, niet om een examen na te bootsen.

De afbeeldingen van de verkeersborden zijn de officiële borden uit bijlage 1 van het RVV 1990, overgenomen van wetten.overheid.nl. Elk bord in de uitvoer heeft een `afbeelding`-veld dat naar die afbeelding wijst. Op wetten, besluiten en verordeningen van de openbare macht rust geen auteursrecht (Auteurswet artikel 11).

## De inhoud bijwerken

De theorie wordt onderhouden in de website-repo van Ribba. Een kopie ervan zit in `data/`. Bijwerken:

```bash
npm run sync -- ../ribba.app
```

## Testen

```bash
npm install
npm run build
npm test
```

De tests draaien tegen de meegeleverde inhoud, dus zonder netwerk. Naast de gereedschappen zelf controleren ze de samenhang: dat elk bord waar een hoofdstuk naar verwijst bestaat, en dat elke wetsverwijzing in de cursus een echte wettekst oplevert.

## Zelf draaien

```bash
npm install
npm run build
node dist/index.js
```

De server praat JSON-RPC over stdin en stdout. Handmatig starten is vooral nuttig om de foutuitvoer te zien; normaal doet je MCP-client dit.

## Licentie

De code staat onder de MIT-licentie. De wetteksten en de bordafbeeldingen zijn overheidspublicaties zonder auteursrecht. De cursusteksten, de begrippenlijst en de oefenvragen zijn geschreven door Ribba en staan onder [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Verwijs bij hergebruik naar https://ribba.nl.

## Verwant

- [cbr-mcp](https://github.com/RibbaBV/cbr-mcp) voor de CBR-slagingspercentages per rijschool, examencentrum, stad en provincie.
- [rijschool-mcp](https://github.com/RibbaBV/rijschool-mcp) voor de rijscholen zelf: adressen, prijzen, beoordelingen en dekkingsgebied.

Vragen of iets kapot? [team@ribba.nl](mailto:team@ribba.nl) of open een issue.
