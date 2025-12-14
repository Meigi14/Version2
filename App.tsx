import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { PalletVisualizer } from './components/PalletVisualizer';
import { parseExcel } from './utils/excelParser';
import { calculatePalletStack } from './utils/packer';
import { MaterialItem, PackingResult } from './types';
import { Package, Ruler, Layers, Box, AlertTriangle, Download, Search } from 'lucide-react';

const App: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>(1350);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      const data = await parseExcel(file);
      if (data.length === 0) {
        setError("未能從檔案中讀取到有效的物料數據。請確保格式為：Material, Length, Width, Height。");
        return;
      }
      setMaterials(data);
      setSelectedMaterialId(data[0].id);
    } catch (err) {
      console.error(err);
      setError("讀取 Excel 檔案時發生錯誤，請檢查檔案格式。");
    }
  };

  const selectedMaterial = useMemo(() => 
    materials.find(m => m.id === selectedMaterialId), 
    [materials, selectedMaterialId]
  );

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materials;
    const lower = searchTerm.toLowerCase();
    return materials.filter(m => 
      m.name.toLowerCase().includes(lower)
    );
  }, [materials, searchTerm]);

  const packingResult: PackingResult | null = useMemo(() => {
    if (!selectedMaterial) return null;
    return calculatePalletStack(selectedMaterial, maxHeight);
  }, [selectedMaterial, maxHeight]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              智能棧板規劃系統 <span className="text-slate-400 text-sm font-normal ml-2">Smart Pallet Packer</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
             <div className="hidden md:flex flex-col items-end">
                 <span className="text-slate-400">平板尺寸</span>
                 <span className="font-mono font-bold">1180 x 980 mm</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Controls Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
             <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="w-full md:w-auto flex-grow">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">1. 導入數據</h2>
                    <FileUpload onFileUpload={handleFileUpload} />
                </div>
                
                <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">2. 設定限制</h2>
                    <div className="flex flex-col gap-3">
                        <label className="text-sm text-gray-600 font-medium">最大堆疊高度 (包含貨物)</label>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setMaxHeight(1350)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${maxHeight === 1350 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                             >
                                 1350 mm (空運/標準)
                             </button>
                             <button 
                                onClick={() => setMaxHeight(700)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${maxHeight === 700 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                             >
                                 700 mm (散貨/限高)
                             </button>
                        </div>
                    </div>
                </div>
             </div>
             
             {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
             )}
          </div>

          {/* Results Section */}
          {materials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Sidebar: Material List */}
              <div className="md:col-span-3 lg:col-span-3 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <Layers className="w-5 h-5" /> 選擇物料
                </h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="搜尋物料..." 
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        {filteredMaterials.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                找不到符合的物料
                            </div>
                        ) : (
                            filteredMaterials.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMaterialId(m.id)}
                                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedMaterialId === m.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="font-bold text-gray-800 truncate">{m.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono">
                                        {m.length}x{m.width}x{m.height} mm
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
              </div>

              {/* Main Visualization & Stats */}
              <div className="md:col-span-9 lg:col-span-9">
                 {packingResult && (
                     <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Stats Header */}
                        <div className="bg-slate-50 border-b border-gray-200 p-6">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{packingResult.material.name}</h2>
                                    <div className="flex gap-4 text-sm text-gray-600 font-mono">
                                        <span>L: {packingResult.material.length}</span>
                                        <span>W: {packingResult.material.width}</span>
                                        <span>H: {packingResult.material.height}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <span className="block text-xs text-gray-500 uppercase">總箱數</span>
                                        <span className="block text-2xl font-bold text-blue-600">{packingResult.totalBoxes}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <span className="block text-xs text-gray-500 uppercase">每層箱數</span>
                                        <span className="block text-2xl font-bold text-gray-800">{packingResult.oddLayer.totalBoxes}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <span className="block text-xs text-gray-500 uppercase">總層數</span>
                                        <span className="block text-2xl font-bold text-gray-800">{packingResult.totalLayers}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <span className="block text-xs text-gray-500 uppercase">堆疊高度</span>
                                        <span className={`block text-2xl font-bold ${packingResult.stackHeight > maxHeight ? 'text-red-500' : 'text-green-600'}`}>
                                            {packingResult.stackHeight.toFixed(1)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">/ {maxHeight} mm</span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Visualizer Area */}
                        <div className="p-6">
                             <PalletVisualizer data={packingResult} />
                        </div>
                     </div>
                 )}
              </div>

            </div>
          )}
          
          {materials.length === 0 && !error && (
             <div className="text-center py-20 opacity-50">
                 <Box className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                 <p className="text-xl text-gray-500">請先上傳 Excel 檔案以開始計算</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;