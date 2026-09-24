/**
 * After a hub scan + gesture choice, which form fields are still missing?
 * Known scan identity is never re-asked as an empty field.
 */

export type HubScanKind = "item" | "location";

export type HubGesture = "przyjmij" | "wydaj" | "przenies" | "gdzie";

export type HubField =
  | "item"
  | "location"
  | "fromLocation"
  | "toLocation"
  | "cafe"
  | "qty";

/** Fields the UI must still collect to finish the gesture. */
export function missingFieldsAfterHubScan(
  scanKind: HubScanKind,
  gesture: HubGesture,
): HubField[] {
  switch (gesture) {
    case "przyjmij":
      if (scanKind === "item") return ["location", "qty"];
      return ["item", "qty"];
    case "wydaj":
      // Cafe prepare: document needs cafe destination + at least one line.
      if (scanKind === "item") return ["location", "cafe", "qty"];
      return ["item", "cafe", "qty"];
    case "przenies":
      if (scanKind === "item") return ["fromLocation", "toLocation", "qty"];
      // Location scan prefills source; still need destination (+ item + qty).
      return ["item", "toLocation", "qty"];
    case "gdzie":
      // Item scan is enough; location scan cannot answer “where is X?”.
      if (scanKind === "item") return [];
      return ["item"];
  }
}

export function hubGestureHref(
  gesture: HubGesture,
  scan: { kind: HubScanKind; id: string },
): string {
  if (gesture === "gdzie") {
    const params = new URLSearchParams();
    if (scan.kind === "item") {
      params.set("itemId", scan.id);
    }
    const qs = params.toString();
    return qs ? `/gdzie?${qs}` : "/gdzie";
  }

  const base =
    gesture === "przyjmij"
      ? "/ruchy/przyjecie"
      : gesture === "wydaj"
        ? "/ruchy/wydanie"
        : "/ruchy/przesuniecie";

  const params = new URLSearchParams();
  if (scan.kind === "item") {
    params.set("itemId", scan.id);
  } else if (gesture === "przenies") {
    params.set("fromLocationId", scan.id);
  } else {
    params.set("locationId", scan.id);
  }
  params.set("fromHub", "1");
  return `${base}?${params.toString()}`;
}
