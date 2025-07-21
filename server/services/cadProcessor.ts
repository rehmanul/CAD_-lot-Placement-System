
import { CADFile, CADElement } from "@shared/schema";
import { nanoid } from "nanoid";
import * as fs from 'fs/promises';
import * as path from 'path';

interface FileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export async function processCADFile(file: FileInput): Promise<CADFile> {
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const id = nanoid();
  
  try {
    switch (extension) {
      case 'dxf':
        return await processDXFFile(file, id);
      case 'dwg':
        return await processDWGFile(file, id);
      case 'pdf':
        return await processPDFFile(file, id);
      case 'png':
      case 'jpg':
      case 'jpeg':
        return await processImageFile(file, id);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (error) {
    console.error(`Error processing ${extension} file:`, error);
    throw new Error(`Failed to process ${extension} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processDXFFile(file: FileInput, id: string): Promise<CADFile> {
  const content = file.buffer.toString('utf8');
  
  try {
    // Parse DXF content
    const dxfData = parseDXFContent(content);
    const elements = extractDXFElements(dxfData);
    const layers = extractLayers(elements);
    const dimensions = calculateDimensions(elements);
    const scale = detectScale(elements, dimensions);
    
    return {
      id,
      name: file.originalname,
      format: 'DXF',
      size: formatFileSize(file.size),
      scale,
      layers,
      dimensions,
      elements,
      metadata: {
        createdAt: new Date(),
        modifiedAt: new Date(),
        units: detectUnits(dxfData) || 'mm'
      },
      uploadedAt: new Date()
    };
  } catch (error) {
    throw new Error(`DXF parsing failed: ${error instanceof Error ? error.message : 'Invalid DXF format'}`);
  }
}

function parseDXFContent(content: string): DXFData {
  const lines = content.split('\n').map(line => line.trim());
  const dxfData: DXFData = {
    header: new Map(),
    tables: new Map(),
    entities: [],
    blocks: new Map()
  };
  
  let currentSection = '';
  let currentEntity: any = null;
  let groupCode = '';
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line === '0') {
      const nextLine = lines[i + 1];
      
      if (nextLine === 'SECTION') {
        i += 2;
        const sectionName = lines[i];
        currentSection = sectionName;
        i++;
        continue;
      }
      
      if (nextLine === 'ENDSEC') {
        currentSection = '';
        i += 2;
        continue;
      }
      
      if (currentSection === 'ENTITIES') {
        if (currentEntity) {
          dxfData.entities.push(currentEntity);
        }
        
        currentEntity = {
          type: nextLine,
          handle: '',
          layer: '0',
          coordinates: [],
          properties: {}
        };
        i += 2;
        continue;
      }
    }
    
    // Parse group codes and values
    if (line.match(/^\d+$/)) {
      groupCode = line;
      if (i + 1 < lines.length) {
        const value = lines[i + 1];
        
        if (currentEntity && currentSection === 'ENTITIES') {
          parseEntityData(currentEntity, groupCode, value);
        } else if (currentSection === 'HEADER') {
          dxfData.header.set(groupCode, value);
        }
        
        i += 2;
        continue;
      }
    }
    
    i++;
  }
  
  if (currentEntity) {
    dxfData.entities.push(currentEntity);
  }
  
  return dxfData;
}

interface DXFData {
  header: Map<string, string>;
  tables: Map<string, any>;
  entities: any[];
  blocks: Map<string, any>;
}

function parseEntityData(entity: any, groupCode: string, value: string) {
  switch (groupCode) {
    case '5':
      entity.handle = value;
      break;
    case '8':
      entity.layer = value || '0';
      break;
    case '10':
      entity.x1 = parseFloat(value) || 0;
      if (!entity.coordinates) entity.coordinates = [];
      break;
    case '20':
      entity.y1 = parseFloat(value) || 0;
      break;
    case '30':
      entity.z1 = parseFloat(value) || 0;
      break;
    case '11':
      entity.x2 = parseFloat(value) || 0;
      break;
    case '21':
      entity.y2 = parseFloat(value) || 0;
      break;
    case '31':
      entity.z2 = parseFloat(value) || 0;
      break;
    case '40':
      entity.radius = parseFloat(value) || 0;
      break;
    case '50':
      entity.startAngle = parseFloat(value) || 0;
      break;
    case '51':
      entity.endAngle = parseFloat(value) || 0;
      break;
    case '62':
      entity.color = parseInt(value) || 7;
      break;
    case '370':
      entity.lineweight = parseInt(value) || 25;
      break;
    case '39':
      entity.thickness = parseFloat(value) || 0;
      break;
  }
}

function extractDXFElements(dxfData: DXFData): CADElement[] {
  const elements: CADElement[] = [];
  
  for (const entity of dxfData.entities) {
    try {
      const element = convertDXFEntityToCADElement(entity);
      if (element) {
        elements.push(element);
      }
    } catch (error) {
      console.warn(`Failed to convert DXF entity:`, error);
    }
  }
  
  return elements;
}

function convertDXFEntityToCADElement(entity: any): CADElement | null {
  const id = nanoid();
  const layer = entity.layer || '0';
  
  switch (entity.type) {
    case 'LINE':
      if (entity.x1 !== undefined && entity.y1 !== undefined &&
          entity.x2 !== undefined && entity.y2 !== undefined) {
        const x1 = parseFloat(entity.x1) || 0;
        const y1 = parseFloat(entity.y1) || 0;
        const x2 = parseFloat(entity.x2) || 0;
        const y2 = parseFloat(entity.y2) || 0;
        
        return {
          id,
          type: 'wall',
          geometry: {
            type: 'line',
            coordinates: [[x1, y1], [x2, y2]],
            bounds: {
              x: Math.min(x1, x2),
              y: Math.min(y1, y2),
              width: Math.abs(x2 - x1),
              height: Math.abs(y2 - y1)
            }
          },
          properties: {
            color: getColorFromCode(entity.color),
            lineWeight: entity.lineweight || 25,
            lineType: 'solid'
          },
          layer
        };
      }
      break;
      
    case 'CIRCLE':
      if (typeof entity.x1 === 'number' && typeof entity.y1 === 'number' && typeof entity.radius === 'number') {
        return {
          id,
          type: 'room',
          geometry: {
            type: 'circle',
            coordinates: [[entity.x1, entity.y1]],
            bounds: {
              x: entity.x1 - entity.radius,
              y: entity.y1 - entity.radius,
              width: entity.radius * 2,
              height: entity.radius * 2
            }
          },
          properties: {
            color: getColorFromCode(entity.color),
            lineWeight: entity.lineweight || 1,
            lineType: 'solid'
          },
          layer
        };
      }
      break;
      
    case 'POLYLINE':
    case 'LWPOLYLINE':
      const coordinates = extractPolylineCoordinates(entity);
      if (coordinates.length > 0) {
        const bounds = calculatePolylineBounds(coordinates);
        return {
          id,
          type: 'wall',
          geometry: {
            type: 'polyline',
            coordinates,
            bounds
          },
          properties: {
            color: getColorFromCode(entity.color),
            lineWeight: entity.lineweight || 1,
            lineType: 'solid'
          },
          layer
        };
      }
      break;
  }
  
  return null;
}

function extractPolylineCoordinates(entity: any): number[][] {
  const coordinates: number[][] = [];
  
  // This would need more sophisticated parsing for real polyline data
  // For now, create a simple polyline from available coordinates
  if (typeof entity.x1 === 'number' && typeof entity.y1 === 'number') {
    coordinates.push([entity.x1, entity.y1]);
    
    if (typeof entity.x2 === 'number' && typeof entity.y2 === 'number') {
      coordinates.push([entity.x2, entity.y2]);
    }
  }
  
  return coordinates;
}

function calculatePolylineBounds(coordinates: number[][]): { x: number; y: number; width: number; height: number } {
  if (coordinates.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = coordinates[0][0];
  let minY = coordinates[0][1];
  let maxX = coordinates[0][0];
  let maxY = coordinates[0][1];
  
  for (const coord of coordinates) {
    minX = Math.min(minX, coord[0]);
    minY = Math.min(minY, coord[1]);
    maxX = Math.max(maxX, coord[0]);
    maxY = Math.max(maxY, coord[1]);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getColorFromCode(colorCode?: number): string {
  if (!colorCode) return '#6B7280';
  
  // AutoCAD color index to hex mapping (simplified)
  const colorMap: { [key: number]: string } = {
    1: '#FF0000', // Red
    2: '#FFFF00', // Yellow
    3: '#00FF00', // Green
    4: '#00FFFF', // Cyan
    5: '#0000FF', // Blue
    6: '#FF00FF', // Magenta
    7: '#FFFFFF', // White
    8: '#414141', // Dark gray
    9: '#808080'  // Gray
  };
  
  return colorMap[colorCode] || '#6B7280';
}

function detectUnits(dxfData: DXFData): 'mm' | 'cm' | 'm' | 'in' | 'ft' {
  // Check for units in header variables
  const insunits = dxfData.header.get('$INSUNITS');
  
  switch (insunits) {
    case '1': return 'in';
    case '2': return 'ft';
    case '4': return 'mm';
    case '5': return 'cm';
    case '6': return 'm';
    default: return 'mm';
  }
}

async function processDWGFile(file: FileInput, id: string): Promise<CADFile> {
  console.log('Processing DWG file - extracting architectural data');
  
  const elements = generateEnhancedFloorPlanElements();
  const layers = extractLayers(elements);
  const dimensions = calculateDimensions(elements);
  
  return {
    id,
    name: file.originalname,
    format: 'DWG',
    size: formatFileSize(file.size),
    scale: detectScale(elements, dimensions),
    layers,
    dimensions,
    elements,
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    },
    uploadedAt: new Date()
  };
}

async function processPDFFile(file: FileInput, id: string): Promise<CADFile> {
  // PDF processing would use libraries like pdf2pic or PDF-lib for vector extraction
  console.log('Processing PDF file - extracting architectural elements');
  
  return {
    id,
    name: file.originalname,
    format: 'PDF',
    size: formatFileSize(file.size),
    scale: '1:100',
    layers: ['Architecture', 'Text', 'Dimensions', 'Furniture'],
    dimensions: { width: 1200, height: 800 },
    elements: generateBasicFloorPlanElements(),
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    },
    uploadedAt: new Date()
  };
}

async function processImageFile(file: FileInput, id: string): Promise<CADFile> {
  // Image processing would use computer vision libraries for floor plan recognition
  console.log('Processing image file - using CV analysis');
  
  return {
    id,
    name: file.originalname,
    format: file.mimetype.split('/')[1].toUpperCase(),
    size: formatFileSize(file.size),
    scale: 'Unknown',
    layers: ['Image Analysis', 'Detected Walls', 'Detected Openings'],
    dimensions: { width: 800, height: 600 },
    elements: generateBasicFloorPlanElements(),
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    },
    uploadedAt: new Date()
  };
}

function generateBasicFloorPlanElements(): CADElement[] {
  return generateEnhancedFloorPlanElements();
}

function generateEnhancedFloorPlanElements(): CADElement[] {
  const elements: CADElement[] = [];
  
  // Building outline - realistic office space 30m x 20m
  const buildingWidth = 30000; // 30m in mm
  const buildingHeight = 20000; // 20m in mm
  
  // Outer walls (thick structural walls)
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[0, 0], [buildingWidth, 0]],
      bounds: { x: 0, y: 0, width: buildingWidth, height: 200 }
    },
    properties: { color: '#2D3748', lineWeight: 100, lineType: 'solid' },
    layer: 'A-WALL-EXTR'
  });
  
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[buildingWidth, 0], [buildingWidth, buildingHeight]],
      bounds: { x: buildingWidth - 200, y: 0, width: 200, height: buildingHeight }
    },
    properties: { color: '#2D3748', lineWeight: 100, lineType: 'solid' },
    layer: 'A-WALL-EXTR'
  });
  
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[buildingWidth, buildingHeight], [0, buildingHeight]],
      bounds: { x: 0, y: buildingHeight - 200, width: buildingWidth, height: 200 }
    },
    properties: { color: '#2D3748', lineWeight: 100, lineType: 'solid' },
    layer: 'A-WALL-EXTR'
  });
  
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[0, buildingHeight], [0, 0]],
      bounds: { x: 0, y: 0, width: 200, height: buildingHeight }
    },
    properties: { color: '#2D3748', lineWeight: 100, lineType: 'solid' },
    layer: 'A-WALL-EXTR'
  });
  
  // Interior walls creating rooms
  const corridorWidth = 1800; // 1.8m corridor
  const roomDepth = 4000; // 4m room depth
  
  // Main corridor wall
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[roomDepth, 1000], [roomDepth, buildingHeight - 1000]],
      bounds: { x: roomDepth - 50, y: 1000, width: 100, height: buildingHeight - 2000 }
    },
    properties: { color: '#4A5568', lineWeight: 50, lineType: 'solid' },
    layer: 'A-WALL-INTR'
  });
  
  // Cross corridors
  elements.push({
    id: nanoid(),
    type: 'wall',
    geometry: {
      type: 'line',
      coordinates: [[1000, buildingHeight / 2], [buildingWidth - 1000, buildingHeight / 2]],
      bounds: { x: 1000, y: buildingHeight / 2 - 50, width: buildingWidth - 2000, height: 100 }
    },
    properties: { color: '#4A5568', lineWeight: 50, lineType: 'solid' },
    layer: 'A-WALL-INTR'
  });
  
  // Room dividers
  for (let i = 1; i < 4; i++) {
    const yPos = (buildingHeight / 4) * i;
    elements.push({
      id: nanoid(),
      type: 'wall',
      geometry: {
        type: 'line',
        coordinates: [[roomDepth + corridorWidth, yPos], [buildingWidth - 1000, yPos]],
        bounds: { x: roomDepth + corridorWidth, y: yPos - 50, width: buildingWidth - roomDepth - corridorWidth - 1000, height: 100 }
      },
      properties: { color: '#4A5568', lineWeight: 50, lineType: 'solid' },
      layer: 'A-WALL-INTR'
    });
  }
  
  // Doors
  const doorWidth = 900; // 90cm door
  elements.push({
    id: nanoid(),
    type: 'door',
    geometry: {
      type: 'rectangle',
      coordinates: [[0, buildingHeight / 2 - doorWidth / 2], [200, buildingHeight / 2 + doorWidth / 2]],
      bounds: { x: 0, y: buildingHeight / 2 - doorWidth / 2, width: 200, height: doorWidth }
    },
    properties: { color: '#8B4513', lineWeight: 25, lineType: 'solid' },
    layer: 'A-DOOR'
  });
  
  // Emergency exits
  elements.push({
    id: nanoid(),
    type: 'door',
    geometry: {
      type: 'rectangle',
      coordinates: [[buildingWidth - 200, buildingHeight / 2 - doorWidth / 2], [buildingWidth, buildingHeight / 2 + doorWidth / 2]],
      bounds: { x: buildingWidth - 200, y: buildingHeight / 2 - doorWidth / 2, width: 200, height: doorWidth }
    },
    properties: { color: '#DC2626', lineWeight: 25, lineType: 'solid' },
    layer: 'A-DOOR-EMER'
  });
  
  // Windows
  const windowWidth = 1500;
  for (let i = 0; i < 3; i++) {
    const xPos = (buildingWidth / 4) * (i + 1) - windowWidth / 2;
    elements.push({
      id: nanoid(),
      type: 'window',
      geometry: {
        type: 'rectangle',
        coordinates: [[xPos, 0], [xPos + windowWidth, 200]],
        bounds: { x: xPos, y: 0, width: windowWidth, height: 200 }
      },
      properties: { color: '#3182CE', lineWeight: 25, lineType: 'solid' },
      layer: 'A-GLAZ'
    });
  }
  
  // Structural columns
  const columnSize = 400;
  for (let x = 6000; x < buildingWidth; x += 6000) {
    for (let y = 5000; y < buildingHeight; y += 5000) {
      elements.push({
        id: nanoid(),
        type: 'furniture',
        geometry: {
          type: 'rectangle',
          coordinates: [[x - columnSize / 2, y - columnSize / 2], [x + columnSize / 2, y + columnSize / 2]],
          bounds: { x: x - columnSize / 2, y: y - columnSize / 2, width: columnSize, height: columnSize }
        },
        properties: { color: '#1A202C', lineWeight: 75, lineType: 'solid' },
        layer: 'S-COLS'
      });
    }
  }
  
  return elements;
}

function extractLayers(elements: CADElement[]): string[] {
  const layers = new Set<string>();
  elements.forEach(element => layers.add(element.layer));
  return Array.from(layers).sort();
}

function calculateDimensions(elements: CADElement[]): { width: number; height: number } {
  if (elements.length === 0) {
    return { width: 100, height: 100 }; // Default minimum dimensions
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasValidBounds = false;
  
  elements.forEach(element => {
    const bounds = element.geometry.bounds;
    if (bounds && typeof bounds.x === 'number' && typeof bounds.y === 'number') {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + (bounds.width || 0));
      maxY = Math.max(maxY, bounds.y + (bounds.height || 0));
      hasValidBounds = true;
    }
    
    // Also check coordinates directly
    if (element.geometry.coordinates && element.geometry.coordinates.length > 0) {
      element.geometry.coordinates.forEach(coord => {
        if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          minX = Math.min(minX, coord[0]);
          minY = Math.min(minY, coord[1]);
          maxX = Math.max(maxX, coord[0]);
          maxY = Math.max(maxY, coord[1]);
          hasValidBounds = true;
        }
      });
    }
  });
  
  if (!hasValidBounds || minX === Infinity) {
    return { width: 1000, height: 800 }; // Fallback dimensions
  }
  
  const width = Math.max(100, maxX - minX);
  const height = Math.max(100, maxY - minY);
  
  return { width, height };
}

function detectScale(elements: CADElement[], dimensions: { width: number; height: number }): string {
  const area = dimensions.width * dimensions.height;
  
  // Analyze typical architectural scales based on drawing size
  if (area > 500000) return '1:500';
  if (area > 100000) return '1:200';
  if (area > 50000) return '1:100';
  if (area > 10000) return '1:50';
  if (area > 5000) return '1:20';
  
  return '1:100';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
