"""Create the fixed synthetic PPTX used by the V4.5 offline website demo.

The deck is generated only from code and a tiny generated PNG. It contains
text, a table, and a picture that V4.2 intentionally reports as unsupported.
Run from the repository root:

    python scripts/v45_make_fixture.py
"""

from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from pptx import Presentation
from pptx.util import Inches

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT = REPO_ROOT / "web" / "fixtures" / "v45" / "synthetic-integration-deck.pptx"

# 1x1 transparent PNG. It exists only to exercise the unsupported-picture path.
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0X8AAAAASUVORK5CYII="
)


def main() -> int:
    presentation = Presentation()

    first = presentation.slides.add_slide(presentation.slide_layouts[5])
    first.shapes.title.text = "合成集成样例：表格与正文"
    body = first.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(1.5))
    text_frame = body.text_frame
    text_frame.text = "这是明确标记的合成课件，用于验证 V4.5 网站展示。"
    paragraph = text_frame.add_paragraph()
    paragraph.text = "第二段展示段落层级和来源页码。"
    paragraph.level = 1

    table = first.shapes.add_table(
        3, 3, Inches(0.8), Inches(3.5), Inches(8.4), Inches(1.4)
    ).table
    headers = ("知识点", "操作", "复杂度")
    rows = (("栈顶", "push/pop", "O(1)"), ("顺序存储", "按索引访问", "O(1)"))
    for column, value in enumerate(headers):
        table.cell(0, column).text = value
    for row_index, row in enumerate(rows, start=1):
        for column, value in enumerate(row):
            table.cell(row_index, column).text = value

    second = presentation.slides.add_slide(presentation.slide_layouts[5])
    second.shapes.title.text = "合成集成样例：未支持对象"
    note = second.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(8.4), Inches(1.4))
    note.text_frame.text = "本页包含一个图片对象；V4.2 只标记其存在，不解析图片内容。"
    second.shapes.add_picture(BytesIO(TINY_PNG), Inches(0.8), Inches(3.2), Inches(1), Inches(1))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    presentation.save(OUTPUT)
    print(f"WROTE {OUTPUT.relative_to(REPO_ROOT).as_posix()} bytes={OUTPUT.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
