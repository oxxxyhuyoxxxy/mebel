import { useRef, useState, useCallback } from 'react';
import { PlacedItem } from '../types';

interface FloorPlanProps {
  placedItems: PlacedItem[];
  brandColor: string;
  roomWidth: number;
  roomDepth: number;
  showFireSafety: boolean;
  selectedItem: string | null;
  onPlaceItem: (x: number, z: number) => void;
  onSelectItem: (id: string | null) => void;
  activeTool: string | null;
}

export default function FloorPlan({ placedItems, brandColor, roomWidth, roomDepth, showFireSafety, selectedItem, onPlaceItem, onSelectItem, activeTool }: FloorPlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; z: number } | null>(null);
  
  const padding = 40;
  const svgWidth = 600;
  const svgHeight = 500;
  const scaleX = (svgWidth - padding * 2) / roomWidth;
  const scaleZ = (svgHeight - padding * 2) / roomDepth;
  const scale = Math.min(scaleX, scaleZ);
  
  const toSvgX = (x: number) => padding + (x + roomWidth / 2) * scale;
  const toSvgZ = (z: number) => padding + (z + roomDepth / 2) * scale;
  const fromSvg = (svgX: number, svgZ: number) => ({
    x: (svgX - padding) / scale - roomWidth / 2,
    z: (svgZ - padding) / scale - roomDepth / 2,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const svgZ = ((e.clientY - rect.top) / rect.height) * svgHeight;
    const pos = fromSvg(svgX, svgZ);
    setHoverPos(pos);
  }, [roomWidth, roomDepth, scale]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const svgZ = ((e.clientY - rect.top) / rect.height) * svgHeight;
    const pos = fromSvg(svgX, svgZ);
    
    // Check if clicking on existing item
    const clickedItem = placedItems.find(item => {
      const dx = Math.abs(pos.x - item.x);
      const dz = Math.abs(pos.z - item.z);
      return dx < item.template.width / 2 && dz < item.template.depth / 2;
    });
    
    if (clickedItem) {
      onSelectItem(clickedItem.id);
    } else if (activeTool) {
      onPlaceItem(pos.x, pos.z);
    } else {
      onSelectItem(null);
    }
  }, [activeTool, placedItems, onPlaceItem, onSelectItem]);

  const getItemColor = (item: PlacedItem) => {
    if (item.template.category === 'counter' || item.template.category === 'fixture') {
      return brandColor;
    }
    return item.template.color || '#666666';
  };

  const renderFirePaths = () => {
    if (!showFireSafety) return null;
    const exits = [
      { x: 0, z: roomDepth / 2, label: 'A' },
      { x: -roomWidth / 2, z: 0, label: 'B' },
      { x: roomWidth / 2, z: 0, label: 'C' },
    ];

    return exits.map((exit, i) => (
      <g key={`egress-${i}`}>
        <line
          x1={toSvgX(0)}
          y1={toSvgZ(0)}
          x2={toSvgX(exit.x)}
          y2={toSvgZ(exit.z)}
          stroke="#FF4444"
          strokeWidth="2"
          strokeDasharray="8,4"
          className="egress-path"
          opacity={0.7}
        />
        <circle cx={toSvgX(exit.x)} cy={toSvgZ(exit.z)} r={8} fill="#00CC00" opacity={0.8} />
        <text x={toSvgX(exit.x)} y={toSvgZ(exit.z) + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {exit.label}
        </text>
      </g>
    ));
  };

  return (
    <div className="w-full h-full flex items-center justify-center blueprint-grid bg-[#FAFAF7] relative overflow-hidden">
      {/* Scale indicator */}
      <div className="absolute top-3 left-3 text-xs text-[#4A4A4A] bg-white/80 px-2 py-1 rounded shadow-sm">
        Scale: 1:{Math.round(1 / scale * 100)} | {roomWidth}m × {roomDepth}m
      </div>
      
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full max-w-[600px] max-h-[500px]"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ cursor: activeTool ? 'crosshair' : 'default' }}
      >
        {/* Grid */}
        <defs>
          <pattern id="smallGrid" width={scale} height={scale} patternUnits="userSpaceOnUse"
            x={padding + (roomWidth / 2 * scale) % scale} y={padding + (roomDepth / 2 * scale) % scale}>
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#E0D8CC" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse"
            x={padding + (roomWidth / 2 * scale) % (scale * 5)} y={padding + (roomDepth / 2 * scale) % (scale * 5)}>
            <rect width={scale * 5} height={scale * 5} fill="url(#smallGrid)" />
            <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#D0C8BC" strokeWidth="1" />
          </pattern>
        </defs>
        
        {/* Floor area */}
        <rect
          x={toSvgX(-roomWidth / 2)}
          y={toSvgZ(-roomDepth / 2)}
          width={roomWidth * scale}
          height={roomDepth * scale}
          fill="url(#grid)"
          stroke="#2D2D2D"
          strokeWidth="2"
        />
        
        {/* Room dimensions */}
        <text x={svgWidth / 2} y={padding - 10} textAnchor="middle" fontSize="11" fill="#4A4A4A" fontFamily="Inter">
          {roomWidth}m
        </text>
        <text x={padding - 10} y={svgHeight / 2} textAnchor="middle" fontSize="11" fill="#4A4A4A" fontFamily="Inter" transform={`rotate(-90, ${padding - 10}, ${svgHeight / 2})`}>
          {roomDepth}m
        </text>

        {/* Placed items */}
        {placedItems.map((item) => {
          const isSelected = selectedItem === item.id;
          const w = item.template.width * scale;
          const d = item.template.depth * scale;
          const cx = toSvgX(item.x);
          const cy = toSvgZ(item.z);
          
          return (
            <g key={item.id} transform={`rotate(${item.rotation}, ${cx}, ${cy})`}>
              <rect
                x={cx - w / 2}
                y={cy - d / 2}
                width={w}
                height={d}
                fill={getItemColor(item)}
                stroke={isSelected ? brandColor : '#2D2D2D'}
                strokeWidth={isSelected ? 2 : 1}
                opacity={0.85}
                rx={2}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onSelectItem(item.id); }}
              />
              {/* Item label */}
              {w > 20 && d > 15 && (
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="500" pointerEvents="none">
                  {item.template.name.split(' ').slice(0, 2).join(' ')}
                </text>
              )}
              {/* Selection ring */}
              {isSelected && (
                <rect
                  x={cx - w / 2 - 3}
                  y={cy - d / 2 - 3}
                  width={w + 6}
                  height={d + 6}
                  fill="none"
                  stroke={brandColor}
                  strokeWidth="1.5"
                  strokeDasharray="4,2"
                  rx={3}
                />
              )}
            </g>
          );
        })}

        {/* Hover preview */}
        {hoverPos && activeTool && (
          <rect
            x={toSvgX(hoverPos.x) - 15}
            y={toSvgZ(hoverPos.z) - 15}
            width={30}
            height={30}
            fill={brandColor}
            opacity={0.3}
            stroke={brandColor}
            strokeWidth="1"
            strokeDasharray="4,2"
            rx={2}
          />
        )}

        {/* Fire safety paths */}
        {renderFirePaths()}

        {/* Dimension lines - top */}
        <line x1={toSvgX(-roomWidth / 2)} y1={padding - 20} x2={toSvgX(roomWidth / 2)} y2={padding - 20} stroke="#999" strokeWidth="0.5" />
        <line x1={toSvgX(-roomWidth / 2)} y1={padding - 24} x2={toSvgX(-roomWidth / 2)} y2={padding - 16} stroke="#999" strokeWidth="0.5" />
        <line x1={toSvgX(roomWidth / 2)} y1={padding - 24} x2={toSvgX(roomWidth / 2)} y2={padding - 16} stroke="#999" strokeWidth="0.5" />
        
        {/* Dimension lines - left */}
        <line x1={padding - 20} y1={toSvgZ(-roomDepth / 2)} x2={padding - 20} y2={toSvgZ(roomDepth / 2)} stroke="#999" strokeWidth="0.5" />
        <line x1={padding - 24} y1={toSvgZ(-roomDepth / 2)} x2={padding - 16} y2={toSvgZ(-roomDepth / 2)} stroke="#999" strokeWidth="0.5" />
        <line x1={padding - 24} y1={toSvgZ(roomDepth / 2)} x2={padding - 16} y2={toSvgZ(roomDepth / 2)} stroke="#999" strokeWidth="0.5" />

        {/* North indicator */}
        <g transform={`translate(${svgWidth - 30}, ${padding + 10})`}>
          <circle r={12} fill="white" stroke="#2D2D2D" strokeWidth="1" />
          <text y={-2} textAnchor="middle" fontSize="8" fill="#2D2D2D" fontWeight="bold">N</text>
          <line x1={0} y1={-8} x2={0} y2={-4} stroke="#FF4444" strokeWidth="2" />
          <line x1={0} y1={4} x2={0} y2={8} stroke="#2D2D2D" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
