# CAD Îlot Placement System - Replit Configuration

## Overview

This is a comprehensive CAD Analysis application built for îlot placement and optimization with AutoCAD API integration and advanced 3D BIM visualization. The system processes CAD files (DXF, DWG, PDF) and performs intelligent spatial analysis using advanced algorithms including genetic optimization and A* pathfinding for corridor generation.

## User Preferences

Preferred communication style: Simple, everyday language.
Branding: Simplified "CAD Îlot Placement System" instead of "Enterprise" terminology.
Remove professional licensing UI elements.

## Recent Changes (January 2025)

✓ Added AutoCAD API integration for direct file import/export
✓ Implemented advanced 3D BIM visualization with layer management
✓ Updated branding to remove "Enterprise" terminology
✓ Removed professional license UI elements
✓ Created new navigation tabs for AutoCAD Integration and 3D BIM
✓ Fixed server startup issues by creating missing service files
✓ Successfully migrated from Replit Agent to Replit environment
✓ Fixed TypeScript errors for proper client/server separation
✓ Project verified working with Vite development environment
✓ Implemented complete pixel-perfect CAD floor plan processing system
✓ Added PixelPerfectFloorPlan component with exact color matching
✓ Created EnhancedCADProcessor with 5-stage processing pipeline
✓ Implemented intelligent îlot placement with corridor rules (1.2m default)
✓ Added new "Pixel-Perfect Processing" navigation tab
✓ Created server-side PixelPerfectProcessor with corridor generation logic
✓ Fixed TypeScript errors and integrated image processing with CAD file system
✓ Implemented complete pixel-perfect processing API endpoints
✓ Added comprehensive image analysis for architectural element detection

## System Architecture

### Frontend Architecture
- **React 18+ with TypeScript** in strict mode for type safety
- **Vite 6.x** as the build system with optimized production builds
- **Tailwind CSS** with custom enterprise theme and glass morphism effects
- **Component-based architecture** using shadcn/ui components for consistent UI
- **Professional design system** with enterprise-grade visual elements

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with proper error handling
- **File upload handling** using Multer with support for multiple CAD formats
- **In-memory storage** with extensible interface for future database integration
- **Modular service architecture** for CAD processing, layout optimization, and export generation

### Key Technologies
- **CAD Processing**: dxf-parser, PDF-lib for file format support
- **Geometric Calculations**: jsts for advanced spatial operations
- **Visualization**: Three.js for 3D rendering, Fabric.js for 2D canvas operations
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with custom styling

## Key Components

### CAD File Processing (`server/services/cadProcessor.ts`)
- **Multi-format support**: DXF, DWG, PDF, and image files
- **Geometric extraction**: Advanced algorithms for extracting walls, doors, windows
- **Layer management**: Professional layer handling and organization
- **Metadata extraction**: Scale detection, units, and file properties

### Layout Optimization (`client/src/utils/ilotOptimizer.ts`)
- **Genetic Algorithm**: Real implementation with configurable parameters
- **Multi-objective optimization**: Space utilization, accessibility, ADA compliance
- **Population-based evolution**: Crossover, mutation, and selection strategies
- **Performance monitoring**: Real-time fitness tracking and convergence analysis

### Corridor Generation (`client/src/utils/corridorGenerator.ts`)
- **A* Pathfinding**: Efficient route planning between îlots
- **Collision detection**: Advanced spatial indexing for obstacle avoidance
- **Width constraints**: Configurable corridor widths with ADA compliance
- **Network optimization**: Connected pathway generation

### Export System (`client/src/utils/exportManager.ts`)
- **Multiple formats**: High-resolution images, professional PDFs, DXF output
- **Progress tracking**: Real-time export progress with detailed status
- **Quality optimization**: 4K resolution exports for professional use
- **Batch processing**: Efficient handling of multiple export formats

## Data Flow

1. **File Upload**: Users upload CAD files through the professional file upload interface
2. **Processing Pipeline**: Files are processed through multiple stages:
   - Format detection and validation
   - Geometric extraction and analysis
   - Layer organization and metadata extraction
3. **Optimization**: Genetic algorithm processes spatial constraints:
   - Population initialization with random îlot placements
   - Fitness evaluation based on multiple criteria
   - Evolutionary operations (selection, crossover, mutation)
4. **Corridor Generation**: A* pathfinding creates optimal routes:
   - Grid-based spatial representation
   - Obstacle avoidance and width constraints
   - Network connectivity optimization
5. **Visualization**: Real-time rendering of results:
   - Interactive floor plan display
   - Layer visibility controls
   - Professional metrics and analytics
6. **Export**: Multi-format output generation:
   - Vector graphics (SVG, DXF)
   - Raster images (PNG, high-resolution)
   - Professional reports (PDF)

## External Dependencies

### Database Configuration
- **Drizzle ORM** configured for PostgreSQL with Neon Database
- **Schema definition** in `shared/schema.ts` with comprehensive CAD data models
- **Migration system** using Drizzle Kit for database version control

### File Processing Libraries
- **@neondatabase/serverless** for database connectivity
- **multer** for professional file upload handling
- **dxf-parser** for AutoCAD DXF file processing
- **pdf-lib** for PDF manipulation and analysis

### UI and Visualization
- **@radix-ui** component primitives for accessible UI
- **lucide-react** for professional iconography
- **class-variance-authority** for systematic component styling
- **@tanstack/react-query** for efficient data fetching and caching

## Deployment Strategy

### Development Environment
- **Vite dev server** with HMR for rapid development
- **TypeScript compilation** with strict type checking
- **ESBuild bundling** for fast development builds
- **Replit integration** with development banner and cartographer plugin

### Production Build
- **Optimized Vite build** with code splitting and tree shaking
- **ESBuild server compilation** with external package handling
- **Static asset optimization** with proper caching headers
- **Environment-specific configuration** for database and API endpoints

### Performance Considerations
- **Code splitting** for optimal bundle sizes
- **Lazy loading** of heavy CAD processing libraries
- **Memory management** for large file processing
- **Streaming uploads** for better user experience with large files

### Monitoring and Analytics
- **Request logging** with performance metrics
- **Error tracking** with detailed stack traces
- **File processing metrics** for optimization insights
- **User interaction analytics** for UX improvements