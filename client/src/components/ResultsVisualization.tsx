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

          {/* Îlots with Pink/Red Outlines - Realistic Office Layout */}
          {layerVisibility.ilots && (
            <g>
              {/* Row 1 - Left side */}
              <rect x="80" y="100" width="40" height="30" className="ilot-small" />
              <text x="100" y="120" textAnchor="middle" className="fill-red-600 text-xs">3.2m²</text>
              
              <rect x="80" y="150" width="40" height="30" className="ilot-small" />
              <text x="100" y="170" textAnchor="middle" className="fill-red-600 text-xs">2.8m²</text>

              <rect x="80" y="200" width="40" height="30" className="ilot-small" />
              <text x="100" y="220" textAnchor="middle" className="fill-red-600 text-xs">3.1m²</text>

              {/* Row 2 - Right side, facing Row 1 */}
              <rect x="170" y="100" width="40" height="30" className="ilot-small" />
              <text x="190" y="120" textAnchor="middle" className="fill-red-600 text-xs">3.0m²</text>
              
              <rect x="170" y="150" width="40" height="30" className="ilot-small" />
              <text x="190" y="170" textAnchor="middle" className="fill-red-600 text-xs">2.9m²</text>

              <rect x="170" y="200" width="40" height="30" className="ilot-small" />
              <text x="190" y="220" textAnchor="middle" className="fill-red-600 text-xs">3.3m²</text>

              {/* Row 3 - Center area */}
              <rect x="280" y="80" width="50" height="40" className="ilot-medium" />
              <text x="305" y="105" textAnchor="middle" className="fill-red-600 text-xs">5.5m²</text>
              
              <rect x="280" y="140" width="50" height="40" className="ilot-medium" />
              <text x="305" y="165" textAnchor="middle" className="fill-red-600 text-xs">5.8m²</text>

              <rect x="280" y="200" width="50" height="40" className="ilot-medium" />
              <text x="305" y="225" textAnchor="middle" className="fill-red-600 text-xs">5.2m²</text>

              {/* Row 4 - Facing Row 3 */}
              <rect x="370" y="80" width="50" height="40" className="ilot-medium" />
              <text x="395" y="105" textAnchor="middle" className="fill-red-600 text-xs">5.7m²</text>
              
              <rect x="370" y="140" width="50" height="40" className="ilot-medium" />
              <text x="395" y="165" textAnchor="middle" className="fill-red-600 text-xs">6.0m²</text>

              <rect x="370" y="200" width="50" height="40" className="ilot-medium" />
              <text x="395" y="225" textAnchor="middle" className="fill-red-600 text-xs">5.9m²</text>

              {/* Large îlots - Bottom area */}
              <rect x="120" y="380" width="80" height="60" className="ilot-large" />
              <text x="160" y="415" textAnchor="middle" className="fill-red-600 text-xs">12.3m²</text>
              
              <rect x="250" y="380" width="80" height="60" className="ilot-large" />
              <text x="290" y="415" textAnchor="middle" className="fill-red-600 text-xs">11.8m²</text>

              <rect x="380" y="380" width="80" height="60" className="ilot-large" />
              <text x="420" y="415" textAnchor="middle" className="fill-red-600 text-xs">13.1m²</text>

              {/* Meeting rooms - Right side */}
              <rect x="550" y="100" width="60" height="80" className="ilot-large" />
              <text x="580" y="145" textAnchor="middle" className="fill-red-600 text-xs">15.2m²</text>
              
              <rect x="550" y="220" width="60" height="80" className="ilot-large" />
              <text x="580" y="265" textAnchor="middle" className="fill-red-600 text-xs">14.8m²</text>
            </g>
          )}

          {/* Corridor Network - Automatic corridors between facing rows */}
          {layerVisibility.corridors && (
            <g>
              {/* Main corridor between Row 1 and Row 2 (1.2m width) */}
              <rect x="120" y="100" width="50" height="12" className="corridor-fill" />
              <rect x="120" y="150" width="50" height="12" className="corridor-fill" />
              <rect x="120" y="200" width="50" height="12" className="corridor-fill" />
              
              {/* Main corridor between Row 3 and Row 4 (1.2m width) */}
              <rect x="330" y="80" width="40" height="12" className="corridor-fill" />
              <rect x="330" y="140" width="40" height="12" className="corridor-fill" />
              <rect x="330" y="200" width="40" height="12" className="corridor-fill" />
              
              {/* Vertical corridor connecting different zones */}
              <rect x="250" y="60" width="12" height="320" className="corridor-fill" />
              
              {/* Horizontal main circulation corridor */}
              <rect x="60" y="280" width="580" height="12" className="corridor-fill" />
              
              {/* Access corridors to meeting rooms */}
              <rect x="480" y="140" width="70" height="12" className="corridor-fill" />
              <rect x="480" y="260" width="70" height="12" className="corridor-fill" />
              
              {/* Connection to entrance/exit */}
              <rect x="60" y="240" width="190" height="12" className="corridor-fill" />
              <rect x="640" y="180" width="110" height="12" className="corridor-fill" />
              
              {/* Corridor outlines for visibility */}
              <path d="M 120 106 L 170 106 M 120 118 L 170 118" className="corridor-line" strokeWidth="1" />
              <path d="M 120 156 L 170 156 M 120 168 L 170 168" className="corridor-line" strokeWidth="1" />
              <path d="M 120 206 L 170 206 M 120 218 L 170 218" className="corridor-line" strokeWidth="1" />
              <path d="M 330 86 L 370 86 M 330 98 L 370 98" className="corridor-line" strokeWidth="1" />
              <path d="M 330 146 L 370 146 M 330 158 L 370 158" className="corridor-line" strokeWidth="1" />
              <path d="M 330 206 L 370 206 M 330 218 L 370 218" className="corridor-line" strokeWidth="1" />
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
