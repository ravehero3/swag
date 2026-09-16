# 📋 PLAN: AUTO-CREATE & MANAGE EMAIL TEMPLATES PROFESSIONALLY

## THE PROBLEM

Currently when you edit a journey step:
1. Many steps show "No template" (empty)
2. When you click "Vyberte šablonu" dropdown, you see only templates that already exist
3. There's no organized way to know which template should be used where
4. Creating templates is manual - no guidance on which one fits which step

## THE SOLUTION - 3 PART PROFESSIONAL SYSTEM

### PART 1: AUTO-POPULATE TEMPLATES ON FIRST RUN
When Admin loads, if templates don't exist yet, auto-create them from our 12 templates.

**Implementation:**
- Create seed function that checks: "Do our 12 templates exist?"
- If NO → Auto-create all 12 with proper names and keys
- If YES → Do nothing (don't duplicate)
- This runs once at startup

**Result:** User opens Admin → All templates already there → Ready to assign

### PART 2: TEMPLATE CATEGORIZATION & SMART DROPDOWN
Instead of a flat list of templates, organize them by journey + step type.

**Current State:**
```
Vyberte šablonu...
├─ Template 1
├─ Template 2
├─ Template 3
```

**New State (Smart):**
```
Vyberte šablonu...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 DOPORUČENO PRO TENTO KROK:
├─ Free Beat Onboarding - Day 3 ⭐
├─ Free Beat Onboarding - Day 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 ONBOARDING:
├─ Free Beat Onboarding - Day 3
├─ Free Kit Onboarding - Day 3

🛒 ABANDONED CHECKOUT:
├─ Abandoned Checkout - Reminder
├─ Abandoned Checkout - Scarcity

🔄 CROSS-SELL & UPSELL:
├─ Post-Beat Purchase - Day 3
├─ Post-Beat Purchase - Day 5
├─ Kit Cross-Sell - Day 2

📚 NURTURE & EDUCATION:
├─ Rapper Tips - Spotify
├─ Producer Tips - Sound Design

🔙 BROWSE RECOVERY:
├─ Browse Recovery - Day 1
├─ Browse Recovery - Day 3
```

### PART 3: AUTO-ASSIGN RECOMMENDED TEMPLATES
When you create a journey step, suggest the correct template automatically.

**How it works:**
1. You add a step to "Free Beat Onboarding" journey → "Email" type
2. System detects: "This is Free Beat Onboarding journey, this is step position 1"
3. Shows recommendation: "Pro tento krok se doporučuje: Free Beat Onboarding - Day 3"
4. One-click assign button: "Usar"
5. Template auto-selected

---

## TECHNICAL IMPLEMENTATION PLAN

### STEP 1: Database Schema Enhancement

Add metadata to templates table:

```sql
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS journey_name VARCHAR(255);
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS step_position INTEGER;
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS step_type VARCHAR(50);
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS sort_order INTEGER;
```

**Example data:**
```
Template: "Free Beat Onboarding - Day 3"
├─ category: "onboarding"
├─ journey_name: "Free Beat Onboarding"
├─ step_position: 3 (Day 3)
├─ step_type: "email"
├─ is_recommended: true
└─ sort_order: 1

Template: "Abandoned Checkout - Reminder"
├─ category: "recovery"
├─ journey_name: "Abandoned Checkout Recovery"
├─ step_position: 1 (1-2 hours after)
├─ step_type: "email"
├─ is_recommended: true
└─ sort_order: 5
```

### STEP 2: Auto-Seed Templates on First Load

Create seed function in `server/src/db.ts`:

```typescript
async function seedMarketingTemplates() {
  // Check if templates already exist
  const existing = await pool.query(
    "SELECT COUNT(*) FROM marketing_templates WHERE key LIKE 'free_beat%' OR key LIKE 'abandoned_checkout%'"
  );
  
  if (existing.rows[0].count > 0) {
    console.log("Templates already seeded, skipping...");
    return;
  }
  
  // Create all 12 templates from our casual templates
  const templates = [
    {
      name: "Free Beat Onboarding - Day 3",
      key: "free_beat_onboarding_day3",
      category: "onboarding",
      journey_name: "Free Beat Onboarding",
      step_position: 3,
      subject: "Pojďme makat (20% sleva na vaši první exkluzivu)",
      preheader: "Stáhli jste si free beat. Teď je čas udělat oficiální věc.",
      html_content: "[HTML from EMAIL_TEMPLATES_12_CASUAL_FINAL.md]",
      is_recommended: true,
      sort_order: 1
    },
    // ... repeat for all 12 templates
  ];
  
  for (const tpl of templates) {
    await pool.query(
      `INSERT INTO marketing_templates 
       (name, key, subject, preheader, html_content, category, journey_name, step_position, is_recommended, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [tpl.name, tpl.key, tpl.subject, tpl.preheader, tpl.html_content, tpl.category, tpl.journey_name, tpl.step_position, tpl.is_recommended, tpl.sort_order]
    );
  }
  
  console.log("✅ 12 marketing templates seeded successfully");
}
```

Call this in the initialization routine (already called on startup).

### STEP 3: Smart Template Recommendation Endpoint

New API route: `GET /api/marketing/templates/recommend`

```typescript
router.get("/templates/recommend", requireAdmin, async (req: Request, res: Response) => {
  const { journeyId, stepPosition, stepType } = req.query;
  
  if (!journeyId || !stepType) {
    return res.json([]);
  }
  
  // Get journey name
  const journey = await pool.query(
    "SELECT name FROM marketing_journeys WHERE id = $1",
    [journeyId]
  );
  
  if (!journey.rows[0]) {
    return res.json([]);
  }
  
  const journeyName = journey.rows[0].name;
  
  // Find matching templates by journey name
  const result = await pool.query(
    `SELECT * FROM marketing_templates 
     WHERE journey_name = $1 AND step_type = $2 AND is_recommended = true
     ORDER BY step_position ASC, sort_order ASC`,
    [journeyName, stepType]
  );
  
  res.json(result.rows);
});
```

### STEP 4: Update Template Dropdown in Admin UI

Modify the template select dropdown to:
1. Load recommended templates first
2. Group by category
3. Show all templates as fallback

```typescript
// In the step editing form
{stepForm.stepType === "email" && (
  <div style={{ marginBottom: "12px" }}>
    <label>Šablona</label>
    <select value={stepForm.templateId} onChange={...}>
      <option value="">Vyberte šablonu…</option>
      
      {/* RECOMMENDED SECTION */}
      {recommendedTemplates.length > 0 && (
        <optgroup label="📌 DOPORUČENO PRO TENTO KROK">
          {recommendedTemplates.map(t => (
            <option key={t.id} value={t.id}>
              ⭐ {t.name}
            </option>
          ))}
        </optgroup>
      )}
      
      {/* GROUPED BY CATEGORY */}
      {['onboarding', 'recovery', 'nurture', 'upsell'].map(category => (
        <optgroup key={category} label={getCategoryLabel(category)}>
          {templates
            .filter(t => t.category === category)
            .map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  </div>
)}
```

### STEP 5: One-Click Template Assignment Button

When editing a step, show a button next to template dropdown:

```typescript
<div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
  <div style={{ flex: 1 }}>
    <label>Šablona</label>
    <select value={stepForm.templateId} onChange={...} style={stepInputStyle}>
      {/* ... dropdown options ... */}
    </select>
  </div>
  
  {/* NEW: Quick assign button */}
  {recommendedTemplate && stepForm.templateId !== recommendedTemplate.id && (
    <button
      onClick={() => setStepForm({ ...stepForm, templateId: recommendedTemplate.id })}
      style={{
        background: "#0B99FC",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap"
      }}
      title="Use recommended template for this step"
    >
      💡 Usar doporučenou
    </button>
  )}
</div>
```

---

## WHAT THIS ACHIEVES

### Before (Current State)
```
Admin opens Journeys → Many steps show "No template"
→ User clicks "Upravit krok"
→ Dropdown shows ALL templates (confusing)
→ User has to guess which one to use
→ Result: Many wrong/missing templates
```

### After (New Professional System)
```
Admin opens Journeys → Templates auto-created on first run
→ Some steps already have templates assigned (auto-recommended)
→ User clicks "Upravit krok"
→ Dropdown shows:
   ├─ 📌 RECOMMENDED FOR THIS STEP (highlighted)
   ├─ Grouped by category
   └─ One-click "Use recommended" button
→ Result: All steps have proper templates, no confusion
```

---

## IMPLEMENTATION CHECKLIST

### Database Changes
- [ ] Add new columns to marketing_templates table
  - category
  - journey_name
  - step_position
  - step_type
  - is_recommended
  - sort_order

### Backend (Node.js)
- [ ] Create `seedMarketingTemplates()` function in db.ts
- [ ] Add all 12 templates with metadata
- [ ] Create `GET /api/marketing/templates/recommend` endpoint
- [ ] Update `GET /api/marketing/templates` to return ordered + categorized

### Frontend (Admin.tsx)
- [ ] Update template dropdown to show optgroups by category
- [ ] Add recommended section at top
- [ ] Fetch recommended templates when step is opened
- [ ] Add "Use Recommended" quick-assign button
- [ ] Show star/highlight for recommended templates

### Testing
- [ ] Verify templates seed on first run
- [ ] Verify recommended templates show for each step
- [ ] Verify dropdown grouping works
- [ ] Verify one-click assign works
- [ ] Test that all 8 journeys automatically get matching templates

---

## CATEGORY LABELS (Frontend)

```typescript
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    onboarding: "📌 ONBOARDING - Vytvoření prvního nákupu",
    recovery: "🛒 RECOVERY - Záchranu opuštěných košíků",
    nurture: "📚 NURTURE - Vzdělávání a vztahy",
    upsell: "🔄 UPSELL & CROSS-SELL - Zvýšení hodnoty",
    browse_recovery: "🔙 BROWSE RECOVERY - Záchranu procházejících"
  };
  return labels[category] || category;
};
```

---

## EXPECTED RESULT

When implemented:
1. ✅ All 12 templates auto-created on first run
2. ✅ No more "No template" errors
3. ✅ Smart dropdown with recommendations
4. ✅ Users can't make mistakes (recommended template is obvious)
5. ✅ Professional, organized system
6. ✅ One-click assignment for recommended templates

---

## MIGRATION PATH

**For existing journeys with missing templates:**
- Run a migration script that:
  1. Loops through all journey steps
  2. For each step, finds matching recommended template
  3. Auto-assigns it
  4. Logs what was assigned
  5. Shows summary: "Assigned 23 templates to 8 journeys"

---

## READY TO IMPLEMENT?

This approach is:
- ✅ Professional
- ✅ User-friendly
- ✅ Zero-confusion
- ✅ Scalable for future templates
- ✅ Follows best practices

Should I proceed with implementation? I'll:
1. Add database columns
2. Create seed function with all 12 templates
3. Create recommendation API
4. Update Admin UI dropdown + add one-click button
5. Test everything works

This will take ~2-3 hours total.

Want me to start?
