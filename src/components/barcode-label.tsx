"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  value: string;
  /** Display height of the bars in px */
  height?: number;
  className?: string;
};

/** Renders a Code128 barcode for hall labels (JsBarcode CODE128). */
export function BarcodeLabel({ value, height = 64, className }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height,
      margin: 8,
      background: "#ffffff",
      lineColor: "#18181b",
    });
  }, [value, height]);

  return <svg ref={svgRef} className={className} role="img" aria-label={`Kod kreskowy ${value}`} />;
}
