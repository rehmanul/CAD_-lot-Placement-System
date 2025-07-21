import { useCallback, useState } from "react";
import { Upload, FilePlus, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { CADFile } from "@shared/schema";
import { cadAPI } from "@/lib/api";

interface FileUploadAreaProps {
  uploadedFile: CADFile | null;
  onFileUpload: (file: CADFile | null) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export default function FileUploadArea({ uploadedFile, onFileUpload }: FileUploadAreaProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  const processFile = useCallback(async (file: File) => {
    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await cadAPI.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadState({ isUploading: false, progress: 100, error: null });
      
      onFileUpload(result.data);
      
      // Reset progress after success
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, progress: 0 }));
      }, 2000);
      
    } catch (error: any) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed'
      });
      console.error("File upload error:", error);
    }
  }, [onFileUpload]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    event.target.value = ''; // Reset input
  }, [processFile]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  }, [processFile]);

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
        className={`border-2 border-dashed ${uploadState.isUploading ? 'border-blue-500 bg-blue-50/5' : 'border-gray-600'} rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploadState.isUploading && document.getElementById('file-input')?.click()}
      >
        {uploadState.isUploading ? (
          <>
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-400">{uploadState.progress}%</span>
              </div>
            </div>
            <p className="text-blue-400 mb-2">Processing CAD file...</p>
            <p className="text-sm text-gray-500">Extracting geometry and analyzing structure</p>
          </>
        ) : uploadState.error ? (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Upload Failed</p>
            <p className="text-sm text-gray-500">{uploadState.error}</p>
            <button 
              onClick={() => setUploadState({ isUploading: false, progress: 0, error: null })}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <FilePlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Drop CAD files here or click to browse</p>
            <p className="text-sm text-gray-500">Support for AutoCAD, SolidWorks, MicroStation formats</p>
          </>
        )}
        
        <input
          id="file-input"
          type="file"
          accept=".dxf,.dwg,.pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploadState.isUploading}
        />
      </div>

      {uploadState.isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>
      )}

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
