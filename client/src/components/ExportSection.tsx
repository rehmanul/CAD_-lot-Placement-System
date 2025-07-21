import { Download, Image, FileText, Layers, Database } from "lucide-react";
import { ExportProgress } from "@/types/cad";
import { exportToImage, exportToPDF, exportToDXF, exportToJSON } from "@/utils/exportManager";

interface ExportSectionProps {
  exportProgress: ExportProgress | null;
  onExport: (progress: ExportProgress | null) => void;
}

export default function ExportSection({ exportProgress, onExport }: ExportSectionProps) {
  const handleExport = async (type: 'image' | 'pdf' | 'dxf' | 'json') => {
    const progress: ExportProgress = {
      type,
      progress: 0,
      status: 'Processing...'
    };
    
    onExport(progress);

    try {
      switch (type) {
        case 'image':
          await exportToImage((p) => onExport({ ...progress, progress: p }));
          break;
        case 'pdf':
          await exportToPDF((p) => onExport({ ...progress, progress: p }));
          break;
        case 'dxf':
          await exportToDXF((p) => onExport({ ...progress, progress: p }));
          break;
        case 'json':
          await exportToJSON((p) => onExport({ ...progress, progress: p }));
          break;
      }
      
      onExport({ ...progress, progress: 100, status: 'Complete' });
      
      setTimeout(() => {
        onExport(null);
      }, 3000);
    } catch (error) {
      onExport({ ...progress, status: 'Error occurred' });
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
      
      {exportProgress && (
        <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Exporting {exportProgress.type.toUpperCase()}...
            </span>
            <span className="text-sm text-gray-400">{exportProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{exportProgress.status}</p>
        </div>
      )}
    </div>
  );
}
