#!/usr/bin/env python3
"""Static quality checks for publishable Markdown blogs. Stdlib only.

Exit status: 0 = no blocking issue, 1 = at least one error (or --strict and warnings),
2 = invalid input. The tool is heuristic; it does not certify content accuracy.
"""
import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})([^`~]*)$")
HEAD_RE = re.compile(r"^(#{1,6})\s+(\S.*)$")
LINK_RE = re.compile(r"(?<!!)\[([^]\n]+)\]\((<?[^)\n]+>?)\)")
BAD_RESIDUES = {
    "ChatGPT Learn": "聊天界面导出残留，请移除或换成真实引用",
    "[image](https://www.google.com/s2/favicons": "favicon 不是有意义的博客配图",
    "&#x20;下载": "可能是聊天按钮残留，不是实际附件链接",
    "下载完整 ZIP": "疑似下载占位符；确认有真实链接/文件",
    "下载 Python 文件": "疑似下载占位符；确认有真实链接/文件",
}


def check_file(path: Path, *, engineering: bool = False):
    issues = []
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    headings = []
    in_fence = False
    fence_char = ""
    fence_n = 0
    body = []

    def issue(sev, line, desc):
        issues.append((sev, line, desc))

    for number, line in enumerate(lines, 1):
        fence = FENCE_RE.match(line)
        if not in_fence and fence:
            symbol = fence.group(1)
            in_fence = True
            fence_char = symbol[0]
            fence_n = len(symbol)
            lang = fence.group(2).strip()
            if not lang:
                issue("WARN", number, "代码围栏没有语言标记；建议 python/cmd/powershell/json/text 等")
            continue
        if in_fence:
            stripped = line.strip()
            if stripped.startswith(fence_char * fence_n) and set(stripped) <= {fence_char}:
                in_fence = False
                fence_char = ""
                fence_n = 0
            continue

        body.append((number, line))
        heading = HEAD_RE.match(line)
        if heading:
            depth = len(heading.group(1))
            title = heading.group(2).strip()
            if headings and depth > headings[-1][0] + 1:
                issue("WARN", number, "标题层级跳跃；请检查章节结构")
            headings.append((depth, number, title))
        for needle, explanation in BAD_RESIDUES.items():
            if needle in line:
                issue("WARN", number, explanation)

        # Basic link integrity. URLs with internal parentheses may require a parser.
        for match in LINK_RE.finditer(line):
            target = match.group(2).strip("<>").strip()
            target = target.split(' "', 1)[0]
            if target.startswith(("#", "http://", "https://", "mailto:", "data:")):
                continue
            if target.startswith("sandbox:"):
                issue("WARN", number, "sandbox 下载链接不能直接作为公开 GitHub 博客的永久路径")
                continue
            if target.startswith(("/", "\\")) or re.match(r"^[A-Za-z]:[\\/]", target):
                issue("WARN", number, "绝对本地路径不是可分享的博客链接")
                continue
            local = unquote(urlsplit(target).path)
            if local and not (path.parent / local).exists():
                issue("ERROR", number, f"相对链接目标不存在: {target}")

    if in_fence:
        issue("ERROR", len(lines), "代码围栏未闭合")
    top = [t for d, n, t in headings if d == 1]
    if not top:
        issue("ERROR", 1, "缺少一级标题 #")
    elif len(top) > 1:
        issue("ERROR", 1, "存在多个一级标题 #；单篇博客只保留一个")
    if engineering and not any("验收" in s or "验证" in s for _, s in body):
        issue("WARN", 1, "工程教程缺少明确验收/验证内容")
    if engineering and not any("为什么" in s or "原理" in s or "原因" in s for _, s in body):
        issue("WARN", 1, "工程教程可能只讲操作，缺少为什么或原理解释")
    if len(lines) < 25:
        issue("WARN", 1, "文章少于 25 行；长文任务需人工核对是否只是提纲")
    return issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="Markdown file or directory")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures")
    parser.add_argument("--engineering", action="store_true", help="Check engineering-specific teaching cues")
    args = parser.parse_args()
    if not args.target.exists():
        print(f"ERROR: not found: {args.target}", file=sys.stderr)
        return 2
    files = [args.target] if args.target.is_file() else sorted(args.target.rglob("*.md"))
    files = [p for p in files if p.suffix.lower() == ".md"]
    if not files:
        print("ERROR: no Markdown files", file=sys.stderr)
        return 2
    errors = warns = 0
    for file in files:
        issues = check_file(file, engineering=args.engineering)
        for severity, line, note in issues:
            print(f"{file}:{line}: {severity}: {note}")
            errors += severity == "ERROR"
            warns += severity == "WARN"
    print(f"Checked {len(files)} file(s): {errors} error(s), {warns} warning(s)")
    return 1 if errors or (args.strict and warns) else 0


if __name__ == "__main__":
    raise SystemExit(main())
