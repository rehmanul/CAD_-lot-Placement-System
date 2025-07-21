import { Download, Image, FileText, Layers, Database, AlertCircle, Check } from "lucide-react";
import { useState } from "react";
import { Analysis } from "@shared/schema";
import { cadAPI } from "@/lib/api";

interface ExportSectionProps {
  analysis: Analysis | null;
}

interface ExportState {
  isExporting: boolean;
  progress: number;
  status: string;
  error: string | null;
}

export default function ExportSection({ analysis }: ExportSectionProps) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    status: '',
    error: null
  });

  const handleExport = async (type: 'image' | 'pdf' | 'dxf' | 'json') => {
    if (!analysis || analysis.status !== 'complete') {
      setExportState(prev => ({ ...prev, error: 'Analysis must be completed before export' }));
      return;
    }

    setExportState({
      isExporting: true,
      progress: 0,
      status: `Generating ${type.toUpperCase()}...`,
      error: null
    });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90)
        }));
      }, 200);

      const result = await cadAPI.exportResults(analysis.id, {
        type,
        resolution: '4k',
        includeMetrics: true
      });

      clearInterval(progressInterval);
      
      // Handle file download
      if (type === 'image' || type === 'pdf') {
        const blob = result as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cad_analysis_${analysis.id}.${type === 'image' ? 'png' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON/DXF, create downloadable file
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cad_analysis_${analysis.id}.${type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setExportState({
        isExporting: false,
        progress: 100,
        status: 'Export completed successfully!',
        error: null
      });

      // Reset after success
      setTimeout(() => {
        setExportState({
          isExporting: false,
          progress: 0,
          status: '',
          error: null
        });
      }, 3000);

    } catch (error: any) {
      setExportState({
        isExporting: false,
        progress: 0,
        status: '',
        error: error.message || 'Export failed'
      });
    }
  };

  return (
    <div className="metric-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Download className="w-5 h-5 mr-2 text-blue-400" />
        Professional Export
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="bg-gray-800/50 rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => handleExport('image')}
        >
          <Image className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h4 className="font-medium text-white mb-1">High-Res Images</h4>
          <p className="text-xs text-gray-400 mb-3">PNG, SVG formats • Up to 4K resolution</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
            Export Images
          </button>
        </div>

        <div 
          className="bg-gray-800/50 rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => handleExport('pdf')}
        >
          <FileText className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h4 className="font-medium text-white mb-1">PDF Reports</h4>
          <p className="text-xs text-gray-400 mb-3">Analysis data • Measurements • Statistics</p>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
            Generate PDF
          </button>
        </div>

        <div 
          className="bg-gray-800/50 rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => handleExport('dxf')}
        >
          <Layers className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h4 className="font-medium text-white mb-1">DXF Export</h4>
          <p className="text-xs text-gray-400 mb-3">AutoCAD compatible • Layer preserved</p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
            Export DXF
          </button>
        </div>

        <div 
          className="bg-gray-800/50 rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => handleExport('json')}
        >
          <Database className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <h4 className="font-medium text-white mb-1">Data Export</h4>
          <p className="text-xs text-gray-400 mb-3">JSON format • Complete geometry data</p>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
            Export Data
          </button>
        </div>
      </div>
      
      {!analysis && (
        <div className="mt-6 text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No Analysis Available</p>
          <p className="text-sm text-gray-500">Complete an analysis to enable export options</p>
        </div>
      )}

      {exportState.error && (
        <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Export Error</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">{exportState.error}</p>
        </div>
      )}

      {exportState.isExporting && (
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-400">
              {exportState.status}
            </span>
            <span className="text-sm text-blue-400">{exportState.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${exportState.progress}%` }}
            />
          </div>
        </div>
      )}

      {exportState.status && !exportState.isExporting && !exportState.error && (
        <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">{exportState.status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
