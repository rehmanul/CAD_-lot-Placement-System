
import { useState } from "react";
import { Settings, Sliders, Users, Ruler, Shield, Zap } from "lucide-react";
import { IlotConfig, OptimizationConfig } from "@shared/schema";

interface ConfigurationPanelProps {
  ilotConfig: IlotConfig;
  optimizationConfig: OptimizationConfig;
  onConfigurationChange: (ilotConfig: IlotConfig, optimizationConfig?: OptimizationConfig) => void;
  disabled?: boolean;
}

export default function ConfigurationPanel({ 
  ilotConfig, 
  optimizationConfig, 
  onConfigurationChange, 
  disabled = false 
}: ConfigurationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleIlotConfigChange = (key: keyof IlotConfig, value: any) => {
    const newConfig = { ...ilotConfig, [key]: value };
    onConfigurationChange(newConfig, optimizationConfig);
  };

  const handleOptimizationConfigChange = (key: keyof OptimizationConfig, value: any) => {
    const newConfig = { ...optimizationConfig, [key]: value };
    onConfigurationChange(ilotConfig, newConfig);
  };

  const handleFitnessWeightChange = (key: string, value: number) => {
    const newWeights = { ...optimizationConfig.fitnessWeights, [key]: value };
    const newConfig = { ...optimizationConfig, fitnessWeights: newWeights };
    onConfigurationChange(ilotConfig, newConfig);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Configuration</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? 'Basic' : 'Advanced'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Îlot Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">Îlot Distribution (%)</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-300">Small Îlots</label>
                <span className="text-sm text-blue-400">{ilotConfig.smallIlots}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ilotConfig.smallIlots}
                onChange={(e) => handleIlotConfigChange('smallIlots', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-300">Medium Îlots</label>
                <span className="text-sm text-blue-400">{ilotConfig.mediumIlots}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ilotConfig.mediumIlots}
                onChange={(e) => handleIlotConfigChange('mediumIlots', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-300">Large Îlots</label>
                <span className="text-sm text-blue-400">{ilotConfig.largeIlots}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ilotConfig.largeIlots}
                onChange={(e) => handleIlotConfigChange('largeIlots', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Spatial Parameters */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white">Spatial Parameters</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-300">Corridor Width</label>
                <span className="text-sm text-blue-400">{ilotConfig.corridorWidth}m</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={ilotConfig.corridorWidth}
                onChange={(e) => handleIlotConfigChange('corridorWidth', parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-300">Min Clearance</label>
                <span className="text-sm text-blue-400">{ilotConfig.minClearance}m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ilotConfig.minClearance}
                onChange={(e) => handleIlotConfigChange('minClearance', parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Compliance & Density */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-400" />
            <span className="text-white">ADA Compliance</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={ilotConfig.adaCompliance}
              onChange={(e) => handleIlotConfigChange('adaCompliance', e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {showAdvanced && (
          <>
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold text-white">Optimization Algorithm</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-300">Population Size</label>
                    <span className="text-sm text-blue-400">{optimizationConfig.populationSize}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={optimizationConfig.populationSize}
                    onChange={(e) => handleOptimizationConfigChange('populationSize', parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-300">Generations</label>
                    <span className="text-sm text-blue-400">{optimizationConfig.generations}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={optimizationConfig.generations}
                    onChange={(e) => handleOptimizationConfigChange('generations', parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-300">Mutation Rate</label>
                    <span className="text-sm text-blue-400">{(optimizationConfig.mutationRate * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={optimizationConfig.mutationRate}
                    onChange={(e) => handleOptimizationConfigChange('mutationRate', parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-300">Crossover Rate</label>
                    <span className="text-sm text-blue-400">{(optimizationConfig.crossoverRate * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={optimizationConfig.crossoverRate}
                    onChange={(e) => handleOptimizationConfigChange('crossoverRate', parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            {/* Fitness Weights */}
            <div>
              <h4 className="font-semibold text-white mb-4">Fitness Function Weights</h4>
              <div className="space-y-3">
                {Object.entries(optimizationConfig.fitnessWeights).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <span className="text-sm text-blue-400">{(value * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={value}
                      onChange={(e) => handleFitnessWeightChange(key, parseFloat(e.target.value))}
                      disabled={disabled}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="mt-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
        <div className="text-sm text-gray-300">
          <div className="font-medium mb-2">Current Configuration Summary:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span>Total Îlots: ~{Math.round((ilotConfig.smallIlots + ilotConfig.mediumIlots + ilotConfig.largeIlots) / 10)}</span>
            <span>Corridor Width: {ilotConfig.corridorWidth}m</span>
            <span>ADA: {ilotConfig.adaCompliance ? 'Enabled' : 'Disabled'}</span>
            <span>Generations: {optimizationConfig.generations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
