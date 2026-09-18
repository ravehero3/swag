# How to Seed Email Templates

The templates need to be manually seeded into the database. There are two ways:

## Method 1: Via API Endpoint (Easiest)

Call this endpoint in your browser or with curl:

```
POST http://localhost:5000/api/marketing/templates/admin/seed
```

Headers:
```
Authorization: Bearer [your-auth-token]
```

This will seed all 18 templates with their audience values.

## Method 2: Direct Database Query

If templates table is empty, run in database client:

```sql
-- Check current count
SELECT COUNT(*) FROM marketing_templates;

-- If empty (0), the auto-seed should have run
-- If it didn't, you can manually call the seed endpoint above
```

## Expected Result

After seeding, you should have:
- 2 Rappeři templates
- 3 Produceři templates
- 13 Obecné templates

Total: 18 templates

## Troubleshooting

If still no templates show:

1. Check Admin Panel → open browser DevTools → Network tab
2. Look for request to `/api/marketing/templates`
3. Check the response - should be array of 18 templates
4. If empty array, templates didn't seed

Then call the seed endpoint from Method 1 above.
