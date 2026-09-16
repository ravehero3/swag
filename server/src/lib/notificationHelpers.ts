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
  const itemCount = items?.length || 0;
  const itemNames = items
    ?.slice(0, 2)
    .map((i: any) => i.title || i.name)
    .join(", ");

  const title = `🛒 Nová objednávka od ${email}`;
  const description = `${itemNames}${itemCount > 2 ? ` a ${itemCount - 2} dalších` : ""} • ${total.toFixed(0)} Kč`;

  await createAdminNotification("purchase", title, description, {
    orderId,
    email,
    itemCount,
    total,
  });
}

/**
 * Create like notification
 */
export async function notifyLike(beatTitle: string, beatId: number, email: string) {
  const title = `❤️ Někdo si oblíbil "${beatTitle}"`;
  const description = `Uživatel ${email} si přidal beat do seznamu oblíbených`;

  await createAdminNotification("like", title, description, {
    beatId,
    email,
  });
}

/**
 * Create comment notification
 */
export async function notifyComment(beatTitle: string, beatId: number, email: string, commentText: string) {
  const preview = commentText.substring(0, 60) + (commentText.length > 60 ? "..." : "");
  const title = `💬 Nový komentář na "${beatTitle}"`;
  const description = `${email}: "${preview}"`;

  await createAdminNotification("comment", title, description, {
    beatId,
    email,
    commentPreview: preview,
  });
}

/**
 * Create system notification
 */
export async function notifySystem(title: string, description: string, data?: Record<string, any>) {
  await createAdminNotification("system", title, description, data);
}
