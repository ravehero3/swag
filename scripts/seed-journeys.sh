#!/bin/bash
# seed-journeys.sh
# Script to create all 8 customer journeys for VOODOO808
# Run this ONCE to initialize all journeys in draft status

set -e

API_URL="${1:-http://localhost:5000}"
ADMIN_COOKIE="${2:-}"

echo "🎵 VOODOO808 Journey Setup"
echo "================================"
echo "API URL: $API_URL"

# Helper function to create journey
create_journey() {
  local name="$1"
  local description="$2"
  local trigger_type="$3"
  local trigger_value="$4"

  echo "Creating: $name"
  
  curl -X POST "$API_URL/api/marketing/journeys" \
    -H "Content-Type: application/json" \
    -H "Cookie: $ADMIN_COOKIE" \
    -d "{
      \"name\": \"$name\",
      \"description\": \"$description\",
      \"trigger_type\": \"$trigger_type\",
      \"trigger_value\": \"$trigger_value\",
      \"status\": \"draft\"
    }" 2>/dev/null | jq .

  echo "✓ $name created"
}

echo ""
echo "📌 LEAD MAGNETS & ONBOARDING"
create_journey \
  "Free Beat Onboarding" \
  "Deliver free beat → Ask what they recorded → Offer 20% discount" \
  "freebie_downloaded" \
  "beat"

create_journey \
  "Free Sound Kit Onboarding" \
  "Deliver kit files → Share processing tip → Introduce premium kits" \
  "freebie_downloaded" \
  "kit"

echo ""
echo "💰 CONVERSION & RECOVERY"
create_journey \
  "Abandoned Checkout Recovery" \
  "Cart abandoned → Remind within 1-2h → Incentive after 24h" \
  "abandoned_checkout" \
  ""

create_journey \
  "Browse Abandonment Recovery" \
  "Viewed beat/kit but no add-to-cart → Remind with BPM/Key info" \
  "page_view_no_action" \
  "product_page"

echo ""
echo "🎓 NURTURE & RELATIONSHIP"
create_journey \
  "Rapper Growth & Tips Series" \
  "Weekly tips: Spotify playlisting, vocal mixing, beat drops" \
  "has_tag" \
  "role:rapper"

create_journey \
  "Producer Growth & Tutorials Series" \
  "Share video tutorials, melody breakdowns, beat selling tips" \
  "has_tag" \
  "role:producer"

echo ""
echo "🔁 POST-PURCHASE & RETENTION"
create_journey \
  "Post-Beat Purchase Upsell" \
  "Thank & deliver → Ask for finished track link → Upgrade offer" \
  "has_purchased" \
  "beat"

create_journey \
  "Kit Cross-Sell Series" \
  "Purchased drum kit → Offer matching melody/loop kit discount" \
  "has_purchased" \
  "kit"

echo ""
echo "✅ All 8 journeys created!"
echo ""
echo "Next steps:"
echo "1. Go to Admin → Marketing → Journeys"
echo "2. Click each journey to build the step sequences"
echo "3. Use the templates provided or create custom ones"
echo "4. Test with sample emails before activating"
