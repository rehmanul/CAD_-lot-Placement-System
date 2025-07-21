import { useEffect, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { SystemMetrics as SystemMetricsType } from "@shared/schema";
import { systemAPI } from "@/lib/api";

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await systemAPI.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
      console.error('Error fetching system metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Update metrics every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="metric-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          System Metrics
        </h3>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metric-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          System Metrics
        </h3>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Connection Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="metric-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-blue-400" />
        System Metrics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">CPU Usage</span>
            <span className="text-sm font-medium text-green-400">{metrics.cpu}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Memory</span>
            <span className="text-sm font-medium text-blue-400">{metrics.memory}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "67%" }} />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Network</span>
            <span className="text-sm font-medium text-yellow-400">{metrics.network}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "45%" }} />
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Analyses</span>
            <span className="text-sm font-medium text-purple-400">{metrics.activeAnalyses}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 ${metrics.cloudSync === 'Online' ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`} />
            <span className="text-xs text-gray-400">
              {metrics.totalFiles} files • Last sync: {new Date(metrics.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
