# ImgFeel.com — Permanent UI/UX & Tool Design Standards

> **CRITICAL RULE**: These UI/UX standards are **permanent, mandatory baseline requirements** for every single tool created, edited, or maintained in the ImgFeel codebase. No tool is complete until it satisfies all standards below.

---

## 1. Zero Touching & Spacing Standards
* **Labels & Inputs/Selectors**:
  * There must **ALWAYS** be clear spacing between any label, heading, or explanatory text and its input field, select dropdown, radio group, or option card.
  * Never allow label text to touch, stick to, or merge into its corresponding control box.
  * Standard: Use `margin-bottom: var(--space-2)` (or `8px-12px`) and `gap: 12px-16px`.
* **Container Padding & Text Separation**:
  * No text should ever touch, overlap, or stick to the edge/border of any card, pill, input box, or section container.
  * Cards, options, and pills must have generous inner padding (`padding: 14px 18px` or more) and defined minimum heights.

---

## 2. Action Buttons Standards
* **Visible Separation (No Touching Buttons)**:
  * Multiple action buttons (e.g. "Download", "Reset / Process Another", "Apply") must **ALWAYS** have an explicit, visible gap between them.
  * Standard: `display: flex; gap: 14px 16px; align-items: center;`.
  * Buttons must **NEVER** touch, overlap, or visually merge into each other.
* **Proportions & Typography**:
  * Buttons must be prominent and professional: `min-height: 48px` to `52px`, `padding: 12px 24px` to `14px 28px`.
  * Typography: `font-size: 15px - 16px; font-weight: 700;`.
  * Icon alignment: Provide `gap: 8px - 10px` between SVG icon and button text.
* **Mobile Responsiveness**:
  * On mobile screens (`< 640px`), action buttons must stack cleanly in a column with `width: 100%` and `gap: 12px - 14px`.

---

## 3. Section Separation & Visual Hierarchy
* **Distinct Section Margins**:
  * All content sections, Related Tools, and FAQ blocks must maintain substantial vertical separation from surrounding sections (`margin-top: var(--space-14)` to `var(--space-16)`).
* **Frequently Asked Questions (FAQ)**:
  * The FAQ heading must **NEVER** touch or crowd the section above it.
  * Standard FAQ container:
    ```css
    .faq-container {
      margin-top: var(--space-16);
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-12);
    }
    ```
  * FAQ items must use modern card styling with `border-radius: var(--radius-xl)`, generous padding (`18px 22px`), clean chevron indicators with smooth transitions, and distinct spacing between accordion items (`gap: 14px`).
* **Related Tools Grid**:
  * Related tools must be structured in a clean 6-card grid (`grid-template-columns: repeat(3, 1fr)` on desktop, 2-col on tablet, 1-col on mobile).
  * Cards must have rich icons, proper padding (`padding: var(--space-5)`), minimum height (`min-height: 160px`), accurate localized titles and descriptions, and smooth hover elevation.

---

## 4. Tables & Data Presentation
* **Responsive Scroll Wrapper**:
  * All tables must be enclosed in `.table-responsive` with `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
  * Never allow tables to cause viewport horizontal scrolling or overflow on mobile devices.
* **Padding & Readability**:
  * Generous cell padding: `padding: 16px 20px` to `18px 22px`.
  * Distinct header rows with `background: var(--color-surface-subtle)`, bold typography, and clean bottom borders.
  * Code/filename chips must have clean padding and background contrast.

---

## 5. Performance & Lightweight Architecture
* **Speed is Priority #1**:
  * Keep all tools 100% lightweight, client-side, and blazingly fast.
  * Do NOT add heavy external dependencies, massive npm libraries, unnecessary JS frameworks, or complex animation runtimes.
  * Leverage native browser APIs, HTML5 Canvas, Web Workers, CSS transitions, and SVG icons.

---

## 6. Mandatory Pre-Completion Verification Checklist
Before completing any tool or UI change, verify:
- [ ] No label or text is touching or sticking to an input, selector, or box border.
- [ ] All buttons have proper padding, height (`≥ 48px`), and visible gaps between adjacent buttons (`gap ≥ 14px`).
- [ ] FAQ section has top border/margin separation and polished accordion cards.
- [ ] Related Tools section is properly styled and spaced.
- [ ] Tables are responsive with adequate cell padding.
- [ ] Mobile view has zero horizontal overflow and clean stacked spacing.
- [ ] Translations across all 8 locales (`en`, `es`, `pt`, `fr`, `de`, `id`, `tr`, `it`) have 100% key parity (`node scripts/check-translations.mjs`).
- [ ] Build succeeds with 0 errors (`npm.cmd run build`).
