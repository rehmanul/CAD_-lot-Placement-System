import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CADFile, Analysis } from "@shared/schema";
import { Eye, Download, Maximize2, Activity } from "lucide-react";

interface PixelPerfectFloorPlanProps {
  cadFile: CADFile;
  analysis: Analysis;
}

const getStatusColor = (status?: string) => {
    if (!status || typeof status !== 'string') return 'text-gray-400';
    const firstChar = status.toLowerCase().charAt(0);
    switch (firstChar) {
      case 'c': return 'text-green-400';
      case 'p': return 'text-yellow-400';
      case 'e': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

export default function PixelPerfectFloorPlan({ 
  cadFile, 
  analysis 
}: PixelPerfectFloorPlanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analysis?.result?.ilots) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size for better pixel-perfect rendering
    canvas.width = 1000;
    canvas.height = 800;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw precise grid (1m = 10px for pixel-perfect visualization)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 10; // 1 meter = 10 pixels
    
    for (let i = 0; i <= canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw major grid lines (5m intervals)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw floor plan bounds with exact measurements
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    const floorPlanWidth = 900;
    const floorPlanHeight = 700;
    const floorPlanX = (canvas.width - floorPlanWidth) / 2;
    const floorPlanY = (canvas.height - floorPlanHeight) / 2;
    ctx.strokeRect(floorPlanX, floorPlanY, floorPlanWidth, floorPlanHeight);

    // Pixel-perfect scaling: 1 meter = 10 pixels
    const scaleFactor = 10;
    const offsetX = floorPlanX;
    const offsetY = floorPlanY;

    // Draw îlots with correct property access
    analysis.result.ilots.forEach((ilot, index) => {
      // Safe null checks with correct property names
      if (!ilot || !ilot.position || typeof ilot.position.x !== 'number' || typeof ilot.position.y !== 'number') return;

      const scaledX = offsetX + (ilot.position.x * scaleFactor);
      const scaledY = offsetY + (ilot.position.y * scaleFactor);
      const scaledWidth = (ilot.width || 2.4) * scaleFactor;
      const scaledHeight = (ilot.height || 1.6) * scaleFactor;

      // Get color based on size
      const colors = {
        small: '#10B981',   // Green
        medium: '#F59E0B',  // Yellow
        large: '#EF4444'    // Red
      };

      const ilotSize = (ilot.size && typeof ilot.size === 'string') ? ilot.size : 'medium';
      ctx.fillStyle = colors[ilotSize as keyof typeof colors] || colors.medium;
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw accessibility indicator
      if (ilot.accessible) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledX + 1, scaledY + 1, scaledWidth - 2, scaledHeight - 2);
      }

      // Draw îlot measurements and label
      if (scaledWidth > 15 && scaledHeight > 15) {
        // Draw measurement text
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const displaySize = ilotSize.charAt(0).toUpperCase();
        const widthM = (ilot.width || 2.4).toFixed(1);
        const heightM = (ilot.height || 1.6).toFixed(1);
        
        ctx.fillText(
          `${displaySize}${index + 1}`,
          scaledX + scaledWidth / 2,
          scaledY + scaledHeight / 2 - 3
        );
        ctx.fillText(
          `${widthM}×${heightM}m`,
          scaledX + scaledWidth / 2,
          scaledY + scaledHeight / 2 + 8
        );
      }
    });

    // Draw corridors first (so they appear behind îlots)
    if (analysis.result.corridors && Array.isArray(analysis.result.corridors)) {
      analysis.result.corridors.forEach((corridor, corridorIndex) => {
        if (corridor.path && Array.isArray(corridor.path) && corridor.path.length >= 2) {
          // Use exact corridor width (default 1.2m = 12 pixels)
          const corridorWidthPixels = (corridor.width || 1.2) * scaleFactor;
          
          for (let i = 0; i < corridor.path.length - 1; i++) {
            const start = corridor.path[i];
            const end = corridor.path[i + 1];
            
            if (start && end && typeof start.x === 'number' && typeof start.y === 'number' &&
                typeof end.x === 'number' && typeof end.y === 'number') {
              
              const startX = offsetX + (start.x * scaleFactor);
              const startY = offsetY + (start.y * scaleFactor);
              const endX = offsetX + (end.x * scaleFactor);
              const endY = offsetY + (end.y * scaleFactor);
              
              // Calculate perpendicular offset for exact corridor width
              const dx = endX - startX;
              const dy = endY - startY;
              const segmentLength = Math.sqrt(dx * dx + dy * dy);
              
              if (segmentLength > 0) {
                const perpX = -dy / segmentLength * (corridorWidthPixels / 2);
                const perpY = dx / segmentLength * (corridorWidthPixels / 2);
                
                // Draw corridor background with exact width
                ctx.fillStyle = 'rgba(99, 102, 241, 0.25)'; // Indigo with transparency
                ctx.beginPath();
                ctx.moveTo(startX + perpX, startY + perpY);
                ctx.lineTo(startX - perpX, startY - perpY);
                ctx.lineTo(endX - perpX, endY - perpY);
                ctx.lineTo(endX + perpX, endY + perpY);
                ctx.closePath();
                ctx.fill();
                
                // Draw corridor border for precision
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw corridor centerline
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            }
          }
          
          // Draw corridor connection points
          corridor.path.forEach((point, pointIndex) => {
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
              const pointX = offsetX + (point.x * scaleFactor);
              const pointY = offsetY + (point.y * scaleFactor);
              
              // Draw connection node
              ctx.fillStyle = '#4f46e5';
              ctx.beginPath();
              ctx.arc(pointX, pointY, 4, 0, 2 * Math.PI);
              ctx.fill();
              
              // Draw node border
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
          
          // Draw corridor width indicator and label
          if (corridor.path.length > 0) {
            const midPoint = corridor.path[Math.floor(corridor.path.length / 2)];
            if (midPoint && typeof midPoint.x === 'number' && typeof midPoint.y === 'number') {
              const labelX = offsetX + (midPoint.x * scaleFactor);
              const labelY = offsetY + (midPoint.y * scaleFactor);
              
              // Draw label background
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(labelX - 25, labelY - 8, 50, 16);
              
              // Draw corridor info
              ctx.fillStyle = '#ffffff';
              ctx.font = '9px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`${(corridor.width || 1.2).toFixed(1)}m`, labelX, labelY + 3);
            }
          }
        }
      });
    }
  }, [analysis]);

  const downloadImage = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${cadFile.name}_floor_plan.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const openFullscreen = () => {
    if (!canvasRef.current) return;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Floor Plan - ${cadFile.name}</title></head>
          <body style="margin: 0; background: #1f2937; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <img src="${canvasRef.current.toDataURL()}" style="max-width: 100%; max-height: 100%;" />
          </body>
        </html>
      `);
    }
  };

  return (
    <Card className="metric-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-400" />
            Pixel-Perfect Floor Plan Visualization
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openFullscreen}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Fullscreen
            </Button>
            <Button size="sm" onClick={downloadImage}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Processing Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Analysis Status</h3>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Current Status:</span>
            <span className={`font-medium ${getStatusColor(analysis?.status || 'unknown')}`}>
              {(analysis?.status || 'unknown').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
        {/* Analysis Results Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {analysis.result?.totalIlots || 0}
            </div>
            <div className="text-sm text-gray-400">Total Îlots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {analysis.result?.spaceUtilization || 0}%
            </div>
            <div className="text-sm text-gray-400">Space Utilization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {analysis.result?.fitnessScore || 0}
            </div>
            <div className="text-sm text-gray-400">Fitness Score</div>
          </div>
        </div>

        {/* Îlot Type Distribution */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-green-600/20 text-green-400">
            Small: {analysis.result?.ilots?.filter(i => i.size === 'small').length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-orange-600/20 text-orange-400">
            Medium: {analysis.result?.ilots?.filter(i => i.size === 'medium').length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-red-600/20 text-red-400">
            Large: {analysis.result?.ilots?.filter(i => i.size === 'large').length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
            Corridors: {analysis.result?.corridors?.length || 0}
          </Badge>
        </div>
         {/* Results Display */}
      {analysis?.result && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Total Îlots</h4>
              <p className="text-2xl font-bold text-white">{analysis.result.totalIlots || 0}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Efficiency</h4>
              <p className="text-2xl font-bold text-green-400">{analysis.result.efficiency || 0}%</p>
            </div>
          </div>

        {/* Canvas with scale reference */}
        <div className="flex flex-col items-center">
          <canvas 
            ref={canvasRef}
            className="border border-gray-600 rounded-lg max-w-full shadow-2xl"
            style={{ background: '#0f172a' }}
          />
          
          {/* Scale Reference */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-10 h-1 bg-gray-400"></div>
              <span>1m = 10px</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 opacity-25 border border-indigo-400"></div>
              <span>Corridors (1.2m width)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>Small Îlots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500"></div>
              <span>Medium Îlots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500"></div>
              <span>Large Îlots</span>
            </div>
          </div>
        </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}