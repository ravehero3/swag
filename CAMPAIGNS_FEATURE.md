# 🎯 KAMPANĚ - Professional Email Campaign Manager

## Overview
Full-featured email campaign management system for VOODOO808, allowing admin to create, manage, test, and send targeted email campaigns to two distinct customer segments (buyers and free-download customers) with professional UI/UX matching the journey builder.

---

## Features Implemented

### 1. **Campaign List View**
- Grid/card layout showing all campaigns
- Quick status indicators (DRAFT / TEST / LIVE)
- Audience type badges (💳 Kupující vs 🎁 Zdarma)
- Email count per campaign
- Create new campaign button with modal dialog
- Professional hover effects and transitions

### 2. **Campaign Sequence Builder**
**Interactive Visual Flow Canvas** (inspired by Journey tab):
- Drag-and-drop enabled canvas with Ctrl+right-click support
- Zoom controls (+/- buttons, percentage display)
- Pan support for large sequences
- Grid background pattern
- Connection lines between email nodes

**Email Nodes Display:**
- Start node: shows selected audience (Kupující / Zdarma stahovači) with count
- Email nodes: show email position, template name, delay hours, scheduled date/time
- End node: "Kampaň Skončena" exit point
- Smooth transitions and hover states
- Selection highlighting with scale animation

**Hover Actions on Nodes:**
- ✏️ Edit button - opens email editor
- 📧 Send test - sends test email to specified address
- 🗑️ Delete - removes email from sequence with confirmation

### 3. **Email Preview Component**
**Inline Preview Below Sequence:**
- Loads directly below the sequence builder (NOT separate page)
- Shows email position, template name, delay/scheduling info
- iframe-based HTML preview with full email rendering
- Copy HTML button (with success feedback)
- Close button returns to sequence view
- Loading state and error handling
- Professional styling with dark theme

### 4. **Audience Selector**
**Two Distinct Customer Groups:**
1. **💳 Kupující zákazníci** (~250+ people)
   - People who have purchased from you
   - Best for: upsells, product updates, exclusive deals
   
2. **🎁 Zdarma stahovači** (~5000+ people)
   - People who downloaded free products
   - Best for: onboarding, introduction sequences, conversion

**UI Features:**
- Card-based selection interface
- Icons and descriptions for each audience
- Count display per audience
- Visual selection indicator (checkmark + highlight)
- Disabled state during operations

### 5. **TEST/LIVE Mode Toggle**
**Safety-First Email Sending:**
- Checkbox toggle: "TEST MODE"
- When enabled: emails only sent to test email address
- When disabled: emails sent to entire audience
- Visual warning banner in TEST MODE
- Clear indication in button state ("SPUSTIT TEST" vs "SPUSTIT LIVE")

**Test Email Input:**
- Persistent test email field (top of builder)
- Validation before sending
- Real-time test sending with "Odesílám..." feedback

### 6. **Date/Time Scheduling**
**Prague Timezone Support:**
- Date picker: select calendar date
- Time picker: select time (HH:MM format)
- Default 09:00 (9 AM Prague time)
- Modal scheduler for each email
- Scheduled dates visible on email nodes
- Schedule override option (immediate vs. scheduled)

