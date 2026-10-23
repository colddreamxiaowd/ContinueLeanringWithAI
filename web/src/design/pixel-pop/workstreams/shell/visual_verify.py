"""Session A browser acceptance after the integrator mounts ShellDemo on Next.js.

Run (Python with playwright + installed Chromium):
    python visual_verify.py --url http://localhost:3000/ui-lab/session-a --out shell-evidence
This script does not alter any repository file or claim that a demo is a real CoursePack.
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

SIZES = [(1440, 900), (768, 1024), (390, 844)]
MODES = [
    ("minimal", "舒适"), ("balanced", "标准"), ("normal", "紧凑")
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="Live integrated Next.js URL for ShellDemo")
    parser.add_argument("--out", default="shell-evidence")
    args = parser.parse_args()
    dest = Path(args.out)
    dest.mkdir(parents=True, exist_ok=True)
    records = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width, height in SIZES:
            context = browser.new_context(viewport={"width": width, "height": height},
                                          device_scale_factor=1, reduced_motion="reduce")
            page = context.new_page()
            page.goto(args.url, wait_until="networkidle")
            page.locator(".pp-root").first.wait_for()
            for mode, label in MODES:
                page.locator('button[aria-haspopup="true"]').first.click()
                page.get_by_role("radio", name=re.compile(label)).click()
                page.locator(f'.pp-root[data-density="{mode}"]').wait_for()
                nav = page.locator('aside[aria-label="学习中心侧边导航"]')
                rect = nav.bounding_box()
                doc_width = page.evaluate("document.documentElement.scrollWidth")
                assert doc_width <= width + 1, f"Unexpected horizontal scroll: {width}/{mode} -> {doc_width}"
                png = dest / f"session-a-{width}-{mode}.png"
                page.screenshot(path=str(png), full_page=True)
                records.append({"viewport": width, "height": height, "mode": mode,
                                "sidebar_width": round(rect["width"], 1) if rect else None,
                                "page_scroll_width": doc_width, "screenshot": png.name})

            if width == 1440:
                page.locator('button[aria-haspopup="true"]').first.click()
                page.screenshot(path=str(dest / "session-a-1440-density-open.png"), full_page=True)
                page.keyboard.press("Escape")
            page.get_by_role("button", name="测试长中文标题").click()
            page.screenshot(path=str(dest / f"session-a-{width}-long-cn.png"), full_page=True)
            if width == 390:
                trigger = page.get_by_role("button", name="打开侧边导航")
                trigger.click()
                nav = page.locator('aside[aria-label="学习中心侧边导航"]')
                assert nav.is_visible(), "Mobile drawer did not open"
                assert page.locator('[data-mobile-open="true"]').count() == 1
                page.screenshot(path=str(dest / "session-a-390-mobile-open.png"), full_page=True)
                page.keyboard.press("Escape")
                assert page.locator('[data-mobile-open="false"]').count() == 1, "Escape did not close"
                assert trigger.evaluate("(node) => document.activeElement === node"), "Focus did not return"
                # Reopen and click a demo navigation button to check selected state.
                trigger.click()
                page.get_by_role("button", name=re.compile("飞书资料")).first.click()
                assert page.locator('aside[aria-label="学习中心侧边导航"] [aria-current="page"]').count() == 1
                page.screenshot(path=str(dest / "session-a-390-mobile-active.png"), full_page=True)
            else:
                if width == 1440:
                    docs_item = page.locator('aside[aria-label="学习中心侧边导航"]').get_by_role("button", name=re.compile("飞书资料"))
                    docs_item.hover()
                    page.screenshot(path=str(dest / "session-a-1440-nav-hover.png"), full_page=True)
                    docs_item.click()
                    page.screenshot(path=str(dest / "session-a-1440-nav-active.png"), full_page=True)
                toggle = page.get_by_role("button", name="折叠侧栏")
                toggle.click()
                assert page.locator('[data-collapsed="true"]').count() == 1
                page.screenshot(path=str(dest / f"session-a-{width}-collapsed.png"), full_page=True)
            context.close()
        browser.close()
    (dest / "measurements.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), "utf-8")
    print(json.dumps({"screenshots": len(list(dest.glob("*.png"))),
                      "measurements": len(records), "out": str(dest)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
