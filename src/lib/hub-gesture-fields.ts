/**
 * After a hub scan + gesture choice, which form fields are still missing?
 * Known scan identity is never re-asked as an empty field.
 */

export type HubScanKind = "item" | "location";

export type HubGesture = "przyjmij" | "wydaj" | "przenies";

export type HubField =
  | "item"
  | "location"
  | "fromLocation"
  | "toLocation"
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
      if (scanKind === "item") return ["location", "qty"];
      return ["item", "qty"];
    case "przenies":
      if (scanKind === "item") return ["fromLocation", "toLocation", "qty"];
      // Location scan prefills source; still need destination (+ item + qty).
      return ["item", "toLocation", "qty"];
  }
}

export function hubGestureHref(
  gesture: HubGesture,
  scan: { kind: HubScanKind; id: string },
): string {
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
