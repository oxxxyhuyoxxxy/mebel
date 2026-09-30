export type SpaceType = 'cafe' | 'coworking' | 'boutique' | 'restaurant';
export type ViewMode = 'topdown' | 'perspective';

export interface FurnitureItem {
  id: string;
  type: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  cost: number;
  seats?: number;
  category: 'seating' | 'table' | 'counter' | 'storage' | 'fixture' | 'decoration';
  icon: string;
  color?: string;
}

export interface PlacedItem {
  id: string;
  furnitureType: string;
  x: number;
  z: number;
  rotation: number;
  template: FurnitureItem;
}

export interface SpaceTemplate {
  id: SpaceType;
  name: string;
  icon: string;
  description: string;
  defaultItems: PlacedItem[];
  roomWidth: number;
  roomDepth: number;
}

export interface AppState {
  viewMode: ViewMode;
  spaceType: SpaceType;
  brandColor: string;
  placedItems: PlacedItem[];
  selectedItem: string | null;
  showFireSafety: boolean;
  showCostPanel: boolean;
  roomWidth: number;
  roomDepth: number;
  isExporting: boolean;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  // Cafe
  { id: 'cafe-table-round', type: 'cafe-table-round', name: 'Round Café Table', width: 0.7, depth: 0.7, height: 0.75, cost: 180, seats: 0, category: 'table', icon: 'circle', color: '#8B6914' },
  { id: 'cafe-chair', type: 'cafe-chair', name: 'Café Chair', width: 0.45, depth: 0.45, height: 0.85, cost: 95, seats: 1, category: 'seating', icon: 'chair', color: '#6B4E1B' },
  { id: 'cafe-counter', type: 'cafe-counter', name: 'Service Counter', width: 2.4, depth: 0.7, height: 1.1, cost: 1200, seats: 0, category: 'counter', icon: 'rectangle', color: '#4A3728' },
  { id: 'cafe-bar-stool', type: 'cafe-bar-stool', name: 'Bar Stool', width: 0.4, depth: 0.4, height: 0.75, cost: 120, seats: 1, category: 'seating', icon: 'chair', color: '#333333' },
  { id: 'cafe-display', type: 'cafe-display', name: 'Pastry Display', width: 0.8, depth: 0.5, height: 1.2, cost: 450, seats: 0, category: 'fixture', icon: 'box', color: '#C4A35A' },
  
  // Co-working
  { id: 'office-desk', type: 'office-desk', name: 'Work Desk', width: 1.4, depth: 0.7, height: 0.75, cost: 350, seats: 1, category: 'table', icon: 'rectangle', color: '#E8DCC8' },
  { id: 'office-chair', type: 'office-chair', name: 'Office Chair', width: 0.55, depth: 0.55, height: 1.1, cost: 280, seats: 1, category: 'seating', icon: 'chair', color: '#2D2D2D' },
  { id: 'meeting-table', type: 'meeting-table', name: 'Meeting Table', width: 2.0, depth: 1.0, height: 0.75, cost: 650, seats: 0, category: 'table', icon: 'rectangle', color: '#D4C5A9' },
  { id: 'bookshelf', type: 'bookshelf', name: 'Bookshelf', width: 1.2, depth: 0.35, height: 2.0, cost: 420, seats: 0, category: 'storage', icon: 'box', color: '#8B7355' },
  { id: 'lounge-sofa', type: 'lounge-sofa', name: 'Lounge Sofa', width: 1.8, depth: 0.8, height: 0.8, cost: 890, seats: 3, category: 'seating', icon: 'rectangle', color: '#5C4033' },
  
  // Boutique
  { id: 'retail-rack', type: 'retail-rack', name: 'Clothing Rack', width: 1.5, depth: 0.5, height: 1.6, cost: 280, seats: 0, category: 'fixture', icon: 'rectangle', color: '#333333' },
  { id: 'retail-shelf', type: 'retail-shelf', name: 'Display Shelf', width: 1.2, depth: 0.4, height: 1.8, cost: 350, seats: 0, category: 'fixture', icon: 'box', color: '#F5F0E8' },
  { id: 'cash-register', type: 'cash-register', name: 'POS Counter', width: 1.0, depth: 0.6, height: 1.0, cost: 550, seats: 0, category: 'counter', icon: 'rectangle', color: '#2D2D2D' },
  { id: 'fitting-room', type: 'fitting-room', name: 'Fitting Room', width: 1.2, depth: 1.2, height: 2.2, cost: 750, seats: 0, category: 'fixture', icon: 'box', color: '#E8DCC8' },
  { id: 'mannequin', type: 'mannequin', name: 'Mannequin Stand', width: 0.5, depth: 0.5, height: 1.7, cost: 180, seats: 0, category: 'decoration', icon: 'circle', color: '#D4C5A9' },
  
  // Restaurant
  { id: 'dining-table-4', type: 'dining-table-4', name: 'Dining Table (4)', width: 1.2, depth: 0.8, height: 0.75, cost: 420, seats: 0, category: 'table', icon: 'rectangle', color: '#8B6914' },
  { id: 'dining-chair', type: 'dining-chair', name: 'Dining Chair', width: 0.45, depth: 0.45, height: 0.9, cost: 110, seats: 1, category: 'seating', icon: 'chair', color: '#4A3728' },
  { id: 'host-stand', type: 'host-stand', name: 'Host Stand', width: 0.6, depth: 0.4, height: 1.1, cost: 380, seats: 0, category: 'counter', icon: 'rectangle', color: '#2D2D2D' },
  { id: 'wine-rack', type: 'wine-rack', name: 'Wine Display', width: 0.8, depth: 0.3, height: 1.8, cost: 520, seats: 0, category: 'fixture', icon: 'box', color: '#5C3D2E' },
  { id: 'booth-seat', type: 'booth-seat', name: 'Booth Seating', width: 1.8, depth: 0.6, height: 1.0, cost: 680, seats: 4, category: 'seating', icon: 'rectangle', color: '#8B4513' },
];

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: 'cafe',
    name: 'Coffee Shop',
    icon: '☕',
    description: 'Cozy café with counter seating & tables',
    roomWidth: 8,
    roomDepth: 6,
    defaultItems: [],
  },
  {
    id: 'coworking',
    name: 'Co-Working',
    icon: '💻',
    description: 'Open plan desks & meeting areas',
    roomWidth: 10,
    roomDepth: 8,
    defaultItems: [],
  },
  {
    id: 'boutique',
    name: 'Boutique Retail',
    icon: '🛍️',
    description: 'Display fixtures & fitting rooms',
    roomWidth: 7,
    roomDepth: 9,
    defaultItems: [],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Dining tables, booths & bar area',
    roomWidth: 9,
    roomDepth: 7,
    defaultItems: [],
  },
];
