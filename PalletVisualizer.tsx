import React, { useState, useEffect, useRef } from 'react';
import { PackingResult, PALLET_L, PALLET_W, BoxPosition } from '../types';
import { Eye, LayoutGrid, Box as BoxIcon } from 'lucide-react';

interface PalletVisualizerProps {
  data: PackingResult;
}

export const PalletVisualizer: React.FC<PalletVisualizerProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Isometric Drawing Logic
  useEffect(() => {
    if (viewMode !== '3d' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Config
    const originX = rect.width / 2;
    const originY = rect.height * 0.9; // Start near bottom
    
    // Scale calculation
    // Max extents: Width ~ (L+W), Height ~ (L+W)/2 + H
    // We want to fit everything.
    // Roughly: 1200mm + 1000mm ~ 2200 units width projection
    // Scale to fit canvas width (e.g., 600px) -> 0.25
    const totalW = PALLET_L + PALLET_W;
    const scale = Math.min(rect.width / totalW * 0.9, rect.height / (totalW * 0.5 + data.stackHeight) * 0.9);

    // Iso projection helpers
    // x, y are world coords on pallet (0..1180, 0..980)
    // z is height (0..stackHeight)
    // Angles: X-axis at -30deg (330), Y-axis at +30deg (30) relative to horizontal? 
    // Standard Iso: X goes down-right, Y goes down-left.
    // Screen X = (x - y) * cos(30)
    // Screen Y = (x + y) * sin(30) - z
    
    const isoX = (x: number, y: number) => (x - y) * Math.cos(Math.PI / 6) * scale + originX;
    const isoY = (x: number, y: number, z: number) => ((x + y) * Math.sin(Math.PI / 6) - z) * scale + originY;

    // Draw Pallet Base
    const drawPallet = () => {
        const h = 140; // Approx pallet height
        const z = -h;
        
        ctx.fillStyle = '#e5e7eb'; // Top
        ctx.beginPath();
        ctx.moveTo(isoX(0, 0), isoY(0, 0, 0));
        ctx.lineTo(isoX(PALLET_L, 0), isoY(PALLET_L, 0, 0));
        ctx.lineTo(isoX(PALLET_L, PALLET_W), isoY(PALLET_L, PALLET_W, 0));
        ctx.lineTo(isoX(0, PALLET_W), isoY(0, PALLET_W, 0));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9ca3af'; // Right
        ctx.beginPath();
        ctx.moveTo(isoX(PALLET_L, 0), isoY(PALLET_L, 0, 0));
        ctx.lineTo(isoX(PALLET_L, PALLET_W), isoY(PALLET_L, PALLET_W, 0));
        ctx.lineTo(isoX(PALLET_L, PALLET_W), isoY(PALLET_L, PALLET_W, z));
        ctx.lineTo(isoX(PALLET_L, 0), isoY(PALLET_L, 0, z));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d1d5db'; // Left
        ctx.beginPath();
        ctx.moveTo(isoX(0, PALLET_W), isoY(0, PALLET_W, 0));
        ctx.lineTo(isoX(PALLET_L, PALLET_W), isoY(PALLET_L, PALLET_W, 0));
        ctx.lineTo(isoX(PALLET_L, PALLET_W), isoY(PALLET_L, PALLET_W, z));
        ctx.lineTo(isoX(0, PALLET_W), isoY(0, PALLET_W, z));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    const drawBox = (box: BoxPosition, zBottom: number, height: number) => {
        const { x, y, length: l, width: w } = box;
        const zTop = zBottom + height;

        // Colors
        const colTop = '#60a5fa'; // Blue 400
        const colRight = '#3b82f6'; // Blue 500
        const colLeft = '#93c5fd'; // Blue 300
        const colStroke = '#1e40af'; // Blue 800

        ctx.strokeStyle = colStroke;
        ctx.lineWidth = 0.5;
        ctx.lineJoin = 'round';

        // Draw Top
        ctx.fillStyle = colTop;
        ctx.beginPath();
        ctx.moveTo(isoX(x, y), isoY(x, y, zTop));
        ctx.lineTo(isoX(x + l, y), isoY(x + l, y, zTop));
        ctx.lineTo(isoX(x + l, y + w), isoY(x + l, y + w, zTop));
        ctx.lineTo(isoX(x, y + w), isoY(x, y + w, zTop));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Right (visible if we view from front-right?)
        // In standard iso (x down-right, y down-left), x=PALLET_L is right, y=PALLET_W is left
        // We see faces corresponding to max X and max Y
        
        // Right Face (Length side) -> Plane x+l
        ctx.fillStyle = colRight;
        ctx.beginPath();
        ctx.moveTo(isoX(x + l, y), isoY(x + l, y, zTop));
        ctx.lineTo(isoX(x + l, y + w), isoY(x + l, y + w, zTop));
        ctx.lineTo(isoX(x + l, y + w), isoY(x + l, y + w, zBottom));
        ctx.lineTo(isoX(x + l, y), isoY(x + l, y, zBottom));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Left Face (Width side) -> Plane y+w
        ctx.fillStyle = colLeft;
        ctx.beginPath();
        ctx.moveTo(isoX(x, y + w), isoY(x, y + w, zTop));
        ctx.lineTo(isoX(x + l, y + w), isoY(x + l, y + w, zTop));
        ctx.lineTo(isoX(x + l, y + w), isoY(x + l, y + w, zBottom));
        ctx.lineTo(isoX(x, y + w), isoY(x, y + w, zBottom));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    drawPallet();

    // Collect all boxes to draw
    // Sort order: Back to Front.
    // In this projection (origin bottom center), X increases right-down, Y increases left-down.
    // Farthest point is x=0, y=0. Nearest is x=L, y=W.
    // We should draw boxes with smaller X+Y first.
    
    for (let layer = 0; layer < data.totalLayers; layer++) {
        const isEven = (layer % 2) !== 0; // 0-indexed: 0 is Layer 1 (Odd), 1 is Layer 2 (Even)
        const layerData = (isEven && data.evenLayer) ? data.evenLayer : data.oddLayer;
        const z = layer * data.layerHeight;

        // Sort boxes in this layer
        // We copy to sort safely
        const sortedBoxes = [...layerData.positions].sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y);
        });

        for (const box of sortedBoxes) {
            drawBox(box, z, data.layerHeight);
        }
    }

  }, [data, viewMode]);


  // 2D SVG Render Helper
  const render2DLayer = (layerData: any, label: string) => {
    if (!layerData) return null;
    const scale = 0.4;
    const svgWidth = PALLET_L * scale + 40;
    const svgHeight = PALLET_W * scale + 40;

    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{label}</h3>
        <div className="border border-gray-300 bg-white rounded-lg shadow-sm p-4 overflow-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`-20 -20 ${PALLET_L + 40} ${PALLET_W + 40}`}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <rect x={0} y={0} width={PALLET_L} height={PALLET_W} fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
            <text x={PALLET_L / 2} y={-5} textAnchor="middle" fontSize="24" fill="#6b7280">{PALLET_L}mm</text>
            <text x={-5} y={PALLET_W / 2} textAnchor="middle" fontSize="24" fill="#6b7280" transform={`rotate(-90, -5, ${PALLET_W / 2})`}>{PALLET_W}mm</text>
            {layerData.positions.map((box: any, idx: number) => (
              <g key={idx}>
                <rect
                  x={box.x} y={box.y} width={box.length} height={box.width}
                  fill="#60a5fa" stroke="#1e40af" strokeWidth="2" opacity="0.9"
                />
                {box.length > 100 && box.width > 60 && (
                   <text x={box.x + box.length / 2} y={box.y + box.width / 2} textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="white" className="pointer-events-none">{idx + 1}</text>
                )}
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-2 text-sm text-gray-600">
            <p>單層數量: {layerData.totalBoxes} 箱 | 排列: {layerData.patternName}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* View Toggle Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${viewMode === '3d' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <BoxIcon className="w-4 h-4" /> 3D 預覽 (參考圖)
        </button>
        <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${viewMode === '2d' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <LayoutGrid className="w-4 h-4" /> 2D 平面圖 (每一層)
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === '3d' ? (
             <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 p-4">
                 <div className="w-full max-w-4xl overflow-hidden flex justify-center">
                    <canvas 
                        ref={canvasRef} 
                        className="max-w-full h-auto"
                        style={{ height: '500px' }}
                    />
                 </div>
                 <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> 
                    示意圖僅供參考。請依實際貨物穩定度調整堆疊。
                 </p>
             </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {render2DLayer(data.oddLayer, '單數層 (第 1, 3, 5... 層)')}
                {data.evenLayer ? (
                    render2DLayer(data.evenLayer, '雙數層 (第 2, 4, 6... 層)')
                ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[300px] bg-gray-50 text-gray-500 p-8">
                        <p className="text-xl font-medium mb-2">雙數層同單數層</p>
                        <p className="text-center text-sm">若旋轉排列無法增加數量，建議保持相同方向以最大化空間利用。</p>
                        <div className="opacity-50 mt-4 scale-75 origin-top">
                            {render2DLayer(data.oddLayer, '示意圖')}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};