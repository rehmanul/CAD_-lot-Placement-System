import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import { processCADFile } from "./services/cadProcessor";
import { optimizeLayout } from "./services/layoutOptimizer";
import { generateExport } from "./services/exportGenerator";
import { PixelPerfectProcessor } from "./services/pixelPerfectProcessor";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/dxf', 'application/pdf', 'image/png', 'image/jpeg'];
    const allowedExtensions = ['.dxf', '.dwg', '.pdf', '.png', '.jpg', '.jpeg'];
    
    const hasValidType = allowedTypes.includes(file.mimetype) ||
                        file.mimetype.startsWith('image/') ||
                        file.mimetype === 'application/octet-stream';
    
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidType && hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: DXF, DWG, PDF, PNG, JPG'));
    }
  }
});

// Validation schemas
const cadAnalysisSchema = z.object({
  ilotConfig: z.object({
    smallIlots: z.number().min(0).max(100),
    mediumIlots: z.number().min(0).max(100),
    largeIlots: z.number().min(0).max(100),
    corridorWidth: z.number().min(0.8).max(3.0),
    adaCompliance: z.boolean(),
    minClearance: z.number().min(0.5).max(2.0).optional(),
    maxDensity: z.number().min(50).max(100).optional()
  }),
  optimizationConfig: z.object({
    populationSize: z.number().min(10).max(200).optional(),
    generations: z.number().min(50).max(500).optional(),
    mutationRate: z.number().min(0.01).max(0.5).optional(),
    crossoverRate: z.number().min(0.5).max(1.0).optional()
  }).optional()
});

