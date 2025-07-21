import { Box, RotateCcw, ZoomIn, ZoomOut, Layers, Eye, EyeOff, Maximize, Grid3X3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";

interface BIMLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  opacity: number;
  type: 'structural' | 'architectural' | 'mechanical' | 'electrical' | 'plumbing';
}

interface BIMModel {
  id: string;
  name: string;
  elements: number;
  size: string;
  layers: BIMLayer[];
}

export function BIMVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'section'>('3d');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [bimModel, setBimModel] = useState<BIMModel>({
    id: 'model_001',
    name: 'Floor Plan Analysis',
    elements: 1247,
    size: '12.4 MB',
    layers: [
      { id: 'layer_1', name: 'Structural Elements', visible: true, color: '#3B82F6', opacity: 1, type: 'structural' },
      { id: 'layer_2', name: 'Architecture', visible: true, color: '#10B981', opacity: 0.8, type: 'architectural' },
      { id: 'layer_3', name: 'Îlots', visible: true, color: '#EF4444', opacity: 0.9, type: 'architectural' },
      { id: 'layer_4', name: 'Corridors', visible: true, color: '#F59E0B', opacity: 0.7, type: 'architectural' },
      { id: 'layer_5', name: 'MEP Systems', visible: false, color: '#8B5CF6', opacity: 0.6, type: 'mechanical' },
      { id: 'layer_6', name: 'Electrical', visible: false, color: '#F97316', opacity: 0.5, type: 'electrical' }
    ]
  });

  useEffect(() => {
    // Initialize 3D visualization
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderBIMModel(ctx);
      }
    }
  }, [viewMode, zoom, rotation, bimModel]);

  const renderBIMModel = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, width, height);
    }
    
    // Draw BIM elements based on view mode
    switch (viewMode) {
      case '3d':
        draw3DModel(ctx, width, height);
        break;
      case '2d':
        draw2DModel(ctx, width, height);
        break;
      case 'section':
        drawSectionView(ctx, width, height);
        break;
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const draw3DModel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = zoom / 100;
    
    // Draw structural elements (if visible)
    const structuralLayer = bimModel.layers.find(l => l.type === 'structural');
    if (structuralLayer?.visible) {
      ctx.strokeStyle = structuralLayer.color;
      ctx.globalAlpha = structuralLayer.opacity;
      ctx.lineWidth = 3;
      
      // Draw 3D structural frame
      drawIsometricBox(ctx, centerX - 100 * scale, centerY - 50 * scale, 200 * scale, 100 * scale, 30 * scale);
    }
    
    // Draw architectural elements
    const archLayer = bimModel.layers.find(l => l.name === 'Architecture');
    if (archLayer?.visible) {
      ctx.strokeStyle = archLayer.color;
      ctx.globalAlpha = archLayer.opacity;
      ctx.lineWidth = 2;
      
      // Draw walls in 3D
      drawIsometricWalls(ctx, centerX, centerY, scale);
    }
    
    // Draw îlots
    const ilotLayer = bimModel.layers.find(l => l.name === 'Îlots');
    if (ilotLayer?.visible) {
      ctx.fillStyle = ilotLayer.color;
      ctx.globalAlpha = ilotLayer.opacity;
      
      // Draw 3D îlots
      drawIsometricIlots(ctx, centerX, centerY, scale);
    }
    
    // Draw corridors
    const corridorLayer = bimModel.layers.find(l => l.name === 'Corridors');
    if (corridorLayer?.visible) {
      ctx.strokeStyle = corridorLayer.color;
      ctx.globalAlpha = corridorLayer.opacity;
      ctx.lineWidth = 3;
      
      // Draw corridor paths
      drawCorridorPaths(ctx, centerX, centerY, scale);
    }
    
    ctx.globalAlpha = 1;
  };

  const draw2DModel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = zoom / 100;
    
    // Draw floor plan in 2D
    bimModel.layers.forEach(layer => {
      if (!layer.visible) return;
      
      ctx.strokeStyle = layer.color;
      ctx.globalAlpha = layer.opacity;
      ctx.lineWidth = 2;
      
      // Draw layer elements
      switch (layer.type) {
        case 'structural':
          draw2DStructural(ctx, centerX, centerY, scale);
          break;
        case 'architectural':
          draw2DArchitectural(ctx, centerX, centerY, scale, layer.name);
          break;
      }
    });
    
    ctx.globalAlpha = 1;
  };

  const drawSectionView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = zoom / 100;
    
    // Draw cross-section view
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    
    // Draw section lines
    ctx.beginPath();
    ctx.moveTo(centerX - 150 * scale, centerY + 50 * scale);
    ctx.lineTo(centerX + 150 * scale, centerY + 50 * scale);
    ctx.lineTo(centerX + 150 * scale, centerY - 100 * scale);
    ctx.lineTo(centerX - 150 * scale, centerY - 100 * scale);
    ctx.closePath();
    ctx.stroke();
    
    // Draw interior elements
    ctx.fillStyle = '#EF4444';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(centerX - 20 * scale, centerY, 40 * scale, 40 * scale);
    ctx.fillRect(centerX + 60 * scale, centerY, 30 * scale, 30 * scale);
    
    ctx.globalAlpha = 1;
  };

  // Helper functions for drawing isometric elements
  const drawIsometricBox = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, d: number) => {
    // Front face
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    
    // Top face
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d * 0.5, y - d * 0.5);
    ctx.lineTo(x + w + d * 0.5, y - d * 0.5);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.stroke();
    
    // Right face
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + d * 0.5, y - d * 0.5);
    ctx.lineTo(x + w + d * 0.5, y + h - d * 0.5);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.stroke();
  };

  const drawIsometricWalls = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number) => {
    // Draw isometric walls
    ctx.beginPath();
    ctx.moveTo(centerX - 120 * scale, centerY - 60 * scale);
    ctx.lineTo(centerX + 120 * scale, centerY - 60 * scale);
    ctx.lineTo(centerX + 120 * scale, centerY + 60 * scale);
    ctx.lineTo(centerX - 120 * scale, centerY + 60 * scale);
    ctx.closePath();
    ctx.stroke();
  };

  const drawIsometricIlots = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number) => {
    // Draw 3D îlots
    const ilots = [
      { x: -80, y: -30, w: 40, h: 30 },
      { x: 20, y: -20, w: 50, h: 35 },
      { x: -50, y: 20, w: 35, h: 25 }
    ];
    
    ilots.forEach(ilot => {
      const x = centerX + ilot.x * scale;
      const y = centerY + ilot.y * scale;
      const w = ilot.w * scale;
      const h = ilot.h * scale;
      const depth = 15 * scale;
      
      drawIsometricBox(ctx, x, y, w, h, depth);
    });
  };

  const drawCorridorPaths = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number) => {
    // Draw corridor connections
    ctx.beginPath();
    ctx.moveTo(centerX - 60 * scale, centerY - 15 * scale);
    ctx.lineTo(centerX + 40 * scale, centerY - 15 * scale);
    ctx.moveTo(centerX + 40 * scale, centerY - 15 * scale);
    ctx.lineTo(centerX - 30 * scale, centerY + 35 * scale);
    ctx.stroke();
  };

  const draw2DStructural = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number) => {
    // Draw columns
    const columns = [
      { x: -100, y: -50 },
      { x: 100, y: -50 },
      { x: -100, y: 50 },
      { x: 100, y: 50 }
    ];
    
    columns.forEach(col => {
      ctx.fillRect(centerX + col.x * scale - 5, centerY + col.y * scale - 5, 10, 10);
    });
  };

  const draw2DArchitectural = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number, layerName: string) => {
    if (layerName === 'Architecture') {
      // Draw walls
      ctx.strokeRect(centerX - 120 * scale, centerY - 60 * scale, 240 * scale, 120 * scale);
    } else if (layerName === 'Îlots') {
      // Draw îlots as rectangles
      ctx.fillRect(centerX - 80 * scale, centerY - 30 * scale, 40 * scale, 30 * scale);
      ctx.fillRect(centerX + 20 * scale, centerY - 20 * scale, 50 * scale, 35 * scale);
      ctx.fillRect(centerX - 50 * scale, centerY + 20 * scale, 35 * scale, 25 * scale);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setBimModel(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    }));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setBimModel(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity: opacity / 100 }
          : layer
      )
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="glass-morphism border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Box className="w-5 h-5" />
                3D BIM Visualization
              </CardTitle>
              <CardDescription className="text-white/70">
                Advanced Building Information Modeling with real-time 3D visualization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
                <TabsList className="bg-white/10">
                  <TabsTrigger value="3d" className="data-[state=active]:bg-white/20">3D View</TabsTrigger>
                  <TabsTrigger value="2d" className="data-[state=active]:bg-white/20">2D Plan</TabsTrigger>
                  <TabsTrigger value="section" className="data-[state=active]:bg-white/20">Section</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(100)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation({ x: 0, y: 0, z: 0 })}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Main Visualization Canvas */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: isFullscreen ? '80vh' : '500px' }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={isFullscreen ? 600 : 500}
                className="w-full h-full object-contain"
              />
              
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm min-w-[60px] text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Model Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{bimModel.elements}</div>
                <div className="text-sm text-white/70">Elements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{bimModel.layers.filter(l => l.visible).length}</div>
                <div className="text-sm text-white/70">Active Layers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{bimModel.size}</div>
                <div className="text-sm text-white/70">Model Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{viewMode.toUpperCase()}</div>
                <div className="text-sm text-white/70">View Mode</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer Management */}
      <Card className="glass-morphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5" />
            BIM Layer Management
          </CardTitle>
          <CardDescription className="text-white/70">
            Control layer visibility and properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bimModel.layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="text-white hover:bg-white/10 p-1"
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: layer.color }}
                  />
                  
                  <div>
                    <div className="text-white font-medium">{layer.name}</div>
                    <div className="text-white/60 text-sm capitalize">{layer.type}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-white/70 text-sm min-w-[60px]">
                    {Math.round(layer.opacity * 100)}%
                  </div>
                  <div className="w-20">
                    <Slider
                      value={[layer.opacity * 100]}
                      onValueChange={(value) => updateLayerOpacity(layer.id, value[0])}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}