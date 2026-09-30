import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedItem, FurnitureItem } from '../types';

interface Scene3DProps {
  placedItems: PlacedItem[];
  brandColor: string;
  roomWidth: number;
  roomDepth: number;
  showFireSafety: boolean;
  viewMode: 'topdown' | 'perspective';
  selectedItem: string | null;
  activeTool?: string | null;
  onPlaceItem?: (x: number, z: number) => void;
  onSelectItem?: (id: string | null) => void;
}

function Floor({ width, depth, brandColor, activeTool, onPlaceItem }: { width: number; depth: number; brandColor: string; activeTool?: string | null; onPlaceItem?: (x: number, z: number) => void }) {
  const handleClick = (e: any) => {
    if (!activeTool || !onPlaceItem) return;
    e.stopPropagation();
    const point = e.point;
    onPlaceItem(point.x, point.z);
  };

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={handleClick}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.8} />
      </mesh>
      {/* Floor grid lines */}
      <gridHelper args={[Math.max(width, depth), Math.max(width, depth) * 2, '#E0D8CC', '#E8E0D4']} position={[0, 0.001, 0]} />
      {/* Walls */}
      <mesh position={[0, 1.5, -depth / 2]}>
        <boxGeometry args={[width, 3, 0.1]} />
        <meshStandardMaterial color="#FAFAF7" roughness={0.9} />
      </mesh>
      <mesh position={[-width / 2, 1.5, 0]}>
        <boxGeometry args={[0.1, 3, depth]} />
        <meshStandardMaterial color="#F0EBE3" roughness={0.9} />
      </mesh>
      <mesh position={[width / 2, 1.5, 0]}>
        <boxGeometry args={[0.1, 3, depth]} />
        <meshStandardMaterial color="#F0EBE3" roughness={0.9} />
      </mesh>
      {/* Brand accent strip on back wall */}
      <mesh position={[0, 2.8, -depth / 2 + 0.06]}>
        <boxGeometry args={[width - 0.2, 0.15, 0.02]} />
        <meshStandardMaterial color={brandColor} emissive={brandColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function FurnitureMesh({ item, brandColor, isSelected, onSelect }: { item: PlacedItem; brandColor: string; isSelected: boolean; onSelect?: (id: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const template = item.template;
  
  const color = useMemo(() => {
    if (template.category === 'counter' || template.category === 'fixture') {
      return brandColor;
    }
    return template.color || '#666666';
  }, [template, brandColor]);

  useFrame(() => {
    if (meshRef.current && isSelected) {
      meshRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.02 + template.height / 2;
    }
  });

  const renderShape = () => {
    const h = template.height;
    const w = template.width;
    const d = template.depth;

    switch (template.category) {
      case 'table':
        return (
          <group>
            {/* Table top */}
            <mesh position={[0, h, 0]} castShadow>
              <boxGeometry args={[w, 0.05, d]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
            {/* Legs */}
            {[[-w/2 + 0.05, h/2, -d/2 + 0.05], [w/2 - 0.05, h/2, -d/2 + 0.05], [-w/2 + 0.05, h/2, d/2 - 0.05], [w/2 - 0.05, h/2, d/2 - 0.05]].map((pos, i) => (
              <mesh key={i} position={pos as [number, number, number]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, h, 8]} />
                <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      case 'seating':
        if (template.id.includes('stool') || template.id.includes('chair') && !template.id.includes('sofa') && !template.id.includes('booth')) {
          return (
            <group>
              {/* Seat */}
              <mesh position={[0, h * 0.55, 0]} castShadow>
                <boxGeometry args={[w * 0.8, 0.05, d * 0.8]} />
                <meshStandardMaterial color={color} roughness={0.6} />
              </mesh>
              {/* Back */}
              <mesh position={[0, h * 0.75, -d * 0.35]} castShadow>
                <boxGeometry args={[w * 0.7, h * 0.4, 0.04]} />
                <meshStandardMaterial color={color} roughness={0.6} />
              </mesh>
              {/* Legs */}
              {[[-w/3, h * 0.27, -d/3], [w/3, h * 0.27, -d/3], [-w/3, h * 0.27, d/3], [w/3, h * 0.27, d/3]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} castShadow>
                  <cylinderGeometry args={[0.015, 0.015, h * 0.55, 6]} />
                  <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
                </mesh>
              ))}
            </group>
          );
        }
        // Sofa / booth
        return (
          <group>
            <mesh position={[0, h * 0.3, 0]} castShadow>
              <boxGeometry args={[w, h * 0.6, d]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            <mesh position={[0, h * 0.6, -d * 0.35]} castShadow>
              <boxGeometry args={[w, h * 0.5, d * 0.3]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          </group>
        );
      case 'counter':
        return (
          <group>
            <mesh position={[0, h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Counter top */}
            <mesh position={[0, h + 0.02, 0]} castShadow>
              <boxGeometry args={[w + 0.05, 0.04, d + 0.05]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.3} />
            </mesh>
          </group>
        );
      case 'fixture':
      case 'storage':
        return (
          <group>
            <mesh position={[0, h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
            {/* Shelf lines */}
            {Array.from({ length: Math.floor(h / 0.4) }).map((_, i) => (
              <mesh key={i} position={[0, (i + 1) * 0.4, 0]}>
                <boxGeometry args={[w - 0.02, 0.02, d - 0.02]} />
                <meshStandardMaterial color="#888888" roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      default:
        return (
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshRef as any}
      position={[item.x, 0, item.z]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(item.id); }}
    >
      {renderShape()}
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(template.width, template.depth) * 0.6, Math.max(template.width, template.depth) * 0.65, 32]} />
          <meshBasicMaterial color={brandColor} />
        </mesh>
      )}
    </group>
  );
}

function FireEgressPaths({ roomWidth, roomDepth, brandColor }: { roomWidth: number; roomDepth: number; brandColor: string }) {
  const arrowRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (arrowRef.current) {
      arrowRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.position.y = 0.05 + Math.sin(Date.now() * 0.003 + i * 0.5) * 0.02;
        }
      });
    }
  });

  const paths = [
    { start: [0, 0], end: [0, roomDepth / 2], label: 'Exit A' },
    { start: [0, 0], end: [-roomWidth / 2, 0], label: 'Exit B' },
    { start: [0, 0], end: [roomWidth / 2, 0], label: 'Exit C' },
  ];

  return (
    <group ref={arrowRef as any}>
      {paths.map((path, i) => {
        const dx = path.end[0] - path.start[0];
        const dz = path.end[1] - path.start[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const numArrows = Math.floor(length / 0.8);
        
        return Array.from({ length: numArrows }).map((_, j) => {
          const t = (j + 0.5) / numArrows;
          const x = path.start[0] + dx * t;
          const z = path.start[1] + dz * t;
          
          return (
            <mesh key={`${i}-${j}`} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, angle]}>
              <coneGeometry args={[0.08, 0.15, 3]} />
              <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
          );
        });
      })}
      {/* Exit signs */}
      <Text position={[0, 2.5, roomDepth / 2 - 0.1]} fontSize={0.2} color="#00FF00" anchorX="center">
        EXIT A
      </Text>
      <Text position={[-roomWidth / 2 + 0.1, 2.5, 0]} fontSize={0.2} color="#00FF00" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        EXIT B
      </Text>
      <Text position={[roomWidth / 2 - 0.1, 2.5, 0]} fontSize={0.2} color="#00FF00" anchorX="center" rotation={[0, -Math.PI / 2, 0]}>
        EXIT C
      </Text>
    </group>
  );
}

function CameraController({ viewMode }: { viewMode: 'topdown' | 'perspective' }) {
  const controlsRef = useRef<any>(null);
  
  useFrame(() => {
    if (controlsRef.current) {
      const target = controlsRef.current;
      if (viewMode === 'topdown') {
        target.object.position.lerp(new THREE.Vector3(0, 12, 0.01), 0.05);
        target.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      } else {
        target.object.position.lerp(new THREE.Vector3(6, 6, 6), 0.05);
        target.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      }
      target.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      maxPolarAngle={viewMode === 'topdown' ? 0.1 : Math.PI / 2.2}
      minDistance={3}
      maxDistance={20}
    />
  );
}

export default function Scene3D({ placedItems, brandColor, roomWidth, roomDepth, showFireSafety, viewMode, selectedItem, activeTool, onPlaceItem, onSelectItem }: Scene3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: viewMode === 'topdown' ? [0, 12, 0.01] : [6, 6, 6], fov: 50 }}
      style={{ background: 'linear-gradient(180deg, #DDD5C8 0%, #F5F0E8 60%, #FAFAF7 100%)' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow shadow-mapSize={2048} shadow-camera-far={50} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} />
      <directionalLight position={[-3, 5, -3]} intensity={0.2} />
      <hemisphereLight args={['#F5F0E8', '#E8E0D4', 0.4]} />
      <fog attach="fog" args={['#F5F0E8', 15, 30]} />
      
      <Floor width={roomWidth} depth={roomDepth} brandColor={brandColor} activeTool={activeTool} onPlaceItem={onPlaceItem} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={Math.max(roomWidth, roomDepth) * 1.5} blur={2} far={4} />
      
      {placedItems.map((item) => (
        <FurnitureMesh
          key={item.id}
          item={item}
          brandColor={brandColor}
          isSelected={selectedItem === item.id}
          onSelect={onSelectItem}
        />
      ))}
      
      {showFireSafety && <FireEgressPaths roomWidth={roomWidth} roomDepth={roomDepth} brandColor={brandColor} />}
      
      <CameraController viewMode={viewMode} />
      <Environment preset="apartment" />
    </Canvas>
  );
}