const exportSchema = z.object({
  type: z.enum(['image', 'pdf', 'dxf', 'json']),
  format: z.string().optional(),
  resolution: z.enum(['1080p', '4k', '8k']).optional(),
  includeMetrics: z.boolean().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CAD file upload and processing
  app.post("/api/cad/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: "No file uploaded",
          message: "Please select a CAD file to upload" 
        });
      }

      const result = await processCADFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Store processed file for later use
      const fileId = await storage.storeCADFile(result);

      res.json({
        success: true,
        fileId,
        data: result,
        message: "CAD file processed successfully"
      });

    } catch (error) {
      console.error('CAD file processing error:', error);
      res.status(500).json({
        error: "File processing failed",
        message: error instanceof Error ? error.message : "Unknown processing error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Get processed CAD file details
  app.get("/api/cad/files/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const cadFile = await storage.getCADFile(fileId);

      if (!cadFile) {
        return res.status(404).json({
          error: "File not found",
          message: "The requested CAD file could not be found"
        });
      }

      res.json({
        success: true,
        data: cadFile
      });

    } catch (error) {
      console.error('Error retrieving CAD file:', error);
      res.status(500).json({
        error: "Retrieval failed",
        message: "Failed to retrieve CAD file details"
      });
    }
  });

  // Run îlot placement optimization analysis
  app.post("/api/cad/analyze/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const validation = cadAnalysisSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid configuration",
          message: "Analysis configuration validation failed",
          details: validation.error.issues
        });
      }

      const cadFile = await storage.getCADFile(fileId);
      if (!cadFile) {
        return res.status(404).json({
          error: "File not found",
          message: "CAD file must be uploaded before analysis"
        });
      }

      // Start optimization process
      const analysisId = await storage.createAnalysis({
        fileId,
        config: validation.data,
        status: 'processing',
        startTime: new Date()
      });

      // Run optimization in background
      optimizeLayout(cadFile, validation.data)
        .then(async (result) => {
          await storage.updateAnalysis(analysisId, {
            status: 'complete',
            result,
            endTime: new Date()
          });
        })
        .catch(async (error) => {
          console.error('Optimization error:', error);
          await storage.updateAnalysis(analysisId, {
            status: 'error',
            error: error.message,
            endTime: new Date()
          });
        });

      res.json({
        success: true,
        analysisId,
        message: "Analysis started successfully"
      });

    } catch (error) {
      console.error('Analysis initiation error:', error);
      res.status(500).json({
        error: "Analysis failed to start",
        message: error instanceof Error ? error.message : "Unknown analysis error"
      });
    }
  });

  // Get analysis progress and results
  app.get("/api/cad/analysis/:analysisId", async (req, res) => {
    try {
      const { analysisId } = req.params;
      const analysis = await storage.getAnalysis(analysisId);

      if (!analysis) {
        return res.status(404).json({
          error: "Analysis not found",
          message: "The requested analysis could not be found"
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error retrieving analysis:', error);
      res.status(500).json({
        error: "Retrieval failed",
        message: "Failed to retrieve analysis results"
      });
    }
  });

  // Pixel-Perfect Processing endpoint
  app.post("/api/cad/pixel-perfect/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const validation = cadAnalysisSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid configuration",
          message: "Pixel-perfect processing parameters validation failed",
          details: validation.error.issues
        });
      }

      const cadFile = await storage.getCADFile(fileId);
      if (!cadFile) {
        return res.status(404).json({
          error: "CAD file not found",
          message: "The specified CAD file could not be found"
        });
      }

      // Initialize pixel-perfect processor
      const processor = new PixelPerfectProcessor(validation.data.ilotConfig.corridorWidth);
      
      // Process with pixel-perfect algorithms
      const result = processor.processCADFilePixelPerfect(
        cadFile,
        validation.data.ilotConfig,
        validation.data.ilotConfig.corridorWidth
      );

      // Create analysis record
      const analysisId = await storage.createAnalysis({
        fileId,
        config: validation.data,
        status: 'complete',
        startTime: new Date(),
        result
      });

      res.json({
        success: true,
        analysisId,
        result,
        message: "Pixel-perfect processing completed successfully"
      });

    } catch (error) {
      console.error('Pixel-perfect processing error:', error);
      res.status(500).json({
        error: "Processing failed",
        message: error instanceof Error ? error.message : "Unknown processing error"
      });
    }
  });

  // Export analysis results in various formats
  app.post("/api/cad/export/:analysisId", async (req, res) => {
    try {
      const { analysisId } = req.params;
      const validation = exportSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid export configuration",
          message: "Export parameters validation failed",
          details: validation.error.issues
        });
      }

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis || analysis.status !== 'complete') {
        return res.status(400).json({
          error: "Analysis not ready",
          message: "Analysis must be completed before export"
        });
      }

      const exportResult = await generateExport(analysis, validation.data);

      if (validation.data.type === 'image' || validation.data.type === 'pdf') {
        // Return file directly for download
        res.setHeader('Content-Type', exportResult.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.data);
      } else {
        // Return JSON response with export data
        res.json({
          success: true,
          data: exportResult,
          message: "Export generated successfully"
        });
      }

    } catch (error) {
      console.error('Export generation error:', error);
      res.status(500).json({
        error: "Export failed",
        message: error instanceof Error ? error.message : "Unknown export error"
      });
    }
  });

  // Get system metrics
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = {
        cpu: Math.floor(Math.random() * 50) + 10, // Simulated CPU usage
        memory: `${(Math.random() * 4 + 2).toFixed(1)}GB`,
        network: `${Math.floor(Math.random() * 200 + 50)} MB/s`,
        cloudSync: "Online",
        timestamp: new Date(),
        activeAnalyses: await storage.getActiveAnalysesCount(),
        totalFiles: await storage.getTotalFilesCount()
      };

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('Error retrieving system metrics:', error);
      res.status(500).json({
        error: "Metrics unavailable",
        message: "Failed to retrieve system metrics"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date(),
      version: "1.0.0"
    });
  });

  // Get all user files
  app.get("/api/cad/files", async (req, res) => {
    try {
      const files = await storage.getAllCADFiles();
      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      console.error('Error retrieving files:', error);
      res.status(500).json({
        error: "Retrieval failed",
        message: "Failed to retrieve files"
      });
    }
  });

  // Delete CAD file and associated analyses
  app.delete("/api/cad/files/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      await storage.deleteCADFile(fileId);
      
      res.json({
        success: true,
        message: "File deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        error: "Deletion failed",
        message: "Failed to delete file"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
