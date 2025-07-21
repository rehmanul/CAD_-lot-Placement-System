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
import { CADFile, Analysis } from "@shared/schema";

export default function CADAnalysisApp() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [uploadedFile, setUploadedFile] = useState<CADFile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  
  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
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
                  onFileUpload={setUploadedFile}
                />
              </div>

              {/* Center Panel: Processing Pipeline & Results */}
              <div className="xl:col-span-2 space-y-6">
                <ProcessingPipeline 
                  uploadedFile={uploadedFile} 
                  onAnalysisComplete={handleAnalysisComplete}
                />
                <ResultsVisualization uploadedFile={uploadedFile} analysis={currentAnalysis} />
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
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Analysis Dashboard</h2>
              <p className="text-gray-400">Advanced analysis tools and configuration options</p>
            </div>
          )}

          {activeTab === "Export" && (
            <ExportSection analysis={currentAnalysis} />
          )}
        </main>
      </div>
    </div>
  );
}
