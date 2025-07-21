import { useCallback } from "react";
import { Upload, FilePlus, FileText, CheckCircle } from "lucide-react";
import { CADFile } from "@/types/cad";
import { processCADFile } from "@/utils/cadProcessor";

interface FileUploadAreaProps {
  uploadedFile: CADFile | null;
  onFileUpload: (file: CADFile | null) => void;
}

export default function FileUploadArea({ uploadedFile, onFileUpload }: FileUploadAreaProps) {
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const processedFile = await processCADFile(file);
      onFileUpload(processedFile);
    } catch (error) {
      console.error("File processing error:", error);
      // Handle error appropriately
    }
  }, [onFileUpload]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    try {
      const processedFile = await processCADFile(file);
      onFileUpload(processedFile);
    } catch (error) {
      console.error("File processing error:", error);
    }
  }, [onFileUpload]);

  return (
    <div className="metric-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Upload className="w-5 h-5 mr-2 text-blue-400" />
        CAD File Processing
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">DXF</span>
        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">DWG</span>
        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">PDF</span>
        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">PNG/JPG</span>
      </div>

      <div
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <FilePlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300 mb-2">Drop CAD files here or click to browse</p>
        <p className="text-sm text-gray-500">Support for AutoCAD, SolidWorks, MicroStation formats</p>
        <input
          id="file-input"
          type="file"
          accept=".dxf,.dwg,.pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {uploadedFile && (
        <div className="mt-4 space-y-2">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className="font-medium text-white">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {uploadedFile.format} • {uploadedFile.size} • Scale: {uploadedFile.scale}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-400">
              <p>Layers detected: {uploadedFile.layers.join(", ")}</p>
              <p>Dimensions: {uploadedFile.dimensions.width}mm × {uploadedFile.dimensions.height}mm</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
