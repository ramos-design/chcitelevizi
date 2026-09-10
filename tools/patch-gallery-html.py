#!/usr/bin/env python3
"""
Přepíše blok .gallery-grid v index.html podle img/galerie/manifest.json
a popisků z assets-src/galerie/popisky.json.

Zároveň spočítá mozaiku: dlaždice se rozdělí do řad tak, aby každá řada přesně
vyplnila 12 sloupců mřížky – galerie tedy nikdy nekončí osiřelou dlaždicí
uprostřed prázdné řady, ať je fotek jakýkoli počet. Fotka na výšku dostane
v řadě nejužší místo, aby ji ořez na šířku nezničil.

Spouštět po tools/build-gallery.py:  python3 tools/patch-gallery-html.py
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
MANIFEST = ROOT / "img" / "galerie" / "manifest.json"
CAPTIONS = ROOT / "assets-src" / "galerie" / "popisky.json"

COLUMNS = 12
GAP = 12                 # gap mřížky v px (css/components.css)
CONTENT_MAX = 1340       # šířka obsahu sekce nad 1400px viewportu (css/responsive.css)
# Dlaždice se nikdy nezobrazuje šířeji než ~780 px, takže do mřížky posíláme
# nejvýš 1440px variantu – pokryje i retina displej. Větší soubory jsou jen
# pro lightbox.
GRID_MAX_W = 1920
# Nad tuhle šířku už lightbox fotku stejně nezvětší, tak ať se nestahuje zbytečně velká.
LIGHTBOX_MAX_W = 1920


def sizes_for(span: int, index: int, portrait: bool) -> str:
    """Přesné `sizes` podle skutečné šířky dlaždice v daném breakpointu.

    Bez toho by prohlížeč u všech dlaždic sahal po stejně velkém souboru –
    u těch úzkých zbytečně velkém. Breakpointy odpovídají css/responsive.css:
    do 600px jeden sloupec, do 900px dva (každá třetí fotka na šířku přes oba).
    """
    col = (CONTENT_MAX - (COLUMNS - 1) * GAP) / COLUMNS
    fixed = round(span * col + (span - 1) * GAP)
    fluid = round(span * 90 / COLUMNS, 1)
    tablet = 90 if ((index + 1) % 3 == 0 and not portrait) else 45

    return (f"(max-width: 600px) 90vw, (max-width: 900px) {tablet}vw, "
            f"(min-width: 1400px) {fixed}px, {fluid}vw")

ROW_PATTERNS_3 = [(5, 4, 3), (3, 5, 4), (4, 3, 5)]
ROW_PATTERNS_2 = [(7, 5), (5, 7)]

GRID_RE = re.compile(r'(<div class="gallery-grid reveal">)(.*?)(\n\s*</div>\s*\n\s*</section>)', re.S)


def row_sizes(n: int) -> list[int]:
    """Rozdělí n dlaždic do řad po 3 a 2 tak, aby žádná řada nezůstala neúplná."""
    if n <= 3:
        return [n]

    rest = n % 3
    if rest == 0:
        threes, twos = n // 3, 0
    elif rest == 2:
        threes, twos = (n - 2) // 3, 1
    else:  # rest == 1 – jednu trojici rozpustíme do dvou dvojic
        threes, twos = (n - 4) // 3, 2

    # Dvojice prostřídáme mezi trojice, ať galerie nepůsobí dole prázdně.
    out, a, b = [], threes, twos
    while a or b:
        if a:
            out.append(3)
            a -= 1
        if b:
            out.append(2)
            b -= 1
    return out


def layout(entries: list[dict]) -> list[int]:
    """Ke každé fotce vrátí počet sloupců, které v mřížce zabere."""
    spans = [0] * len(entries)
    i, p3, p2 = 0, 0, 0

    for size in row_sizes(len(entries)):
        idx = list(range(i, i + size))

        if size == 3:
            widths, p3 = list(ROW_PATTERNS_3[p3 % len(ROW_PATTERNS_3)]), p3 + 1
        elif size == 2:
            widths, p2 = list(ROW_PATTERNS_2[p2 % len(ROW_PATTERNS_2)]), p2 + 1
        else:
            widths = [COLUMNS // size] * size
            widths[0] += COLUMNS - sum(widths)

        # Nejvyšší fotka (největší poměr výška/šířka) dostane nejužší dlaždici.
        tallest = sorted(idx, key=lambda k: entries[k]["source_h"] / entries[k]["source_w"], reverse=True)
        for k, w in zip(tallest, sorted(widths)):
            spans[k] = w
        i += size

    return spans


def render(entry: dict, meta: dict, index: int, span: int) -> str:
    variants = entry["variants"]
    grid = [v for v in variants if v["w"] <= GRID_MAX_W] or variants[:1]
    full = max((v for v in variants if v["w"] <= LIGHTBOX_MAX_W), key=lambda v: v["w"])
    fallback = entry["fallback"]

    webp_set = ", ".join(f'{v["path"]} {v["w"]}w' for v in grid)

    alt = meta.get("alt", "")
    caption = meta.get("caption", "")
    is_portrait = entry["source_h"] > entry["source_w"]
    portrait = " is-portrait-src" if is_portrait else ""
    sizes = sizes_for(span, index, is_portrait)

    return f'''
      <div class="gallery-item gs-{span}{portrait}" data-index="{index}" role="button" tabindex="0" aria-label="Otevřít: {alt}">
        <div class="gallery-item-inner">
          <picture>
            <source type="image/webp" srcset="{webp_set}" sizes="{sizes}">
            <img src="{fallback['path']}"
                 data-full="{full['path']}" data-full-fallback="{fallback['path']}"
                 data-full-w="{full['w']}" data-full-h="{full['h']}"
                 alt="{alt}" width="{fallback['w']}" height="{fallback['h']}"
                 loading="lazy" decoding="async">
          </picture>
        </div>
        <div class="gallery-overlay">
          <div class="gallery-caption">{caption}</div>
        </div>
      </div>
'''


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    captions = json.loads(CAPTIONS.read_text(encoding="utf-8")) if CAPTIONS.is_file() else {}

    missing = [e["name"] for e in manifest if e["name"] not in captions]
    if missing:
        print("Chybí popisek v popisky.json pro: " + ", ".join(missing), file=sys.stderr)
        return 1

    html = HTML.read_text(encoding="utf-8")
    match = GRID_RE.search(html)
    if not match:
        print("Nepodařilo se najít blok .gallery-grid v index.html", file=sys.stderr)
        return 1

    spans = layout(manifest)
    rendered = [render(e, captions[e["name"]], i, spans[i]) for i, e in enumerate(manifest)]

    HTML.write_text(html[:match.start(2)] + "".join(rendered) + html[match.end(2):], encoding="utf-8")

    print(f"index.html: přepsáno {len(rendered)} položek galerie.")
    print("Mozaika:", " | ".join(
        " ".join(str(spans[j]) for j in range(sum(row_sizes(len(manifest))[:r]),
                                              sum(row_sizes(len(manifest))[:r + 1])))
        for r in range(len(row_sizes(len(manifest))))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
