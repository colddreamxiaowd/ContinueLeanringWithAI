#!/usr/bin/env python3
"""Create unfilled article templates and one series matrix; does not overwrite files."""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--series", required=True, help="Series name e.g. 从零开发 Agent Watchdog")
    parser.add_argument("--from-chapter", type=int, required=True)
    parser.add_argument("--to-chapter", type=int, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if not (1 <= args.from_chapter <= args.to_chapter <= 999):
        parser.error("Invalid chapter range")
    args.out.mkdir(parents=True, exist_ok=True)
    template = (ROOT / "assets" / "chapter-template.md").read_text(encoding="utf-8")
    for i in range(args.from_chapter, args.to_chapter + 1):
        name = f"{args.series}（{i:02d}）.md"
        target = args.out / name
        if target.exists():
            print("SKIP existing:", target)
            continue
        content = template.replace("【系列名称】", args.series).replace("（NN）", f"（{i:02d}）").replace("第 NN 篇", f"第 {i:02d} 篇")
        target.write_text(content, encoding="utf-8")
        print("CREATE:", target)
    matrix = args.out / "系列推进矩阵.md"
    if not matrix.exists():
        matrix.write_text((ROOT / "assets" / "series-matrix.md").read_text(encoding="utf-8"), encoding="utf-8")
        print("CREATE:", matrix)
    print("注：这些是待填写的框架，不是已完成的文章。")


if __name__ == "__main__":
    main()
