export interface MaterialItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
}

export interface BoxPosition {
  x: number;
  y: number;
  width: number;
  length: number;
  rotated: boolean;
}

export interface LayerResult {
  patternName: string;
  totalBoxes: number;
  positions: BoxPosition[];
  usedWidth: number;
  usedLength: number;
  efficiency: number;
}

export interface PackingResult {
  material: MaterialItem;
  maxHeightConstraint: number;
  totalLayers: number;
  totalBoxes: number;
  layerHeight: number;
  stackHeight: number;
  oddLayer: LayerResult;
  evenLayer: LayerResult | null; // Null if same as odd
  paleltUtilization: number;
}

export const PALLET_L = 1180;
export const PALLET_W = 980;
