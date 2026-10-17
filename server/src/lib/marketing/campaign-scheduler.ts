import { pool } from "../../db.js";

interface RateLimitConfig {
  dailyLimit: number;
  hourlyLimit: number;
  currentHourSent: number;
  currentDaySent: number;
  lastHourReset: Date;
  lastDayReset: Date;
}

/**
 * Check and update hourly/daily reset if needed
 */
async function updateRateLimitCounters(
  campaignId: number,
  config: RateLimitConfig
): Promise<RateLimitConfig> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let updated = false;

  // Reset hourly counter if an hour has passed
  if (config.lastHourReset < hourAgo) {
    config.currentHourSent = 0;
    config.lastHourReset = now;
    updated = true;
  }

  // Reset daily counter if a day has passed
  if (config.lastDayReset < dayAgo) {
    config.currentDaySent = 0;
    config.lastDayReset = now;
    updated = true;
  }

  if (updated) {
    await pool.query(
      `UPDATE campaign_rate_limits
       SET current_hour_sent = $1, last_hour_reset = $2,
           current_day_sent = $3, last_day_reset = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $5`,
      [config.currentHourSent, config.lastHourReset, config.currentDaySent, config.lastDayReset, campaignId]
    );
  }

  return config;
}

/**
 * Calculate how many emails we can send right now
 */
function calculateSendQuota(config: RateLimitConfig): number {
  const hourlyQuota = Math.max(0, config.hourlyLimit - config.currentHourSent);
  const dailyQuota = Math.max(0, config.dailyLimit - config.currentDaySent);
  return Math.min(hourlyQuota, dailyQuota);
}

/**
 * Process a single campaign's queued emails
 */
