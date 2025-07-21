import { useState } from "react";
import { Download, FileImage, FileText, Code, Database, Loader } from "lucide-react";
import { Analysis } from "@shared/schema";
import { cadAPI } from "@/lib/api";

interface ExportSectionProps {
  analysis?: Analysis | null;
}

export default function ExportSection({ analysis }: ExportSectionProps) {
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("");

  const handleExport = async (type: 'image' | 'pdf' | 'dxf' | 'json') => {
    if (!analysis || analysis.status !== 'complete') {
      setExportStatus("Analysis must be completed before export");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("Preparing export...");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const exportConfig = {
        type,
        format: type === 'image' ? 'svg' : undefined,
        resolution: type === 'image' ? '4k' as const : undefined,
        includeMetrics: true
      };

      const response = await fetch(`/api/cad/export/${analysis.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportConfig)
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Handle file download for binary formats
      if (type === 'image' || type === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cad_analysis_${analysis.id}.${type === 'image' ? 'svg' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON/DXF text responses
        const result = await response.json();
        if (result.data) {
          const blob = new Blob([typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)], 
                               { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename || `cad_analysis_${analysis.id}.${type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }

      setExportStatus(`${type.toUpperCase()} exported successfully`);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress(0);
        setExportStatus("");
      }, 3000);
    }
  };

  const exportOptions = [
    {
      id: 'image',
      label: 'High-Res Image',
      description: 'SVG vector graphics with scalable quality',
      icon: FileImage,
      color: 'text-blue-400'
    },
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'Complete analysis report with metrics',
      icon: FileText,
      color: 'text-red-400'
    },
    {
      id: 'dxf',
      label: 'CAD Drawing',
      description: 'DXF format for AutoCAD integration',
      icon: Code,
      color: 'text-green-400'
    },
    {
      id: 'json',
      label: 'Raw Data',
      description: 'Complete dataset in JSON format',
      icon: Database,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">Export Results</h3>
      </div>

      {!analysis || analysis.status !== 'complete' ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Complete analysis to enable exports</div>
          <div className="text-sm text-gray-500">Upload a CAD file and run optimization first</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleExport(option.id as any)}
                disabled={isExporting}
                className="flex items-center gap-4 p-4 bg-gray-750 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <option.icon className={`w-8 h-8 ${option.color} group-hover:scale-110 transition-transform`} />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
                {isExporting ? (
                  <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                )}
              </button>
            ))}
          </div>

          {isExporting && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Export Progress</span>
                <span className="text-blue-400">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              {exportStatus && (
                <div className="text-center text-sm text-gray-300">{exportStatus}</div>
              )}
            </div>
          )}

          {exportStatus && !isExporting && (
            <div className="mt-4 text-center text-sm text-green-400">{exportStatus}</div>
          )}
        </>
      )}
    </div>
  );
}