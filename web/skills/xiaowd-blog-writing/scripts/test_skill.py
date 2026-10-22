#!/usr/bin/env python3
"""Smoke-test frontmatter, referenced assets, article lint, and scaffold safety."""
from pathlib import Path
import re
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from lint_blog import check_file  # noqa: E402
from scaffold import ROOT as SCAFFOLD_ROOT  # noqa: E402


def main():
    skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    assert skill.startswith("---\n"), "SKILL.md must start with frontmatter"
    frontmatter = skill.split("---", 2)[1]
    name = re.search(r"^name:\s*([^\n]+)", frontmatter, re.M)
    desc = re.search(r"^description:\s*(.+)$", frontmatter, re.M)
    assert name and name.group(1).strip() == ROOT.name, "Skill name/folder mismatch"
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", ROOT.name), "Invalid skill name"
    assert desc and 1 <= len(desc.group(1).strip()) <= 1024, "Invalid description"
    for ref in re.findall(r"`((?:references|assets|scripts)/[^`\n]+)`", skill):
        assert (ROOT / ref).exists(), f"Missing resource: {ref}"
    assert SCAFFOLD_ROOT == ROOT
    with tempfile.TemporaryDirectory() as tmp:
        good = Path(tmp) / "good.md"
        good.write_text("# 标题\n\n## 为什么这么做\n\n这里解释原理。\n\n## 验收\n\n- [ ] 完成\n\n```python\nprint(1)\n```\n" + "\n".join("可复现说明。" for _ in range(30)), encoding="utf-8")
        assert check_file(good, engineering=True) == [], "Valid Markdown flagged"
        bad = Path(tmp) / "bad.md"
        bad.write_text("## 二级开头\n\n[不存在](missing.py)\n\n```\n", encoding="utf-8")
        issues = check_file(bad)
        assert sum(sev == 'ERROR' for sev, _, _ in issues) >= 2, "Invalid Markdown not caught"
    print("PASS skill-format: name/description/frontmatter")
    print("PASS resource-links: all referenced local resources exist")
    print("PASS linter: valid article accepted / broken article detected")
    print("PASS scaffold: project root resolves")
    print("4 checks passed")


if __name__ == "__main__":
    main()
