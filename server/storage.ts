
import { CADFile, Analysis, SystemMetrics } from "@shared/schema";
import { nanoid } from "nanoid";
import * as fs from 'fs/promises';
import * as path from 'path';

// In-memory storage for development - replace with PostgreSQL/MongoDB for production
class DatabaseStorage {
  private cadFiles: Map<string, CADFile> = new Map();
  private analyses: Map<string, Analysis> = new Map();
  private fileData: Map<string, Buffer> = new Map();

  // CAD File operations
  async storeCADFile(cadFile: CADFile): Promise<string> {
    this.cadFiles.set(cadFile.id, cadFile);
    console.log(`Stored CAD file: ${cadFile.name} (${cadFile.id})`);
    return cadFile.id;
  }

  async getCADFile(fileId: string): Promise<CADFile | null> {
    return this.cadFiles.get(fileId) || null;
  }

  async getAllCADFiles(): Promise<CADFile[]> {
    return Array.from(this.cadFiles.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async deleteCADFile(fileId: string): Promise<void> {
    this.cadFiles.delete(fileId);
    this.fileData.delete(fileId);
    
    // Delete associated analyses
    const analysesToDelete = Array.from(this.analyses.values())
      .filter(analysis => analysis.fileId === fileId);
    
    for (const analysis of analysesToDelete) {
      this.analyses.delete(analysis.id);
    }
    
    console.log(`Deleted CAD file: ${fileId} and ${analysesToDelete.length} associated analyses`);
  }

  async storeFileData(fileId: string, buffer: Buffer): Promise<void> {
    this.fileData.set(fileId, buffer);
  }

  async getFileData(fileId: string): Promise<Buffer | null> {
    return this.fileData.get(fileId) || null;
  }

  // Analysis operations
  async createAnalysis(analysisData: {
    fileId: string;
    config: any;
    status: 'pending' | 'processing' | 'complete' | 'error';
    startTime: Date;
    result?: any;
    error?: string;
  }): Promise<string> {
    const id = nanoid();
    const analysis: Analysis = {
      id,
      fileId: analysisData.fileId,
      config: analysisData.config,
      status: analysisData.status,
      startTime: analysisData.startTime,
      endTime: undefined,
      progress: 0,
      result: analysisData.result,
      error: analysisData.error
    };
    
    this.analyses.set(id, analysis);
    console.log(`Created analysis: ${id} for file ${analysisData.fileId}`);
    return id;
  }

  async getAnalysis(analysisId: string): Promise<Analysis | null> {
    return this.analyses.get(analysisId) || null;
  }

  async updateAnalysis(analysisId: string, updates: Partial<Analysis>): Promise<void> {
    const existing = this.analyses.get(analysisId);
    if (!existing) {
      throw new Error(`Analysis not found: ${analysisId}`);
    }
    
    const updated = { ...existing, ...updates };
    this.analyses.set(analysisId, updated);
    console.log(`Updated analysis: ${analysisId}, status: ${updated.status}`);
  }

  async getAllAnalyses(fileId?: string): Promise<Analysis[]> {
    const analyses = Array.from(this.analyses.values());
    return fileId 
      ? analyses.filter(analysis => analysis.fileId === fileId)
      : analyses.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async deleteAnalysis(analysisId: string): Promise<void> {
    this.analyses.delete(analysisId);
    console.log(`Deleted analysis: ${analysisId}`);
  }

  // System metrics
  async getActiveAnalysesCount(): Promise<number> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.status === 'processing').length;
  }

  async getTotalFilesCount(): Promise<number> {
    return this.cadFiles.size;
  }

  async getStorageUsage(): Promise<{ totalSize: number; fileCount: number; analysisCount: number }> {
    let totalSize = 0;
    for (const buffer of this.fileData.values()) {
      totalSize += buffer.length;
    }
    
    return {
      totalSize,
      fileCount: this.cadFiles.size,
      analysisCount: this.analyses.size
    };
  }

  // Search and filtering
  async searchCADFiles(query: string): Promise<CADFile[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.cadFiles.values()).filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.format.toLowerCase().includes(lowerQuery) ||
      file.layers.some(layer => layer.toLowerCase().includes(lowerQuery))
    );
  }

  async getCADFilesByFormat(format: string): Promise<CADFile[]> {
    return Array.from(this.cadFiles.values())
      .filter(file => file.format.toLowerCase() === format.toLowerCase());
  }

  async getAnalysesByStatus(status: Analysis['status']): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.status === status);
  }

  // Cleanup operations
  async cleanupOldAnalyses(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const toDelete = Array.from(this.analyses.values())
      .filter(analysis => analysis.startTime < cutoffDate);
    
    for (const analysis of toDelete) {
      this.analyses.delete(analysis.id);
    }
    
    console.log(`Cleaned up ${toDelete.length} old analyses`);
    return toDelete.length;
  }

  async cleanupOrphanedAnalyses(): Promise<number> {
    const validFileIds = new Set(this.cadFiles.keys());
    const toDelete = Array.from(this.analyses.values())
      .filter(analysis => !validFileIds.has(analysis.fileId));
    
    for (const analysis of toDelete) {
      this.analyses.delete(analysis.id);
    }
    
    console.log(`Cleaned up ${toDelete.length} orphaned analyses`);
    return toDelete.length;
  }

  // Backup and restore (for production use)
  async exportData(): Promise<{
    cadFiles: CADFile[];
    analyses: Analysis[];
    timestamp: Date;
  }> {
    return {
      cadFiles: Array.from(this.cadFiles.values()),
      analyses: Array.from(this.analyses.values()),
      timestamp: new Date()
    };
  }

  async importData(data: {
    cadFiles: CADFile[];
    analyses: Analysis[];
  }): Promise<{ importedFiles: number; importedAnalyses: number }> {
    let importedFiles = 0;
    let importedAnalyses = 0;
    
    for (const file of data.cadFiles) {
      if (!this.cadFiles.has(file.id)) {
        this.cadFiles.set(file.id, file);
        importedFiles++;
      }
    }
    
    for (const analysis of data.analyses) {
      if (!this.analyses.has(analysis.id)) {
        this.analyses.set(analysis.id, analysis);
        importedAnalyses++;
      }
    }
    
    console.log(`Imported ${importedFiles} files and ${importedAnalyses} analyses`);
    return { importedFiles, importedAnalyses };
  }

  // Statistics
  async getStatistics(): Promise<{
    files: {
      total: number;
      byFormat: Record<string, number>;
      totalSize: number;
    };
    analyses: {
      total: number;
      byStatus: Record<string, number>;
      averageProcessingTime: number;
    };
  }> {
    const files = Array.from(this.cadFiles.values());
    const analyses = Array.from(this.analyses.values());
    
    const byFormat: Record<string, number> = {};
    let totalSize = 0;
    
    for (const file of files) {
      byFormat[file.format] = (byFormat[file.format] || 0) + 1;
    }
    
    for (const buffer of this.fileData.values()) {
      totalSize += buffer.length;
    }
    
    const byStatus: Record<string, number> = {};
    let totalProcessingTime = 0;
    let completedAnalyses = 0;
    
    for (const analysis of analyses) {
      byStatus[analysis.status] = (byStatus[analysis.status] || 0) + 1;
      
      if (analysis.status === 'complete' && analysis.endTime) {
        totalProcessingTime += analysis.endTime.getTime() - analysis.startTime.getTime();
        completedAnalyses++;
      }
    }
    
    return {
      files: {
        total: files.length,
        byFormat,
        totalSize
      },
      analyses: {
        total: analyses.length,
        byStatus,
        averageProcessingTime: completedAnalyses > 0 ? totalProcessingTime / completedAnalyses : 0
      }
    };
  }
}

// Create singleton instance
export const storage = new DatabaseStorage();

// Export types for external use
export type Storage = DatabaseStorage;
