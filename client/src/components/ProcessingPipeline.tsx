
import { useEffect, useState } from "react";
import { Cpu, Check, Loader, Clock, AlertCircle, Play, Pause } from "lucide-react";
import { Analysis, CADFile, IlotConfig, OptimizationConfig } from "@shared/schema";
import { cadAPI } from "@/lib/api";

interface ProcessingPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  duration: string;
  progress?: number;
  error?: string;
}

interface ProcessingPipelineProps {
  uploadedFile?: CADFile | null;
  onAnalysisComplete?: (analysis: Analysis) => void;
  onAnalysisStart?: () => void;
  ilotConfig: IlotConfig;
  optimizationConfig: OptimizationConfig;
  processingPhases: ProcessingPhase[];
}

export default function ProcessingPipeline({ 
  uploadedFile, 
  onAnalysisComplete, 
  onAnalysisStart,
  ilotConfig,
  optimizationConfig,
  processingPhases 
}: ProcessingPipelineProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phases, setPhases] = useState<ProcessingPhase[]>(processingPhases);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const canStartAnalysis = uploadedFile && !isProcessing;

  const updatePhaseStatus = (phaseId: string, status: ProcessingPhase['status'], progress?: number, error?: string) => {
    setPhases(prevPhases => 
      prevPhases.map(phase => 
        phase.id === phaseId 
          ? { ...phase, status, progress, error }
          : phase
      )
    );
  };

  const startAnalysis = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    onAnalysisStart?.();
    setCurrentPhaseIndex(0);
    
    // Reset all phases to pending
    setPhases(prevPhases => 
      prevPhases.map(phase => ({ ...phase, status: 'pending' as const, progress: 0, error: undefined }))
    );

    try {
      // Phase 1: File Upload (already complete)
      updatePhaseStatus('upload', 'complete', 100);
      setCurrentPhaseIndex(1);

      // Phase 2: Spatial Analysis
      updatePhaseStatus('analysis', 'processing', 0);
      
      // Simulate spatial analysis progress
      for (let progress = 0; progress <= 100; progress += 10) {
        updatePhaseStatus('analysis', 'processing', progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      updatePhaseStatus('analysis', 'complete', 100);
      setCurrentPhaseIndex(2);

      // Phase 3: Start the actual optimization
      updatePhaseStatus('optimization', 'processing', 0);
      
      const { analysisId } = await cadAPI.startAnalysis(uploadedFile.id, {
        ilotConfig,
        optimizationConfig
      });

      // Phase 4: Poll for optimization results
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      const pollInterval = setInterval(async () => {
        try {
          const analysis = await cadAPI.getAnalysis(analysisId);
          setCurrentAnalysis(analysis);

          // Calculate progress based on generation if available
          const progress = analysis.result ? 
            Math.min((analysis.result.generation / optimizationConfig.generations) * 100, 100) : 
            Math.min((attempts / maxAttempts) * 100, 90);

          updatePhaseStatus('optimization', 'processing', progress);

          if (analysis.status === 'complete') {
            clearInterval(pollInterval);
            updatePhaseStatus('optimization', 'complete', 100);
            setCurrentPhaseIndex(3);

            // Phase 5: Corridor Generation
            updatePhaseStatus('corridor', 'processing', 0);
            
            // Simulate corridor generation
            for (let progress = 0; progress <= 100; progress += 20) {
              updatePhaseStatus('corridor', 'processing', progress);
              await new Promise(resolve => setTimeout(resolve, 150));
            }
            updatePhaseStatus('corridor', 'complete', 100);
            setCurrentPhaseIndex(4);

            // Phase 6: Export Ready
            updatePhaseStatus('export', 'complete', 100);
            
            setIsProcessing(false);
            onAnalysisComplete?.(analysis);
            
          } else if (analysis.status === 'error') {
            clearInterval(pollInterval);
            updatePhaseStatus('optimization', 'error', 0, analysis.error || 'Optimization failed');
            setIsProcessing(false);
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            updatePhaseStatus('optimization', 'error', 0, 'Analysis timeout');
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Analysis polling error:', error);
          clearInterval(pollInterval);
          updatePhaseStatus('optimization', 'error', 0, 'Failed to get analysis results');
          setIsProcessing(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Analysis start error:', error);
      updatePhaseStatus('optimization', 'error', 0, error instanceof Error ? error.message : 'Analysis failed to start');
      setIsProcessing(false);
    }
  };

  // Calculate estimated time remaining
  useEffect(() => {
    if (isProcessing) {
      const remainingPhases = phases.slice(currentPhaseIndex);
      const totalEstimatedSeconds = remainingPhases.reduce((acc, phase) => {
        const [min, max] = phase.duration.replace('s', '').split('-').map(Number);
        return acc + (max || min);
      }, 0);
      setEstimatedTimeRemaining(totalEstimatedSeconds);
    }
  }, [isProcessing, currentPhaseIndex, phases]);

  const getStatusIcon = (status: ProcessingPhase['status']) => {
    switch (status) {
      case 'complete':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProcessingPhase['status']) => {
    switch (status) {
      case 'complete':
        return 'border-green-400 bg-green-400/10';
      case 'processing':
        return 'border-blue-400 bg-blue-400/10';
      case 'error':
        return 'border-red-400 bg-red-400/10';
      default:
        return 'border-gray-600 bg-gray-700/30';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Processing Pipeline</h3>
        </div>
        
        {canStartAnalysis && (
          <button
            onClick={startAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Analysis
          </button>
        )}
      </div>

      {!uploadedFile ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Upload a CAD file to begin processing</div>
          <div className="text-sm text-gray-500">Supported formats: DXF, DWG, PDF, PNG, JPG</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Processing Phases */}
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor(phase.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(phase.status)}
                  <div>
                    <div className="font-semibold text-white">{phase.name}</div>
                    <div className="text-sm text-gray-400">{phase.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Est. {phase.duration}</div>
                  {phase.status === 'processing' && phase.progress !== undefined && (
                    <div className="text-sm text-blue-400">{Math.round(phase.progress)}%</div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {phase.status === 'processing' && phase.progress !== undefined && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {phase.status === 'error' && phase.error && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="text-red-400 text-sm">{phase.error}</div>
                </div>
              )}
            </div>
          ))}

          {/* Processing Summary */}
          {isProcessing && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="flex items-center justify-between text-blue-400">
                <span className="font-medium">Processing in progress...</span>
                {estimatedTimeRemaining > 0 && (
                  <span className="text-sm">~{estimatedTimeRemaining}s remaining</span>
                )}
              </div>
              <div className="text-sm text-blue-300 mt-1">
                Phase {currentPhaseIndex + 1} of {phases.length}: {phases[currentPhaseIndex]?.name}
              </div>
            </div>
          )}

          {/* Analysis Results Summary */}
          {currentAnalysis && currentAnalysis.status === 'complete' && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="text-green-400 font-medium mb-2">Analysis Complete!</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Îlots:</span>
                  <span className="text-white ml-2">{currentAnalysis.result?.metrics.totalIlots}</span>
                </div>
                <div>
                  <span className="text-gray-400">Space Utilization:</span>
                  <span className="text-white ml-2">
                    {((currentAnalysis.result?.metrics.spaceUtilization || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Fitness Score:</span>
                  <span className="text-white ml-2">
                    {((currentAnalysis.result?.fitness || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Generation:</span>
                  <span className="text-white ml-2">{currentAnalysis.result?.generation}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
