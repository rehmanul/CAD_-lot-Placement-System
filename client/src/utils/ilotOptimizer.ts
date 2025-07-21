import { Ilot, Room, RestrictedArea, OptimizationResult, GeneticAlgorithmConfig } from "@/types/analysis";
import { Point } from "@/types/analysis";

export class GeneticAlgorithmOptimizer {
  private config: GeneticAlgorithmConfig;
  private rooms: Room[];
  private restrictedAreas: RestrictedArea[];
  private population: Individual[] = [];

  constructor(
    rooms: Room[],
    restrictedAreas: RestrictedArea[],
    config: Partial<GeneticAlgorithmConfig> = {}
  ) {
    this.rooms = rooms;
    this.restrictedAreas = restrictedAreas;
    this.config = {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      eliteSize: 5,
      fitnessWeights: {
        spaceUtilization: 0.4,
        accessibility: 0.3,
        corridorEfficiency: 0.2,
        adaCompliance: 0.1
      },
      ...config
    };
  }

  public async optimize(): Promise<OptimizationResult> {
    // Initialize population
    this.initializePopulation();

    let bestIndividual: Individual | null = null;
    
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness for all individuals
      this.evaluatePopulation();
      
      // Sort by fitness (highest first)
      this.population.sort((a, b) => b.fitness - a.fitness);
      
      // Update best individual
      if (!bestIndividual || this.population[0].fitness > bestIndividual.fitness) {
        bestIndividual = { ...this.population[0] };
      }

      // Create new generation
      const newPopulation: Individual[] = [];
      
      // Elitism - keep best individuals
      for (let i = 0; i < this.config.eliteSize; i++) {
        newPopulation.push({ ...this.population[i] });
      }
      
      // Generate offspring through crossover and mutation
      while (newPopulation.length < this.config.populationSize) {
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        
        let offspring1: Individual, offspring2: Individual;
        
        if (Math.random() < this.config.crossoverRate) {
          [offspring1, offspring2] = this.crossover(parent1, parent2);
        } else {
          offspring1 = { ...parent1 };
          offspring2 = { ...parent2 };
        }
        
        if (Math.random() < this.config.mutationRate) {
          this.mutate(offspring1);
        }
        if (Math.random() < this.config.mutationRate) {
          this.mutate(offspring2);
        }
        
        newPopulation.push(offspring1);
        if (newPopulation.length < this.config.populationSize) {
          newPopulation.push(offspring2);
        }
      }
      
      this.population = newPopulation;
      
      // Progress callback could be added here
      if (generation % 10 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${bestIndividual?.fitness.toFixed(4)}`);
      }
    }

    // Convert best individual to result format
    return this.individualToResult(bestIndividual!, this.config.generations);
  }

  private initializePopulation(): void {
    this.population = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const individual: Individual = {
        ilots: this.generateRandomIlots(),
        fitness: 0
      };
      this.population.push(individual);
    }
  }

  private generateRandomIlots(): Ilot[] {
    const ilots: Ilot[] = [];
    const usableRooms = this.rooms.filter(room => room.type === 'office' || room.type === 'common');
    
    for (const room of usableRooms) {
      const roomIlots = this.placeIlotsInRoom(room);
      ilots.push(...roomIlots);
    }
    
    return ilots;
  }

  private placeIlotsInRoom(room: Room): Ilot[] {
    const ilots: Ilot[] = [];
    const usableArea = this.calculateUsableArea(room);
    
    // Determine number of îlots based on room size
    const targetIlots = Math.floor(usableArea / 8); // Average 8m² per îlot
    
    for (let i = 0; i < targetIlots; i++) {
      const size = this.randomIlotSize();
      const dimensions = this.getIlotDimensions(size);
      const position = this.findValidPosition(room, dimensions);
      
      if (position) {
        ilots.push({
          id: `ilot_${ilots.length}`,
          position,
          width: dimensions.width,
          height: dimensions.height,
          area: dimensions.width * dimensions.height,
          size,
          rotation: 0,
          accessible: true,
          corridorConnections: []
        });
      }
    }
    
    return ilots;
  }

  private calculateUsableArea(room: Room): number {
    // Subtract restricted areas and circulation space
    let usableArea = room.area;
    
    // Check for overlapping restricted areas
    for (const restrictedArea of this.restrictedAreas) {
      const overlap = this.calculatePolygonOverlap(room.boundary, restrictedArea.boundary);
      usableArea -= overlap;
    }
    
    // Reserve 30% for circulation
    return usableArea * 0.7;
  }

  private randomIlotSize(): 'small' | 'medium' | 'large' {
    const rand = Math.random();
    if (rand < 0.3) return 'small';
    if (rand < 0.8) return 'medium';
    return 'large';
  }

  private getIlotDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
    switch (size) {
      case 'small':
        return { width: 1.5 + Math.random() * 1, height: 2 + Math.random() * 1 };
      case 'medium':
        return { width: 2.5 + Math.random() * 1.5, height: 2.5 + Math.random() * 1.5 };
      case 'large':
        return { width: 3.5 + Math.random() * 2, height: 3.5 + Math.random() * 2 };
    }
  }

  private findValidPosition(room: Room, dimensions: { width: number; height: number }): Point | null {
    // Find room bounds
    const bounds = this.getPolygonBounds(room.boundary);
    const maxAttempts = 50;
    
    for (let i = 0; i < maxAttempts; i++) {
      const position: Point = {
        x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX - dimensions.width),
        y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY - dimensions.height)
      };
      
      if (this.isValidPosition(position, dimensions, room)) {
        return position;
      }
    }
    
    return null;
  }

  private isValidPosition(position: Point, dimensions: { width: number; height: number }, room: Room): boolean {
    // Check if îlot is within room bounds
    const ilotCorners: Point[] = [
      position,
      { x: position.x + dimensions.width, y: position.y },
      { x: position.x + dimensions.width, y: position.y + dimensions.height },
      { x: position.x, y: position.y + dimensions.height }
    ];
    
    // Check if all corners are within room
    for (const corner of ilotCorners) {
      if (!this.pointInPolygon(corner, room.boundary)) {
        return false;
      }
    }
    
    // Check against restricted areas
    for (const restrictedArea of this.restrictedAreas) {
      if (this.rectangleIntersectsPolygon(position, dimensions, restrictedArea.boundary)) {
        return false;
      }
    }
    
    return true;
  }

  private evaluatePopulation(): void {
    for (const individual of this.population) {
      individual.fitness = this.calculateFitness(individual);
    }
  }

  private calculateFitness(individual: Individual): number {
    const spaceUtilization = this.calculateSpaceUtilization(individual.ilots);
    const accessibility = this.calculateAccessibility(individual.ilots);
    const corridorEfficiency = this.calculateCorridorEfficiency(individual.ilots);
    const adaCompliance = this.calculateADACompliance(individual.ilots);
    
    const fitness = 
      this.config.fitnessWeights.spaceUtilization * spaceUtilization +
      this.config.fitnessWeights.accessibility * accessibility +
      this.config.fitnessWeights.corridorEfficiency * corridorEfficiency +
      this.config.fitnessWeights.adaCompliance * adaCompliance;
    
    return fitness;
  }

  private calculateSpaceUtilization(ilots: Ilot[]): number {
    const totalIlotArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    const totalRoomArea = this.rooms.reduce((sum, room) => sum + room.area, 0);
    return Math.min(totalIlotArea / (totalRoomArea * 0.7), 1); // Max 70% utilization
  }

  private calculateAccessibility(ilots: Ilot[]): number {
    // Check if all îlots are accessible via corridors
    const accessibleIlots = ilots.filter(ilot => ilot.accessible);
    return accessibleIlots.length / ilots.length;
  }

  private calculateCorridorEfficiency(ilots: Ilot[]): number {
    // Measure corridor length efficiency (shorter corridors = better)
    if (ilots.length < 2) return 1;
    
    const totalDistance = this.calculateMinimumSpanningTree(ilots);
    const theoreticalOptimal = Math.sqrt(ilots.length) * 5; // Heuristic
    
    return Math.max(0, 1 - (totalDistance / theoreticalOptimal));
  }

  private calculateADACompliance(ilots: Ilot[]): number {
    // Check ADA compliance for îlot spacing and access
    let compliantIlots = 0;
    
    for (const ilot of ilots) {
      if (this.checkADACompliance(ilot)) {
        compliantIlots++;
      }
    }
    
    return compliantIlots / ilots.length;
  }

  private checkADACompliance(ilot: Ilot): boolean {
    // Check if îlot has adequate clearance (minimum 1.2m on at least one side)
    // This is a simplified check
    return ilot.accessible;
  }

  private tournamentSelection(): Individual {
    const tournamentSize = 3;
    let best = this.population[Math.floor(Math.random() * this.population.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = this.population[Math.floor(Math.random() * this.population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    
    return best;
  }

  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    // Single-point crossover on îlots array
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.ilots.length, parent2.ilots.length));
    
    const offspring1: Individual = {
      ilots: [
        ...parent1.ilots.slice(0, crossoverPoint),
        ...parent2.ilots.slice(crossoverPoint)
      ],
      fitness: 0
    };
    
    const offspring2: Individual = {
      ilots: [
        ...parent2.ilots.slice(0, crossoverPoint),
        ...parent1.ilots.slice(crossoverPoint)
      ],
      fitness: 0
    };
    
    return [offspring1, offspring2];
  }

  private mutate(individual: Individual): void {
    if (individual.ilots.length === 0) return;
    
    const mutationIndex = Math.floor(Math.random() * individual.ilots.length);
    const ilot = individual.ilots[mutationIndex];
    
    // Random mutation: small position change
    ilot.position.x += (Math.random() - 0.5) * 2; // ±1m
    ilot.position.y += (Math.random() - 0.5) * 2; // ±1m
    
    // Ensure îlot stays within valid bounds
    // This would need proper validation in a real implementation
  }

  private individualToResult(individual: Individual, generation: number): OptimizationResult {
    const corridors = this.generateCorridors(individual.ilots);
    
    return {
      ilots: individual.ilots,
      corridors,
      metrics: {
        totalIlots: individual.ilots.length,
        totalArea: individual.ilots.reduce((sum, ilot) => sum + ilot.area, 0),
        usedArea: this.calculateUsedArea(individual.ilots),
        spaceUtilization: this.calculateSpaceUtilization(individual.ilots),
        accessibilityCompliance: this.calculateAccessibility(individual.ilots),
        corridorEfficiency: this.calculateCorridorEfficiency(individual.ilots)
      },
      fitness: individual.fitness,
      generation
    };
  }

  private generateCorridors(ilots: Ilot[]): any[] {
    // Generate corridors connecting all îlots using minimum spanning tree
    // Simplified implementation
    return [];
  }

  private calculateUsedArea(ilots: Ilot[]): number {
    return ilots.reduce((sum, ilot) => sum + ilot.area, 0);
  }

  private calculateMinimumSpanningTree(ilots: Ilot[]): number {
    // Simplified MST calculation
    if (ilots.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < ilots.length - 1; i++) {
      const distance = this.calculateDistance(
        ilots[i].position,
        ilots[i + 1].position
      );
      totalDistance += distance;
    }
    
    return totalDistance;
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // Utility geometry functions
  private getPolygonBounds(polygon: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const point of polygon) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
  }

  private pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  private rectangleIntersectsPolygon(position: Point, dimensions: { width: number; height: number }, polygon: Point[]): boolean {
    // Simplified intersection check
    const corners: Point[] = [
      position,
      { x: position.x + dimensions.width, y: position.y },
      { x: position.x + dimensions.width, y: position.y + dimensions.height },
      { x: position.x, y: position.y + dimensions.height }
    ];
    
    // Check if any corner is inside the polygon
    for (const corner of corners) {
      if (this.pointInPolygon(corner, polygon)) {
        return true;
      }
    }
    
    return false;
  }

  private calculatePolygonOverlap(polygon1: Point[], polygon2: Point[]): number {
    // Simplified overlap calculation - in production use proper polygon intersection
    return 0;
  }
}

interface Individual {
  ilots: Ilot[];
  fitness: number;
}

export function optimizeIlotPlacement(
  rooms: Room[],
  restrictedAreas: RestrictedArea[],
  config?: Partial<GeneticAlgorithmConfig>
): Promise<OptimizationResult> {
  const optimizer = new GeneticAlgorithmOptimizer(rooms, restrictedAreas, config);
  return optimizer.optimize();
}
