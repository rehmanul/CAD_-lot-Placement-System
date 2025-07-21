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
    if (!canvasRef.current || !analysis?.result?.ilots) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw floor plan bounds
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 500);

    const scaleFactor = 6;
    const offsetX = 60;
    const offsetY = 60;

    // Draw îlots
    analysis.result.ilots.forEach((ilot, index) => {
      // Safe null checks
      if (!ilot || typeof ilot.x !== 'number' || typeof ilot.y !== 'number') return;

      const scaledX = offsetX + (ilot.x * scaleFactor);
      const scaledY = offsetY + (ilot.y * scaleFactor);
      const scaledWidth = (ilot.width || 10) * scaleFactor;
      const scaledHeight = (ilot.height || 10) * scaleFactor;

      // Get color based on type
      const colors = {
        small: '#10B981',   // Green
        medium: '#F59E0B',  // Yellow
        large: '#EF4444'    // Red
      };

      const ilotType = (ilot.type && typeof ilot.type === 'string') ? ilot.type : 'small';
      ctx.fillStyle = colors[ilotType as keyof typeof colors] || colors.small;
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw label
      if (scaledWidth > 20 && scaledHeight > 20) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const displayType = ilotType.charAt(0).toUpperCase();
        ctx.fillText(
          `${displayType}${index + 1}`,
          scaledX + scaledWidth / 2,
          scaledY + scaledHeight / 2 + 4
        );
      }
    });

    // Draw corridors if available
    if (analysis.result.corridors && Array.isArray(analysis.result.corridors)) {
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      analysis.result.corridors.forEach(corridor => {
        if (corridor.points && Array.isArray(corridor.points)) {
          corridor.points.forEach((point, index) => {
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
              if (index === 0) {
                ctx.beginPath();
                ctx.moveTo(offsetX + (point.x * scaleFactor), offsetY + (point.y * scaleFactor));
              } else {
                ctx.lineTo(offsetX + (point.x * scaleFactor), offsetY + (point.y * scaleFactor));
              }
            }
          });
          ctx.stroke();
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