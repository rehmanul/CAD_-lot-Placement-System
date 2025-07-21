export interface CADFile {
  name: string;
  format: string;
  size: string;
  scale: string;
  layers: string[];
  dimensions: {
    width: number;
    height: number;
  };
  elements: CADElement[];
  metadata: {
    createdAt: Date;
    modifiedAt: Date;
    author?: string;
    units: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  };
}

export interface CADElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'annotation' | 'furniture';
  geometry: Geometry;
  properties: ElementProperties;
  layer: string;
}

export interface Geometry {
  type: 'line' | 'polyline' | 'circle' | 'arc' | 'rectangle' | 'polygon';
  coordinates: number[][];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface ElementProperties {
  color: string;
  lineWeight: number;
  lineType: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  text?: string;
  thickness?: number;
}

export interface ProcessingPhase {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  details?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface IlotConfiguration {
  smallIlots: number; // percentage
  mediumIlots: number; // percentage
  largeIlots: number; // percentage
  corridorWidth: number; // meters
  adaCompliance: boolean;
  minClearance?: number; // meters
  maxDensity?: number; // percentage
}

export interface ExportProgress {
  type: 'image' | 'pdf' | 'dxf' | 'json';
  progress: number;
  status: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: string;
  network: string;
  cloudSync: string;
  timestamp: Date;
}
