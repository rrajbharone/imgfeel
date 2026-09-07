---
trigger: always_on
description: Mandatory UI/UX and Tool Design Standards for all ImgFeel tools
---

# Mandatory UI/UX & Tool Design Standards for ImgFeel.com

These rules are strictly enforced for every tool created or modified on ImgFeel.com:

1. **Labels and Controls Spacing**:
   - Always ensure distinct separation between labels/headings and their input, select, or option elements.
   - Text must never touch, stick to, or merge with control borders.

2. **Buttons Layout & Spacing**:
   - Every button must have generous padding, balanced height (`min-height: 48px - 52px`), and clear font hierarchy.
   - Adjacent buttons must ALWAYS have a minimum gap (`gap: 14px - 16px`). Never allow buttons to touch each other.
   - On mobile, stack action buttons vertically with full width.

3. **Section Separation & FAQ Styling**:
   - Maintain generous vertical margins between major sections (`margin-top: var(--space-14) - var(--space-16)`).
   - FAQ heading must never touch or crowd the section above it; always include top border separation (`border-top: 1px solid var(--color-border)` and `padding-top: var(--space-12)`).
   - FAQ cards must use modern rounded borders (`border-radius: var(--radius-xl)`), smooth chevron transitions, and readable typography.

4. **Related Tools Section**:
   - Structured 6-card grid with rich icons, minimum height, proper padding, and accurate localized copy across all 8 locales.

5. **Tables**:
   - Must always be wrapped in `.table-responsive` with clean cell padding (`16px 20px - 18px 22px`) and zero mobile horizontal overflow.

6. **Performance & Lightweight Client-Side Execution**:
   - Website speed is first priority. Never add heavy libraries or unnecessary dependencies.

7. **Verification**:
   - Every tool must be checked against this checklist and verified with `node scripts/check-translations.mjs` and `npm.cmd run build` before considering the work complete.
