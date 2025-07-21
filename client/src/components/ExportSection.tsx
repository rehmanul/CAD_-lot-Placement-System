import { useState } from "react";
import { Download, FileImage, FileText, File, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Analysis } from "@shared/schema";
import { cadAPI } from "@/lib/api";
import { exportToImage, exportToPDF, exportToDXF, exportToJSON } from "@/utils/exportManager";

interface ExportSectionProps {
  analysis?: Analysis | null;
}

export default function ExportSection({ analysis }: ExportSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'image' | 'pdf' | 'dxf' | 'json'>('image');
  const [resolution, setResolution] = useState<'1080p' | '4k' | '8k'>('1080p');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeGeometry, setIncludeGeometry] = useState(true);
  const [includeLayers, setIncludeLayers] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
        <CardDescription>Export the current analysis in various formats.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="export-format">Format</Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'image' | 'pdf' | 'dxf' | 'json')}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="dxf">DXF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {exportFormat === 'image' && (
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={resolution} onValueChange={(value) => setResolution(value as '1080p' | '4k' | '8k')}>
                <SelectTrigger id="resolution">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                  <SelectItem value="8k">8K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="include-metrics" checked={includeMetrics} onCheckedChange={setIncludeMetrics} />
          <Label htmlFor="include-metrics">Include Metrics</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="include-geometry" checked={includeGeometry} onCheckedChange={setIncludeGeometry} />
          <Label htmlFor="include-geometry">Include Geometry</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="include-layers" checked={includeLayers} onCheckedChange={setIncludeLayers} />
          <Label htmlFor="include-layers">Include Layers</Label>
        </div>
        {isExporting && (
          <Progress value={exportProgress} />
        )}
        <Button disabled={isExporting} onClick={async () => {
          if (!analysis) return;

          setIsExporting(true);
          setExportProgress(0);

          try {
            switch (exportFormat) {
              case 'image':
                await exportToImage(analysis, resolution, includeMetrics, includeGeometry, includeLayers, setExportProgress);
                break;
              case 'pdf':
                await exportToPDF(analysis, includeMetrics, includeGeometry, includeLayers, setExportProgress);
                break;
              case 'dxf':
                await exportToDXF(analysis, includeMetrics, includeGeometry, includeLayers, setExportProgress);
                break;
              case 'json':
                await exportToJSON(analysis, includeMetrics, includeGeometry, includeLayers, setExportProgress);
                break;
              default:
                break;
            }
          } finally {
            setIsExporting(false);
            setExportProgress(0);
          }
        }}>
          {isExporting ? 'Exporting...' : 'Export'}
          {exportFormat === 'image' ? <FileImage className="ml-2 h-4 w-4" /> :
            exportFormat === 'pdf' ? <FileText className="ml-2 h-4 w-4" /> :
              exportFormat === 'dxf' ? <File className="ml-2 h-4 w-4" /> :
                <FileText className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}