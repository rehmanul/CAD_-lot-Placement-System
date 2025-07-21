
import { useState } from "react";
import EnterpriseHeader from "@/components/EnterpriseHeader";
import NavigationTabs from "@/components/NavigationTabs";
import SystemMetrics from "@/components/SystemMetrics";
import FileUploadArea from "@/components/FileUploadArea";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ProcessingPipeline from "@/components/ProcessingPipeline";
import ResultsVisualization from "@/components/ResultsVisualization";
import ExportSection from "@/components/ExportSection";
import { AutoCADIntegration } from "@/components/AutoCADIntegration";
import { BIMVisualization } from "@/components/BIMVisualization";
import { CADFile, Analysis, IlotConfig, OptimizationConfig } from "@shared/schema";

export default function CADAnalysisApp() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [uploadedFile, setUploadedFile] = useState<CADFile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Configuration state
  const [ilotConfig, setIlotConfig] = useState<IlotConfig>({
    smallIlots: 30,
    mediumIlots: 50,
    largeIlots: 20,
    corridorWidth: 1.2,
    adaCompliance: true,
    minClearance: 1.2,
    maxDensity: 80
  });

  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    populationSize: 50,
    generations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    eliteSize: 5,
    fitnessWeights: {
      spaceUtilization: 0.4,
      accessibility: 0.3,
      corridorEfficiency: 0.2,
      adaCompliance: 0.1
    }
  });

  // Processing phases for pipeline visualization
  const processingPhases = [
    {
      id: 'upload',
      name: 'File Upload',
      description: 'CAD file validation and parsing',
      status: uploadedFile ? 'complete' : 'pending',
      duration: '2-5s'
    },
    {
      id: 'analysis',
      name: 'Spatial Analysis',
      description: 'Floor plan geometry extraction',
      status: uploadedFile && !isProcessing ? 'complete' : uploadedFile ? 'processing' : 'pending',
      duration: '5-10s'
    },
    {
      id: 'optimization',
      name: 'Îlot Optimization',
      description: 'Genetic algorithm placement',
      status: currentAnalysis?.status === 'complete' ? 'complete' : 
              currentAnalysis?.status === 'processing' ? 'processing' : 'pending',
      duration: '15-30s'
    },
    {
      id: 'corridor',
      name: 'Corridor Generation',
      description: 'A* pathfinding network',
      status: currentAnalysis?.status === 'complete' ? 'complete' : 'pending',
      duration: '10-15s'
    },
    {
      id: 'export',
      name: 'Export Ready',
      description: 'Results visualization and export',
      status: currentAnalysis?.status === 'complete' ? 'complete' : 'pending',
      duration: '1-2s'
    }
  ];
  
  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    setIsProcessing(false);
  };

  const handleAnalysisStart = () => {
    setIsProcessing(true);
    setCurrentAnalysis(null);
  };

  const handleFileUpload = (file: CADFile) => {
    setUploadedFile(file);
    setCurrentAnalysis(null);
    setIsProcessing(false);
  };

  const handleConfigurationChange = (newIlotConfig: IlotConfig, newOptimizationConfig?: OptimizationConfig) => {
    setIlotConfig(newIlotConfig);
    if (newOptimizationConfig) {
      setOptimizationConfig(newOptimizationConfig);
    }
  };

  return (
    <div className="bg-gray-900 font-inter text-white min-h-screen overflow-x-hidden">
      <EnterpriseHeader />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex min-h-screen">
        <main className="flex-1 p-6">
          {activeTab === "Dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
              
              {/* Left Panel: System Metrics & File Upload */}
              <div className="xl:col-span-1 space-y-6">
                <SystemMetrics />
                <FileUploadArea 
                  uploadedFile={uploadedFile} 
                  onFileUpload={handleFileUpload}
                />
                <ConfigurationPanel
                  ilotConfig={ilotConfig}
                  optimizationConfig={optimizationConfig}
                  onConfigurationChange={handleConfigurationChange}
                  disabled={isProcessing}
                />
              </div>

              {/* Center Panel: Processing Pipeline & Results */}
              <div className="xl:col-span-2 space-y-6">
                <ProcessingPipeline 
                  uploadedFile={uploadedFile} 
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisStart={handleAnalysisStart}
                  ilotConfig={ilotConfig}
                  optimizationConfig={optimizationConfig}
                  processingPhases={processingPhases}
                />
                <ResultsVisualization 
                  uploadedFile={uploadedFile} 
                  analysis={currentAnalysis}
                  isProcessing={isProcessing}
                />
                <ExportSection analysis={currentAnalysis} />
              </div>
            </div>
          )}

          {activeTab === "AutoCAD Integration" && (
            <AutoCADIntegration />
          )}

          {activeTab === "3D BIM" && (
            <BIMVisualization />
          )}

          {activeTab === "Analysis" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ConfigurationPanel
                  ilotConfig={ilotConfig}
                  optimizationConfig={optimizationConfig}
                  onConfigurationChange={handleConfigurationChange}
                  disabled={isProcessing}
                />
                <ProcessingPipeline 
                  uploadedFile={uploadedFile} 
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisStart={handleAnalysisStart}
                  ilotConfig={ilotConfig}
                  optimizationConfig={optimizationConfig}
                  processingPhases={processingPhases}
                />
              </div>
              <ResultsVisualization 
                uploadedFile={uploadedFile} 
                analysis={currentAnalysis}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {activeTab === "Export" && (
            <div className="max-w-4xl mx-auto">
              <ExportSection analysis={currentAnalysis} />
              {currentAnalysis && (
                <div className="mt-6">
                  <ResultsVisualization 
                    uploadedFile={uploadedFile} 
                    analysis={currentAnalysis}
                    isProcessing={false}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
