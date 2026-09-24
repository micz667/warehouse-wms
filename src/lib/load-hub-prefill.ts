import type { ScannedCatalogItem } from "@/components/item-scan-field";
import type { PickedLocation } from "@/components/location-picker";
import { prisma } from "@/lib/prisma";

export type HubPrefill = {
  fromHub: boolean;
  item: ScannedCatalogItem | null;
  location: PickedLocation | null;
  fromLocation: PickedLocation | null;
  toLocation: PickedLocation | null;
};

function toScannedItem(row: {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  unit: string;
}): ScannedCatalogItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    barcode: row.barcode,
    unit: row.unit,
  };
}

function toPickedLocation(row: {
  id: string;
  code: string;
  label: string;
}): PickedLocation {
  return { id: row.id, code: row.code, label: row.label };
}

/** Resolve optional hub query ids into form prefills (server). */
export async function loadHubPrefill(params: {
  itemId?: string;
  locationId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  fromHub?: string;
}): Promise<HubPrefill> {
  const fromHub = params.fromHub === "1" || params.fromHub === "true";

  const [itemRow, locationRow, fromRow, toRow] = await Promise.all([
    params.itemId
      ? prisma.catalogItem.findUnique({ where: { id: params.itemId } })
      : Promise.resolve(null),
    params.locationId
      ? prisma.location.findUnique({ where: { id: params.locationId } })
      : Promise.resolve(null),
    params.fromLocationId
      ? prisma.location.findUnique({ where: { id: params.fromLocationId } })
      : Promise.resolve(null),
    params.toLocationId
      ? prisma.location.findUnique({ where: { id: params.toLocationId } })
      : Promise.resolve(null),
  ]);

  return {
    fromHub,
    item: itemRow ? toScannedItem(itemRow) : null,
    location: locationRow ? toPickedLocation(locationRow) : null,
    fromLocation: fromRow ? toPickedLocation(fromRow) : null,
    toLocation: toRow ? toPickedLocation(toRow) : null,
  };
}
