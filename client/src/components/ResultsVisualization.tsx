import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CADFile } from "@shared/schema";
import { Building, Layers, Ruler, Scale } from "lucide-react";

interface ResultsVisualizationProps {
  cadFile: CADFile | null;
  analysisResults: any;
}

export function ResultsVisualization({ cadFile, analysisResults }: ResultsVisualizationProps) {
  if (!cadFile) {
    return (
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Building className="w-5 h-5 mr-2 text-blue-400" />
            Floor Plan Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Upload a CAD file to begin analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Information */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Building className="w-5 h-5 mr-2 text-blue-400" />
            CAD File Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400">Format</label>
              <p className="text-white font-medium">{cadFile.format}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Scale</label>
              <p className="text-white font-medium">{cadFile.scale}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Dimensions</label>
              <p className="text-white font-medium">
                {cadFile.dimensions.width}mm × {cadFile.dimensions.height}mm
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Elements</label>
              <p className="text-white font-medium">{cadFile.elements.length}</p>
            </div>
          </div>

          {/* Layers */}
          <div>
            <label className="text-sm text-gray-400 flex items-center mb-2">
              <Layers className="w-4 h-4 mr-1" />
              Layers Detected
            </label>
            <div className="flex flex-wrap gap-2">
              {cadFile.layers.map((layer) => (
                <Badge key={layer} variant="secondary" className="bg-blue-600/20 text-blue-400">
                  {layer}
                </Badge>
              ))}
            </div>
          </div>

          {/* Element Types */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Element Distribution</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['wall', 'door', 'window', 'room', 'furniture', 'annotation'].map((type) => {
                const count = cadFile.elements.filter(el => el.type === type).length;
                return (
                  <div key={type} className="text-center">
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-400 capitalize">{type}s</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Scale className="w-5 h-5 mr-2 text-green-400" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {analysisResults.totalIlots || 0}
                </div>
                <div className="text-sm text-gray-400">Total Îlots Placed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {analysisResults.spaceUtilization || 0}%
                </div>
                <div className="text-sm text-gray-400">Space Utilization</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {analysisResults.fitnessScore || 0}
                </div>
                <div className="text-sm text-gray-400">Fitness Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}