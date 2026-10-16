-- ========================================================================
-- TRANSACTIONAL EMAIL JOURNEYS - Setup for order & purchase emails
-- ========================================================================
--
-- This migration creates all necessary transactional email templates and
-- journeys for automatic customer notifications:
--
-- 1. Order Confirmation Email (sent immediately after purchase)
-- 2. Order Shipped Notification (sent when order ships)
-- 3. Order Delivery Confirmation (sent on delivery)
-- 4. License/Key Delivery Email (for digital beats/kits)
-- 5. Invoice & Receipt (tax & payment details)
--
-- All emails use consistent branding with 180px logo in header.
-- ========================================================================

-- First, create transactional email templates if they don't exist
INSERT INTO marketing_templates (
  name,
  key,
  category,
  audience,
  journey_name,
  step_position,
  step_type,
  is_recommended,
  sort_order,
  subject,
  preheader,
  html_content,
  created_at,
  updated_at
) VALUES
  (
    'Order Confirmation Email',
    'transactional_order_confirmation',
    'transactional',
    'buyer',
    'Order Confirmation Journey',
    1,
    'email',
    true,
    1,
    'Objednávka #{order_id} potvrzena — Děkujeme!',
    'Tvoje objednávka byla úspěšně přijata. Zde jsou detaily...',
    '<html><body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <!-- HEADER WITH LOGO -->
        <div style="background:#000;padding:30px;text-align:center;border-bottom:2px solid #0B99FC">
          <img src="https://voodoo808.com/logo.svg" alt="VOODOO808" style="height:180px;width:auto;display:inline-block" />
        </div>
        
        <!-- MAIN CONTENT -->
        <div style="padding:40px;color:#333">
          <h1 style="margin:0 0 20px 0;font-size:24px;color:#000">Objednávka Potvrzena ✓</h1>
          
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#555">
            Ahoj {{first_name}},<br><br>
            Děkujeme za vaši objednávku! Vaše nákup byl úspěšně přijat a zpracován.
          </p>
          
          <!-- ORDER DETAILS -->
          <div style="background:#f9f9f9;padding:20px;border-radius:6px;margin:24px 0;border-left:4px solid #0B99FC">
            <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#000">Detaily Objednávky</h3>
            <table style="width:100%;font-size:13px">
              <tr>
                <td style="padding:6px 0;color:#666">Číslo objednávky:</td>
                <td style="padding:6px 0;color:#000;font-weight:700">{{order_id}}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Datum objednávky:</td>
                <td style="padding:6px 0;color:#000;font-weight:700">{{order_date}}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Celková suma:</td>
                <td style="padding:6px 0;color:#000;font-weight:700">{{order_total}} Kč</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Stavová:</td>
                <td style="padding:6px 0;color:#24e053;font-weight:700">✓ Potvrzena</td>
              </tr>
            </table>
          </div>
          
          <!-- ITEMS -->
          <div style="margin:24px 0">
            <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#000">Zakoupené Položky</h3>
            {{items_table}}
          </div>
          
          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr>
              <td>
                <a href="{{order_link}}" style="display:inline-block;background:#0B99FC;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px">
                  Zobrazit Objednávku
                </a>
              </td>
            </tr>
          </table>
          
          <!-- FOOTER -->
          <p style="margin:32px 0 0 0;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888">
            Máte otázky? <a href="mailto:support@voodoo808.com" style="color:#0B99FC;text-decoration:none">Kontaktujte nás</a>
          </p>
        </div>
      </div>
    </body></html>',
    NOW(),
    NOW()
  ),
  (
    'Digital License Delivery Email',
    'transactional_license_delivery',
    'transactional',
    'buyer',
    'License Delivery Journey',
    1,
    'email',
    true,
    2,
    'Tvůj Beat/Kit je připraven ke stažení',
    'Tvoje licence a stahovací odkaz jsou níže...',
    '<html><body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <!-- HEADER -->
        <div style="background:#000;padding:30px;text-align:center;border-bottom:2px solid #24e053">
          <img src="https://voodoo808.com/logo.svg" alt="VOODOO808" style="height:180px;width:auto;display:inline-block" />
        </div>
        
        <!-- CONTENT -->
        <div style="padding:40px;color:#333">
          <h1 style="margin:0 0 20px 0;font-size:24px;color:#000">🎁 Tvůj Beat Je Připraven</h1>
          
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#555">
            Ahoj {{first_name}},<br><br>
            Tvá licence pro {{product_name}} je aktivní. Stáhni si ji nyní!
          </p>
          
          <!-- LICENSE INFO -->
          <div style="background:#f0f9ff;padding:20px;border-radius:6px;margin:24px 0;border-left:4px solid #24e053">
            <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#000">Tvá Licence</h3>
            <table style="width:100%;font-size:13px">
              <tr>
                <td style="padding:6px 0;color:#666">Typ licence:</td>
                <td style="padding:6px 0;color:#000;font-weight:700">{{license_type}}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Platná do:</td>
                <td style="padding:6px 0;color:#000;font-weight:700">{{license_expiry}}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Licenční kód:</td>
                <td style="padding:6px 0;color:#0B99FC;font-weight:700;font-family:monospace">{{license_code}}</td>
              </tr>
            </table>
          </div>
          
          <!-- DOWNLOAD -->
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%">
            <tr>
              <td style="text-align:center">
                <a href="{{download_link}}" style="display:inline-block;background:#24e053;color:#000;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px">
                  ⬇ Stáhnout Soubor
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin:16px 0;padding:12px;background:#fff3cd;border-radius:4px;font-size:12px;color:#856404">
            ℹ️ Odkaz je platný 30 dní. Po vypršení si jej můžete znovu stáhnout z vašeho účtu.
          </p>
          
          <!-- FOOTER -->
          <p style="margin:32px 0 0 0;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888">
            Máte otázky? <a href="mailto:support@voodoo808.com" style="color:#0B99FC;text-decoration:none">Kontaktujte nás</a>
          </p>
        </div>
      </div>
    </body></html>',
    NOW(),
    NOW()
  ),
  (
    'Invoice & Receipt Email',
    'transactional_invoice',
    'transactional',
    'buyer',
    'Invoice Journey',
    1,
    'email',
    true,
    3,
    'Faktura a Příjmová {invoice_number}',
    'Zde je vaše podrobná faktura a kvitance...',
    '<html><body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <!-- HEADER -->
        <div style="background:#000;padding:30px;text-align:center;border-bottom:2px solid #0B99FC">
          <img src="https://voodoo808.com/logo.svg" alt="VOODOO808" style="height:180px;width:auto;display:inline-block" />
        </div>
        
        <!-- CONTENT -->
        <div style="padding:40px;color:#333">
          <h1 style="margin:0 0 8px 0;font-size:20px;color:#000">Faktura č. {{invoice_number}}</h1>
          <p style="margin:0 0 20px 0;font-size:12px;color:#888">Vystaveno: {{invoice_date}}</p>
          
          <!-- BILLING INFO -->
          <table style="width:100%;margin:24px 0">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:20px;border-right:1px solid #eee">
                <h4 style="margin:0 0 8px 0;font-size:12px;color:#666;text-transform:uppercase">Billed To:</h4>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#000">
                  {{customer_name}}<br>
                  {{customer_email}}<br>
                  {{customer_address}}
                </p>
              </td>
              <td style="width:50%;vertical-align:top;padding-left:20px">
                <h4 style="margin:0 0 8px 0;font-size:12px;color:#666;text-transform:uppercase">Invoice Details:</h4>
                <table style="width:100%;font-size:12px">
                  <tr>
                    <td style="color:#666">Invoice #:</td>
                    <td style="color:#000;font-weight:700">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="color:#666">Order #:</td>
                    <td style="color:#000;font-weight:700">{{order_id}}</td>
                  </tr>
                  <tr>
                    <td style="color:#666">Date:</td>
                    <td style="color:#000;font-weight:700">{{invoice_date}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- LINE ITEMS -->
          <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px">
            <tr style="background:#f0f0f0;border-top:1px solid #ddd;border-bottom:1px solid #ddd">
              <th style="padding:10px;text-align:left;color:#666;font-weight:700">Item</th>
              <th style="padding:10px;text-align:center;color:#666;font-weight:700">Qty</th>
              <th style="padding:10px;text-align:right;color:#666;font-weight:700">Unit Price</th>
              <th style="padding:10px;text-align:right;color:#666;font-weight:700">Amount</th>
            </tr>
            {{invoice_line_items}}
          </table>
          
          <!-- TOTALS -->
          <div style="text-align:right;margin:24px 0;font-size:13px">
            <table style="margin-left:auto;width:300px">
              <tr>
                <td style="padding:6px 0;color:#666">Subtotal:</td>
                <td style="padding:6px 0;text-align:right;color:#000;font-weight:700">{{subtotal}}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666">Tax ({{tax_rate}}%):</td>
                <td style="padding:6px 0;text-align:right;color:#000;font-weight:700">{{tax_amount}}</td>
              </tr>
              <tr style="border-top:2px solid #0B99FC">
                <td style="padding:10px 0;color:#000;font-weight:700">TOTAL:</td>
                <td style="padding:10px 0;text-align:right;color:#0B99FC;font-weight:700;font-size:16px">{{total_amount}}</td>
              </tr>
            </table>
          </div>
          
          <!-- PAYMENT INFO -->
          <div style="background:#f0f9ff;padding:16px;border-radius:4px;border-left:4px solid #0B99FC;font-size:12px;margin:24px 0;color:#555">
            <strong style="color:#0B99FC">Payment Method:</strong> {{payment_method}}<br>
            <strong style="color:#0B99FC">Transaction ID:</strong> {{transaction_id}}
          </div>
          
          <!-- FOOTER -->
          <p style="margin:32px 0 0 0;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center">
            Tato faktura je automaticky vygenerovaná. Uchovejte si ji pro své záznamy.<br>
            <a href="https://voodoo808.com/account" style="color:#0B99FC;text-decoration:none">Zobrazit v účtu</a> | 
            <a href="mailto:support@voodoo808.com" style="color:#0B99FC;text-decoration:none">Podpora</a>
          </p>
        </div>
      </div>
    </body></html>',
    NOW(),
    NOW()
  )
ON CONFLICT (key) DO NOTHING;

-- Now create the transactional journeys (if they don't exist)
INSERT INTO marketing_journeys (
  name,
  description,
  trigger_type,
  trigger_value,
  status,
  created_at,
  updated_at
) VALUES
  (
    'Order Confirmation Journey',
    'Automatic email sent immediately after purchase confirmation',
    'purchase',
    'order_created',
    'active',
    NOW(),
    NOW()
  ),
  (
    'License Delivery Journey',
    'Sends license/download link for digital products (beats, kits)',
    'purchase',
    'digital_license_ready',
    'active',
    NOW(),
    NOW()
  ),
  (
    'Invoice Journey',
    'Sends detailed invoice and tax receipt to customers',
    'purchase',
    'invoice_ready',
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Create journey steps for Order Confirmation (immediate send)
INSERT INTO marketing_journey_steps (
  journey_id,
  position,
  template_id,
  step_type,
  delay_hours,
  description,
  created_at,
  updated_at
) 
SELECT 
  j.id,
  1,
  t.id,
  'email',
  0,
  'Send order confirmation immediately after purchase',
  NOW(),
  NOW()
FROM marketing_journeys j
JOIN marketing_templates t ON t.key = 'transactional_order_confirmation'
WHERE j.name = 'Order Confirmation Journey'
AND NOT EXISTS (
  SELECT 1 FROM marketing_journey_steps mjs 
  WHERE mjs.journey_id = j.id AND mjs.position = 1
)
ON CONFLICT DO NOTHING;

-- Create journey steps for License Delivery (2 hour delay)
INSERT INTO marketing_journey_steps (
  journey_id,
  position,
  template_id,
  step_type,
  delay_hours,
  description,
  created_at,
  updated_at
) 
SELECT 
  j.id,
  1,
  t.id,
  'email',
  2,
  'Send license and download link after 2 hours',
  NOW(),
  NOW()
FROM marketing_journeys j
JOIN marketing_templates t ON t.key = 'transactional_license_delivery'
WHERE j.name = 'License Delivery Journey'
AND NOT EXISTS (
  SELECT 1 FROM marketing_journey_steps mjs 
  WHERE mjs.journey_id = j.id AND mjs.position = 1
)
ON CONFLICT DO NOTHING;

-- Create journey steps for Invoice (1 hour delay)
INSERT INTO marketing_journey_steps (
  journey_id,
  position,
  template_id,
  step_type,
  delay_hours,
  description,
  created_at,
  updated_at
) 
SELECT 
  j.id,
  1,
  t.id,
  'email',
  1,
  'Send invoice and receipt after 1 hour',
  NOW(),
  NOW()
FROM marketing_journeys j
JOIN marketing_templates t ON t.key = 'transactional_invoice'
WHERE j.name = 'Invoice Journey'
AND NOT EXISTS (
  SELECT 1 FROM marketing_journey_steps mjs 
  WHERE mjs.journey_id = j.id AND mjs.position = 1
)
ON CONFLICT DO NOTHING;
