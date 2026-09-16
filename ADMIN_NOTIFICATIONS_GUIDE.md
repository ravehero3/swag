# 🔔 Admin Notifications System - Complete Guide

## Overview
Professional notification system for VOODOO808 admin panel that tracks purchases, likes, and comments in real-time.

## Features

### 1. Admin Header (Always Visible)
- **Location**: Top of all admin pages
- **Logo**: Centered "🎵 VOODOO808" branding
- **Notifications Bell**: Right side with unread counter badge
- **Profile Picture**: Admin avatar on far right
- **Auto-refresh**: Checks for new notifications every 30 seconds

### 2. Notification Dropdown
- **Trigger**: Click the bell icon in header
- **Shows**: Last 100 notifications
- **Auto-dismiss**: Closes when clicking outside
- **Auto-mark**: All notifications marked as read when opening dropdown
- **Quick action**: "Podrobnosti →" button links to full notifications page

### 3. Full Notifications Page
- **Tab**: "Oznámení" in admin navigation
- **Features**:
  - Filter by type (All, Purchases, Likes, Comments, System)
  - Pagination (50 items per page)
  - Individual delete buttons
  - Mark as read indicators
  - Full JSON data preview
  - Responsive dark UI

## Notification Types

### 🛒 Purchase Notifications
**Triggers**: When customer completes payment
**Shows**: 
- Customer email
- Product names (up to 2) + count of additional items
- Total price

**Example**: "🛒 Nová objednávka od user@gmail.com - Summer Beat, Trap Kit a 1 dalších • 599 Kč"

**Data**: orderId, email, itemCount, total

### ❤️ Like Notifications
**Triggers**: When user saves a beat to favorites (first time only)
**Shows**:
- Beat title
- User email

**Example**: "❤️ Někdo si oblíbil "Summer Vibes" - user@gmail.com"

**Data**: beatId, email

### 💬 Comment Notifications
**Triggers**: When user posts a comment on a beat
**Shows**:
- Beat title
- User email and comment preview (60 characters)

**Example**: "💬 Nový komentář na "Summer Vibes" - user@gmail.com: "Super beat! Love the vibes...""

**Data**: beatId, email, commentPreview

### ⚙️ System Notifications
**Triggers**: Future system events (e.g., database backups, errors)
**Shows**: Custom title and description

## API Endpoints

All endpoints require admin authentication (`credentials: include`).

### GET /api/admin/notifications
**Parameters**:
- `limit` (default: 100, max: 100)
- `offset` (default: 0)
- `unread_only` (true/false, default: false)

**Response**:
```json
[
  {
    "id": 1,
    "admin_id": 1,
    "type": "purchase",
    "title": "🛒 Nová objednávka od user@gmail.com",
    "description": "Summer Beat • 599 Kč",
    "related_data": { "orderId": 42, "email": "user@gmail.com", "itemCount": 1, "total": 599 },
    "is_read": false,
    "created_at": "2024-09-16T12:30:00Z",
    "updated_at": "2024-09-16T12:30:00Z"
  }
]
```

### GET /api/admin/notifications/count/unread
**Response**:
```json
{
  "unread_count": 3
}
```

### PATCH /api/admin/notifications/:id/read
**Response**: Updated notification object (is_read = true)

### PATCH /api/admin/notifications/read-all
**Response**:
```json
{
  "success": true
}
```

### DELETE /api/admin/notifications/:id
**Response**:
```json
{
  "success": true
}
```

## Database Schema

```sql
CREATE TABLE admin_notifications (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,              -- 'purchase', 'like', 'comment', 'system'
  title VARCHAR(255) NOT NULL,            -- Display title with emoji
  description TEXT,                       -- Formatted description
  related_data JSONB,                     -- Flexible data (orderId, email, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_admin_notifications_admin ON admin_notifications (admin_id);
CREATE INDEX idx_admin_notifications_read ON admin_notifications (is_read, created_at DESC);
CREATE INDEX idx_admin_notifications_created ON admin_notifications (created_at DESC);
```

## File Structure

```
client/src/
├── components/
│   └── AdminHeader.tsx          # Header with bell icon + dropdown
└── pages/
    └── Notifikace.tsx           # Full notifications history page

server/src/
├── lib/
│   └── notificationHelpers.ts   # Helper functions (notifyPurchase, etc.)
├── routes/
│   ├── notifications.ts         # API endpoints
│   ├── orders.ts                # ✓ Purchase notifications integrated
│   ├── saved.ts                 # ✓ Like notifications integrated
│   └── comments.ts              # ✓ Comment notifications integrated
└── db.ts                        # Database schema + admin_notifications table
```

## How It Works

### Purchase Flow
```
1. Customer completes payment
   ↓
2. Order status → 'completed'
   ↓
3. notifyOrderCompletedForMarketing() called
   ↓
4. notifyPurchase() helper creates notification
   ↓
5. INSERT INTO admin_notifications
   ↓
6. Admin sees unread count on bell icon
   ↓
7. Admin clicks bell to view dropdown
   ↓
8. Notifications auto-marked as read
```

### Like Flow
```
1. User clicks heart icon on beat
   ↓
2. POST /api/saved (first time only)
   ↓
3. Check if already saved (isNewSave flag)
   ↓
4. If new AND item_type = 'beat':
   ↓
5. notifyLike() creates notification
   ↓
6. INSERT INTO admin_notifications
```

