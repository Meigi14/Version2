import { BoxPosition, LayerResult, MaterialItem, PALLET_L, PALLET_W } from '../types';

/**
 * Calculates a simple block layout (grid) for a given box orientation.
 */
function calculateBlockLayout(
  boxL: number,
  boxW: number,
  pL: number,
  pW: number,
  rotated: boolean
): LayerResult {
  const cols = Math.floor(pL / boxL);
  const rows = Math.floor(pW / boxW);
  const totalBoxes = cols * rows;

  const usedLength = cols * boxL;
  const usedWidth = rows * boxW;

  // Calculate centering offsets
  const startX = (pL - usedLength) / 2;
  const startY = (pW - usedWidth) / 2;

  const positions: BoxPosition[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        x: startX + c * boxL,
        y: startY + r * boxW,
        length: boxL,
        width: boxW,
        rotated: rotated,
      });
    }
  }

  return {
    patternName: rotated ? 'Rotated Grid' : 'Standard Grid',
    totalBoxes,
    positions,
    usedLength,
    usedWidth,
    efficiency: (usedLength * usedWidth) / (pL * pW),
  };
}

/**
 * Determines the best single layer layout.
 * It compares aligning Box Length with Pallet Length vs Box Width with Pallet Length.
 */
export function calculateBestLayer(item: MaterialItem): { best: LayerResult; alt: LayerResult } {
  // Option 1: Normal alignment (Length to Length)
  const opt1 = calculateBlockLayout(item.length, item.width, PALLET_L, PALLET_W, false);
  
  // Option 2: Rotated alignment (Width to Length)
  const opt2 = calculateBlockLayout(item.width, item.length, PALLET_L, PALLET_W, true);

  // Heuristic: Prefer higher count. If equal, prefer higher efficiency (area coverage).
  if (opt2.totalBoxes > opt1.totalBoxes) {
    return { best: opt2, alt: opt1 };
  } else if (opt1.totalBoxes > opt2.totalBoxes) {
    return { best: opt1, alt: opt2 };
  } else {
    // Counts are equal, pick the one with better area usage or default to unrotated
    return opt1.efficiency >= opt2.efficiency ? { best: opt1, alt: opt2 } : { best: opt2, alt: opt1 };
  }
}

/**
 * Full calculation for the pallet stack.
 */
export function calculatePalletStack(item: MaterialItem, maxStackHeight: number) {
  const { best, alt } = calculateBestLayer(item);
  
  // Calculate max layers allowed
  // Note: Assuming pallet base height is NOT included in the 1350mm/700mm limit, 
  // or that the limit applies to the cargo + pallet. 
  // Usually limits are inclusive, but here we calculate cargo height. 
  // We will assume the limit is the maximum top-out height.
  // Standard wooden pallet is ~150mm. 
  // Let's purely calculate based on cargo space available if not specified, 
  // but usually "Max Stacking Height" includes the goods. 
  // We will simply divide MaxHeight by BoxHeight for this calculation as requested.
  
  const totalLayers = Math.floor(maxStackHeight / item.height);
  const stackHeight = totalLayers * item.height;
  
  // Stability Logic:
  // If we can rotate the layer (Alt pattern) and it provides a similar box count (e.g. within 10-15%),
  // we might want to use it for even layers to create interlock. 
  // However, for strict "Maximum Quantity", we usually stick to the best pattern.
  // The user asked for "Stability" and "Cannot overlap upwards in same direction".
  // If Option 1 and Option 2 have the SAME count, we definitely alternate.
  // If they are different, we usually stick to the dense one for max qty, but this sacrifices stability.
  // Since the prompt asks for "Max Quantity" AND "Stability", we will prioritize Max Quantity.
  // If count is identical, we return both layers to visualize alternation.
  
  let evenLayer: LayerResult | null = null;
  
  // If the alternate orientation has the same count, use it for even layers to lock the stack
  if (alt.totalBoxes === best.totalBoxes && best.totalBoxes > 0) {
    evenLayer = alt;
  }

  // If evenLayer is null (meaning rotation reduces count), we might still want to mirror/flip 
  // the pattern if it's not perfectly centered/symmetrical, but our block algorithm is always centered.
  // In a block stack, the only way to interlock without changing count is rotation.
  
  const totalBoxes = totalLayers * best.totalBoxes;

  const volumePerBox = item.length * item.width * item.height;
  const totalVolume = totalBoxes * volumePerBox;
  const palletVolume = PALLET_L * PALLET_W * stackHeight;
  
  return {
    material: item,
    maxHeightConstraint: maxStackHeight,
    totalLayers,
    totalBoxes,
    layerHeight: item.height,
    stackHeight,
    oddLayer: best,
    evenLayer: evenLayer, // Can be null if no stable alternative exists with same count
    paleltUtilization: totalLayers > 0 ? (totalVolume / palletVolume) : 0
  };
}