import { useState, useCallback, useMemo, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FURNITURE_CATALOG, SPACE_TEMPLATES } from './types';
import type { PlacedItem, SpaceType, ViewMode, FurnitureItem } from './types';
import Scene3D from './components/Scene3D';
import FloorPlan from './components/FloorPlan';
import { 
  Eye, Grid3X3, Palette, Calculator, Flame, Download, 
  Coffee, Laptop, ShoppingBag, UtensilsCrossed, Plus, 
  RotateCw, Trash2, ChevronRight, X, Check, Move, MousePointer
} from 'lucide-react';

// Helper to create placed items
const createPlacedItem = (furnitureId: string, x: number, z: number, rotation = 0): PlacedItem => {
  const template = FURNITURE_CATALOG.find(f => f.id === furnitureId)!;
  return {
    id: `${furnitureId}-${Math.random().toString(36).slice(2, 8)}`,
    furnitureType: furnitureId,
    x, z, rotation,
    template,
  };
};

// Default layouts for each template
const getDefaultItems = (type: SpaceType): PlacedItem[] => {
  switch (type) {
    case 'cafe':
      return [
        createPlacedItem('cafe-counter', 0, -2.2),
        createPlacedItem('cafe-table-round', -2, 0),
        createPlacedItem('cafe-table-round', 0, 0),
        createPlacedItem('cafe-table-round', 2, 0),
        createPlacedItem('cafe-chair', -2.5, 0.5),
        createPlacedItem('cafe-chair', -1.5, 0.5),
        createPlacedItem('cafe-chair', -0.5, 0.5),
        createPlacedItem('cafe-chair', 0.5, 0.5),
        createPlacedItem('cafe-chair', 1.5, 0.5),
        createPlacedItem('cafe-chair', 2.5, 0.5),
        createPlacedItem('cafe-display', -3.2, -2),
        createPlacedItem('cafe-bar-stool', -0.8, -1.6),
        createPlacedItem('cafe-bar-stool', 0, -1.6),
        createPlacedItem('cafe-bar-stool', 0.8, -1.6),
      ];
    case 'coworking':
      return [
        createPlacedItem('office-desk', -2.5, -1.5),
        createPlacedItem('office-desk', -2.5, 0),
        createPlacedItem('office-desk', -2.5, 1.5),
        createPlacedItem('office-desk', 2.5, -1.5),
        createPlacedItem('office-desk', 2.5, 0),
        createPlacedItem('office-desk', 2.5, 1.5),
        createPlacedItem('office-chair', -2.5, -0.8),
        createPlacedItem('office-chair', -2.5, 0.7),
        createPlacedItem('office-chair', -2.5, 2.2),
        createPlacedItem('office-chair', 2.5, -0.8),
        createPlacedItem('office-chair', 2.5, 0.7),
        createPlacedItem('office-chair', 2.5, 2.2),
        createPlacedItem('meeting-table', 0, 2.5),
        createPlacedItem('bookshelf', -4.5, -3.5),
        createPlacedItem('lounge-sofa', 0, -2.5),
      ];
    case 'boutique':
      return [
        createPlacedItem('retail-rack', -2, -1),
        createPlacedItem('retail-rack', -2, 1),
        createPlacedItem('retail-rack', 2, -1),
        createPlacedItem('retail-rack', 2, 1),
        createPlacedItem('retail-shelf', -3, -3.5),
        createPlacedItem('retail-shelf', 3, -3.5),
        createPlacedItem('cash-register', 0, -3.8),
        createPlacedItem('fitting-room', -2.5, 3.5),
        createPlacedItem('fitting-room', 2.5, 3.5),
        createPlacedItem('mannequin', 0, 0),
        createPlacedItem('mannequin', -0.8, 2),
        createPlacedItem('mannequin', 0.8, 2),
      ];
    case 'restaurant':
      return [
        createPlacedItem('dining-table-4', -2.5, -1),
        createPlacedItem('dining-table-4', 0, -1),
        createPlacedItem('dining-table-4', 2.5, -1),
        createPlacedItem('dining-table-4', -2.5, 1.5),
        createPlacedItem('dining-table-4', 0, 1.5),
        createPlacedItem('dining-table-4', 2.5, 1.5),
        createPlacedItem('dining-chair', -3, -1),
        createPlacedItem('dining-chair', -2, -1),
        createPlacedItem('dining-chair', -0.5, -1),
        createPlacedItem('dining-chair', 0.5, -1),
        createPlacedItem('dining-chair', 2, -1),
        createPlacedItem('dining-chair', 3, -1),
        createPlacedItem('host-stand', 0, -3),
        createPlacedItem('wine-rack', -4, -2.5),
        createPlacedItem('booth-seat', 0, 3),
      ];
    default:
      return [];
  }
};

