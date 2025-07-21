import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Square, Eye, EyeOff, Download, Maximize2 } from "lucide-react";
import { CADFile, Analysis } from "@shared/schema";

interface FloorPlanElement {
  type: 'wall' | 'entrance' | 'exit' | 'restricted' | 'ilot' | 'corridor';
  id: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    path?: { x: number; y: number }[];
  };
  properties: {
    color: string;
    strokeWidth: number;
    area?: number;
    label?: string;
  };
}

interface IlotPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  size: 'small' | 'medium' | 'large';
  accessible: boolean;
}

interface CorridorPath {
  id: string;
  path: { x: number; y: number }[];
  width: number;
  connectedIlots: string[];
}

interface PixelPerfectFloorPlanProps {
  cadFile: CADFile | null;
  analysis: Analysis | null;
  corridorWidth: number;
  onCorridorWidthChange: (width: number) => void;
}

const COLORS = {
  WALL: '#6B7280',           // Gray - MUR
  RESTRICTED: '#3B82F6',     // Blue - NO ENTREE  
  ENTRANCE: '#EF4444',       // Red - ENTRÉE/SORTIE
  ILOT_SMALL: '#F3E8FF',     // Light purple for small ilots
  ILOT_MEDIUM: '#E0E7FF',    // Light blue for medium ilots
  ILOT_LARGE: '#FEF3C7',     // Light yellow for large ilots
  CORRIDOR: '#EC4899',       // Pink for corridors
  TEXT: '#1F2937',           // Dark gray for text
  BACKGROUND: '#F9FAFB'      // Light background
};

