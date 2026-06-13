from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_GROUPS = (
    (ROOT / "assets" / "monster", ROOT / "assets" / "monster-scalefx"),
    (ROOT / "assets" / "boss", ROOT / "assets" / "boss-scalefx"),
)


def scale2x_frame(source):
    width, height = source.size
    src = source.load()
    output = Image.new("RGBA", (width * 2, height * 2))
    dst = output.load()

    for y in range(height):
        for x in range(width):
            center = src[x, y]
            up = src[x, max(0, y - 1)]
            left = src[max(0, x - 1), y]
            right = src[min(width - 1, x + 1), y]
            down = src[x, min(height - 1, y + 1)]

            if up != down and left != right:
                pixels = (
                    left if left == up else center,
                    right if up == right else center,
                    left if left == down else center,
                    right if down == right else center,
                )
            else:
                pixels = (center, center, center, center)

            ox, oy = x * 2, y * 2
            dst[ox, oy] = pixels[0]
            dst[ox + 1, oy] = pixels[1]
            dst[ox, oy + 1] = pixels[2]
            dst[ox + 1, oy + 1] = pixels[3]

    return output


def process_sheet(source_path, output_path):
    source = Image.open(source_path).convert("RGBA")
    frame_width = source.width // 3
    frame_height = source.height // 4
    output = Image.new("RGBA", (source.width * 2, source.height * 2))

    for row in range(4):
        for column in range(3):
            left = column * frame_width
            top = row * frame_height
            frame = source.crop(
                (left, top, left + frame_width, top + frame_height)
            )
            scaled = scale2x_frame(frame)
            output.alpha_composite(
                scaled,
                (column * frame_width * 2, row * frame_height * 2),
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, optimize=True)


def main():
    processed = 0
    for source_root, output_root in SOURCE_GROUPS:
        for source_path in sorted(source_root.glob("*/sheet.png")):
            output_path = output_root / source_path.parent.name / "sheet.png"
            process_sheet(source_path, output_path)
            processed += 1
    print(f"Generated {processed} filtered enemy sheets.")


if __name__ == "__main__":
    main()
