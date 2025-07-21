import { Sliders } from "lucide-react";
import { IlotConfiguration } from "@/types/cad";

interface ConfigurationPanelProps {
  config: IlotConfiguration;
  onConfigChange: (config: IlotConfiguration) => void;
}

export default function ConfigurationPanel({ config, onConfigChange }: ConfigurationPanelProps) {
  const updateConfig = (updates: Partial<IlotConfiguration>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="metric-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Sliders className="w-5 h-5 mr-2 text-blue-400" />
        Analysis Configuration
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Element Colors</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="w-4 h-4 bg-gray-500 rounded mx-auto mb-1"></div>
              <span className="text-xs text-gray-400">Walls</span>
              <p className="text-xs font-mono text-gray-500">#6B7280</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-1"></div>
              <span className="text-xs text-gray-400">Restricted</span>
              <p className="text-xs font-mono text-gray-500">#3B82F6</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-1"></div>
              <span className="text-xs text-gray-400">Entrance</span>
              <p className="text-xs font-mono text-gray-500">#EF4444</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Îlot Size Distribution</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Small (1-4m²)</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  className="w-20"
                  min="0"
                  max="100"
                  value={config.smallIlots}
                  onChange={(e) => updateConfig({ smallIlots: parseInt(e.target.value) })}
                />
                <span className="text-sm font-medium text-white w-8">{config.smallIlots}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Medium (5-9m²)</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  className="w-20"
                  min="0"
                  max="100"
                  value={config.mediumIlots}
                  onChange={(e) => updateConfig({ mediumIlots: parseInt(e.target.value) })}
                />
                <span className="text-sm font-medium text-white w-8">{config.mediumIlots}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Large (10m²+)</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  className="w-20"
                  min="0"
                  max="100"
                  value={config.largeIlots}
                  onChange={(e) => updateConfig({ largeIlots: parseInt(e.target.value) })}
                />
                <span className="text-sm font-medium text-white w-8">{config.largeIlots}%</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Corridor Parameters</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Minimum Width</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  value={config.corridorWidth}
                  step="0.1"
                  onChange={(e) => updateConfig({ corridorWidth: parseFloat(e.target.value) })}
                />
                <span className="text-sm text-gray-400">m</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">ADA Compliance</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.adaCompliance}
                  onChange={(e) => updateConfig({ adaCompliance: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
