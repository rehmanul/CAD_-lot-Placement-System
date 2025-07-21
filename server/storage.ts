import { 
  CADFile, 
  Analysis, 
  SystemMetrics,
  InsertCADFile,
  InsertAnalysis,
  OptimizationResult
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // CAD File operations
  storeCADFile(cadFile: CADFile): Promise<string>;
  getCADFile(fileId: string): Promise<CADFile | undefined>;
  getAllCADFiles(): Promise<CADFile[]>;
  deleteCADFile(fileId: string): Promise<void>;
  
  // Analysis operations
  createAnalysis(analysis: Omit<Analysis, 'id' | 'progress'>): Promise<string>;
  getAnalysis(analysisId: string): Promise<Analysis | undefined>;
  updateAnalysis(analysisId: string, updates: Partial<Analysis>): Promise<void>;
  getActiveAnalysesCount(): Promise<number>;
  
  // System metrics
  getTotalFilesCount(): Promise<number>;
  getSystemMetrics(): Promise<SystemMetrics>;
}

export class MemStorage implements IStorage {
  private cadFiles: Map<string, CADFile>;
  private analyses: Map<string, Analysis>;

  constructor() {
    this.cadFiles = new Map();
    this.analyses = new Map();
  }

  async storeCADFile(cadFile: CADFile): Promise<string> {
    const fileId = cadFile.id || nanoid();
    const fileWithId = { ...cadFile, id: fileId };
    this.cadFiles.set(fileId, fileWithId);
    return fileId;
  }

  async getCADFile(fileId: string): Promise<CADFile | undefined> {
    return this.cadFiles.get(fileId);
  }

  async getAllCADFiles(): Promise<CADFile[]> {
    return Array.from(this.cadFiles.values());
  }

  async deleteCADFile(fileId: string): Promise<void> {
    this.cadFiles.delete(fileId);
    // Also delete associated analyses
    const analysesToDelete = Array.from(this.analyses.entries())
      .filter(([_, analysis]) => analysis.fileId === fileId)
      .map(([id, _]) => id);
    
    analysesToDelete.forEach(analysisId => this.analyses.delete(analysisId));
  }

  async createAnalysis(analysis: Omit<Analysis, 'id' | 'progress'>): Promise<string> {
    const analysisId = nanoid();
    const analysisWithId: Analysis = {
      ...analysis,
      id: analysisId,
      progress: 0
    };
    this.analyses.set(analysisId, analysisWithId);
    return analysisId;
  }

  async getAnalysis(analysisId: string): Promise<Analysis | undefined> {
    return this.analyses.get(analysisId);
  }

  async updateAnalysis(analysisId: string, updates: Partial<Analysis>): Promise<void> {
    const existing = this.analyses.get(analysisId);
    if (existing) {
      this.analyses.set(analysisId, { ...existing, ...updates });
    }
  }

  async getActiveAnalysesCount(): Promise<number> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.status === 'processing').length;
  }

  async getTotalFilesCount(): Promise<number> {
    return this.cadFiles.size;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: Math.floor(Math.random() * 50) + 10,
      memory: `${(Math.random() * 4 + 2).toFixed(1)}GB`,
      network: `${Math.floor(Math.random() * 200 + 50)} MB/s`,
      cloudSync: "Online",
      timestamp: new Date(),
      activeAnalyses: await this.getActiveAnalysesCount(),
      totalFiles: await this.getTotalFilesCount()
    };
  }
}

export const storage = new MemStorage();
