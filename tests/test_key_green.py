import contextlib
import io
from pathlib import Path
import runpy
import tempfile
import unittest

from PIL import Image


key = runpy.run_path(
    str(Path(__file__).resolve().parents[1] / "scripts" / "key-green.py")
)["key"]


class KeyGreenTests(unittest.TestCase):
    def key_image(self, image, pad_ratio=0):
        with tempfile.TemporaryDirectory() as directory:
            src = Path(directory) / "input.png"
            dest = Path(directory) / "output.png"
            image.save(src)
            with contextlib.redirect_stdout(io.StringIO()):
                key(str(src), str(dest), pad_ratio)
            with Image.open(dest) as output:
                return output.copy()

    def test_transparent_background_stays_transparent_and_is_cropped(self):
        image = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        image.paste((220, 30, 30, 255), (10, 10, 30, 30))

        output = self.key_image(image, pad_ratio=0.1)

        self.assertEqual(output.size, (24, 24))
        self.assertEqual(output.getpixel((0, 0))[3], 0)
        self.assertEqual(output.getpixel((12, 12)), (220, 30, 30, 255))
        self.assertEqual(output.getchannel("A").histogram()[255], 400)

    def test_foreground_alpha_is_combined_with_chroma_alpha(self):
        for foreground, expected in (
            ((220, 30, 30, 128), (220, 30, 30, 128)),
            ((220, 30, 30, 64), (220, 30, 30, 64)),
            ((200, 241, 0, 128), (200, 200, 0, 63)),
        ):
            with self.subTest(foreground=foreground):
                image = Image.new("RGBA", (40, 40), (0, 255, 0, 255))
                image.paste(foreground, (10, 10, 30, 30))

                output = self.key_image(image)

                self.assertEqual(output.size, (20, 20))
                self.assertEqual(output.getpixel((10, 10)), expected)

    def test_rgb_green_screen_still_removes_background(self):
        image = Image.new("RGB", (40, 40), (0, 255, 0))
        image.paste((220, 30, 30), (10, 10, 30, 30))

        output = self.key_image(image, pad_ratio=0.1)

        self.assertEqual(output.size, (24, 24))
        self.assertEqual(output.getpixel((0, 0))[3], 0)
        self.assertEqual(output.getpixel((12, 12)), (220, 30, 30, 255))
        self.assertEqual(output.getchannel("A").histogram()[255], 400)


if __name__ == "__main__":
    unittest.main()
