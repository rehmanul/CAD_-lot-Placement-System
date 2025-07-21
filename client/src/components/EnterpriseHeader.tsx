import { Layers, Wifi, User, Settings } from "lucide-react";

export default function EnterpriseHeader() {
  return (
    <header className="enterprise-gradient glass-morphism enterprise-shadow relative z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CAD Îlot Placement System</h1>
                <p className="text-sm text-white/80">AutoCAD Integration • 3D BIM Visualization • Real-time Analysis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Settings className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
