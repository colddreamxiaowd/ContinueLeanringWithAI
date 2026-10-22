# V4.2 PPTX Content Pipeline (local)

Status: local-only. No website publication, no LLM generation, and no changes to
the validated Feishu OAuth/download/SHA-256 workflow.

## Command

```bash
python scripts/pptx_content.py path/to/deck.pptx --outdir build/v42
```

Outputs:

- `content.json` — deterministic schema `pptx-content-v1`
- `preview.html` — standalone local preview with escaped source text

## Contract

- Top level: `schema_version`, full `source_sha256`, `slides`.
- Slide: zero-based `slide_index`, one-based `slide_number`, `title`, `blocks`.
- Text block: `role` (`title`/`body`), `shape_index`, and `paragraphs` with
  zero-based `index`, list `level`, and `text`.
- Table block: `shape_index` and `rows` of cell text.
- Unsupported content: `shape_index`, `shape_type`, and a note; no invented text.
- Output is deterministic: sorted JSON keys, stable slide/shape order, no
  timestamps, and no input filename or path.
- The full source SHA-256 makes the JSON traceable to the exact PPTX bytes.

## Supported and unsupported

Supported: title and body text, list levels, tables, and blank slides.

Not parsed in v1: pictures, charts, media/OLE objects, and grouped shapes. These
are recorded as `unsupported` placeholders rather than fabricated content.

## Tests

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

The suite generates synthetic PPTX files at runtime; no private courseware is
committed. Both the new V4.2 tests and the existing V4.1 fingerprint tests run.

## Boundaries

- No private PPTX, tokens, or extracted private text in the repository.
- Generated JSON/HTML are local build artifacts.
- No automatic PR merge, deployment, or publication.
