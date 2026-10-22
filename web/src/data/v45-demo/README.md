# V4.5 合成演示数据

本目录由 `scripts/v45_export_synthetic.py` 通过现有 V4.3 流水线生成，仅包含项目内明确标记的合成 PPTX：

- `web/fixtures/v2/synthetic-stack-lesson.pptx`
- `web/fixtures/v45/synthetic-integration-deck.pptx`

生成命令（仓库根目录）：

```bash
python scripts/v45_make_fixture.py   # 仅首次或需要重建固定合成 Fixture 时
python scripts/v45_export_synthetic.py
```

不要手工编辑 `index.json` 或 `documents/*.json`。本目录不包含真实课程文件名、真实来源哈希以外的私人元数据、Token、绝对路径或真实课件文本。