export async function processCampaignQueue(campaignId: number) {
  try {
    // Get campaign
    const campaignRes = await pool.query(
      `SELECT id, status, daily_send_limit, hourly_send_limit, paused_until
       FROM marketing_campaigns
       WHERE id = $1`,
      [campaignId]
    );

    if (campaignRes.rows.length === 0) return;
    const campaign = campaignRes.rows[0];

    // Check if paused
    if (campaign.paused_until && new Date(campaign.paused_until) > new Date()) {
      console.log(`[Campaign Queue] Campaign ${campaignId} is paused`);
      return;
    }

    if (campaign.status !== "active") {
      console.log(`[Campaign Queue] Campaign ${campaignId} not active (status: ${campaign.status})`);
      return;
    }

    // Get or create rate limit config
    let rateLimitRes = await pool.query(
      `SELECT daily_limit, hourly_limit, current_hour_sent, current_day_sent,
              last_hour_reset, last_day_reset
       FROM campaign_rate_limits
       WHERE campaign_id = $1`,
      [campaignId]
    );

    let rateLimitConfig: RateLimitConfig;
    if (rateLimitRes.rows.length === 0) {
      // Create rate limit entry
      await pool.query(
        `INSERT INTO campaign_rate_limits 
         (campaign_id, daily_limit, hourly_limit, current_hour_sent, current_day_sent)
         VALUES ($1, $2, $3, 0, 0)`,
        [campaignId, campaign.daily_send_limit || 85, campaign.hourly_send_limit || 4]
      );
      rateLimitConfig = {
        dailyLimit: campaign.daily_send_limit || 85,
        hourlyLimit: campaign.hourly_send_limit || 4,
        currentHourSent: 0,
        currentDaySent: 0,
        lastHourReset: new Date(),
        lastDayReset: new Date(),
      };
    } else {
      const row = rateLimitRes.rows[0];
      rateLimitConfig = {
        dailyLimit: row.daily_limit,
        hourlyLimit: row.hourly_limit,
        currentHourSent: row.current_hour_sent,
        currentDaySent: row.current_day_sent,
        lastHourReset: new Date(row.last_hour_reset),
        lastDayReset: new Date(row.last_day_reset),
      };
    }

    // Update counters if needed
    rateLimitConfig = await updateRateLimitCounters(campaignId, rateLimitConfig);

    // Calculate how many emails we can send
    const quota = calculateSendQuota(rateLimitConfig);
    if (quota <= 0) {
      console.log(
        `[Campaign Queue] Campaign ${campaignId} rate limit reached. Hour: ${rateLimitConfig.currentHourSent}/${rateLimitConfig.hourlyLimit}, Day: ${rateLimitConfig.currentDaySent}/${rateLimitConfig.dailyLimit}`
      );
      return;
    }

    console.log(`[Campaign Queue] Campaign ${campaignId}: Can send ${quota} emails this window`);

    // Get queued emails ready to send
    const queueRes = await pool.query(
      `SELECT csq.id, csq.subscriber_id, csq.retry_count,
              s.email, mc.id as campaign_email_id
       FROM campaign_send_queue csq
       JOIN subscribers s ON s.id = csq.subscriber_id
       LEFT JOIN marketing_campaign_emails mc ON mc.campaign_id = $1
       WHERE csq.campaign_id = $1
         AND csq.status = 'queued'
         AND (csq.scheduled_for IS NULL OR csq.scheduled_for <= CURRENT_TIMESTAMP)
       ORDER BY csq.queued_at ASC
       LIMIT $2`,
      [campaignId, quota]
    );

    if (queueRes.rows.length === 0) {
      console.log(`[Campaign Queue] No queued emails for campaign ${campaignId}`);
      return;
    }

    console.log(`[Campaign Queue] Found ${queueRes.rows.length} emails to send for campaign ${campaignId}`);

    // Send emails and update queue
    for (const row of queueRes.rows) {
      try {
        // Update queue status to in_progress
        await pool.query(
          `UPDATE campaign_send_queue
           SET status = 'in_progress'
           WHERE id = $1`,
          [row.id]
        );

        // TODO: Send email via Resend API
        // For now, mark as sent (in production, this would call sendEmail())
        const emailSendRes = await pool.query(
          `INSERT INTO marketing_email_sends
           (subscriber_id, campaign_id, idempotency_key, status, recipient, email_type)
           VALUES ($1, $2, $3, 'sent', $4, 'campaign')
           RETURNING id`,
          [row.subscriber_id, campaignId, `campaign-${campaignId}-${row.subscriber_id}-${Date.now()}`, row.email]
        );

        // Update queue entry
        await pool.query(
          `UPDATE campaign_send_queue
           SET status = 'sent', sent_at = CURRENT_TIMESTAMP,
               email_send_id = $1
           WHERE id = $2`,
          [emailSendRes.rows[0]?.id, row.id]
        );

        // Update campaign stats
        await pool.query(
          `UPDATE marketing_campaigns
           SET total_sent = total_sent + 1
           WHERE id = $1`,
          [campaignId]
        );

        // Update rate limit counters
        rateLimitConfig.currentHourSent++;
        rateLimitConfig.currentDaySent++;

        console.log(`[Campaign Queue] Sent email to ${row.email} (campaign ${campaignId})`);
      } catch (err) {
        console.error(`[Campaign Queue] Error sending email for queue ${row.id}:`, err);

        // Update retry count
        const retryCount = (row.retry_count || 0) + 1;
        const maxRetries = 3;

        if (retryCount >= maxRetries) {
          // Mark as failed
          await pool.query(
            `UPDATE campaign_send_queue
             SET status = 'failed', failed_reason = $1, retry_count = $2
             WHERE id = $3`,
            [String(err).substring(0, 200), retryCount, row.id]
          );

          await pool.query(
            `UPDATE marketing_campaigns
             SET total_failed = total_failed + 1
             WHERE id = $1`,
            [campaignId]
          );
        } else {
          // Schedule retry
          const retryDelays = [3600, 21600, 86400]; // 1h, 6h, 24h
          const nextRetryMs = Date.now() + (retryDelays[retryCount - 1] * 1000);

          await pool.query(
            `UPDATE campaign_send_queue
             SET status = 'queued', scheduled_for = $1, retry_count = $2
             WHERE id = $3`,
            [new Date(nextRetryMs), retryCount, row.id]
          );

          console.log(
            `[Campaign Queue] Email queued for retry (attempt ${retryCount}/${maxRetries}) for queue ${row.id}`
          );
        }
      }
    }

    // Update rate limit counters in database
    await pool.query(
      `UPDATE campaign_rate_limits
       SET current_hour_sent = $1, current_day_sent = $2, updated_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $3`,
      [rateLimitConfig.currentHourSent, rateLimitConfig.currentDaySent, campaignId]
    );

    // Check if campaign is complete
    const incompletRes = await pool.query(
      `SELECT COUNT(*) as count FROM campaign_send_queue
       WHERE campaign_id = $1 AND status IN ('queued', 'in_progress', 'failed')
       AND (status != 'failed' OR retry_count < 3)`,
      [campaignId]
    );

    if (incompletRes.rows[0].count === 0) {
      console.log(`[Campaign Queue] Campaign ${campaignId} is complete!`);
      await pool.query(
        `UPDATE marketing_campaigns
         SET status = 'completed', campaign_completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campaignId]
      );
    }
  } catch (err) {
    console.error(`[Campaign Queue] Error processing campaign ${campaignId}:`, err);
  }
}

/**
 * Main scheduler job - runs every 15 minutes
 */
export async function startCampaignScheduler() {
  console.log("[Campaign Scheduler] Starting campaign scheduler");

  // Run immediately on startup
  await runCampaignSchedulerCycle();

  // Then run every 15 minutes
  setInterval(runCampaignSchedulerCycle, 15 * 60 * 1000);
}

async function runCampaignSchedulerCycle() {
  try {
    console.log(`[Campaign Scheduler] Running cycle at ${new Date().toISOString()}`);

    // Get all active campaigns
    const campaignsRes = await pool.query(
      `SELECT id FROM marketing_campaigns WHERE status = 'active' ORDER BY campaign_started_at ASC`
    );

    console.log(`[Campaign Scheduler] Found ${campaignsRes.rows.length} active campaigns`);

    // Process each campaign
    for (const row of campaignsRes.rows) {
      await processCampaignQueue(row.id);
    }

    console.log(`[Campaign Scheduler] Cycle complete`);
  } catch (err) {
    console.error("[Campaign Scheduler] Cycle error:", err);
  }
}