const templateIcons: Record<SpaceType, any> = {
  cafe: Coffee,
  coworking: Laptop,
  boutique: ShoppingBag,
  restaurant: UtensilsCrossed,
};

const getCatalogForSpace = (spaceType: SpaceType): FurnitureItem[] => {
  const prefixes: Record<SpaceType, string> = {
    cafe: 'cafe',
    coworking: 'office',
    boutique: 'retail',
    restaurant: 'dining',
  };
  const prefix = prefixes[spaceType];
  const specific = FURNITURE_CATALOG.filter(f => f.id.startsWith(prefix));
  const common = FURNITURE_CATALOG.filter(f => 
    f.id === 'meeting-table' || f.id === 'lounge-sofa' || f.id === 'host-stand'
  );
  return [...specific, ...common.slice(0, 2)];
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [spaceType, setSpaceType] = useState<SpaceType>('cafe');
  const [brandColor, setBrandColor] = useState('#D97706');
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>(getDefaultItems('cafe'));
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showFireSafety, setShowFireSafety] = useState(false);
  const [showCostPanel, setShowCostPanel] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const currentTemplate = SPACE_TEMPLATES.find(t => t.id === spaceType)!;
  const roomWidth = currentTemplate.roomWidth;
  const roomDepth = currentTemplate.roomDepth;
  const catalog = useMemo(() => getCatalogForSpace(spaceType), [spaceType]);

  // Capacity calculations
  const totalSeats = useMemo(() => {
    return placedItems.reduce((sum, item) => {
      const seats = item.template.seats || 0;
      return sum + seats;
    }, 0);
  }, [placedItems]);

  const area = roomWidth * roomDepth;
  const seatsPerSqm = area > 0 ? (totalSeats / area).toFixed(2) : '0';
  const maxCapacity = Math.floor(area * 0.5); // 0.5 seats per sqm recommended
  const capacityPercent = Math.min((totalSeats / maxCapacity) * 100, 100);

  // Cost calculations
  const totalCost = useMemo(() => {
    return placedItems.reduce((sum, item) => sum + item.template.cost, 0);
  }, [placedItems]);

  const costByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    placedItems.forEach(item => {
      cats[item.template.category] = (cats[item.template.category] || 0) + item.template.cost;
    });
    return cats;
  }, [placedItems]);

  // Place item
  const handlePlaceItem = useCallback((x: number, z: number) => {
    if (!activeTool) return;
    const template = catalog.find(f => f.id === activeTool);
    if (!template) return;
    
    // Clamp to room bounds
    const clampedX = Math.max(-roomWidth / 2 + template.width / 2, Math.min(roomWidth / 2 - template.width / 2, x));
    const clampedZ = Math.max(-roomDepth / 2 + template.depth / 2, Math.min(roomDepth / 2 - template.depth / 2, z));
    
    const newItem: PlacedItem = {
      id: `${activeTool}-${Date.now()}`,
      furnitureType: activeTool,
      x: clampedX,
      z: clampedZ,
      rotation: 0,
      template,
    };
    setPlacedItems(prev => [...prev, newItem]);
  }, [activeTool, catalog, roomWidth, roomDepth]);

  // Delete selected item
  const handleDeleteSelected = useCallback(() => {
    if (!selectedItem) return;
    setPlacedItems(prev => prev.filter(item => item.id !== selectedItem));
    setSelectedItem(null);
  }, [selectedItem]);

  // Rotate selected item
  const handleRotateSelected = useCallback(() => {
    if (!selectedItem) return;
    setPlacedItems(prev => prev.map(item => 
      item.id === selectedItem ? { ...item, rotation: (item.rotation + 45) % 360 } : item
    ));
  }, [selectedItem]);

  // Export to PDF
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('SpaceForge — Layout Plan', 20, 25);
        doc.setFontSize(10);
        doc.text(`Space Type: ${currentTemplate.name}`, 20, 40);
        doc.text(`Room: ${roomWidth}m × ${roomDepth}m (${area} sqm)`, 20, 48);
        doc.text(`Total Seats: ${totalSeats}`, 20, 56);
        doc.text(`Total Cost: $${totalCost.toLocaleString()}`, 20, 64);
        doc.text(`Brand Color: ${brandColor}`, 20, 72);
        
        doc.setFontSize(12);
        doc.text('Items Placed:', 20, 88);
        
        let y = 96;
        placedItems.forEach((item, i) => {
          doc.setFontSize(9);
          doc.text(`${i + 1}. ${item.template.name} — $${item.template.cost}`, 25, y);
          y += 7;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        
        doc.save(`spaceforge-${spaceType}-layout.pdf`);
      } catch (e) {
        console.error('Export failed:', e);
      }
      setIsExporting(false);
    }, 1500);
  }, [placedItems, spaceType, currentTemplate, roomWidth, roomDepth, area, totalSeats, totalCost, brandColor]);

  // Load template defaults
  const loadTemplate = useCallback((type: SpaceType) => {
    setSpaceType(type);
    setPlacedItems(getDefaultItems(type));
    setSelectedItem(null);
    setActiveTool(null);
    setShowTemplates(false);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedItem(null);
      setActiveTool(null);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedItem) {
        setPlacedItems(prev => prev.filter(item => item.id !== selectedItem));
        setSelectedItem(null);
      }
    }
    if (e.key === 'r' || e.key === 'R') {
      if (selectedItem) {
        setPlacedItems(prev => prev.map(item => 
          item.id === selectedItem ? { ...item, rotation: (item.rotation + 45) % 360 } : item
        ));
      }
    }
    if (e.key === '1') setViewMode('perspective');
    if (e.key === '2') setViewMode('topdown');
  }, [selectedItem]);

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFAF7] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-[#E8E0D4] flex items-center px-4 gap-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor }}>
            <Grid3X3 size={16} color="white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            SpaceForge
          </h1>
        </div>
        
        <div className="h-6 w-px bg-[#E8E0D4]" />
        
        {/* View Toggle */}
        <div className="flex items-center bg-[#F5F0E8] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('perspective')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'perspective' ? 'bg-white shadow-sm text-[#2D2D2D]' : 'text-[#4A4A4A] hover:text-[#2D2D2D]'
            }`}
          >
            <Eye size={13} /> 3D View
          </button>
          <button
            onClick={() => setViewMode('topdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'topdown' ? 'bg-white shadow-sm text-[#2D2D2D]' : 'text-[#4A4A4A] hover:text-[#2D2D2D]'
            }`}
          >
            <Grid3X3 size={13} /> Floor Plan
          </button>
        </div>

        <div className="h-6 w-px bg-[#E8E0D4]" />

        {/* Template Selector */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F5F0E8] hover:bg-[#E8E0D4] transition-colors"
        >
          <span>{currentTemplate.icon}</span>
          <span>{currentTemplate.name}</span>
          <ChevronRight size={12} className={`transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
        </button>

        <div className="flex-1" />

        {/* Brand Color */}
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-[#4A4A4A]" />
          <div className="flex items-center gap-1">
            {['#D97706', '#059669', '#7C3AED', '#DC2626', '#2563EB', '#DB2777'].map(color => (
              <button
                key={color}
                onClick={() => setBrandColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                  brandColor === color ? 'border-[#2D2D2D] scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-5 h-5 rounded-full cursor-pointer"
              title="Custom color"
            />
          </div>
        </div>

        {/* Fire Safety Toggle */}
        <button
          onClick={() => setShowFireSafety(!showFireSafety)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showFireSafety ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#F5F0E8] text-[#4A4A4A] hover:bg-[#E8E0D4]'
          }`}
        >
          <Flame size={13} /> Safety
        </button>

        {/* Cost Panel Toggle */}
        <button
          onClick={() => setShowCostPanel(!showCostPanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showCostPanel ? 'text-white border' : 'bg-[#F5F0E8] text-[#4A4A4A] hover:bg-[#E8E0D4]'
          }`}
          style={showCostPanel ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
        >
          <Calculator size={13} /> Costs
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2D2D2D] text-white hover:bg-[#4A4A4A] transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          {isExporting ? 'Building...' : 'Export PDF'}
        </button>
      </header>

      {/* Template Dropdown */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-[200px] z-40 bg-white rounded-xl shadow-xl border border-[#E8E0D4] p-3 w-80"
          >
            <p className="text-xs text-[#4A4A4A] mb-2 font-medium">Choose a space template</p>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_TEMPLATES.map(template => {
                const Icon = templateIcons[template.id];
                return (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      spaceType === template.id
                        ? 'border-2 shadow-sm'
                        : 'border-[#E8E0D4] hover:border-[#D0C8BC] hover:shadow-sm'
                    }`}
                    style={spaceType === template.id ? { borderColor: brandColor } : {}}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <p className="text-sm font-medium mt-1">{template.name}</p>
                    <p className="text-[10px] text-[#4A4A4A] mt-0.5">{template.description}</p>
                    <p className="text-[10px] text-[#4A4A4A] mt-0.5">{template.roomWidth}m × {template.roomDepth}m</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar - Furniture */}
        <aside className="w-56 bg-white border-r border-[#E8E0D4] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#E8E0D4]">
            <h3 className="text-xs font-semibold text-[#4A4A4A] uppercase tracking-wider">Furniture</h3>
            <p className="text-[10px] text-[#999] mt-0.5">Click to select, then click in viewport to place</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Select Tool */}
            <button
              onClick={() => setActiveTool(null)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs mb-2 ${
                activeTool === null ? 'bg-[#F5F0E8] border border-[#D0C8BC]' : 'hover:bg-[#F5F0E8] border border-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-[#2D2D2D]">
                <MousePointer size={14} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2D2D2D]">Select / Move</p>
                <p className="text-[10px] text-[#999]">Click items to select</p>
              </div>
              {activeTool === null && <Check size={12} className="text-[#2D2D2D]" />}
            </button>
            
            <div className="h-px bg-[#E8E0D4] mb-2" />
            
            {catalog.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTool(activeTool === item.id ? null : item.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs ${
                  activeTool === item.id
                    ? 'shadow-sm border'
                    : 'hover:bg-[#F5F0E8] border border-transparent'
                }`}
                style={activeTool === item.id ? { backgroundColor: `${brandColor}15`, borderColor: brandColor } : {}}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.category === 'counter' || item.category === 'fixture' ? brandColor : (item.color || '#666') }}
                >
                  {item.category === 'table' && <div className="w-4 h-3 border-2 border-white rounded-sm" />}
                  {item.category === 'seating' && <div className="w-3 h-3 bg-white rounded-sm" />}
                  {item.category === 'counter' && <div className="w-5 h-2 bg-white rounded-sm" />}
                  {item.category === 'fixture' && <div className="w-3 h-4 bg-white rounded-sm" />}
                  {item.category === 'storage' && <div className="w-3 h-4 bg-white rounded-sm" />}
                  {item.category === 'decoration' && <div className="w-3 h-3 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D2D2D] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#999]">${item.cost}{item.seats ? ` · ${item.seats} seat${item.seats > 1 ? 's' : ''}` : ''}</p>
                </div>
                {activeTool === item.id && <Plus size={12} style={{ color: brandColor }} />}
              </button>
            ))}
          </div>

          {/* Active Tool Indicator */}
          {activeTool && (
            <div className="p-3 border-t border-[#E8E0D4] bg-[#F5F0E8]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: brandColor }}>
                  Placing: {catalog.find(f => f.id === activeTool)?.name}
                </span>
                <button onClick={() => setActiveTool(null)} className="text-[#999] hover:text-[#2D2D2D]">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[10px] text-[#999] mt-1">Click in the viewport to place</p>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="p-2 border-t border-[#E8E0D4] flex gap-1">
            <button
              onClick={() => setPlacedItems(getDefaultItems(spaceType))}
              className="flex-1 text-[10px] py-1.5 px-2 rounded-md bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#4A4A4A] font-medium transition-colors"
              title="Reset to default layout"
            >
              Reset
            </button>
            <button
              onClick={() => { setPlacedItems([]); setSelectedItem(null); }}
              className="flex-1 text-[10px] py-1.5 px-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
              title="Clear all items"
            >
              Clear All
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 relative overflow-hidden">
          {viewMode === 'perspective' ? (
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-[#F5F0E8]">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-[#E8E0D4] border-t-[#D97706] rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-[#4A4A4A] mt-3">Loading 3D Scene...</p>
                </div>
              </div>
            }>
              <Scene3D
                placedItems={placedItems}
                brandColor={brandColor}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
                showFireSafety={showFireSafety}
                viewMode={viewMode}
                selectedItem={selectedItem}
                activeTool={activeTool}
                onPlaceItem={handlePlaceItem}
                onSelectItem={setSelectedItem}
              />
            </Suspense>
          ) : (
            <FloorPlan
              placedItems={placedItems}
              brandColor={brandColor}
              roomWidth={roomWidth}
              roomDepth={roomDepth}
              showFireSafety={showFireSafety}
              selectedItem={selectedItem}
              onPlaceItem={handlePlaceItem}
              onSelectItem={setSelectedItem}
              activeTool={activeTool}
            />
          )}

          {/* Viewport Quick Stats */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-[#E8E0D4]">
              <p className="text-[10px] text-[#4A4A4A] font-medium">
                {activeTool ? (
                  <span className="flex items-center gap-1">
                    <Plus size={10} style={{ color: brandColor }} />
                    Click to place {catalog.find(f => f.id === activeTool)?.name}
                  </span>
                ) : selectedItem ? (
                  <span className="flex items-center gap-1">
                    <RotateCw size={10} className="text-[#4A4A4A]" />
                    Use controls below to rotate or delete
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MousePointer size={10} className="text-[#999]" />
                    Select a furniture item to start placing
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Right side quick metrics */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-[#E8E0D4]">
              <p className="text-[9px] text-[#999] uppercase tracking-wider">Seats</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>{totalSeats}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-[#E8E0D4]">
              <p className="text-[9px] text-[#999] uppercase tracking-wider">Cost</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>${totalCost >= 1000 ? `${(totalCost/1000).toFixed(1)}k` : totalCost}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-[#E8E0D4]">
              <p className="text-[9px] text-[#999] uppercase tracking-wider">Density</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>{seatsPerSqm}/m²</p>
            </div>
          </div>

          {/* Viewport Overlay - Item Actions */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-xl shadow-lg border border-[#E8E0D4] px-4 py-2"
              >
                <span className="text-xs font-medium text-[#2D2D2D]">
                  {placedItems.find(i => i.id === selectedItem)?.template.name}
                </span>
                <div className="h-4 w-px bg-[#E8E0D4]" />
                <button
                  onClick={handleRotateSelected}
                  className="p-1.5 rounded-md hover:bg-[#F5F0E8] transition-colors"
                  title="Rotate"
                >
                  <RotateCw size={14} className="text-[#4A4A4A]" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-md hover:bg-[#F5F0E8] transition-colors"
                  title="Deselect"
                >
                  <X size={14} className="text-[#4A4A4A]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Export Animation Overlay */}
          <AnimatePresence>
            {isExporting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl p-8 shadow-2xl text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Download size={28} color="white" />
                  </motion.div>
                  <p className="text-sm font-medium text-[#2D2D2D]">Building your layout sheet...</p>
                  <p className="text-xs text-[#999] mt-1">Generating PDF with floor plan & cost breakdown</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Panel - Cost Estimator */}
        <AnimatePresence>
          {showCostPanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-l border-[#E8E0D4] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-[#E8E0D4]">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Cost Estimator</h3>
                <p className="text-[10px] text-[#999] mt-0.5">Live totals as you design</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Total Cost */}
                <div className="bg-[#F5F0E8] rounded-xl p-4">
                  <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium">Total Estimate</p>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>
                    ${totalCost.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#999] mt-1">{placedItems.length} items placed</p>
                </div>

                {/* Cost by Category */}
                <div>
                  <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium mb-2">Breakdown</p>
                  {Object.entries(costByCategory).map(([cat, cost]) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 border-b border-[#F5F0E8]">
                      <span className="text-xs text-[#4A4A4A] capitalize">{cat}</span>
                      <span className="text-xs font-medium">${cost.toLocaleString()}</span>
                    </div>
                  ))}
                  {Object.keys(costByCategory).length === 0 && (
                    <p className="text-xs text-[#999] italic">No items placed yet</p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium mb-2">Capacity</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-[#4A4A4A]">Total Seats</span>
                      <span className="text-xs font-bold">{totalSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#4A4A4A]">Seats / sqm</span>
                      <span className="text-xs font-bold">{seatsPerSqm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#4A4A4A]">Floor Area</span>
                      <span className="text-xs font-bold">{area} sqm</span>
                    </div>
                    {/* Capacity bar */}
                    <div className="mt-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-[#999]">Capacity Usage</span>
                        <span className="text-[10px] font-medium" style={{ color: capacityPercent > 80 ? '#EF4444' : brandColor }}>
                          {Math.round(capacityPercent)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#F5F0E8] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: capacityPercent > 80 ? '#EF4444' : brandColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${capacityPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-[10px] text-[#999] mt-1">
                        Recommended max: {maxCapacity} seats (0.5/sqm)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <p className="text-[10px] text-[#4A4A4A] uppercase tracking-wider font-medium mb-2">Placed Items</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {placedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#F5F0E8] cursor-pointer"
                        onClick={() => setSelectedItem(item.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.template.category === 'counter' || item.template.category === 'fixture' ? brandColor : item.template.color }} />
                          <span className="text-[11px] text-[#4A4A4A]">{item.template.name}</span>
                        </div>
                        <span className="text-[10px] text-[#999]">${item.template.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats Footer */}
              <div className="p-3 border-t border-[#E8E0D4] bg-[#FAFAF7]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>{placedItems.length}</p>
                    <p className="text-[9px] text-[#999]">Items</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk', color: brandColor }}>{totalSeats}</p>
                    <p className="text-[9px] text-[#999]">Seats</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#FAFAF7] via-[#F5F0E8] to-[#E8E0D4] blueprint-grid"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center max-w-md px-8"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                <Grid3X3 size={32} color="white" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold text-[#2D2D2D] mb-2"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                SpaceForge
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-[#4A4A4A] mb-6"
              >
                3D Commercial Space Planner for Cafés, Offices & Retail
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-3 mb-8"
              >
                {['☕ Cafés', '💻 Co-Working', '🛍️ Boutique', '🍽️ Restaurants'].map(item => (
                  <span key={item} className="text-xs bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#E8E0D4]">
                    {item}
                  </span>
                ))}
              </motion.div>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => setShowWelcome(false)}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ backgroundColor: brandColor }}
              >
                Start Designing →
              </motion.button>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-[10px] text-[#999] mt-4"
              >
                Press 1 for 3D view · Press 2 for floor plan · R to rotate · Del to remove
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-white border-t border-[#E8E0D4] flex items-center px-4 gap-4 text-[10px] text-[#999]">
        <div className="flex items-center gap-1.5">
          <Move size={10} />
          <span>{roomWidth}m × {roomDepth}m ({area} sqm)</span>
        </div>
        <div className="h-3 w-px bg-[#E8E0D4]" />
        <span>{placedItems.length} items</span>
        <div className="h-3 w-px bg-[#E8E0D4]" />
        <span>{totalSeats} seats ({seatsPerSqm}/sqm)</span>
        <div className="h-3 w-px bg-[#E8E0D4]" />
        <span>Total: ${totalCost.toLocaleString()}</span>
        <div className="flex-1" />
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          {viewMode === 'perspective' ? '3D Perspective' : 'Top-Down Floor Plan'}
        </span>
      </footer>
    </div>
  );
}
