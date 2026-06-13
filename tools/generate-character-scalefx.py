from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "assets" / "character"
OUTPUT_ROOT = ROOT / "assets" / "character-scalefx"
CHARACTERS = (
    "Elite Orc",
    "Greatsword Skeleton",
    "Priest",
    "Slime",
    "Werebear",
    "Wizard",
)


def scale3x_frame(source):
    width, height = source.size
    src = source.load()
    output = Image.new("RGBA", (width * 3, height * 3))
    dst = output.load()

    for y in range(height):
        for x in range(width):
            a = src[max(0, x - 1), max(0, y - 1)]
            b = src[x, max(0, y - 1)]
            c = src[min(width - 1, x + 1), max(0, y - 1)]
            d = src[max(0, x - 1), y]
            e = src[x, y]
            f = src[min(width - 1, x + 1), y]
            g = src[max(0, x - 1), min(height - 1, y + 1)]
            h = src[x, min(height - 1, y + 1)]
            i = src[min(width - 1, x + 1), min(height - 1, y + 1)]

            if b != h and d != f:
                pixels = (
                    d if d == b else e,
                    b if (d == b and e != c) or (b == f and e != a) else e,
                    f if b == f else e,
                    d if (d == b and e != g) or (d == h and e != a) else e,
                    e,
                    f if (b == f and e != i) or (h == f and e != c) else e,
                    d if d == h else e,
                    h if (d == h and e != i) or (h == f and e != g) else e,
                    f if h == f else e,
                )
            else:
                pixels = (e,) * 9

            ox, oy = x * 3, y * 3
            for py in range(3):
                for px in range(3):
                    dst[ox + px, oy + py] = pixels[py * 3 + px]

    return output


def process_sheet(source_path, output_path):
    source = Image.open(source_path).convert("RGBA")
    frame_size = 100
    frame_count = source.width // frame_size
    output = Image.new("RGBA", (source.width * 3, source.height * 3))

    for frame_index in range(frame_count):
        left = frame_index * frame_size
        frame = source.crop((left, 0, left + frame_size, frame_size))
        output.alpha_composite(scale3x_frame(frame), (frame_index * 300, 0))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, optimize=True)


def main():
    processed = 0
    for character in CHARACTERS:
        source_dir = SOURCE_ROOT / character / character
        output_dir = OUTPUT_ROOT / character
        for source_path in sorted(source_dir.glob("*.png")):
            output_name = source_path.name.replace("-DEATH.png", "-Death.png")
            output_path = output_dir / output_name
            process_sheet(source_path, output_path)
            processed += 1
    print(f"Generated {processed} filtered character animations.")


if __name__ == "__main__":
    main()
