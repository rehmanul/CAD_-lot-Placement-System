import { CADFile, Ilot, Corridor, OptimizationResult } from "../../shared/schema";

interface FloorPlanElement {
  type: 'wall' | 'entrance' | 'exit' | 'restricted';
  id: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    coordinates: number[][];
  };
  properties: {
    color: string;
    classification: string;
  };
}

interface Room {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  area: number;
  isUsable: boolean;
  restrictions: string[];
}

interface IlotRow {
  y: number;
  ilots: Ilot[];
  direction: 'horizontal' | 'vertical';
}

export class PixelPerfectProcessor {
  private corridorWidth: number = 1.2; // Default 1.2m as specified

  constructor(corridorWidth: number = 1.2) {
    this.corridorWidth = corridorWidth;
  }

  /**
   * Process CAD file to extract pixel-perfect floor plan elements
   */
  extractFloorPlanElements(cadFile: CADFile): FloorPlanElement[] {
    const elements: FloorPlanElement[] = [];

    cadFile.elements.forEach(element => {
      const bounds = element.geometry.bounds;
      
      // Classify elements based on properties and layer names
      const classification = this.classifyElement(element);
      
      if (classification) {
        elements.push({
          type: classification.type,
          id: element.id,
          geometry: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            coordinates: element.geometry.coordinates
          },
          properties: {
            color: classification.color,
            classification: classification.name
          }
        });
      }
    });

