import { Analysis } from "@shared/schema";

interface ExportConfig {
  type: 'image' | 'pdf' | 'dxf' | 'json';
  format?: string;
  resolution?: '1080p' | '4k' | '8k';
  includeMetrics?: boolean;
}

interface ExportResult {
  data: Buffer | string;
  filename: string;
  mimeType: string;
}

export async function generateExport(analysis: Analysis, config: ExportConfig): Promise<ExportResult> {
  switch (config.type) {
    case 'image':
      return await generateImageExport(analysis, config);
    case 'pdf':
      return await generatePDFExport(analysis, config);
    case 'dxf':
      return await generateDXFExport(analysis, config);
    case 'json':
      return await generateJSONExport(analysis, config);
    default:
      throw new Error(`Unsupported export type: ${config.type}`);
  }
}

async function generateImageExport(analysis: Analysis, config: ExportConfig): Promise<ExportResult> {
  // Generate high-resolution SVG
  const svg = generateFloorPlanSVG(analysis);
  
  // Convert to PNG if needed
  const data = Buffer.from(svg, 'utf8');
  
  return {
    data,
    filename: `cad_analysis_${analysis.id}.svg`,
    mimeType: 'image/svg+xml'
  };
}

async function generatePDFExport(analysis: Analysis, config: ExportConfig): Promise<ExportResult> {
  // Use pdf-lib to generate comprehensive PDF report
  const { PDFDocument, rgb } = await import('pdf-lib');
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  
  // Add title
  page.drawText('CAD Îlot Placement System - Analysis Report', {
    x: 50,
    y: 550,
    size: 20,
    color: rgb(0, 0, 0),
  });
  
  // Add analysis results
  if (analysis.result) {
    const metrics = analysis.result.metrics;
    let yPos = 500;
    
    const metricsText = [
      `Total Îlots: ${metrics.totalIlots}`,
      `Space Utilization: ${(metrics.spaceUtilization * 100).toFixed(1)}%`,
      `Accessibility Compliance: ${(metrics.accessibilityCompliance * 100).toFixed(1)}%`,
      `Corridor Efficiency: ${(metrics.corridorEfficiency * 100).toFixed(1)}%`,
      `Total Area: ${metrics.totalArea.toFixed(1)} m²`,
      `Used Area: ${metrics.usedArea.toFixed(1)} m²`
    ];
    
    for (const text of metricsText) {
      page.drawText(text, {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0, 0, 0),
      });
      yPos -= 20;
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  
  return {
    data: Buffer.from(pdfBytes),
    filename: `cad_analysis_report_${analysis.id}.pdf`,
    mimeType: 'application/pdf'
  };
}

async function generateDXFExport(analysis: Analysis, config: ExportConfig): Promise<ExportResult> {
  const dxfContent = generateDXFContent(analysis);
  
  return {
    data: Buffer.from(dxfContent, 'utf8'),
    filename: `cad_analysis_${analysis.id}.dxf`,
    mimeType: 'application/dxf'
  };
}

async function generateJSONExport(analysis: Analysis, config: ExportConfig): Promise<ExportResult> {
  const data = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      software: 'CAD Îlot Placement System',
      analysisId: analysis.id
    },
    analysis,
    floorPlan: {
      dimensions: { width: 1200, height: 800 },
      scale: '1:100',
      units: 'mm'
    }
  };
  
  return {
    data: Buffer.from(JSON.stringify(data, null, 2), 'utf8'),
    filename: `cad_analysis_data_${analysis.id}.json`,
    mimeType: 'application/json'
  };
}

function generateFloorPlanSVG(analysis: Analysis): string {
  const ilots = analysis.result?.ilots || [];
  const corridors = analysis.result?.corridors || [];
  
  let ilotsSVG = '';
  for (const ilot of ilots) {
    const className = `ilot-${ilot.size}`;
    ilotsSVG += `
      <rect x="${ilot.position.x}" y="${ilot.position.y}" 
            width="${ilot.width * 10}" height="${ilot.height * 10}" 
            class="${className}" />
      <text x="${ilot.position.x + ilot.width * 5}" y="${ilot.position.y + ilot.height * 5}" 
            class="label">${ilot.area.toFixed(1)}m²</text>
    `;
  }
  
  let corridorsSVG = '';
  for (const corridor of corridors) {
    const pathData = corridor.path.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    corridorsSVG += `<path d="${pathData}" class="corridor" />`;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .wall { stroke: #6B7280; stroke-width: 4; fill: none; }
    .restricted { fill: #3B82F6; fill-opacity: 0.3; stroke: #3B82F6; stroke-width: 2; }
    .entrance { stroke: #EF4444; stroke-width: 3; fill: none; }
    .ilot-small { fill: rgba(239, 68, 68, 0.1); stroke: #EF4444; stroke-width: 1.5; }
    .ilot-medium { fill: rgba(239, 68, 68, 0.15); stroke: #EF4444; stroke-width: 1.5; }
    .ilot-large { fill: rgba(239, 68, 68, 0.2); stroke: #EF4444; stroke-width: 1.5; }
    .corridor { stroke: #EC4899; stroke-width: 2; stroke-dasharray: 4,2; fill: none; }
    .label { font-family: Arial, sans-serif; font-size: 12px; fill: #EF4444; text-anchor: middle; }
  </style>
  
  <!-- Floor Plan -->
  <rect x="50" y="50" width="700" height="500" class="wall" />
  <line x1="50" y1="200" x2="400" y2="200" class="wall" />
  <line x1="400" y1="50" x2="400" y2="350" class="wall" />
  
  <!-- Restricted Areas -->
  <rect x="150" y="100" width="80" height="60" class="restricted" />
  
  <!-- Îlots -->
  ${ilotsSVG}
  
  <!-- Corridors -->
  ${corridorsSVG}
</svg>`;
}

function generateDXFContent(analysis: Analysis): string {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1021
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
5
8
330
0
100
AcDbSymbolTable
70
3
0
LAYER
5
10
330
8
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
WALLS
70
0
62
7
6
CONTINUOUS
0
LAYER
5
11
330
8
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
ILOTS
70
0
62
1
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
5
100
330
1F
100
AcDbEntity
8
WALLS
100
AcDbLine
10
50.0
20
50.0
30
0.0
11
750.0
21
50.0
31
0.0
0
ENDSEC
0
EOF`;
}