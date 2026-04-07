#!/usr/bin/env python3
"""
TasteBud WCAG 2.1 Contrast Audit

Reads color tokens from mobile/src/theme/colors.ts and verifies that every
foreground/background pair meets WCAG AA contrast requirements.

Standards:
  - AA Normal text: 4.5:1
  - AA Large text:  3.0:1
  - AAA Normal:     7.0:1

Note on `primary`:
  In LIGHT mode, `primary` (#0e0f0f) is used as a foreground accent — it's
  near-black, sits on light backgrounds, and is tested as text.
  In DARK mode, `primary` (#1f2122) is a deep neutral SURFACE color, not a
  foreground. Foreground accents in dark mode use `textPrimary` instead.
  The script reflects this asymmetric usage.

Usage:
  python3 tools/audit-wcag-contrast.py
"""

import re
import sys
from pathlib import Path

AA_NORMAL = 4.5
AA_LARGE = 3.0
AAA_NORMAL = 7.0


def hex_to_rgb(hex_color):
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def relative_luminance(rgb):
    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(fg_hex, bg_hex):
    l1 = relative_luminance(hex_to_rgb(fg_hex))
    l2 = relative_luminance(hex_to_rgb(bg_hex))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def grade(ratio):
    if ratio >= AAA_NORMAL:
        return "AAA"
    if ratio >= AA_NORMAL:
        return "AA"
    if ratio >= AA_LARGE:
        return "AA-Large"
    return "FAIL"


# In light mode, primary is a foreground (used for text/icons on light surfaces).
# In dark mode, primary is a surface, not a foreground — use textPrimary instead.
PAIRS_TO_TEST = {
    "light": {
        "backgrounds": ["background", "card"],
        "foregrounds": [
            "primary",
            "success",
            "warning",
            "danger",
            "info",
            "textPrimary",
            "textSecondary",
            "textTertiary",
        ],
    },
    "dark": {
        "backgrounds": ["background", "card"],
        "foregrounds": [
            "success",
            "warning",
            "danger",
            "info",
            "textPrimary",
            "textSecondary",
            "textTertiary",
        ],
    },
}


def parse_colors(colors_ts_path):
    """Extract Colors.light and Colors.dark hex values from colors.ts.

    Uses brace-counting to correctly identify the start and end of each
    mode block, since simple regex can't handle nested braces.
    """
    text = colors_ts_path.read_text()
    colors = {"light": {}, "dark": {}}

    for mode in ("light", "dark"):
        # Find the start of the mode block: e.g. "light: {"
        start_match = re.search(rf"\b{mode}\s*:\s*\{{", text)
        if not start_match:
            print(f"ERROR: could not find '{mode}:' in colors.ts")
            sys.exit(1)

        # Walk forward from the opening brace, counting braces, until balanced
        pos = start_match.end()  # position right after the opening {
        depth = 1
        end = None
        while pos < len(text) and depth > 0:
            if text[pos] == "{":
                depth += 1
            elif text[pos] == "}":
                depth -= 1
                if depth == 0:
                    end = pos
                    break
            pos += 1

        if end is None:
            print(f"ERROR: unbalanced braces in '{mode}' block")
            sys.exit(1)

        block = text[start_match.end():end]

        for key, hex_val in re.findall(r"(\w+)\s*:\s*['\"](#[0-9a-fA-F]{3,8})['\"]", block):
            colors[mode][key] = hex_val

    return colors


def main():
    project_root = Path(__file__).resolve().parent.parent
    colors_path = project_root / "mobile" / "src" / "theme" / "colors.ts"

    if not colors_path.exists():
        print(f"ERROR: {colors_path} not found")
        print("Run this script from the project root.")
        sys.exit(1)

    colors = parse_colors(colors_path)

    print()
    print("=" * 75)
    print("  TASTEBUD WCAG 2.1 CONTRAST AUDIT")
    print("=" * 75)
    print(f"  Source:    {colors_path.relative_to(project_root)}")
    print(f"  Standard:  WCAG 2.1 AA (>=4.5:1 normal text, >=3.0:1 large/UI)")
    print(f"  Note:      'primary' is a surface in dark mode, not a foreground.")
    print()

    total_pairs = 0
    total_pass_aa = 0
    total_pass_aaa = 0
    failures = []

    for mode in ("light", "dark"):
        print("  " + "=" * 71)
        print(f"  {mode.upper()} MODE")
        print("  " + "=" * 71)
        print(f"  {'FOREGROUND':<26} {'BACKGROUND':<14} {'RATIO':<10} {'GRADE':<10}")
        print(f"  {'-' * 26} {'-' * 14} {'-' * 10} {'-' * 10}")

        spec = PAIRS_TO_TEST[mode]

        for fg_key in spec["foregrounds"]:
            if fg_key not in colors[mode]:
                continue
            fg_hex = colors[mode][fg_key]

            for bg_key in spec["backgrounds"]:
                if bg_key not in colors[mode]:
                    continue
                bg_hex = colors[mode][bg_key]

                ratio = contrast_ratio(fg_hex, bg_hex)
                grade_str = grade(ratio)
                total_pairs += 1
                if ratio >= AA_NORMAL:
                    total_pass_aa += 1
                if ratio >= AAA_NORMAL:
                    total_pass_aaa += 1
                if ratio < AA_NORMAL:
                    failures.append((mode, fg_key, fg_hex, bg_key, bg_hex, ratio))

                marker = "" if ratio >= AA_NORMAL else "  <-- FAIL"
                label = f"{fg_key} ({fg_hex})"
                print(f"  {label:<26} {bg_key:<14} {ratio:>6.2f}:1   {grade_str:<10}{marker}")
        print()

    print("  " + "=" * 71)
    print("  SUMMARY")
    print("  " + "=" * 71)
    print(f"  Total pairs tested:    {total_pairs}")
    print(f"  Pass AA  (>=4.5:1):    {total_pass_aa}/{total_pairs}  ({100 * total_pass_aa / total_pairs:.0f}%)")
    print(f"  Pass AAA (>=7.0:1):    {total_pass_aaa}/{total_pairs}  ({100 * total_pass_aaa / total_pairs:.0f}%)")
    print()

    if failures:
        print(f"  {len(failures)} FAILURE(S) -- these pairs do NOT meet AA:")
        for mode, fg_key, fg_hex, bg_key, bg_hex, ratio in failures:
            print(f"    [{mode}] {fg_key} ({fg_hex}) on {bg_key} ({bg_hex}): {ratio:.2f}:1")
        print()
        sys.exit(1)
    else:
        print("  All foreground/background pairs pass WCAG 2.1 AA. Compliance: 100%.")
        print()
        sys.exit(0)


if __name__ == "__main__":
    main()
