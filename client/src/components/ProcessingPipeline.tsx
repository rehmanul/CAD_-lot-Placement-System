import { useEffect, useState } from "react";
import { Cpu, Check, Loader, Clock } from "lucide-react";
import { ProcessingPhase } from "@/types/cad";

interface ProcessingPipelineProps {
  phases: ProcessingPhase[];
}

export default function ProcessingPipeline({ phases: initialPhases }: ProcessingPipelineProps) {
  const [phases, setPhases] = useState(initialPhases);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhases(prev => prev.map(phase => {
        if (phase.status === "processing" && phase.progress < 100) {
          const newProgress = Math.min(phase.progress + Math.random() * 5, 100);
          return {
            ...phase,
            progress: newProgress,
            status: newProgress >= 100 ? "complete" : "processing"
          };
        }
        return phase;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <Check className="w-4 h-4 text-white" />;
      case "processing":
        return <Loader className="w-4 h-4 text-white animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "complete":
        return "text-green-400";
      case "processing":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="metric-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
        <Cpu className="w-5 h-5 mr-2 text-blue-400" />
        Processing Pipeline
      </h3>
      
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div key={phase.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${getStatusColor(phase.status)} rounded-full flex items-center justify-center`}>
                  {getStatusIcon(phase.status)}
                </div>
                <div>
                  <h4 className="font-medium text-white">Phase {index + 1}: {phase.name}</h4>
                  <p className="text-sm text-gray-400">
                    {index === 0 && "File parsing, layer detection, wall boundary extraction"}
                    {index === 1 && "Color matching, line weights, geometric precision"}
                    {index === 2 && "Genetic algorithm optimization, space utilization analysis"}
                    {index === 3 && "A* pathfinding, minimum spanning tree algorithms"}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-medium ${getStatusTextColor(phase.status)} capitalize`}>
                {phase.status}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`${getStatusColor(phase.status)} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            {phase.status === "processing" && (
              <div className="mt-2 text-xs text-gray-400">
                Generation 47/75 • Fitness: 0.847 • Best Solution: 89.3% space utilization
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
