#!/usr/bin/env python3
"""
Generuje odvozeniny fotek galerie z originálů v assets-src/galerie/.

Originály zůstávají mimo nasazovanou část webu – na server jde jen to, co
vznikne tady. Z každé fotky vzniknou 4 soubory:

  <jmeno>-w560.webp   – dlaždice v mřížce
  <jmeno>-w1100.webp  – dlaždice na retina displeji, lightbox
  <jmeno>-w1920.webp  – lightbox na retina displeji
  <jmeno>-w1100.jpg   – jediný fallback pro prohlížeče bez WebP

Tři WebP stupně pokryjí všechny reálné velikosti zobrazení (dlaždice je široká
300–780 px, lightbox nejvýš 920 px) na běžném i retina displeji. Víc stupňů by
znamenalo jen víc souborů v repozitáři bez viditelného přínosu.

Šířka větší než originál se nikdy negeneruje – nevyrábíme falešné pixely.
Kvalita se tak zvedne sama, jakmile do assets-src/galerie/ přibude ostřejší
originál; stačí skript spustit znovu.

Spuštění:  python3 tools/build-gallery.py
"""

import json
import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets-src" / "galerie"
OUT_DIR = ROOT / "img" / "galerie"
CAPTIONS = SRC_DIR / "popisky.json"
MANIFEST = OUT_DIR / "manifest.json"

WIDTHS = [560, 1100, 1920]
FALLBACK_W = 1100          # jediná JPEG varianta pro prohlížeče bez WebP
WEBP_QUALITY = 82
JPEG_QUALITY = 84
SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def variants_for(width: int) -> list[int]:
    """Šířky, které má smysl vyrobit.

    Nikdy neupscalujeme nad originál (nevyrábíme falešné pixely) a zároveň
    negenerujeme nic nad WIDTHS[-1] – větší soubor už lightbox nevyužije,
    jen by se dlouho stahoval. U fotek menších než nejmenší cíl vezmeme
    rovnou originální šířku, ať je k dispozici to nejostřejší, co existuje.
    """
    out = [w for w in WIDTHS if w <= width]
    if width < WIDTHS[-1] and width not in out:
        out.append(width)
    return sorted(set(out)) or [width]


def build_one(path: pathlib.Path) -> dict:
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        src_w, src_h = im.size
        ratio = src_h / src_w
        widths = variants_for(src_w)

        def scaled(w: int) -> tuple[Image.Image, int]:
            h = max(1, round(w * ratio))
            return (im if (w, h) == (src_w, src_h) else im.resize((w, h), Image.LANCZOS)), h

        variants = []
        for w in widths:
            resized, h = scaled(w)
            out = OUT_DIR / f"{path.stem}-w{w}.webp"
            resized.save(out, "WEBP", quality=WEBP_QUALITY, method=6)
            variants.append({"w": w, "h": h, "path": f"img/galerie/{out.name}",
                             "bytes": out.stat().st_size})

        # Fallback bereme co nejblíž FALLBACK_W, ale nikdy nad rozlišení originálu.
        fw = min(widths, key=lambda w: abs(w - FALLBACK_W))
        resized, fh = scaled(fw)
        out = OUT_DIR / f"{path.stem}-w{fw}.jpg"
        resized.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        fallback = {"w": fw, "h": fh, "path": f"img/galerie/{out.name}",
                    "bytes": out.stat().st_size}

    return {
        "name": path.stem,
        "source": f"assets-src/galerie/{path.name}",
        "source_w": src_w,
        "source_h": src_h,
        "variants": variants,
        "fallback": fallback,
    }


def ordered_sources() -> list[pathlib.Path]:
    """Pořadí bere z popisky.json; co tam není, přijde na konec abecedně."""
    files = {p.stem: p for p in SRC_DIR.iterdir() if p.suffix.lower() in SUFFIXES}

    order = []
    if CAPTIONS.is_file():
        for key in json.loads(CAPTIONS.read_text(encoding="utf-8")):
            if not key.startswith("_") and key in files:
                order.append(files.pop(key))

    return order + [files[k] for k in sorted(files)]


def main() -> int:
    if not SRC_DIR.is_dir():
        print(f"Chybí složka se zdroji: {SRC_DIR}", file=sys.stderr)
        return 1

    sources = ordered_sources()
    if not sources:
        print(f"Ve složce {SRC_DIR} nejsou žádné fotky.", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Staré odvozeniny smažeme, ať po přejmenování nebo úbytku fotek nezůstávají sirotci.
    for old in OUT_DIR.glob("*-w*.*"):
        old.unlink()

    manifest = [build_one(p) for p in sources]
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    total = files = 0
    for item in manifest:
        widths = ", ".join(str(v["w"]) for v in item["variants"])
        largest = item["variants"][-1]
        total += sum(v["bytes"] for v in item["variants"]) + item["fallback"]["bytes"]
        files += len(item["variants"]) + 1
        flag = "" if largest["w"] >= 1100 else "   ⚠ originál v nízkém rozlišení"
        print(f"{item['name']:<32} {item['source_w']}×{item['source_h']}  →  "
              f"{widths} webp + {item['fallback']['w']} jpg{flag}")

    print(f"\n{len(manifest)} fotek, {files} souborů, celkem {total/1024/1024:.2f} MB")
    print(f"Manifest: {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
