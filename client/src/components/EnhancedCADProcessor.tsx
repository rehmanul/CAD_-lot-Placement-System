import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Zap, Eye, Download, Settings } from "lucide-react";
import { CADFile, Analysis } from "@shared/schema";
import PixelPerfectFloorPlan from "./PixelPerfectFloorPlan";

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
}

interface EnhancedCADProcessorProps {
  cadFile: CADFile | null;
  analysis: Analysis | null;
  onAnalysisComplete: (analysis: Analysis) => void;
}

export default function EnhancedCADProcessor({ 
  cadFile, 
  analysis, 
  onAnalysisComplete 
}: EnhancedCADProcessorProps) {
  const [corridorWidth, setCorridorWidth] = useState(1.2);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    {
      id: 'extract',
      name: 'Floor Plan Extraction',
      description: 'Extracting walls, doors, and restricted areas from CAD file',
      status: 'pending',
      progress: 0
    },
    {
      id: 'classify',
      name: 'Element Classification',
      description: 'Identifying walls (MUR), restricted areas (NO ENTREE), entrances (ENTRÉE/SORTIE)',
      status: 'pending',
      progress: 0
    },
    {
      id: 'optimize',
      name: 'Îlot Placement',
      description: 'Intelligent placement of îlots with size optimization',
      status: 'pending',
      progress: 0
    },
    {
      id: 'corridors',
      name: 'Corridor Generation',
      description: 'Creating 1.2m wide corridors between facing îlots',
      status: 'pending',
      progress: 0
    },
    {
      id: 'render',
      name: 'Pixel-Perfect Rendering',
      description: 'Generating professional floor plan visualization',
      status: 'pending',
      progress: 0
    }
  ]);

  const updateStageStatus = useCallback((stageId: string, status: ProcessingStage['status'], progress: number = 0) => {
    setProcessingStages(prev => 
      prev.map(stage => 
        stage.id === stageId 
          ? { ...stage, status, progress }
          : stage
      )
    );
  }, []);

  const startPixelPerfectProcessing = async () => {
    if (!cadFile) return;

    // Stage 1: Floor Plan Extraction
    updateStageStatus('extract', 'processing', 0);
    
    // Simulate extraction progress
    for (let i = 0; i <= 100; i += 20) {
      updateStageStatus('extract', 'processing', i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    updateStageStatus('extract', 'complete', 100);

    // Stage 2: Element Classification
    updateStageStatus('classify', 'processing', 0);
    
    // Simulate classification
    for (let i = 0; i <= 100; i += 25) {
      updateStageStatus('classify', 'processing', i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    updateStageStatus('classify', 'complete', 100);

    // Stage 3: Îlot Placement Optimization
    updateStageStatus('optimize', 'processing', 0);
    
    // This is where the pixel-perfect processing runs
    try {
      const response = await fetch(`/api/cad/pixel-perfect/${cadFile.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ilotConfig: {
            smallIlots: 30,
            mediumIlots: 50,
            largeIlots: 20,
            corridorWidth,
            adaCompliance: true,
            minClearance: 1.2,
            maxDensity: 80
          },
          optimizationConfig: {
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
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        updateStageStatus('optimize', 'complete', 100);
        
        // Stage 4: Corridor Generation
        updateStageStatus('corridors', 'processing', 0);
        
        // Simulate corridor generation
        for (let i = 0; i <= 100; i += 10) {
          updateStageStatus('corridors', 'processing', i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        updateStageStatus('corridors', 'complete', 100);

        // Stage 5: Pixel-Perfect Rendering
        updateStageStatus('render', 'processing', 0);
        
        for (let i = 0; i <= 100; i += 20) {
          updateStageStatus('render', 'processing', i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        updateStageStatus('render', 'complete', 100);

        // Process the pixel-perfect result directly
        if (result.result) {
          onAnalysisComplete({
            id: result.analysisId,
            fileId: cadFile.id,
            timestamp: new Date(),
            status: 'complete',
            result: result.result,
            config: {}
          });
        } else {
          // Fallback to fetch analysis if not included in response
          const analysisResponse = await fetch(`/api/cad/analysis/${result.analysisId}`);
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            onAnalysisComplete(analysisData.data);
          }
        }
      }
    } catch (error) {
      console.error('Processing failed:', error);
      updateStageStatus('optimize', 'error', 0);
    }
  };

  const resetProcessing = () => {
    setProcessingStages(prev => 
      prev.map(stage => ({ ...stage, status: 'pending', progress: 0 }))
    );
  };

  const getStatusIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'complete': return '✓';
      case 'processing': return '⟳';
      case 'error': return '✗';
      default: return '○';
    }
  };

  const getStatusColor = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'complete': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!cadFile) {
    return (
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Enhanced CAD Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Upload a CAD file to begin pixel-perfect processing
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Control Panel */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-400" />
              Pixel-Perfect CAD Processing
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={startPixelPerfectProcessing}
                disabled={processingStages.some(stage => stage.status === 'processing')}
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
              <Button onClick={resetProcessing} size="sm" variant="outline">
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* CAD File Info */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
            <div>
              <label className="text-xs text-gray-400">File</label>
              <p className="text-sm font-medium text-white">{cadFile.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Format</label>
              <p className="text-sm font-medium text-white">{cadFile.format}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Elements</label>
              <p className="text-sm font-medium text-white">{cadFile.elements.length}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Layers</label>
              <p className="text-sm font-medium text-white">{cadFile.layers.length}</p>
            </div>
          </div>

          {/* Processing Stages */}
          <div className="space-y-3">
            {processingStages.map((stage, index) => (
              <div key={stage.id} className="relative">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg ${getStatusColor(stage.status)}`}>
                      {getStatusIcon(stage.status)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{stage.name}</h4>
                      <p className="text-xs text-gray-400">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={stage.status === 'complete' ? 'default' : 'secondary'}
                      className={stage.status === 'complete' ? 'bg-green-600' : ''}
                    >
                      {stage.status}
                    </Badge>
                    {stage.status === 'processing' && (
                      <span className="text-xs text-blue-400">{stage.progress}%</span>
                    )}
                  </div>
                </div>
                
                {stage.status === 'processing' && (
                  <Progress 
                    value={stage.progress} 
                    className="mt-1 h-1"
                  />
                )}
                
                {/* Connection line to next stage */}
                {index < processingStages.length - 1 && (
                  <div className="absolute left-5 top-full w-0.5 h-3 bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Results View */}
      <Tabs defaultValue="plan" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="plan" className="text-white data-[state=active]:bg-blue-600">
            <Eye className="w-4 h-4 mr-2" />
            Floor Plan
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-white data-[state=active]:bg-blue-600">
            <Settings className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="export" className="text-white data-[state=active]:bg-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          <PixelPerfectFloorPlan
            cadFile={cadFile}
            analysis={analysis}
            corridorWidth={corridorWidth}
            onCorridorWidthChange={setCorridorWidth}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis ? (
            <Card className="metric-card">
              <CardHeader>
                <CardTitle className="text-white">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {analysis.result?.ilots.length || 0}
                    </p>
                    <p className="text-sm text-gray-400">Total Îlots</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {analysis.result?.metrics.spaceUtilization.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-gray-400">Space Utilization</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {analysis.result?.corridors.length || 0}
                    </p>
                    <p className="text-sm text-gray-400">Corridors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {analysis.result?.metrics.usedArea.toFixed(1) || 0}m²
                    </p>
                    <p className="text-sm text-gray-400">Used Area</p>
                  </div>
                </div>
                
                {analysis.result && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Îlot Distribution</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['small', 'medium', 'large'].map(size => {
                          const count = analysis.result!.ilots.filter(ilot => ilot.size === size).length;
                          return (
                            <div key={size} className="text-center p-2 bg-gray-800 rounded">
                              <p className="text-lg font-semibold text-white">{count}</p>
                              <p className="text-xs text-gray-400 capitalize">{size} Îlots</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Optimization Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Accessibility Compliance</span>
                          <span className="text-green-400">
                            {(analysis.result.metrics.accessibilityCompliance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Corridor Efficiency</span>
                          <span className="text-blue-400">
                            {(analysis.result.metrics.corridorEfficiency * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Final Fitness Score</span>
                          <span className="text-purple-400">
                            {analysis.result.fitness.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="metric-card">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">Run processing to see analysis results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-white">Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>High-Res PNG</span>
                  <span className="text-xs opacity-70">4K Resolution</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>Professional PDF</span>
                  <span className="text-xs opacity-70">With Measurements</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>AutoCAD DXF</span>
                  <span className="text-xs opacity-70">Vector Format</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>JSON Data</span>
                  <span className="text-xs opacity-70">Raw Results</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}