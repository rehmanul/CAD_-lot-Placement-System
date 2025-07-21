import { useState } from "react";
import { Layout, Ruler, Square, Maximize } from "lucide-react";
import { CADFile } from "@shared/schema";

interface ResultsVisualizationProps {
  uploadedFile: CADFile | null;
  analysis?: any;
}

export default function ResultsVisualization({ uploadedFile, analysis }: ResultsVisualizationProps) {
  const [layerVisibility, setLayerVisibility] = useState({
    walls: true,
    ilots: true,
    corridors: true
  });
  const [cursorCoords, setCursorCoords] = useState({ x: 425, y: 320 });

  const toggleLayer = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="metric-card rounded-xl p-6 h-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Layout className="w-5 h-5 mr-2 text-blue-400" />
          Floor Plan Visualization
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-3 text-sm">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={layerVisibility.walls}
                onChange={() => toggleLayer('walls')}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Walls</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={layerVisibility.ilots}
                onChange={() => toggleLayer('ilots')}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Îlots</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={layerVisibility.corridors}
                onChange={() => toggleLayer('corridors')}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Corridors</span>
            </label>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors" title="Measure Distance">
              <Ruler className="w-4 h-4 text-gray-300" />
            </button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors" title="Measure Area">
              <Square className="w-4 h-4 text-gray-300" />
            </button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors" title="Zoom Fit">
              <Maximize className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="floor-plan-canvas rounded-lg h-80 relative overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="absolute inset-0">
          {/* Floor Plan Walls (MUR) */}
          {layerVisibility.walls && (
            <g>
              <rect x="50" y="50" width="700" height="500" className="cad-wall" />
              <line x1="50" y1="200" x2="400" y2="200" className="cad-wall" />
              <line x1="400" y1="50" x2="400" y2="350" className="cad-wall" />
              <line x1="400" y1="400" x2="400" y2="550" className="cad-wall" />
              <line x1="600" y1="50" x2="600" y2="300" className="cad-wall" />
              <line x1="200" y1="350" x2="400" y2="350" className="cad-wall" />
              <line x1="50" y1="400" x2="200" y2="400" className="cad-wall" />
              <line x1="200" y1="350" x2="200" y2="550" className="cad-wall" />
              <line x1="600" y1="350" x2="750" y2="350" className="cad-wall" />
            </g>
          )}

          {/* Blue Restricted Areas (NO ENTREE) */}
          <g>
            <rect x="150" y="100" width="80" height="60" className="cad-restricted" />
            <text x="190" y="135" textAnchor="middle" className="fill-blue-600 text-xs font-medium">NO ENTREE</text>
            <rect x="300" y="450" width="80" height="60" className="cad-restricted" />
            <text x="340" y="485" textAnchor="middle" className="fill-blue-600 text-xs font-medium">NO ENTREE</text>
          </g>

          {/* Red Entrance/Exit Areas with Door Swings */}
          <g>
            <path d="M 50 250 Q 80 220 110 250" className="cad-entrance" />
            <text x="80" y="240" textAnchor="middle" className="fill-red-600 text-xs font-medium">ENTRÉE</text>
            <path d="M 750 200 Q 720 170 690 200" className="cad-entrance" />
            <text x="720" y="190" textAnchor="middle" className="fill-red-600 text-xs font-medium">SORTIE</text>
          </g>

          {/* Îlots with Pink/Red Outlines */}
          {layerVisibility.ilots && (
            <g>
              <rect x="100" y="80" width="30" height="40" className="ilot-small" />
              <text x="115" y="105" textAnchor="middle" className="fill-red-600 text-xs">3.2m²</text>
              
              <rect x="250" y="120" width="35" height="30" className="ilot-small" />
              <text x="267" y="140" textAnchor="middle" className="fill-red-600 text-xs">2.8m²</text>

              <rect x="450" y="100" width="50" height="60" className="ilot-medium" />
              <text x="475" y="135" textAnchor="middle" className="fill-red-600 text-xs">5.5m²</text>
              
              <rect x="650" y="120" width="60" height="50" className="ilot-medium" />
              <text x="680" y="150" textAnchor="middle" className="fill-red-600 text-xs">6.8m²</text>
              
              <rect x="80" y="280" width="55" height="50" className="ilot-medium" />
              <text x="107" y="310" textAnchor="middle" className="fill-red-600 text-xs">7.2m²</text>

              <rect x="450" y="450" width="80" height="70" className="ilot-large" />
              <text x="490" y="490" textAnchor="middle" className="fill-red-600 text-xs">12.3m²</text>
              
              <rect x="620" y="420" width="70" height="80" className="ilot-large" />
              <text x="655" y="465" textAnchor="middle" className="fill-red-600 text-xs">11.8m²</text>
            </g>
          )}

          {/* Corridor Network (Pink/Red Lines) */}
          {layerVisibility.corridors && (
            <g>
              <path d="M 115 120 L 190 130 L 267 140 L 350 130 L 475 135" className="corridor-line" />
              <path d="M 475 135 L 580 140 L 680 150" className="corridor-line" />
              <path d="M 350 130 L 350 250 L 107 310" className="corridor-line" />
              <path d="M 350 250 L 490 380 L 490 450" className="corridor-line" />
              <path d="M 530 485 L 620 485 L 655 465" className="corridor-line" />
              <path d="M 80 250 L 190 250 L 350 250" className="corridor-line" />
              <path d="M 680 200 L 650 250 L 580 300" className="corridor-line" />
            </g>
          )}
        </svg>
        
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-xs text-white">
          <span>X: {cursorCoords.x}mm, Y: {cursorCoords.y}mm</span>
        </div>
        
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-xs text-white">
          Scale: 1:100 • Total Area: 960m²
        </div>
      </div>
    </div>
  );
}
