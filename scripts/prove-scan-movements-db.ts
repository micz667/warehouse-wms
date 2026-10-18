/**
 * Discriminating acceptance for F007 — needs Postgres.
 * Receipt / transfer / issue post movements with actor; transfer balances;
 * issue refuses negative stock.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { findCatalogByBarcode } from "../src/server/catalog/find-catalog-by-barcode";
import { createLocation } from "../src/server/locations/create-location";
import { listRecentMovements } from "../src/server/movements/list-recent-movements";
import { postIssue } from "../src/server/movements/post-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { postTransfer } from "../src/server/movements/post-transfer";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f007-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F007 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    name: `F007 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const byBarcode = await findCatalogByBarcode(prisma, item.item.barcode);
  assert.ok(byBarcode);
  assert.equal(byBarcode?.id, item.item.id);

  const locA = await createLocation(prisma, {
    code: `F7A-${suffix}`,
    label: `F007 A ${suffix}`,
  });
  assert.equal(locA.ok, true);
  if (!locA.ok) throw new Error("location A failed");

  const locB = await createLocation(prisma, {
    code: `F7B-${suffix}`,
    label: `F007 B ${suffix}`,
  });
  assert.equal(locB.ok, true);
  if (!locB.ok) throw new Error("location B failed");

  // 1) Receipt posts +qty with actor + timestamp
  const receipt = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: "10",
    createdById: actor.id,
  });
  assert.equal(receipt.ok, true);
  if (!receipt.ok) throw new Error("receipt failed");
  assert.equal(receipt.movement.type, "receipt");
  assert.equal(receipt.movement.qty.toString(), "10");
  assert.equal(receipt.movement.createdById, actor.id);
  assert.ok(receipt.movement.createdAt instanceof Date);

  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "10",
  );

  // 2) Transfer: −source +dest same qty (paired transfer rows)
  const transfer = await postTransfer(prisma, {
    catalogItemId: item.item.id,
    fromLocationId: locA.location.id,
    toLocationId: locB.location.id,
    qty: "4",
    createdById: actor.id,
  });
  assert.equal(transfer.ok, true);
  if (!transfer.ok) throw new Error("transfer failed");
  assert.equal(transfer.from.type, "transfer");
  assert.equal(transfer.to.type, "transfer");
  assert.equal(transfer.from.qty.toString(), "-4");
  assert.equal(transfer.to.qty.toString(), "4");
  assert.equal(transfer.from.createdById, actor.id);
  assert.equal(transfer.to.createdById, actor.id);

  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "6",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locB.location.id,
      })
    ).toString(),
    "4",
  );

  // 3) Issue refuses when it would drive balance negative
  const overdraw = await postIssue(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: "7",
    createdById: actor.id,
  });
  assert.equal(overdraw.ok, false);
  if (overdraw.ok) throw new Error("expected insufficient_stock");
  assert.equal(overdraw.error, "insufficient_stock");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "6",
    "refused issue must not change balance",
  );

  // Successful issue of remaining 6
  const issue = await postIssue(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: new Decimal("6"),
    createdById: actor.id,
  });
  assert.equal(issue.ok, true);
  if (!issue.ok) throw new Error("issue failed");
  assert.equal(issue.movement.type, "issue");
  assert.equal(issue.movement.qty.toString(), "-6");
  assert.equal(issue.movement.createdById, actor.id);
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "0",
  );

  // History shows actor + timestamp for posted movements
  const recent = await listRecentMovements(prisma, { take: 20 });
  const ours = recent.filter((r) => r.catalogItem.id === item.item.id);
  assert.ok(ours.length >= 4, "history should include receipt/transfer pair/issue");
  for (const row of ours) {
    assert.ok(row.createdAt instanceof Date);
    assert.equal(row.createdBy?.id, actor.id);
  }
  assert.ok(ours.some((r) => r.type === "receipt"));
  assert.ok(ours.some((r) => r.type === "issue"));
  assert.equal(
    ours.filter((r) => r.type === "transfer").length,
    2,
    "transfer history shows both legs",
  );

  console.log(
    "prove-scan-movements-db: ok (receipt/transfer/issue + actor history; issue refuses negative)",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
