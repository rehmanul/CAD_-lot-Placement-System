import { Download, Upload, FileType, Link2, Database, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface AutoCADConnectionStatus {
  connected: boolean;
  version: string;
  lastSync: Date | null;
}

export function AutoCADIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<AutoCADConnectionStatus>({
    connected: false,
    version: "AutoCAD 2024",
    lastSync: null
  });
  const [syncProgress, setSyncProgress] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setSyncProgress(0);
    
    // Simulate connection process
    for (let i = 0; i <= 100; i += 10) {
      setSyncProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setConnectionStatus({
      connected: true,
      version: "AutoCAD 2024",
      lastSync: new Date()
    });
    setIsConnecting(false);
  };

  const handleDirectImport = () => {
    // Handle direct AutoCAD import
    console.log("Importing directly from AutoCAD...");
  };

  const handleDirectExport = () => {
    // Handle direct AutoCAD export
    console.log("Exporting directly to AutoCAD...");
  };

  return (
    <div className="space-y-6">
      <Card className="glass-morphism border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                AutoCAD Integration (Demo)
              </CardTitle>
              <CardDescription className="text-white/70">
                Demo interface for AutoCAD integration. Actual AutoCAD API integration requires enterprise license and COM/ActiveX setup.
              </CardDescription>
            </div>
            <Badge 
              variant={connectionStatus.connected ? "default" : "secondary"}
              className={connectionStatus.connected ? "bg-green-500" : "bg-gray-500"}
            >
              {connectionStatus.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connectionStatus.connected ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/80 mb-4">
                  Connect to AutoCAD to enable direct file operations
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isConnecting ? "Connecting..." : "Connect to AutoCAD"}
                </Button>
              </div>
              
              {isConnecting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Establishing connection...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="w-full" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{connectionStatus.version}</div>
                  <div className="text-sm text-white/70">Version</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">Active</div>
                  <div className="text-sm text-white/70">Status</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleDirectImport}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Direct Import
                </Button>
                <Button 
                  onClick={handleDirectExport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Direct Export
                </Button>
              </div>
              
              {connectionStatus.lastSync && (
                <div className="text-sm text-white/70 text-center">
                  Last sync: {connectionStatus.lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="import" className="data-[state=active]:bg-white/20">Import</TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-white/20">Export</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-4">
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Import from AutoCAD</CardTitle>
              <CardDescription className="text-white/70">
                Import drawings directly from your AutoCAD workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Drawing Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                    placeholder="Enter drawing name..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Layer Selection</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white">
                    <option value="all">All Layers</option>
                    <option value="architecture">Architecture Only</option>
                    <option value="structural">Structural Only</option>
                    <option value="custom">Custom Selection</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <FileType className="w-4 h-4 mr-2" />
                  Import Drawing
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Export to AutoCAD</CardTitle>
              <CardDescription className="text-white/70">
                Export optimized îlot layouts back to AutoCAD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Export Format</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white">
                    <option value="dwg">AutoCAD Drawing (.dwg)</option>
                    <option value="dxf">AutoCAD Exchange (.dxf)</option>
                    <option value="dwt">AutoCAD Template (.dwt)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Scale</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white">
                    <option value="1:50">1:50</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Include Elements</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 text-white/80">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Îlots</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white/80">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Corridors</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white/80">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Dimensions</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white/80">
                    <input type="checkbox" className="rounded" />
                    <span>Annotations</span>
                  </label>
                </div>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export to AutoCAD
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">AutoCAD Settings</CardTitle>
              <CardDescription className="text-white/70">
                Configure AutoCAD integration preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">AutoCAD Installation Path</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                    placeholder="C:\Program Files\Autodesk\AutoCAD 2024"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Default Export Location</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                    placeholder="Select folder..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-white">
                    <input type="checkbox" className="rounded" />
                    <span>Auto-sync on file changes</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Preserve layer organization</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white">
                    <input type="checkbox" className="rounded" />
                    <span>Enable real-time preview</span>
                  </label>
                </div>
                
                <Button className="w-full bg-gray-600 hover:bg-gray-700">
                  <Database className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}