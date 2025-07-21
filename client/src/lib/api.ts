import { CADFile, Analysis, SystemMetrics, OptimizationResult } from "@shared/schema";

const API_BASE = '/api';

class APIError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      errorData.message || `HTTP ${response.status}`,
      errorData.details
    );
  }

  return response.json();
}

export const cadAPI = {
  // Upload and process CAD file
  async uploadFile(file: File): Promise<{ fileId: string; data: CADFile }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/cad/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        errorData.message || 'Upload failed',
        errorData.details
      );
    }

    return response.json();
  },

  // Get CAD file details
  async getFile(fileId: string): Promise<CADFile> {
    const result = await apiRequest<{ data: CADFile }>(`/cad/files/${fileId}`);
    return result.data;
  },

  // Get all CAD files
  async getAllFiles(): Promise<CADFile[]> {
    const result = await apiRequest<{ data: CADFile[] }>('/cad/files');
    return result.data;
  },

  // Delete CAD file
  async deleteFile(fileId: string): Promise<void> {
    await apiRequest(`/cad/files/${fileId}`, { method: 'DELETE' });
  },

  // Start analysis
  async startAnalysis(
    fileId: string,
    config: {
      ilotConfig: {
        smallIlots: number;
        mediumIlots: number;
        largeIlots: number;
        corridorWidth: number;
        adaCompliance: boolean;
        minClearance?: number;
        maxDensity?: number;
      };
      optimizationConfig?: {
        populationSize?: number;
        generations?: number;
        mutationRate?: number;
        crossoverRate?: number;
      };
    }
  ): Promise<{ analysisId: string }> {
    const result = await apiRequest<{ analysisId: string }>(`/cad/analyze/${fileId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return result;
  },

  // Get analysis results
  async getAnalysis(analysisId: string): Promise<Analysis> {
    const result = await apiRequest<{ data: Analysis }>(`/cad/analysis/${analysisId}`);
    return result.data;
  },

  // Start pixel-perfect analysis
  async startPixelPerfectAnalysis(
    fileId: string,
    config: {
      ilotConfig: {
        smallIlots: number;
        mediumIlots: number;
        largeIlots: number;
        corridorWidth: number;
        adaCompliance: boolean;
        minClearance?: number;
        maxDensity?: number;
      };
    }
  ): Promise<{ analysisId: string; result: any }> {
    const result = await apiRequest<{ analysisId: string; result: any }>(`/cad/pixel-perfect/${fileId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return result;
  },

  // Export analysis results
  async exportResults(
    analysisId: string,
    config: {
      type: 'image' | 'pdf' | 'dxf' | 'json';
      format?: string;
      resolution?: '1080p' | '4k' | '8k';
      includeMetrics?: boolean;
    }
  ): Promise<Blob | any> {
    const response = await fetch(`${API_BASE}/cad/export/${analysisId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        errorData.message || 'Export failed',
        errorData.details
      );
    }

    if (config.type === 'image' || config.type === 'pdf') {
      return response.blob();
    } else {
      return response.json();
    }
  },
};

export const systemAPI = {
  // Get system metrics
  async getMetrics(): Promise<SystemMetrics> {
    const result = await apiRequest<{ data: SystemMetrics }>('/system/metrics');
    return result.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    return apiRequest('/health');
  },
};

export { APIError };