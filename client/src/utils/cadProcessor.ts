import { CADFile, CADElement, Geometry } from "@/types/cad";

export async function processCADFile(file: File): Promise<CADFile> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'dxf':
      return await processDXFFile(file);
    case 'dwg':
      return await processDWGFile(file);
    case 'pdf':
      return await processPDFFile(file);
    case 'png':
    case 'jpg':
    case 'jpeg':
      return await processImageFile(file);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

async function processDXFFile(file: File): Promise<CADFile> {
  const content = await file.text();
  
  // Parse DXF content - simplified implementation
  // In production, use a proper DXF parser library
  const elements = await parseDXFContent(content);
  const layers = extractLayers(elements);
  const dimensions = calculateDimensions(elements);
  
  return {
    name: file.name,
    format: 'DXF',
    size: formatFileSize(file.size),
    scale: detectScale(elements) || '1:100',
    layers,
    dimensions,
    elements,
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    }
  };
}

async function processDWGFile(file: File): Promise<CADFile> {
  // DWG processing would require a specialized library
  // For now, treat as binary and extract basic metadata
  
  return {
    name: file.name,
    format: 'DWG',
    size: formatFileSize(file.size),
    scale: '1:100',
    layers: ['0', 'WALLS', 'DOORS', 'WINDOWS'],
    dimensions: { width: 1200, height: 800 },
    elements: [],
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    }
  };
}

async function processPDFFile(file: File): Promise<CADFile> {
  // PDF processing - extract vector graphics
  const arrayBuffer = await file.arrayBuffer();
  
  // Use PDF-lib or similar to parse PDF content
  // For now, return mock processed data
  
  return {
    name: file.name,
    format: 'PDF',
    size: formatFileSize(file.size),
    scale: '1:100',
    layers: ['Architecture', 'Dimensions', 'Text'],
    dimensions: { width: 1200, height: 800 },
    elements: [],
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      units: 'mm'
    }
  };
}

async function processImageFile(file: File): Promise<CADFile> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        name: file.name,
        format: file.type.split('/')[1].toUpperCase(),
        size: formatFileSize(file.size),
        scale: 'Unknown',
        layers: ['Raster Image'],
        dimensions: { width: img.width, height: img.height },
        elements: [],
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          units: 'px'
        }
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

async function parseDXFContent(content: string): Promise<CADElement[]> {
  const elements: CADElement[] = [];
  const lines = content.split('\n');
  
  // Simplified DXF parsing - in production use a proper parser
  let currentElement: Partial<CADElement> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'ENTITIES') {
      // Start of entities section
      continue;
    }
    
    if (line === 'LINE' || line === 'POLYLINE' || line === 'CIRCLE') {
      if (currentElement) {
        elements.push(currentElement as CADElement);
      }
      
      currentElement = {
        id: `element_${elements.length}`,
        type: 'wall',
        geometry: {
          type: line.toLowerCase() as any,
          coordinates: [],
          bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
        },
        properties: {
          color: '#6B7280',
          lineWeight: 1,
          lineType: 'solid'
        },
        layer: '0'
      };
    }
  }
  
  if (currentElement) {
    elements.push(currentElement as CADElement);
  }
  
  return elements;
}

function extractLayers(elements: CADElement[]): string[] {
  const layers = new Set<string>();
  elements.forEach(element => layers.add(element.layer));
  return Array.from(layers);
}

function calculateDimensions(elements: CADElement[]): { width: number; height: number } {
  if (elements.length === 0) {
    return { width: 0, height: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  elements.forEach(element => {
    const bounds = element.geometry.bounds;
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });
  
  return {
    width: maxX - minX,
    height: maxY - minY
  };
}

function detectScale(elements: CADElement[]): string | null {
  // Scale detection logic based on typical architectural dimensions
  // This is a simplified heuristic approach
  
  const dimensions = calculateDimensions(elements);
  const area = dimensions.width * dimensions.height;
  
  if (area > 100000) return '1:200';
  if (area > 50000) return '1:100';
  if (area > 10000) return '1:50';
  return '1:20';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateCADFile(file: File): boolean {
  const validExtensions = ['dxf', 'dwg', 'pdf', 'png', 'jpg', 'jpeg'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  return validExtensions.includes(extension || '');
}

export function extractFloorPlanGeometry(cadFile: CADFile) {
  // Extract walls, doors, windows from CAD elements
  const walls = cadFile.elements.filter(e => e.type === 'wall');
  const doors = cadFile.elements.filter(e => e.type === 'door');
  const windows = cadFile.elements.filter(e => e.type === 'window');
  
  return { walls, doors, windows };
}