### 7. **Professional UI/UX**
**Design System Alignment:**
- Dark monochrome color scheme (#000, #0f0f0f, #111, #222, etc.)
- Consistent typography and spacing
- Blue accent color: #0B99FC
- Green for live/active: #24e053
- Orange for test/caution: #f9a825
- Red for danger: #ff5252

**Interactive Effects:**
- Smooth transitions on all state changes
- Hover effects on buttons and cards
- Selection highlighting with shadow
- Fade-in animations for overlays
- Loading states with spinners/ellipsis
- Success/error message feedback

**Layout:**
- Left sidebar: campaign info + controls (300px)
- Main area: sequence builder (flex grow)
- Responsive to resize
- Proper padding (16-20px) throughout
- Grid gaps (12-16px) between elements

---

## Components

### 1. `CampaignSequenceBuilder.tsx`
- Canvas-based flow visualization
- Zoom and pan controls
- SVG connectors between nodes
- Click-to-select email nodes
- Hover action buttons (edit, test, delete)
- Test email input bar
- Keyboard support (Ctrl/Cmd for pan mode)

### 2. `CampaignEmailPreview.tsx`
- Overlay preview panel
- iframe for HTML rendering
- Copy HTML functionality
- Close button
- Error state handling
- Loading spinner

### 3. `CampaignAudienceSelector.tsx`
- Two-option card layout
- Icon display per audience
- Count statistics
- Selection indicator
- Hover states and transitions
- Disabled state support

### 4. `Campaigns.tsx` (Page)
- List view with campaign grid
- Campaign creation modal
- Campaign detail view with sidebar
- Integration of all sub-components
- State management for campaigns, emails, templates
- Navigation between list/detail views

---

## Backend API Endpoints

### Campaign Emails
```
POST   /api/marketing/campaigns/:campaignId/emails
GET    /api/marketing/campaigns/:campaignId/emails
PATCH  /api/marketing/campaigns/:campaignId/emails/:emailId
DELETE /api/marketing/campaigns/:campaignId/emails/:emailId
POST   /api/marketing/campaigns/:campaignId/emails/:emailId/send-test
GET    /api/marketing/campaigns/:campaignId/audience-stats
```

### Existing Campaign Endpoints
```
GET    /api/marketing/campaigns
POST   /api/marketing/campaigns
PATCH  /api/marketing/campaigns/:id
GET    /api/marketing/campaigns/:id/preview
POST   /api/marketing/campaigns/:id/send-test
POST   /api/marketing/campaigns/:id/send
GET    /api/marketing/campaigns/:id/stats
```

---

## Database Schema (Required Tables)

### `marketing_campaigns`
```sql
CREATE TABLE marketing_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  audience TEXT NOT NULL, -- 'buyers' or 'free_downloads'
  status TEXT NOT NULL, -- 'draft', 'test', 'live', 'scheduled', 'sent'
  subject VARCHAR,
  preheader VARCHAR,
  template_id INTEGER REFERENCES marketing_templates(id),
  blocks JSONB,
  html_content TEXT,
  header_options JSONB,
  segment_rules JSONB,
  scheduled_at TIMESTAMP,
  recipient_count INTEGER,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `campaign_emails` (New)
```sql
CREATE TABLE campaign_emails (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES marketing_templates(id),
  position INTEGER NOT NULL, -- order in sequence
  delay_hours INTEGER DEFAULT 0, -- hours after previous email
  send_date DATE, -- for scheduled sends (Prague timezone)
  send_time TIME, -- for scheduled sends (Prague timezone)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Usage Flow

### 1. **Create Campaign**
1. Click "Nová kampaň" button
2. Enter campaign name
3. Select audience (Kupující or Zdarma stahovači)
4. Click "Vytvořit"

### 2. **Build Sequence**
1. Campaign detail view opens with empty sequence
2. Click blue "+" button to add first email
3. Select template from modal/dropdown
4. Optional: set delay hours (e.g., 24h after previous)
5. Click email node to select & preview
6. Repeat: add more emails in sequence

### 3. **Preview & Test**
1. Click email node to select it
2. Email preview loads below sequence
3. Scroll down to view full HTML preview
4. Enter test email address
5. Click "Poslat test" button
6. Email sent to test address only (TEST MODE enabled)

### 4. **Schedule (Optional)**
1. Right-click email node or click edit icon
2. Set date and time for email send (Prague timezone)
3. Scheduled dates visible on node

### 5. **Go Live**
1. Uncheck "TEST MODE" toggle
2. Click "SPUSTIT LIVE" button
3. Confirm (modal asks for recipient count confirmation)
4. Email campaign sends to all audience members

---

## File Structure

```
client/src/
├── components/
│   ├── CampaignSequenceBuilder.tsx      (15.8 KB)
│   ├── CampaignEmailPreview.tsx          (6.6 KB)
│   └── CampaignAudienceSelector.tsx      (5.7 KB)
└── pages/
    └── Campaigns.tsx                     (25.3 KB)

server/src/routes/
└── campaignEmails.ts                     (8.1 KB)
```

---

## Styling Specifications

### Colors
- **Background**: #000, #0a0a0a, #0f0f0f, #111, #1a1a1a
- **Text**: #fff, #aaa, #888, #666, #555
- **Accent**: #0B99FC (blue)
- **Success**: #24e053 (green)
- **Warning**: #f9a825 (orange)
- **Error**: #ff5252 (red)
- **Borders**: #333, #222

### Typography
- **Headers**: 700 weight, 16-28px size
- **Body**: 400-600 weight, 11-14px size
- **Monospace**: For code/HTML display

### Spacing
- **Padding**: 16-32px (sections), 8-12px (components)
- **Gaps**: 12-16px between items
- **Margins**: 0-24px

### Transitions
- **Duration**: 150ms ease-in-out (standard)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Properties**: background, color, border-color, transform, opacity

---

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

## Performance Notes
- Canvas rendering: efficient SVG with pointer-events: none
- Large email lists: implemented pagination in preview
- Template loading: lazy-loaded on demand
- State management: React hooks (useState, useEffect)
- No external dependencies beyond existing (React, Ant Design)

---

## Future Enhancements
1. Drag-to-reorder emails in sequence
2. Email AB testing (variant A/B selection)
3. Conditional branching (if opened, if clicked, etc.)
4. Advanced analytics dashboard
5. Template usage statistics
6. Export campaign data as JSON/CSV
7. Email send history and bounce management
8. Subscriber segmentation by behavior
9. AI-powered subject line suggestions
10. Integration with external ESP (Klaviyo, Drip, etc.)

---

## Testing Checklist
- ✅ Create campaign with different audiences
- ✅ Add/remove emails from sequence
- ✅ Template selection and preview
- ✅ Test mode toggle and behavior
- ✅ Send test email functionality
- ✅ Schedule email sends with dates/times
- ✅ Canvas zoom and pan controls
- ✅ Responsive design on different screen sizes
- ✅ Error handling and validation
- ✅ Loading states and transitions
- ✅ Dark mode styling consistency

---

## Deployment
1. Commit code: `git add -A && git commit -m "..."`
2. Push to main: `git push origin main`
3. Backend rebuilds automatically
4. Frontend bundled with Vite
5. Deployed to VPS via Docker

---

**Built with:** React + TypeScript + Ant Design + Lucide Icons + CSS-in-JS styling

**Status:** ✅ Complete and production-ready
