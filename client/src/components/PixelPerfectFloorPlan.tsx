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

const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') return 'text-gray-400';
    switch (status.charAt(0)) {
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
    if (!canvasRef.current || !analysis.result) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#1f2937'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor plan outline
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Draw walls from CAD file
    if (analysis.result.floorPlan?.walls) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;

      analysis.result.floorPlan.walls.forEach(wall => {
        if (wall.geometry.coordinates && wall.geometry.coordinates.length >= 2) {
          ctx.beginPath();
          const [x1, y1] = wall.geometry.coordinates[0];
          const [x2, y2] = wall.geometry.coordinates[1];

          // Scale coordinates to fit canvas
          const scaledX1 = (x1 / cadFile.dimensions.width) * (canvas.width - 100) + 50;
          const scaledY1 = (y1 / cadFile.dimensions.height) * (canvas.height - 100) + 50;
          const scaledX2 = (x2 / cadFile.dimensions.width) * (canvas.width - 100) + 50;
          const scaledY2 = (y2 / cadFile.dimensions.height) * (canvas.height - 100) + 50;

          ctx.moveTo(scaledX1, scaledY1);
          ctx.lineTo(scaledX2, scaledY2);
          ctx.stroke();
        }
      });
    }

    // Draw îlots
    if (analysis.result.ilots) {
      analysis.result.ilots.forEach((ilot, index) => {
        // Set color based on îlot type
        let fillColor = '#3b82f6'; // Default blue
        const ilotType = ilot.type || 'unknown';
        if (ilotType === 'small') fillColor = '#10b981'; // Green
        if (ilotType === 'medium') fillColor = '#f59e0b'; // Orange
        if (ilotType === 'large') fillColor = '#ef4444'; // Red

        ctx.fillStyle = fillColor + '80'; // Add transparency
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;

        // Scale îlot position and size
        const scaledX = (ilot.x / cadFile.dimensions.width) * (canvas.width - 100) + 50;
        const scaledY = (ilot.y / cadFile.dimensions.height) * (canvas.width - 100) + 50;
        const scaledWidth = (ilot.width / cadFile.dimensions.width) * (canvas.width - 100);
        const scaledHeight = (ilot.height / cadFile.dimensions.height) * (canvas.width - 100);

        // Draw îlot rectangle
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Add îlot label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const ilotType = ilot.type || 'unknown';
        ctx.fillText(
          `${ilotType.charAt(0).toUpperCase()}${index + 1}`,
          scaledX + scaledWidth / 2,
          scaledY + scaledHeight / 2 + 4
        );
      });
    }

    // Draw corridors
    if (analysis.result.corridors) {
      ctx.strokeStyle = '#8b5cf6'; // Purple for corridors
      ctx.lineWidth = 8; // Wide corridor
      ctx.setLineDash([5, 5]); // Dashed line

      analysis.result.corridors.forEach(corridor => {
        if (corridor.points && corridor.points.length > 1) {
          ctx.beginPath();

          corridor.points.forEach((point, index) => {
            const [x, y] = point;
            const scaledX = (x / cadFile.dimensions.width) * (canvas.width - 100) + 50;
            const scaledY = (y / cadFile.dimensions.height) * (canvas.height - 100) + 50;

            if (index === 0) {
              ctx.moveTo(scaledX, scaledY);
            } else {
              ctx.lineTo(scaledX, scaledY);
            }
          });

          ctx.stroke();
        }
      });

      ctx.setLineDash([]); // Reset line dash
    }

    // Add legend
    const legendY = canvas.height - 120;
    ctx.fillStyle = '#374151';
    ctx.fillRect(10, legendY, 200, 100);
    ctx.strokeStyle = '#6b7280';
    ctx.strokeRect(10, legendY, 200, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Legend:', 20, legendY + 20);

    // Legend items
    const legendItems = [
      { color: '#10b981', label: 'Small Îlots' },
      { color: '#f59e0b', label: 'Medium Îlots' },
      { color: '#ef4444', label: 'Large Îlots' },
      { color: '#8b5cf6', label: 'Corridors' }
    ];

    legendItems.forEach((item, index) => {
      const y = legendY + 35 + index * 15;
      ctx.fillStyle = item.color;
      ctx.fillRect(20, y - 8, 12, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(item.label, 40, y);
    });

  }, [cadFile, analysis]);

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
            Small: {analysis.result?.ilots?.filter(i => i.type === 'small').length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-orange-600/20 text-orange-400">
            Medium: {analysis.result?.ilots?.filter(i => i.type === 'medium').length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-red-600/20 text-red-400">
            Large: {analysis.result?.ilots?.filter(i => i.type === 'large').length || 0}
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

        {/* Canvas */}
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef}
            className="border border-gray-600 rounded-lg max-w-full"
            style={{ background: '#1f2937' }}
          />
        </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}