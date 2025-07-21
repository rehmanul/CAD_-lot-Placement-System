export interface FloorPlan {
  id: string;
  name: string;
  bounds: Rectangle;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  restrictedAreas: RestrictedArea[];
  scale: number;
  units: 'mm' | 'cm' | 'm' | 'in' | 'ft';
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  type: 'exterior' | 'interior' | 'bearing' | 'partition';
}

export interface Door {
  id: string;
  position: Point;
  width: number;
  swingDirection: number; // degrees
  type: 'entrance' | 'exit' | 'interior';
}

export interface Window {
  id: string;
  position: Point;
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  boundary: Point[];
  area: number;
  type: 'office' | 'corridor' | 'utility' | 'common' | 'storage';
  usableArea?: number;
}

export interface RestrictedArea {
  id: string;
  boundary: Point[];
  type: 'no_entry' | 'equipment' | 'emergency' | 'storage';
  label: string;
}

export interface Ilot {
  id: string;
  position: Point;
  width: number;
  height: number;
  area: number;
  size: 'small' | 'medium' | 'large';
  rotation: number;
  accessible: boolean;
  corridorConnections: string[];
}

export interface Corridor {
  id: string;
  path: Point[];
  width: number;
  connectedIlots: string[];
  accessible: boolean;
  length: number;
}

export interface OptimizationResult {
  ilots: Ilot[];
  corridors: Corridor[];
  metrics: {
    totalIlots: number;
    totalArea: number;
    usedArea: number;
    spaceUtilization: number;
    accessibilityCompliance: number;
    corridorEfficiency: number;
  };
  fitness: number;
  generation: number;
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  fitnessWeights: {
    spaceUtilization: number;
    accessibility: number;
    corridorEfficiency: number;
    adaCompliance: number;
  };
}