export default function PixelPerfectFloorPlan({ 
  cadFile, 
  analysis, 
  corridorWidth = 1.2,
  onCorridorWidthChange 
}: PixelPerfectFloorPlanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [showIlots, setShowIlots] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [floorPlanElements, setFloorPlanElements] = useState<FloorPlanElement[]>([]);
  const [ilotPlacements, setIlotPlacements] = useState<IlotPlacement[]>([]);
  const [corridorPaths, setCorridorPaths] = useState<CorridorPath[]>([]);

  // Process CAD file to extract floor plan elements
  const processCADFile = () => {
    if (!cadFile) return;

    setIsProcessing(true);
    
    // Extract elements from CAD file
    const elements: FloorPlanElement[] = [];
    
    cadFile.elements.forEach(element => {
      const bounds = element.geometry.bounds;
      
      switch (element.type) {
        case 'wall':
          elements.push({
            type: 'wall',
            id: element.id,
            geometry: {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
            },
            properties: {
              color: COLORS.WALL,
              strokeWidth: 8
            }
          });
          break;
          
        case 'door':
        case 'window':
          // Classify as entrance/exit based on properties
          const isEntrance = element.properties.text?.toLowerCase().includes('entree') || 
                           element.properties.text?.toLowerCase().includes('entrance');
          
          elements.push({
            type: isEntrance ? 'entrance' : 'exit',
            id: element.id,
            geometry: {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
            },
            properties: {
              color: COLORS.ENTRANCE,
              strokeWidth: 4
            }
          });
          break;
          
        case 'room':
          // Check if it's a restricted area
          const isRestricted = element.properties.text?.toLowerCase().includes('no') ||
                             element.properties.text?.toLowerCase().includes('restricted');
          
          if (isRestricted) {
            elements.push({
              type: 'restricted',
              id: element.id,
              geometry: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
              },
              properties: {
                color: COLORS.RESTRICTED,
                strokeWidth: 2
              }
            });
          }
          break;
      }
    });
    
    setFloorPlanElements(elements);
    
    // Generate optimal ilot placements
    generateIlotPlacements(elements);
    
    setIsProcessing(false);
  };

  // Generate intelligent ilot placements
  const generateIlotPlacements = (elements: FloorPlanElement[]) => {
    const placements: IlotPlacement[] = [];
    
    // Find available floor space (avoiding walls, restricted areas, entrances)
    const obstacles = elements.filter(el => 
      el.type === 'wall' || el.type === 'restricted' || el.type === 'entrance' || el.type === 'exit'
    );
    
    // Calculate usable area bounds
    const floorBounds = {
      minX: Math.min(...elements.map(el => el.geometry.x)),
      minY: Math.min(...elements.map(el => el.geometry.y)),
      maxX: Math.max(...elements.map(el => el.geometry.x + el.geometry.width)),
      maxY: Math.max(...elements.map(el => el.geometry.y + el.geometry.height))
    };
    
    // Generate grid-based placement with different sizes
    const ilotSizes = [
      { size: 'small' as const, width: 2.0, height: 1.5, color: COLORS.ILOT_SMALL },
      { size: 'medium' as const, width: 2.5, height: 2.0, color: COLORS.ILOT_MEDIUM },
      { size: 'large' as const, width: 3.0, height: 2.5, color: COLORS.ILOT_LARGE }
    ];
    
    let ilotId = 1;
    
    // Grid placement algorithm
    for (let y = floorBounds.minY + 1; y < floorBounds.maxY - 3; y += 3) {
      for (let x = floorBounds.minX + 1; x < floorBounds.maxX - 3; x += 3) {
        
        // Choose random size for variety
        const sizeConfig = ilotSizes[Math.floor(Math.random() * ilotSizes.length)];
        
        const proposedIlot = {
          x,
          y,
          width: sizeConfig.width,
          height: sizeConfig.height
        };
        
        // Check if placement is valid (no collisions)
        const hasCollision = obstacles.some(obstacle => 
          isRectangleOverlap(proposedIlot, obstacle.geometry)
        );
        
        // Check minimum distance from other ilots
        const tooClose = placements.some(existing =>
          getDistance(proposedIlot, existing) < corridorWidth + 0.5
        );
        
        if (!hasCollision && !tooClose && placements.length < 50) {
          placements.push({
            id: `ilot-${ilotId++}`,
            x: proposedIlot.x,
            y: proposedIlot.y,
            width: proposedIlot.width,
            height: proposedIlot.height,
            area: proposedIlot.width * proposedIlot.height,
            size: sizeConfig.size,
            accessible: true
          });
        }
      }
    }
    
    setIlotPlacements(placements);
    
    // Generate corridors after ilot placement
    generateCorridorNetwork(placements);
  };

  // Generate intelligent corridor network
  const generateCorridorNetwork = (ilots: IlotPlacement[]) => {
    const corridors: CorridorPath[] = [];
    
    // Find ilot pairs that need corridors (facing each other)
    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const ilot1 = ilots[i];
        const ilot2 = ilots[j];
        
        // Check if ilots are facing each other and need a corridor
        if (shouldCreateCorridor(ilot1, ilot2, corridorWidth)) {
          const corridor = createCorridorPath(ilot1, ilot2, corridorWidth);
          if (corridor) {
            corridors.push(corridor);
          }
        }
      }
    }
    
    setCorridorPaths(corridors);
  };

  // Helper functions
  const isRectangleOverlap = (rect1: any, rect2: any) => {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
  };

  const getDistance = (rect1: any, rect2: any) => {
    const centerX1 = rect1.x + rect1.width / 2;
    const centerY1 = rect1.y + rect1.height / 2;
    const centerX2 = rect2.x + rect2.width / 2;
    const centerY2 = rect2.y + rect2.height / 2;
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  };

  const shouldCreateCorridor = (ilot1: IlotPlacement, ilot2: IlotPlacement, width: number) => {
    const distance = getDistance(ilot1, ilot2);
    const minDistance = Math.max(ilot1.width, ilot1.height) + Math.max(ilot2.width, ilot2.height) + width;
    
    // Create corridor if ilots are close enough and aligned
    return distance < minDistance * 2 && distance > minDistance;
  };

  const createCorridorPath = (ilot1: IlotPlacement, ilot2: IlotPlacement, width: number): CorridorPath | null => {
    // Create straight corridor path between ilot centers
    const start = {
      x: ilot1.x + ilot1.width / 2,
      y: ilot1.y + ilot1.height / 2
    };
    
    const end = {
      x: ilot2.x + ilot2.width / 2,
      y: ilot2.y + ilot2.height / 2
    };
    
    return {
      id: `corridor-${ilot1.id}-${ilot2.id}`,
      path: [start, end],
      width,
      connectedIlots: [ilot1.id, ilot2.id]
    };
  };

  // Canvas rendering
  const drawFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set scale and transform
    ctx.save();
    ctx.scale(scale, scale);
    
    // Draw floor plan elements (walls, restricted areas, entrances)
    floorPlanElements.forEach(element => {
      ctx.strokeStyle = element.properties.color;
      ctx.lineWidth = element.properties.strokeWidth;
      
      if (element.type === 'wall') {
        ctx.fillStyle = element.properties.color;
        ctx.fillRect(
          element.geometry.x, 
          element.geometry.y, 
          element.geometry.width, 
          element.geometry.height
        );
      } else if (element.type === 'restricted') {
        ctx.fillStyle = element.properties.color + '40'; // Semi-transparent
        ctx.fillRect(
          element.geometry.x, 
          element.geometry.y, 
          element.geometry.width, 
          element.geometry.height
        );
      } else if (element.type === 'entrance' || element.type === 'exit') {
        // Draw door swing arcs
        ctx.beginPath();
        ctx.arc(
          element.geometry.x + element.geometry.width / 2,
          element.geometry.y + element.geometry.height / 2,
          Math.max(element.geometry.width, element.geometry.height) / 2,
          0,
          Math.PI
        );
        ctx.stroke();
      }
    });
    
    // Draw corridors
    if (showCorridors) {
      corridorPaths.forEach(corridor => {
        ctx.strokeStyle = COLORS.CORRIDOR;
        ctx.lineWidth = corridor.width * 10; // Scale for visibility
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        corridor.path.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });
    }
    
    // Draw ilots
    if (showIlots) {
      ilotPlacements.forEach(ilot => {
        const color = ilot.size === 'small' ? COLORS.ILOT_SMALL :
                     ilot.size === 'medium' ? COLORS.ILOT_MEDIUM : COLORS.ILOT_LARGE;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = COLORS.CORRIDOR;
        ctx.lineWidth = 2;
        
        ctx.fillRect(ilot.x, ilot.y, ilot.width, ilot.height);
        ctx.strokeRect(ilot.x, ilot.y, ilot.width, ilot.height);
        
        // Draw measurements
        if (showMeasurements) {
          ctx.fillStyle = COLORS.TEXT;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${ilot.area.toFixed(1)}m²`,
            ilot.x + ilot.width / 2,
            ilot.y + ilot.height / 2
          );
        }
      });
    }
    
    ctx.restore();
  };

  // Effects
  useEffect(() => {
    if (cadFile) {
      processCADFile();
    }
  }, [cadFile]);

  useEffect(() => {
    drawFloorPlan();
  }, [floorPlanElements, ilotPlacements, corridorPaths, scale, showIlots, showCorridors, showMeasurements]);

  useEffect(() => {
    if (ilotPlacements.length > 0) {
      generateCorridorNetwork(ilotPlacements);
    }
  }, [corridorWidth]);

  const exportFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'floor-plan-with-ilots.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!cadFile) {
    return (
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="text-white">Pixel-Perfect Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Upload a CAD file to begin floor plan processing
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Panel */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="text-white flex items-between">
            <span>Floor Plan Controls</span>
            <div className="flex gap-2">
              <Button
                onClick={processCADFile}
                disabled={isProcessing}
                size="sm"
                className="ml-auto"
              >
                {isProcessing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isProcessing ? 'Processing...' : 'Generate Plan'}
              </Button>
              <Button onClick={exportFloorPlan} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Corridor Width Control */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Corridor Width: {corridorWidth.toFixed(1)}m
            </label>
            <Slider
              value={[corridorWidth]}
              onValueChange={(value) => onCorridorWidthChange(value[0])}
              min={0.8}
              max={3.0}
              step={0.1}
              className="w-full"
            />
          </div>
          
          {/* Display Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showIlots}
                onCheckedChange={setShowIlots}
              />
              <label className="text-sm text-gray-300">Show Îlots</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showCorridors}
                onCheckedChange={setShowCorridors}
              />
              <label className="text-sm text-gray-300">Show Corridors</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showMeasurements}
                onCheckedChange={setShowMeasurements}
              />
              <label className="text-sm text-gray-300">Show Measurements</label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Scale:</label>
              <Slider
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                min={0.5}
                max={3.0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="text-xs text-gray-400">Total Îlots</label>
              <p className="text-lg font-semibold text-white">{ilotPlacements.length}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Corridors</label>
              <p className="text-lg font-semibold text-white">{corridorPaths.length}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Total Area</label>
              <p className="text-lg font-semibold text-white">
                {ilotPlacements.reduce((sum, ilot) => sum + ilot.area, 0).toFixed(1)}m²
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floor Plan Canvas */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="text-white">Pixel-Perfect Floor Plan Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-600 rounded-lg bg-white w-full"
              style={{ maxHeight: '600px' }}
            />
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.WALL }}></div>
                <span className="text-xs text-gray-400">Walls (MUR)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.RESTRICTED }}></div>
                <span className="text-xs text-gray-400">Restricted (NO ENTREE)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.ENTRANCE }}></div>
                <span className="text-xs text-gray-400">Entrance/Exit (ENTRÉE/SORTIE)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.CORRIDOR }}></div>
                <span className="text-xs text-gray-400">Corridors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.ILOT_SMALL }}></div>
                <span className="text-xs text-gray-400">Small Îlots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.ILOT_MEDIUM }}></div>
                <span className="text-xs text-gray-400">Medium Îlots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.ILOT_LARGE }}></div>
                <span className="text-xs text-gray-400">Large Îlots</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}