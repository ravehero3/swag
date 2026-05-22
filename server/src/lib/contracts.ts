import { pool } from "../db.js";
import {
  fillContractTemplate,
  formatDateCzech,
  formatPriceCzech,
} from "./contractTemplate.js";
import { contractTextToPdfBuffer } from "./contractPdf.js";

export interface OrderContractContext {
  id?: number;
  email: string;
  buyer_legal_name?: string | null;
  buyer_artist_name?: string | null;
  buyer_address?: string | null;
  created_at?: string | Date | null;
}

export interface ContractOrderItem {
  title?: string;
  price?: number;
  licenseTypeId?: number | null;
  productType?: string;
}

export function isContractEligibleItem(item: ContractOrderItem | null | undefined): boolean {
  if (!item?.productType) return false;
  return (
    item.productType === "beat" ||
    item.productType === "sound_kit" ||
    item.productType === "kit"
  );
}

export async function resolveContractTemplate(
  licenseTypeId?: number | null,
  itemPrice?: number
): Promise<{ template: string | null; licensePrice: number }> {
  let contractTemplate: string | null = null;
  let licensePrice = Number(itemPrice) || 0;

  if (licenseTypeId) {
    const ltRes = await pool.query(
      "SELECT contract_template, price FROM license_types WHERE id = $1",
      [licenseTypeId]
    );
    if (ltRes.rows.length > 0) {
      contractTemplate = ltRes.rows[0].contract_template;
      licensePrice = Number(ltRes.rows[0].price) || licensePrice;
    }
  }

  if (!contractTemplate) {
    const fallbackRes = await pool.query(
      `SELECT contract_template, price FROM license_types
       WHERE contract_template IS NOT NULL AND is_active = true
       ORDER BY price DESC LIMIT 1`
    );
    if (fallbackRes.rows.length > 0) {
      contractTemplate = fallbackRes.rows[0].contract_template;
      if (!licensePrice) licensePrice = Number(fallbackRes.rows[0].price) || 0;
    }
  }

  return { template: contractTemplate, licensePrice };
}

export function contractFilenameForItem(title?: string): string {
  const safe = (title || "produkt")
    .replace(/[^\p{L}\p{N}\-_]+/gu, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  return `Licencni_smlouva_${safe}.pdf`;
}

export async function generateOrderItemContractPdf(
  order: OrderContractContext,
  item: ContractOrderItem
): Promise<{ buffer: Buffer; filename: string } | null> {
  const { template, licensePrice } = await resolveContractTemplate(
    item.licenseTypeId,
    item.price
  );
  if (!template) return null;

  const orderDate = new Date(order.created_at || Date.now());
  const datum = formatDateCzech(orderDate);

  const filled = fillContractTemplate(template, {
    datum,
    pravniJmeno: order.buyer_legal_name || order.email,
    umeleckeJmeno: order.buyer_artist_name || order.email,
    adresa: order.buyer_address || "—",
    beatNazev: item.title || "—",
    cena: formatPriceCzech(Number(licensePrice)),
  });

  const buffer = await contractTextToPdfBuffer(
    filled,
    item.title || "Licence",
    datum
  );

  return {
    buffer,
    filename: contractFilenameForItem(item.title),
  };
}
