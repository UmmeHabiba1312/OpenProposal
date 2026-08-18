from pathlib import Path

_RULEBOOK_PATH = Path(__file__).parent / "rulebook.md"

PROPOSAL_RULEBOOK = _RULEBOOK_PATH.read_text(encoding="utf-8")