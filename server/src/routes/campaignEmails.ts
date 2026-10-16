// ── Campaign emails endpoints ────────────────────────────────────────────────
// These endpoints should be added to server/src/routes/marketing.ts
// or in a separate router file and mounted in the main marketing router

// GET /api/marketing/campaigns/:campaignId/emails
// List all emails in a campaign
export async function getCampaignEmails(req: any, res: any, pool: any) {
  try {
    const { campaignId } = req.params;
    const result = await pool.query(
      `SELECT ce.*, mt.name as template_name
       FROM campaign_emails ce
       LEFT JOIN marketing_templates mt ON mt.id = ce.template_id
       WHERE ce.campaign_id = $1
       ORDER BY ce.position ASC`,
      [campaignId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání e-mailů kampaně" });
  }
}

// POST /api/marketing/campaigns/:campaignId/emails
// Add new email to campaign
export async function addEmailToCampaign(req: any, res: any, pool: any) {
  try {
    const { campaignId } = req.params;
    const { templateId, delayHours, position, sendDate, sendTime } = req.body;
    
    const result = await pool.query(
      `INSERT INTO campaign_emails 
       (campaign_id, template_id, delay_hours, position, send_date, send_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        campaignId,
        templateId || null,
        delayHours || 0,
        position || 1,
        sendDate || null,
        sendTime || null,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error adding email to campaign:", error);
    res.status(500).json({ error: "Chyba při přidávání e-mailu do kampaně" });
  }
}

// PATCH /api/marketing/campaigns/:campaignId/emails/:emailId
// Update email in campaign
export async function updateCampaignEmail(req: any, res: any, pool: any) {
  try {
    const { campaignId, emailId } = req.params;
    const { templateId, delayHours, position, sendDate, sendTime } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    
    if (templateId !== undefined) { updates.push(`template_id = $${i++}`); params.push(templateId); }
    if (delayHours !== undefined) { updates.push(`delay_hours = $${i++}`); params.push(delayHours); }
    if (position !== undefined) { updates.push(`position = $${i++}`); params.push(position); }
    if (sendDate !== undefined) { updates.push(`send_date = $${i++}`); params.push(sendDate); }
    if (sendTime !== undefined) { updates.push(`send_time = $${i++}`); params.push(sendTime); }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(emailId);
    
    const result = await pool.query(
      `UPDATE campaign_emails SET ${updates.join(", ")} 
       WHERE id = $${i} AND campaign_id = $1 RETURNING *`,
      [campaignId, ...params]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "E-mail kampaně nenalezen" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating campaign email:", error);
    res.status(500).json({ error: "Chyba při aktualizaci e-mailu kampaně" });
  }
}

// DELETE /api/marketing/campaigns/:campaignId/emails/:emailId
// Delete email from campaign
export async function deleteEmailFromCampaign(req: any, res: any, pool: any) {
  try {
    const { campaignId, emailId } = req.params;
    
    const result = await pool.query(
      `DELETE FROM campaign_emails 
       WHERE id = $1 AND campaign_id = $2 
       RETURNING id`,
      [emailId, campaignId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "E-mail kampaně nenalezen" });
    }
    
    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting campaign email:", error);
    res.status(500).json({ error: "Chyba při mazání e-mailu kampaně" });
  }
}

// POST /api/marketing/campaigns/:campaignId/emails/:emailId/send-test
// Send test email
export async function sendTestCampaignEmail(req: any, res: any, pool: any, logMarketingAction: any) {
  try {
    const { campaignId, emailId } = req.params;
    const { email: toEmail } = req.body;
    
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu" });
    }
    
    // Get the email details
    const emailRes = await pool.query(
      `SELECT ce.*, mt.subject, mt.html_content, mt.preheader, mt.header_options
       FROM campaign_emails ce
       LEFT JOIN marketing_templates mt ON mt.id = ce.template_id
       WHERE ce.id = $1 AND ce.campaign_id = $2`,
      [emailId, campaignId]
    );
    
    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: "E-mail kampaně nenalezen" });
    }
    
    const email = emailRes.rows[0];
    if (!email.template_id) {
      return res.status(400).json({ error: "E-mail nemá přiřazenou šablonu" });
    }
    
    // Send via email service (Resend)
    const { sendTestMarketingEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestMarketingEmail(email.template_id, toEmail);
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error || "Odesílání e-mailu selhalo" });
    }
    
    await logMarketingAction(
      "campaign_email.test_sent",
      req.session?.userId || null,
      { type: "campaign_email", id: emailId },
      { to: toEmail, campaignId }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu" });
  }
}

// GET /api/marketing/campaigns/:campaignId/audience-stats
// Get audience statistics for campaign (buyers vs free-downloads)
export async function getCampaignAudienceStats(req: any, res: any, pool: any) {
  try {
    const { campaignId } = req.params;
    
    // Get campaign to see audience type
    const campaignRes = await pool.query(
      "SELECT audience FROM marketing_campaigns WHERE id = $1",
      [campaignId]
    );
    
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: "Kampaň nenalezena" });
    }
    
    const audience = campaignRes.rows[0].audience;
    
    // Count subscribers in audience
    let count = 0;
    if (audience === "buyers") {
      const res1 = await pool.query("SELECT COUNT(*) FROM subscribers WHERE is_buyer = true");
      count = parseInt(res1.rows[0].count, 10);
    } else if (audience === "free_downloads") {
      const res2 = await pool.query("SELECT COUNT(*) FROM subscribers WHERE is_buyer = false");
      count = parseInt(res2.rows[0].count, 10);
    }
    
    res.json({ audience, count });
  } catch (error) {
    console.error("Error getting campaign audience stats:", error);
    res.status(500).json({ error: "Chyba při načítání statistik publika" });
  }
}

// IMPORTANT: These routes need to be registered in the marketing router:
// 
// import { 
//   getCampaignEmails, 
//   addEmailToCampaign, 
//   updateCampaignEmail, 
//   deleteEmailFromCampaign,
//   sendTestCampaignEmail,
//   getCampaignAudienceStats 
// } from "./campaignEmails.js";
//
// router.get("/campaigns/:campaignId/emails", requireAdmin, (req, res) => getCampaignEmails(req, res, pool));
// router.post("/campaigns/:campaignId/emails", requireAdmin, (req, res) => addEmailToCampaign(req, res, pool));
// router.patch("/campaigns/:campaignId/emails/:emailId", requireAdmin, (req, res) => updateCampaignEmail(req, res, pool));
// router.delete("/campaigns/:campaignId/emails/:emailId", requireAdmin, (req, res) => deleteEmailFromCampaign(req, res, pool));
// router.post("/campaigns/:campaignId/emails/:emailId/send-test", requireAdmin, (req, res) => sendTestCampaignEmail(req, res, pool, logMarketingAction));
// router.get("/campaigns/:campaignId/audience-stats", requireAdmin, (req, res) => getCampaignAudienceStats(req, res, pool));
