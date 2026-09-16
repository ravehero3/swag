import { pool } from "../db.js";

export type NotificationType = "purchase" | "like" | "comment" | "system";

/**
 * Create a notification for the admin
 * This can be called from any route to notify about purchases, likes, comments, etc.
 */
export async function createAdminNotification(
  type: NotificationType,
  title: string,
  description: string,
  relatedData?: Record<string, any>
) {
  try {
    // Get the first admin user (usually ID 1)
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE is_admin = true ORDER BY id LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      console.warn("No admin user found for notification");
      return;
    }

    const adminId = adminResult.rows[0].id;

    await pool.query(
      `INSERT INTO admin_notifications (admin_id, type, title, description, related_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, type, title, description, relatedData ? JSON.stringify(relatedData) : null]
    );
  } catch (error) {
    console.error("Error creating admin notification:", error);
  }
}

/**
 * Create purchase notification
 */
export async function notifyPurchase(email: string, items: any[], total: number, orderId: number) {
  try {
    // Validate inputs
    if (!email || typeof email !== "string") {
      console.error("Invalid email for purchase notification");
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      console.error("No items in purchase notification");
      return;
    }
    if (typeof total !== "number" || total <= 0) {
      console.error("Invalid total for purchase notification");
      return;
    }
    if (!orderId || typeof orderId !== "number") {
      console.error("Invalid orderId for purchase notification");
      return;
    }

    const itemCount = items.length;
    const itemNames = items
      .slice(0, 2)
      .map((i: any) => (i.title || i.name || "neznámý item"))
      .filter(Boolean)
      .join(", ") || "položky";

    const title = `🛒 Nová objednávka od ${email.substring(0, 50)}`;
    const description = `${itemNames}${itemCount > 2 ? ` a ${itemCount - 2} dalších` : ""} • ${total.toFixed(0)} Kč`;

    await createAdminNotification("purchase", title, description, {
      orderId,
      email,
      itemCount,
      total,
    });
  } catch (error) {
    console.error("Error creating purchase notification:", error);
  }
}

/**
 * Create like notification
 */
export async function notifyLike(beatTitle: string, beatId: number, email: string) {
  try {
    // Validate inputs
    if (!beatTitle || typeof beatTitle !== "string") {
      console.error("Invalid beat title for like notification");
      return;
    }
    if (!beatId || typeof beatId !== "number") {
      console.error("Invalid beat ID for like notification");
      return;
    }
    if (!email || typeof email !== "string") {
      console.error("Invalid email for like notification");
      return;
    }

    const sanitizedTitle = beatTitle.substring(0, 100);
    const sanitizedEmail = email.substring(0, 100);

    const title = `❤️ Někdo si oblíbil "${sanitizedTitle}"`;
    const description = `Uživatel ${sanitizedEmail} si přidal beat do seznamu oblíbených`;

    await createAdminNotification("like", title, description, {
      beatId,
      email: sanitizedEmail,
    });
  } catch (error) {
    console.error("Error creating like notification:", error);
  }
}

/**
 * Create comment notification
 */
export async function notifyComment(beatTitle: string, beatId: number, email: string, commentText: string) {
  try {
    // Validate inputs
    if (!beatTitle || typeof beatTitle !== "string") {
      console.error("Invalid beat title for comment notification");
      return;
    }
    if (!beatId || typeof beatId !== "number") {
      console.error("Invalid beat ID for comment notification");
      return;
    }
    if (!email || typeof email !== "string") {
      console.error("Invalid email for comment notification");
      return;
    }
    if (!commentText || typeof commentText !== "string") {
      console.error("Invalid comment text for comment notification");
      return;
    }

    const sanitizedTitle = beatTitle.substring(0, 100);
    const sanitizedEmail = email.substring(0, 100);
    const preview = commentText.substring(0, 60) + (commentText.length > 60 ? "..." : "");

    const title = `💬 Nový komentář na "${sanitizedTitle}"`;
    const description = `${sanitizedEmail}: "${preview}"`;

    await createAdminNotification("comment", title, description, {
      beatId,
      email: sanitizedEmail,
      commentPreview: preview,
    });
  } catch (error) {
    console.error("Error creating comment notification:", error);
  }
}

/**
 * Create system notification
 */
export async function notifySystem(title: string, description: string, data?: Record<string, any>) {
  await createAdminNotification("system", title, description, data);
}

/**
 * Create free download notification
 */
export async function notifyFreeBeat(beatTitle: string, beatId: number, email: string) {
  try {
    // Validate inputs
    if (!beatTitle || typeof beatTitle !== "string") {
      console.error("Invalid beat title for free download notification");
      return;
    }
    if (!beatId || typeof beatId !== "number") {
      console.error("Invalid beat ID for free download notification");
      return;
    }
    if (!email || typeof email !== "string") {
      console.error("Invalid email for free download notification");
      return;
    }

    const sanitizedTitle = beatTitle.substring(0, 100);
    const sanitizedEmail = email.substring(0, 100);

    const title = `🎁 Stažení free beatu: "${sanitizedTitle}"`;
    const description = `${sanitizedEmail} si stáhl free verzi`;

    await createAdminNotification("system", title, description, {
      beatId,
      email: sanitizedEmail,
      type: "free_download",
    });
  } catch (error) {
    console.error("Error creating free download notification:", error);
  }
}
