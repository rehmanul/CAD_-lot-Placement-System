import { useState } from "react";
import EnterpriseHeader from "@/components/EnterpriseHeader";
import NavigationTabs from "@/components/NavigationTabs";
import SystemMetrics from "@/components/SystemMetrics";
import FileUploadArea from "@/components/FileUploadArea";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ProcessingPipeline from "@/components/ProcessingPipeline";
import ResultsVisualization from "@/components/ResultsVisualization";
import ExportSection from "@/components/ExportSection";
import { CADFile, ProcessingPhase, IlotConfiguration, ExportProgress } from "@/types/cad";

export default function CADAnalysisApp() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [uploadedFile, setUploadedFile] = useState<CADFile | null>(null);
  const [processingPhases, setProcessingPhases] = useState<ProcessingPhase[]>([
    { id: 1, name: "CAD Processing & Floor Plan Extraction", status: "complete", progress: 100 },
    { id: 2, name: "Pixel-Perfect Visual Reproduction", status: "complete", progress: 100 },
    { id: 3, name: "Intelligent Îlot Placement", status: "processing", progress: 67 },
    { id: 4, name: "Corridor Network Generation", status: "pending", progress: 0 }
  ]);
  const [ilotConfig, setIlotConfig] = useState<IlotConfiguration>({
    smallIlots: 30,
    mediumIlots: 50,
    largeIlots: 20,
    corridorWidth: 1.2,
    adaCompliance: true
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  return (
    <div className="bg-gray-900 font-inter text-white min-h-screen overflow-x-hidden">
      <EnterpriseHeader />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex min-h-screen">
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            
            {/* Left Panel: System Metrics & File Upload */}
            <div className="xl:col-span-1 space-y-6">
              <SystemMetrics />
              <FileUploadArea 
                uploadedFile={uploadedFile} 
                onFileUpload={setUploadedFile}
              />
              <ConfigurationPanel 
                config={ilotConfig}
                onConfigChange={setIlotConfig}
              />
            </div>

            {/* Center Panel: Processing Pipeline & Results */}
            <div className="xl:col-span-2 space-y-6">
              <ProcessingPipeline phases={processingPhases} />
              <ResultsVisualization uploadedFile={uploadedFile} />
              <ExportSection 
                exportProgress={exportProgress}
                onExport={setExportProgress}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
