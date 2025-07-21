import { z } from "zod";

// Base geometric types
export const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const rectangleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

// CAD file schemas
export const cadElementSchema = z.object({
  id: z.string(),
  type: z.enum(['wall', 'door', 'window', 'room', 'annotation', 'furniture']),
  geometry: z.object({
    type: z.enum(['line', 'polyline', 'circle', 'arc', 'rectangle', 'polygon']),
    coordinates: z.array(z.array(z.number())),
    bounds: rectangleSchema
  }),
  properties: z.object({
    color: z.string(),
    lineWeight: z.number(),
    lineType: z.enum(['solid', 'dashed', 'dotted']),
    fillColor: z.string().optional(),
    text: z.string().optional(),
    thickness: z.number().optional()
  }),
  layer: z.string()
});

export const cadFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.string(),
  size: z.string(),
  scale: z.string(),
  layers: z.array(z.string()),
  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }),
  elements: z.array(cadElementSchema),
  metadata: z.object({
    createdAt: z.date(),
    modifiedAt: z.date(),
    author: z.string().optional(),
    units: z.enum(['mm', 'cm', 'm', 'in', 'ft'])
  }),
  uploadedAt: z.date()
});

// Analysis schemas
export const ilotConfigSchema = z.object({
  smallIlots: z.number().min(0).max(100),
  mediumIlots: z.number().min(0).max(100),
  largeIlots: z.number().min(0).max(100),
  corridorWidth: z.number().min(0.8).max(3.0),
  adaCompliance: z.boolean(),
  minClearance: z.number().min(0.5).max(2.0).default(1.2),
  maxDensity: z.number().min(50).max(100).default(80)
});

export const optimizationConfigSchema = z.object({
  populationSize: z.number().min(10).max(200).default(50),
  generations: z.number().min(50).max(500).default(100),
  mutationRate: z.number().min(0.01).max(0.5).default(0.1),
  crossoverRate: z.number().min(0.5).max(1.0).default(0.8),
  eliteSize: z.number().min(1).max(20).default(5),
  fitnessWeights: z.object({
    spaceUtilization: z.number().min(0).max(1).default(0.4),
    accessibility: z.number().min(0).max(1).default(0.3),
    corridorEfficiency: z.number().min(0).max(1).default(0.2),
    adaCompliance: z.number().min(0).max(1).default(0.1)
  })
});

export const ilotSchema = z.object({
  id: z.string(),
  position: pointSchema,
  width: z.number(),
  height: z.number(),
  area: z.number(),
  size: z.enum(['small', 'medium', 'large']),
  rotation: z.number(),
  accessible: z.boolean(),
  corridorConnections: z.array(z.string())
});

export const corridorSchema = z.object({
  id: z.string(),
  path: z.array(pointSchema),
  width: z.number(),
  connectedIlots: z.array(z.string()),
  accessible: z.boolean(),
  length: z.number()
});

export const optimizationResultSchema = z.object({
  ilots: z.array(ilotSchema),
  corridors: z.array(corridorSchema),
  metrics: z.object({
    totalIlots: z.number(),
    totalArea: z.number(),
    usedArea: z.number(),
    spaceUtilization: z.number(),
    accessibilityCompliance: z.number(),
    corridorEfficiency: z.number()
  }),
  fitness: z.number(),
  generation: z.number()
});

export const analysisSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  config: z.object({
    ilotConfig: ilotConfigSchema,
    optimizationConfig: optimizationConfigSchema.optional()
  }),
  status: z.enum(['pending', 'processing', 'complete', 'error']),
  result: optimizationResultSchema.optional(),
  error: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  progress: z.number().min(0).max(100).default(0)
});

// Export schemas
export const exportConfigSchema = z.object({
  type: z.enum(['image', 'pdf', 'dxf', 'json']),
  format: z.string().optional(),
  resolution: z.enum(['1080p', '4k', '8k']).optional(),
  includeMetrics: z.boolean().default(true)
});

export const systemMetricsSchema = z.object({
  cpu: z.number(),
  memory: z.string(),
  network: z.string(),
  cloudSync: z.string(),
  timestamp: z.date(),
  activeAnalyses: z.number(),
  totalFiles: z.number()
});

// Type exports
export type Point = z.infer<typeof pointSchema>;
export type Rectangle = z.infer<typeof rectangleSchema>;
export type CADElement = z.infer<typeof cadElementSchema>;
export type CADFile = z.infer<typeof cadFileSchema>;
export type IlotConfig = z.infer<typeof ilotConfigSchema>;
export type OptimizationConfig = z.infer<typeof optimizationConfigSchema>;
export type Ilot = z.infer<typeof ilotSchema>;
export type Corridor = z.infer<typeof corridorSchema>;
export type OptimizationResult = z.infer<typeof optimizationResultSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type ExportConfig = z.infer<typeof exportConfigSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;

// Insert schemas for database operations
export const insertCADFileSchema = cadFileSchema.omit({ id: true, uploadedAt: true });
export const insertAnalysisSchema = analysisSchema.omit({ id: true });

export type InsertCADFile = z.infer<typeof insertCADFileSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
