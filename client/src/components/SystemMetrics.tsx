import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: string;
  network: string;
  cloudSync: string;
}

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 23,
    memory: "4.2GB",
    network: "125 MB/s",
    cloudSync: "Online"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 50) + 10
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
            <span className="text-sm text-gray-400">Cloud Sync</span>
            <span className="text-sm font-medium text-green-400">{metrics.cloudSync}</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span className="text-xs text-gray-400">Last sync: 2 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
