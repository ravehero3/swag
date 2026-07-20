---
name: Admin bento lbl-in-flex pattern
description: How to correctly use the lbl style constant inside flex-row wrappers in Admin.tsx bento cards
---

# Admin bento `lbl` inside flex wrappers

## The rule
The `lbl` style constant (defined inside the bento IIFE in BeatsTab) has `marginBottom: "10px"`. When `lbl` is used inside a flex-row wrapper that **also** specifies its own `marginBottom`, always zero out the lbl's marginBottom to prevent double spacing:

```tsx
// ✅ Correct — flex wrapper controls bottom spacing, lbl doesn't double it
<div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
  <div style={{ ...lbl, marginBottom: 0 }}>BPM</div>
  {badge}
</div>

// ❌ Wrong — lbl adds another 10px inside the flex item, total 20px gap
<div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
  <div style={lbl}>BPM</div>  {/* lbl also has marginBottom: "10px" */}
  {badge}
</div>
```

**Why:** In a flex row, a child's `marginBottom` still contributes to its own layout box size, creating visual asymmetry and excessive spacing above the input below the wrapper.

**Where it applies:** Any bento card in Admin.tsx where the primary card label (`lbl`) is co-located with a badge, button, or other sibling element inside a flex row header. Currently: BPM card, Tónina card, Preview Audio card.
