#!/bin/bash
#
# TasteBud Design System Audit
#
# Scans the mobile app source for usage of design tokens defined in
# mobile/src/theme/colors.ts and reports per-file counts of:
#   - Color token references (theme.*)
#   - Shadow token references (Shadows.*)
#   - Spacing token references (Spacing.*)
#   - Typography token references (Typography.*)
#   - Raw hex code literals (offenders that bypass the design system)
#
# Usage:
#   bash tools/audit-design-system.sh
#
# Run from the project root.

set -e

SRC_DIR="mobile/src"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: $SRC_DIR not found. Run this script from the project root."
  exit 1
fi

cd "$SRC_DIR"

count_pattern() {
  local pattern="$1"
  local file="$2"
  if [ ! -f "$file" ]; then
    echo 0
    return
  fi
  grep -cE "$pattern" "$file" 2>/dev/null | tr -d '[:space:]' || echo 0
}

count_colors()      { count_pattern 'theme\.(primary|primaryLight|primaryDark|success|warning|danger|info|todayBadgeBg|todayBadgeText|todayLabelText|background|card|elevated|textPrimary|textSecondary|textTertiary|border|divider|glassTint|glassBlur)' "$1"; }
count_shadows()     { count_pattern 'Shadows\.(light|dark)\.(small|medium|large)' "$1"; }
count_spacing()     { count_pattern 'Spacing\.(xs|sm|md|lg|xl|xxl)' "$1"; }
count_typography()  { count_pattern 'Typography\.(title1|title2|title3|body|bodyBold|caption|footnote)' "$1"; }
count_hex()         { count_pattern '#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}' "$1"; }

print_header() {
  printf "\n  %-50s %8s %8s %8s %8s %8s\n" "FILE" "COLORS" "SHADOWS" "SPACING" "TYPOGRAPHY" "RAW_HEX"
  printf "  %-50s %8s %8s %8s %8s %8s\n" "----" "------" "-------" "-------" "----------" "-------"
}

print_file_stats() {
  local file="$1"
  [ -f "$file" ] || return
  local short
  short=$(echo "$file" | sed 's|^\./||')

  local c s sp t h
  c=$(count_colors "$file")
  s=$(count_shadows "$file")
  sp=$(count_spacing "$file")
  t=$(count_typography "$file")
  h=$(count_hex "$file")

  printf "  %-50s %8s %8s %8s %8s %8s\n" "$short" "$c" "$s" "$sp" "$t" "$h"
}

print_section() {
  local title="$1"
  shift
  echo ""
  echo "==============================================================================="
  echo "  $title"
  echo "==============================================================================="
  print_header
  for f in "$@"; do
    print_file_stats "$f"
  done
}

aggregate_section() {
  local title="$1"
  shift
  local total_colors=0
  local total_shadows=0
  local total_spacing=0
  local total_typography=0
  local total_hex=0
  local file_count=0

  for f in "$@"; do
    [ -f "$f" ] || continue
    file_count=$((file_count + 1))
    local c s sp t h
    c=$(count_colors "$f")
    s=$(count_shadows "$f")
    sp=$(count_spacing "$f")
    t=$(count_typography "$f")
    h=$(count_hex "$f")
    total_colors=$((total_colors + c))
    total_shadows=$((total_shadows + s))
    total_spacing=$((total_spacing + sp))
    total_typography=$((total_typography + t))
    total_hex=$((total_hex + h))
  done

  local label="$title ($file_count files)"
  printf "  %-50s %8s %8s %8s %8s %8s\n" "$label" "$total_colors" "$total_shadows" "$total_spacing" "$total_typography" "$total_hex"
}

echo ""
echo "==============================================================================="
echo "  TASTEBUD DESIGN SYSTEM AUDIT"
echo "==============================================================================="
echo "  Source: mobile/src"
echo "  Date:   $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "  This report shows how many references each file makes to design tokens"
echo "  defined in mobile/src/theme/colors.ts, alongside the count of raw hex code"
echo "  literals (which indicate places that bypass the design system)."
echo ""
echo "  Healthy files: high token counts, low or zero raw hex counts."
echo "  Offender files: low token counts, high raw hex counts."

print_section "ONBOARDING SCREENS" screens/onboarding/*.tsx
print_section "MAIN APP SCREENS" screens/home/*.tsx
print_section "COMPONENTS: CARDS" components/cards/*.tsx
print_section "COMPONENTS: FORMS" components/forms/*.tsx
print_section "COMPONENTS: MODALS" components/modals/*.tsx
print_section "COMPONENTS: MODULES" components/modules/*.tsx
print_section "COMPONENTS: TABS" components/tabs/*.tsx
print_section "COMPONENTS: SECTION" components/section/*.tsx

echo ""
echo "==============================================================================="
echo "  PROJECT TOTALS BY SECTION"
echo "==============================================================================="
print_header
aggregate_section "Onboarding screens" screens/onboarding/*.tsx
aggregate_section "Main app screens" screens/home/*.tsx
aggregate_section "Card components" components/cards/*.tsx
aggregate_section "Form components" components/forms/*.tsx
aggregate_section "Modal components" components/modals/*.tsx
aggregate_section "Module components" components/modules/*.tsx
aggregate_section "Tab components" components/tabs/*.tsx
aggregate_section "Section components" components/section/*.tsx

echo ""
echo "==============================================================================="
echo "  AUDIT COMPLETE"
echo "==============================================================================="
echo ""