### Comment Flow
```
1. User posts comment on beat
   ↓
2. POST /api/beats/:beatId/comments
   ↓
3. INSERT INTO beat_comments
   ↓
4. notifyComment() creates notification
   ↓
5. INSERT INTO admin_notifications
```

## Frontend Components

### AdminHeader.tsx Props
```typescript
interface AdminHeaderProps {
  adminEmail?: string;           // Display in profile tooltip
  adminProfileImage?: string;    // Avatar URL
  onNavigateToNotifications?: () => void; // Callback to nav to Notifikace tab
}
```

### Usage in Admin.tsx
```typescript
<AdminHeader 
  adminEmail={adminEmail}
  onNavigateToNotifications={() => setTab("notifikace")} 
/>
```

## Frontend Hooks

### Real-time Updates
- **Poll interval**: 30 seconds
- **Unread count updates** automatically
- **Dropdown polling**: Only when dropdown is open
- **Auto-read**: Marks all as read when viewing dropdown (counter disappears)

### State Management
```typescript
const [notifications, setNotifications] = useState<NotificationItem[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showDropdown, setShowDropdown] = useState(false);
const [loading, setLoading] = useState(false);
```

## Styling

### Colors
- **Background**: Dark (#0a0a0a)
- **Primary accent**: #E11D48 (red/pink)
- **Borders**: #222 and #1a1a1a
- **Text**: #fff, #eee, #999, #666
- **Hover states**: rgba(255,255,255,0.05-0.1)

### Responsive
- Desktop: Full header with dropdown
- Mobile: Compact notification icon in header

## Performance Optimizations

1. **Database Indexes**: 
   - (admin_id) for quick user lookup
   - (is_read, created_at DESC) for unread count queries
   - (created_at DESC) for pagination

2. **Polling Strategy**:
   - Only when component mounted
   - 30-second intervals (not too aggressive)
   - Configurable timeout per fetch

3. **Pagination**:
   - Limit 100 items per request
   - 50 items per page in full list view
   - Reduces payload size

4. **Notification Deduplication**:
   - Like notifications: Check if already saved
   - Purchase: Only on status completion
   - Comment: Always new (user can comment multiple times)

## Future Enhancements

1. **Real-time WebSocket Updates**
   - Replace polling with Socket.io
   - Instant notification delivery

2. **Notification Sound**
   - Optional audio alert on new notification

3. **Toast Notifications**
   - Non-intrusive popups on new event
   - Auto-dismiss after 5 seconds

4. **Notification Categories**
   - Group by week/month
   - Archive old notifications

5. **Email Digest**
   - Daily/weekly summary email
   - Configurable frequency

6. **Automated Cleanup**
   - Delete notifications >30 days old (cron job)
   - Archive to separate table

7. **Admin Preferences**
   - Toggle notification types on/off
   - Custom notification sounds
   - Email preferences

## Testing Checklist

- [ ] Buy a beat and verify purchase notification appears
- [ ] Like a beat and verify like notification appears
- [ ] Comment on a beat and verify comment notification appears
- [ ] Click bell icon and verify dropdown shows last 10
- [ ] Verify unread count badge updates
- [ ] Click "Podrobnosti →" and navigate to full page
- [ ] Filter notifications by type in full page
- [ ] Delete a notification
- [ ] Verify "mark as read" functionality
- [ ] Test pagination in full page
- [ ] Verify responsive design on mobile
- [ ] Check performance with many notifications (100+)

## Troubleshooting

### Bell icon shows wrong count
- Clear browser cache
- Manually refresh page
- Check admin_notifications table in DB

### Notifications not appearing
1. Check if admin user exists in database
2. Verify notification_helpers.ts is imported
3. Check browser console for errors
4. Verify API endpoints are responding

### Dropdown not opening
- Check if AdminHeader component is rendering
- Verify click handlers are attached
- Check z-index conflicts in CSS

### Slow notifications
- Check database query performance
- Run indexes on admin_notifications table
- Consider caching strategy if >1000 notifications

## API Integration Example

### JavaScript/Fetch
```javascript
// Get unread count
const response = await fetch('/api/admin/notifications/count/unread', {
  credentials: 'include'
});
const { unread_count } = await response.json();
console.log(`Unread: ${unread_count}`);

// Get all notifications
const res = await fetch('/api/admin/notifications?limit=50&offset=0', {
  credentials: 'include'
});
const notifications = await res.json();

// Mark all as read
await fetch('/api/admin/notifications/read-all', {
  method: 'PATCH',
  credentials: 'include'
});
```

### cURL
```bash
# Get unread count
curl -H "Cookie: session=..." https://voodoo808.com/api/admin/notifications/count/unread

# Get notifications
curl -H "Cookie: session=..." "https://voodoo808.com/api/admin/notifications?limit=100"

# Mark as read
curl -X PATCH -H "Cookie: session=..." https://voodoo808.com/api/admin/notifications/1/read
```

## Support

For issues or feature requests, please check:
1. Browser console for JavaScript errors
2. Server logs for backend errors
3. Database for notification records
4. API response codes (4xx = client error, 5xx = server error)

---

**Last Updated**: September 16, 2024
**Status**: Production Ready ✅