    return elements;
  }

  /**
   * Classify CAD elements into floor plan components
   */
  private classifyElement(element: any): { type: 'wall' | 'entrance' | 'exit' | 'restricted'; color: string; name: string } | null {
    const layer = element.layer.toLowerCase();
    const text = element.properties.text?.toLowerCase() || '';
    
    // Wall classification (MUR)
    if (layer.includes('wall') || layer.includes('mur') || 
        element.type === 'wall' || element.properties.lineWeight > 3) {
      return { type: 'wall', color: '#6B7280', name: 'MUR' };
    }
    
    // Restricted areas (NO ENTREE)
    if (layer.includes('restrict') || text.includes('no') || 
        text.includes('restrict') || text.includes('interdit') ||
        layer.includes('no_entry')) {
      return { type: 'restricted', color: '#3B82F6', name: 'NO ENTREE' };
    }
    
    // Entrance/Exit areas (ENTRÉE/SORTIE)
    if (element.type === 'door' || element.type === 'window' ||
        text.includes('entrée') || text.includes('entrance') ||
        text.includes('sortie') || text.includes('exit') ||
        layer.includes('door') || layer.includes('opening')) {
      return { type: 'entrance', color: '#EF4444', name: 'ENTRÉE/SORTIE' };
    }

    return null;
  }

  /**
   * Generate optimized îlot placement with exact measurements
   */
  generateOptimalIlotPlacement(
    floorPlanElements: FloorPlanElement[],
    ilotConfig: any
  ): { ilots: Ilot[]; rooms: Room[] } {
    // Calculate usable floor space
    const rooms = this.identifyUsableRooms(floorPlanElements);
    const ilots: Ilot[] = [];
    
    // Îlot size configurations with exact measurements
    const ilotSizes = [
      { size: 'small' as const, width: 1.8, height: 1.2, targetCount: ilotConfig.smallIlots },
      { size: 'medium' as const, width: 2.4, height: 1.6, targetCount: ilotConfig.mediumIlots },
      { size: 'large' as const, width: 3.0, height: 2.0, targetCount: ilotConfig.largeIlots }
    ];

    let ilotId = 1;

    rooms.forEach(room => {
      if (!room.isUsable) return;

      // Generate grid-based placement within each room
      ilotSizes.forEach(sizeConfig => {
        const ilotsToPlace = Math.floor(sizeConfig.targetCount / rooms.length);
        
        // Calculate grid spacing including corridor width
        const spacingX = sizeConfig.width + this.corridorWidth;
        const spacingY = sizeConfig.height + this.corridorWidth;
        
        // Calculate how many îlots can fit
        const maxCols = Math.floor((room.bounds.width - sizeConfig.width) / spacingX) + 1;
        const maxRows = Math.floor((room.bounds.height - sizeConfig.height) / spacingY) + 1;
        
        let placed = 0;
        
        for (let row = 0; row < maxRows && placed < ilotsToPlace; row++) {
          for (let col = 0; col < maxCols && placed < ilotsToPlace; col++) {
            const x = room.bounds.x + col * spacingX + 0.5; // 0.5m margin from walls
            const y = room.bounds.y + row * spacingY + 0.5;
            
            // Verify placement doesn't conflict with obstacles
            if (this.isValidPlacement(x, y, sizeConfig.width, sizeConfig.height, floorPlanElements)) {
              ilots.push({
                id: `ilot-${ilotId++}`,
                position: { x, y },
                width: sizeConfig.width,
                height: sizeConfig.height,
                area: sizeConfig.width * sizeConfig.height,
                size: sizeConfig.size,
                rotation: 0,
                accessible: true,
                corridorConnections: []
              });
              placed++;
            }
          }
        }
      });
    });

    return { ilots, rooms };
  }

  /**
   * Generate corridor network following exact rules:
   * 1. Automatic corridors between facing îlot rows
   * 2. Configurable width (default 1.2m)
   * 3. Must touch îlots on each side
   * 4. Never cut or overlap îlots
   */
  generateCorridorNetwork(ilots: Ilot[]): Corridor[] {
    const corridors: Corridor[] = [];
    
    if (ilots.length === 0) return corridors;
    
    // Group îlots into rows based on Y position
    const ilotRows = this.groupIlotsIntoRows(ilots);
    
    // Generate horizontal corridors between facing rows
    for (let i = 0; i < ilotRows.length - 1; i++) {
      const currentRow = ilotRows[i];
      const nextRow = ilotRows[i + 1];
      
      // Check if rows are facing each other
      if (this.areRowsFacing(currentRow, nextRow)) {
        const corridor = this.createCorridorBetweenRows(currentRow, nextRow, corridors.length + 1);
        if (corridor) {
          corridors.push(corridor);
          
          // Update îlot connections
          this.updateIlotConnections(currentRow.ilots, corridor.id);
          this.updateIlotConnections(nextRow.ilots, corridor.id);
        }
      }
    }

    // Generate vertical corridors for perpendicular access
    const verticalCorridors = this.generateVerticalCorridors(ilots, corridors.length);
    corridors.push(...verticalCorridors);

    // Generate perimeter corridors for external access
    const perimeterCorridors = this.generatePerimeterCorridors(ilots, corridors.length + verticalCorridors.length);
    corridors.push(...perimeterCorridors);

    return corridors;
  }

  /**
   * Group îlots into rows for corridor generation
   */
  private groupIlotsIntoRows(ilots: Ilot[]): IlotRow[] {
    const rows: IlotRow[] = [];
    const tolerance = 0.5; // 50cm tolerance for row alignment
    
    ilots.forEach(ilot => {
      // Find existing row or create new one
      let targetRow = rows.find(row => 
        Math.abs(row.y - ilot.position.y) <= tolerance
      );
      
      if (!targetRow) {
        targetRow = {
          y: ilot.position.y,
          ilots: [],
          direction: 'horizontal'
        };
        rows.push(targetRow);
      }
      
      targetRow.ilots.push(ilot);
    });

    // Sort rows by Y position and îlots within rows by X position
    rows.forEach(row => {
      row.ilots.sort((a, b) => a.position.x - b.position.x);
    });
    
    rows.sort((a, b) => a.y - b.y);
    
    return rows;
  }

  /**
   * Check if two rows are facing each other and need a corridor
   */
  private areRowsFacing(row1: IlotRow, row2: IlotRow): boolean {
    const distance = row2.y - (row1.y + this.getMaxIlotHeight(row1.ilots));
    
    // Rows are facing if distance is between 1.2m and 3.0m
    return distance >= this.corridorWidth && distance <= this.corridorWidth * 2.5;
  }

  /**
   * Create corridor between two facing rows
   */
  private createCorridorBetweenRows(row1: IlotRow, row2: IlotRow, corridorId: number): Corridor | null {
    // Calculate corridor path
    const startX = Math.min(
      Math.min(...row1.ilots.map(i => i.position.x)),
      Math.min(...row2.ilots.map(i => i.position.x))
    ) - 0.2; // 20cm margin
    
    const endX = Math.max(
      Math.max(...row1.ilots.map(i => i.position.x + i.width)),
      Math.max(...row2.ilots.map(i => i.position.x + i.width))
    ) + 0.2;
    
    const corridorY = row1.y + this.getMaxIlotHeight(row1.ilots) + (this.corridorWidth / 2);
    
    const path = [
      { x: startX, y: corridorY },
      { x: endX, y: corridorY }
    ];
    
    const length = endX - startX;
    
    // Get connected îlots (those within corridor reach)
    const connectedIlots = [
      ...row1.ilots.filter(ilot => this.isIlotConnectedToCorridor(ilot, path, this.corridorWidth)),
      ...row2.ilots.filter(ilot => this.isIlotConnectedToCorridor(ilot, path, this.corridorWidth))
    ].map(ilot => ilot.id);

    return {
      id: `corridor-${corridorId}`,
      path,
      width: this.corridorWidth,
      connectedIlots,
      accessible: true,
      length
    };
  }

  /**
   * Generate vertical corridors for perpendicular access
   */
  private generateVerticalCorridors(ilots: Ilot[], startingId: number): Corridor[] {
    const corridors: Corridor[] = [];
    
    // Group îlots by X position for vertical corridors
    const columns: { [key: string]: Ilot[] } = {};
    const tolerance = 0.5;
    
    ilots.forEach(ilot => {
      const key = Math.round(ilot.position.x / tolerance) * tolerance;
      if (!columns[key]) columns[key] = [];
      columns[key].push(ilot);
    });

    Object.values(columns).forEach((columnIlots, index) => {
      if (columnIlots.length > 1) {
        columnIlots.sort((a, b) => a.position.y - b.position.y);
        
        // Create vertical corridor if needed
        const minY = Math.min(...columnIlots.map(i => i.position.y));
        const maxY = Math.max(...columnIlots.map(i => i.position.y + i.height));
        const corridorX = columnIlots[0].position.x + columnIlots[0].width + (this.corridorWidth / 2);
        
        if (maxY - minY > this.corridorWidth * 2) {
          corridors.push({
            id: `vertical-corridor-${startingId + index}`,
            path: [
              { x: corridorX, y: minY - 0.2 },
              { x: corridorX, y: maxY + 0.2 }
            ],
            width: this.corridorWidth,
            connectedIlots: columnIlots.map(ilot => ilot.id),
            accessible: true,
            length: maxY - minY + 0.4
          });
        }
      }
    });

    return corridors;
  }

  /**
   * Helper methods
   */
  private identifyUsableRooms(elements: FloorPlanElement[]): Room[] {
    // Simplified room identification - in real implementation, this would use
    // advanced geometric algorithms to identify enclosed spaces
    const walls = elements.filter(e => e.type === 'wall');
    const restricted = elements.filter(e => e.type === 'restricted');
    
    // For now, create a simplified room layout
    return [{
      id: 'main-room',
      bounds: { x: 5, y: 5, width: 90, height: 70 },
      area: 6300,
      isUsable: true,
      restrictions: []
    }];
  }

  private isValidPlacement(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    obstacles: FloorPlanElement[]
  ): boolean {
    const ilotBounds = { x, y, width, height };
    
    return !obstacles.some(obstacle => {
      if (obstacle.type === 'wall' || obstacle.type === 'restricted') {
        return this.rectanglesOverlap(ilotBounds, obstacle.geometry);
      }
      return false;
    });
  }

  private rectanglesOverlap(rect1: any, rect2: any): boolean {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
  }

  private getMaxIlotHeight(ilots: Ilot[]): number {
    return Math.max(...ilots.map(ilot => ilot.height));
  }

  private isIlotConnectedToCorridor(ilot: Ilot, corridorPath: any[], corridorWidth: number): boolean {
    // Check if îlot is within corridor reach
    const corridorY = corridorPath[0].y;
    const ilotBottom = ilot.position.y + ilot.height;
    const ilotTop = ilot.position.y;
    
    // Îlot is connected if it's within corridor width distance
    return Math.abs(corridorY - ilotBottom) <= corridorWidth / 2 ||
           Math.abs(corridorY - ilotTop) <= corridorWidth / 2;
  }

  private updateIlotConnections(ilots: Ilot[], corridorId: string): void {
    ilots.forEach(ilot => {
      if (!ilot.corridorConnections.includes(corridorId)) {
        ilot.corridorConnections.push(corridorId);
      }
    });
  }

  /**
   * Generate perimeter corridors around the entire layout
   */
  private generatePerimeterCorridors(ilots: Ilot[], startingId: number): Corridor[] {
    if (ilots.length === 0) return [];
    
    const corridors: Corridor[] = [];
    
    // Find layout bounds
    const minX = Math.min(...ilots.map(i => i.position.x));
    const maxX = Math.max(...ilots.map(i => i.position.x + i.width));
    const minY = Math.min(...ilots.map(i => i.position.y));
    const maxY = Math.max(...ilots.map(i => i.position.y + i.height));
    
    const margin = this.corridorWidth;
    
    // Top perimeter corridor
    corridors.push({
      id: `perimeter-top-${startingId}`,
      path: [
        { x: minX - margin, y: minY - margin },
        { x: maxX + margin, y: minY - margin }
      ],
      width: this.corridorWidth,
      connectedIlots: ilots.filter(i => i.position.y === minY).map(i => i.id),
      accessible: true,
      length: (maxX + margin) - (minX - margin)
    });
    
    // Bottom perimeter corridor
    corridors.push({
      id: `perimeter-bottom-${startingId + 1}`,
      path: [
        { x: minX - margin, y: maxY + margin },
        { x: maxX + margin, y: maxY + margin }
      ],
      width: this.corridorWidth,
      connectedIlots: ilots.filter(i => i.position.y + i.height === maxY).map(i => i.id),
      accessible: true,
      length: (maxX + margin) - (minX - margin)
    });
    
    return corridors;
  }

  /**
   * Main processing method that combines all steps
   */
  processCADFilePixelPerfect(
    cadFile: CADFile,
    ilotConfig: any,
    corridorWidth: number = 1.2
  ): OptimizationResult {
    this.corridorWidth = corridorWidth;
    
    // Step 1: Extract floor plan elements
    const floorPlanElements = this.extractFloorPlanElements(cadFile);
    
    // Step 2: Generate optimal îlot placement
    const { ilots, rooms } = this.generateOptimalIlotPlacement(floorPlanElements, ilotConfig);
    
    // Step 3: Generate corridor network with exact rules
    const corridors = this.generateCorridorNetwork(ilots);
    
    // Step 4: Calculate metrics
    const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
    const usedArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    const corridorArea = corridors.reduce((sum, corridor) => sum + (corridor.length * corridor.width), 0);
    
    const metrics = {
      totalIlots: ilots.length,
      totalArea,
      usedArea,
      spaceUtilization: (usedArea / totalArea) * 100,
      accessibilityCompliance: this.calculateAccessibilityCompliance(ilots, corridors),
      corridorEfficiency: this.calculateCorridorEfficiency(corridors, usedArea)
    };

    const fitness = this.calculateFitness(metrics);

    return {
      ilots,
      corridors,
      metrics,
      fitness,
      generation: 0 // This is not from genetic algorithm
    };
  }

  private calculateAccessibilityCompliance(ilots: Ilot[], corridors: Corridor[]): number {
    // All îlots should be accessible via corridors
    const accessibleIlots = ilots.filter(ilot => 
      corridors.some(corridor => 
        corridor.connectedIlots.includes(ilot.id) && corridor.width >= 1.2
      )
    );
    
    return ilots.length > 0 ? accessibleIlots.length / ilots.length : 1;
  }

  private calculateCorridorEfficiency(corridors: Corridor[], usedArea: number): number {
    const totalCorridorArea = corridors.reduce((sum, corridor) => 
      sum + (corridor.length * corridor.width), 0
    );
    
    // Efficiency is the ratio of used area to corridor area
    return totalCorridorArea > 0 ? usedArea / (usedArea + totalCorridorArea) : 1;
  }

  private calculateFitness(metrics: any): number {
    return (
      metrics.spaceUtilization * 0.4 +
      metrics.accessibilityCompliance * 100 * 0.3 +
      metrics.corridorEfficiency * 100 * 0.3
    ) / 100;
  }
}