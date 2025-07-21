import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CADFile } from "@shared/schema";
import { Building, Layers, Ruler, Scale } from "lucide-react";

interface ResultsVisualizationProps {
  cadFile: CADFile | null;
  analysisResults: any;
}

export default function ResultsVisualization({ cadFile, analysisResults }: ResultsVisualizationProps) {
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
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {cadFile.elements?.filter(e => e.type === 'wall').length || 0}
                </div>
                <div className="text-sm text-gray-400">Walls</div>
              </div>
              <div className="text-center">
                {cadFile.elements?.filter(e => e.type === 'door').length || 0}
              </div>
              <div className="text-sm text-gray-400">Doors</div>
            </div>
            <div className="text-center">
              {cadFile.elements?.filter(e => e.type === 'window').length || 0}
              </div>
              <div className="text-sm text-gray-400">Windows</div>
            </div>
            <div className="text-center">
              {cadFile.elements?.filter(e => e.type === 'room').length || 0}
              </div>
              <div className="text-sm text-gray-400">Rooms</div>
            </div>
            <div className="text-center">
              {cadFile.elements?.filter(e => e.type === 'furniture').length || 0}
              </div>
              <div className="text-sm text-gray-400">Furniture</div>
            </div>
            <div className="text-center">
              {cadFile.elements?.filter(e => e.type === 'annotation').length || 0}
              </div>
              <div className="text-sm text-gray-400">Annotations</div>
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
                {analysisResults?.result?.metrics?.totalIlots || analysisResults?.result?.ilots?.length || 0}
              </div>
              <div className="text-sm text-gray-400">Total Îlots Placed</div>
            </div>
            <div className="text-center">
              {analysisResults?.result?.metrics?.spaceUtilization?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-gray-400">Space Utilization</div>
            </div>
            <div className="text-center">
              {analysisResults?.result?.fitness?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-400">Fitness Score</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}