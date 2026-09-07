# theorie-mcp

Een MCP-server met de volledige theorie voor het autorijbewijs B in Nederland: elf hoofdstukken met 134 paragrafen, alle 175 verkeersborden uit bijlage 1 van het RVV 1990, 182 begrippen en de wetsartikelen waar elke regel op rust. Gratis, zonder account en zonder sleutel.

De inhoud zit in het pakket. De server werkt dus zonder netwerk en zonder database.

Gemaakt en onderhouden door **[Ribba](https://ribba.nl)**, de vergelijker voor rijscholen en gratis theorie in Nederland.

## Installeren

Er is geen account en geen sleutel nodig. Elke client hieronder start de server zelf met `npx`, dus je hoeft niets vooraf te installeren behalve Node 20 of nieuwer.

### Claude Code

```bash
claude mcp add --scope user theorie -- npx -y @ribba/theorie-mcp
```

`--scope user` schrijft hem naar `~/.claude.json`, waarmee hij in al je projecten werkt en ook beschikbaar is in het Code-tabblad van de desktop-app. Laat je `--scope` weg, dan geldt hij alleen in de map waar je op dat moment staat. Wil je hem juist met je team delen, gebruik dan `--scope project`: die schrijft naar `.mcp.json` in de repo, en dat bestand hoort in versiebeheer.

### Codex

```bash
codex mcp add theorie -- npx -y @ribba/theorie-mcp
```

Of met de hand in `~/.codex/config.toml`:

```toml
[mcp_servers.theorie]
command = "npx"
args = ["-y", "@ribba/theorie-mcp"]
```

De Codex-CLI, de IDE-extensie en de ChatGPT-desktopapp lezen alle drie datzelfde bestand, dus één keer instellen is genoeg. Zet je het in `.codex/config.toml` binnen een project, dan geldt het alleen daar.

### Claude Desktop

De chat-app deelt zijn instellingen niet met Claude Code en heeft een eigen bestand:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Herstart de app daarna. Heb je hem daar al staan en wil je hem ook in Claude Code, dan neemt `claude mcp add-from-claude-desktop` hem over.

### Cursor, Windsurf en andere clients

Dezelfde JSON als hierboven, in het configuratiebestand van je client.

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

## Deze theorie op het web

Alles wat deze server teruggeeft staat ook als gewone pagina op **[ribba.nl](https://ribba.nl)**, met afbeeldingen, voorbeelden en oefenvragen erbij:

- [Gratis theorie leren](https://ribba.nl/gratis-theorie-leren): de volledige cursus
- [Alle verkeersborden](https://ribba.nl/verkeersborden) uit bijlage 1 van het RVV 1990
- [De begrippenlijst](https://ribba.nl/begrippen)
- [De gids](https://ribba.nl/gids): het theorie-examen van begin tot eind

Wil je de theorie op je eigen site zetten? Dat mag, en het kan met een kant-en-klaar kader: zie [gratis theorie aanbieden](https://ribba.nl/gratis-theorie-aanbieden).

Elk bord, begrip en hoofdstuk in de uitvoer bevat een `pagina`-veld dat naar de bijbehorende pagina wijst.

## Licentie

De code staat onder de MIT-licentie. De wetteksten en de bordafbeeldingen zijn overheidspublicaties zonder auteursrecht. De cursusteksten, de begrippenlijst en de oefenvragen zijn geschreven door Ribba en staan onder [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Verwijs bij hergebruik naar https://ribba.nl.

## Verwant

- [cbr-mcp](https://github.com/RibbaBV/cbr-mcp) voor de CBR-slagingspercentages per rijschool, examencentrum, stad en provincie.
- [rijschool-mcp](https://github.com/RibbaBV/rijschool-mcp) voor de rijscholen zelf: adressen, prijzen, beoordelingen en dekkingsgebied.

Vragen of iets kapot? [team@ribba.nl](mailto:team@ribba.nl) of open een issue.
