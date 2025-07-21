
import { CADFile, OptimizationResult, Ilot, Corridor } from "@shared/schema";
import { nanoid } from "nanoid";

interface AnalysisConfig {
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
    eliteSize?: number;
    fitnessWeights?: {
      spaceUtilization: number;
      accessibility: number;
      corridorEfficiency: number;
      adaCompliance: number;
    };
  };
}

interface Individual {
  id: string;
  ilots: Ilot[];
  corridors: Corridor[];
  fitness: number;
  metrics: {
    spaceUtilization: number;
    accessibility: number;
    corridorEfficiency: number;
    adaCompliance: number;
  };
}

export async function optimizeLayout(cadFile: CADFile, config: AnalysisConfig): Promise<OptimizationResult> {
  const optimizer = new GeneticAlgorithmOptimizer(cadFile, config);
  return await optimizer.optimize();
}

class GeneticAlgorithmOptimizer {
  private cadFile: CADFile;
  private config: AnalysisConfig;
  private optimizationConfig: Required<AnalysisConfig['optimizationConfig']>;
  private population: Individual[] = [];
  private generation = 0;
  private bestFitness = 0;
  private floorPlan: FloorPlan;

  constructor(cadFile: CADFile, config: AnalysisConfig) {
    this.cadFile = cadFile;
    this.config = config;
    this.optimizationConfig = {
      populationSize: config.optimizationConfig?.populationSize || 50,
      generations: config.optimizationConfig?.generations || 100,
      mutationRate: config.optimizationConfig?.mutationRate || 0.1,
      crossoverRate: config.optimizationConfig?.crossoverRate || 0.8,
      eliteSize: config.optimizationConfig?.eliteSize || 5,
      fitnessWeights: config.optimizationConfig?.fitnessWeights || {
        spaceUtilization: 0.4,
        accessibility: 0.3,
        corridorEfficiency: 0.2,
        adaCompliance: 0.1
      }
    };
    
    this.floorPlan = this.createFloorPlan(cadFile);
  }

  async optimize(): Promise<OptimizationResult> {
    console.log('Starting genetic algorithm optimization...');
    
    // Initialize population
    this.initializePopulation();
    
    // Evolution loop
    for (let gen = 0; gen < this.optimizationConfig.generations; gen++) {
      this.generation = gen;
      
      // Evaluate fitness for all individuals
      for (const individual of this.population) {
        individual.fitness = this.calculateFitness(individual);
      }
      
      // Sort by fitness (descending)
      this.population.sort((a, b) => b.fitness - a.fitness);
      
      // Track best fitness
      this.bestFitness = this.population[0].fitness;
      
      // Log progress periodically
      if (gen % 10 === 0) {
        console.log(`Generation ${gen}: Best fitness = ${this.bestFitness.toFixed(4)}`);
      }
      
      // Early termination if fitness is good enough
      if (this.bestFitness > 0.95) {
        console.log(`Early termination at generation ${gen} with fitness ${this.bestFitness}`);
        break;
      }
      
      // Create next generation
      const newPopulation: Individual[] = [];
      
      // Elite selection
      for (let i = 0; i < this.optimizationConfig.eliteSize; i++) {
        newPopulation.push(this.deepCopyIndividual(this.population[i]));
      }
      
      // Fill rest with crossover and mutation
      while (newPopulation.length < this.optimizationConfig.populationSize) {
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        
        let offspring = this.crossover(parent1, parent2);
        
        if (Math.random() < this.optimizationConfig.mutationRate) {
          offspring = this.mutate(offspring);
        }
        
        newPopulation.push(offspring);
      }
      
      this.population = newPopulation;
    }
    
    // Return best solution
    const bestIndividual = this.population[0];
    console.log(`Optimization complete. Final fitness: ${bestIndividual.fitness.toFixed(4)}`);
    
    return {
      ilots: bestIndividual.ilots,
      corridors: bestIndividual.corridors,
      metrics: {
        totalIlots: bestIndividual.ilots.length,
        totalArea: bestIndividual.ilots.reduce((sum, ilot) => sum + ilot.area, 0),
        usedArea: bestIndividual.ilots.reduce((sum, ilot) => sum + ilot.area, 0),
        spaceUtilization: bestIndividual.metrics.spaceUtilization,
        accessibilityCompliance: bestIndividual.metrics.accessibility,
        corridorEfficiency: bestIndividual.metrics.corridorEfficiency
      },
      fitness: bestIndividual.fitness,
      generation: this.generation
    };
  }

  private createFloorPlan(cadFile: CADFile): FloorPlan {
    const walls = cadFile.elements.filter(el => el.type === 'wall');
    const obstacles = cadFile.elements.filter(el => 
      el.type === 'furniture' || el.type === 'room'
    );
    
    return {
      bounds: {
        x: 0,
        y: 0,
        width: cadFile.dimensions.width,
        height: cadFile.dimensions.height
      },
      walls,
      obstacles,
      entrances: this.findEntrances(cadFile.elements),
      restrictedAreas: this.findRestrictedAreas(cadFile.elements)
    };
  }

  private findEntrances(elements: any[]): { x: number; y: number }[] {
    // Find doors and windows as potential entrances
    return elements
      .filter(el => el.type === 'door' || el.type === 'window')
      .map(el => ({
        x: el.geometry.bounds.x + el.geometry.bounds.width / 2,
        y: el.geometry.bounds.y + el.geometry.bounds.height / 2
      }));
  }

  private findRestrictedAreas(elements: any[]): { x: number; y: number; width: number; height: number }[] {
    // Areas that cannot have îlots placed
    return elements
      .filter(el => el.type === 'furniture' || el.layer === 'RESTRICTED')
      .map(el => el.geometry.bounds);
  }

  private initializePopulation(): void {
    this.population = [];
    
    for (let i = 0; i < this.optimizationConfig.populationSize; i++) {
      const individual = this.createRandomIndividual();
      this.population.push(individual);
    }
    
    console.log(`Initialized population of ${this.population.length} individuals`);
  }

  private createRandomIndividual(): Individual {
    const id = nanoid();
    const ilots = this.generateRandomIlots();
    const corridors = this.generateCorridorNetwork(ilots);
    
    const individual: Individual = {
      id,
      ilots,
      corridors,
      fitness: 0,
      metrics: {
        spaceUtilization: 0,
        accessibility: 0,
        corridorEfficiency: 0,
        adaCompliance: 0
      }
    };
    
    // Calculate metrics
    individual.metrics = this.calculateMetrics(individual);
    
    return individual;
  }

  private generateRandomIlots(): Ilot[] {
    const ilots: Ilot[] = [];
    const totalCount = Math.floor(
      (this.floorPlan.bounds.width * this.floorPlan.bounds.height) / 10000
    );
    
    const smallCount = Math.floor(totalCount * this.config.ilotConfig.smallIlots / 100);
    const mediumCount = Math.floor(totalCount * this.config.ilotConfig.mediumIlots / 100);
    const largeCount = Math.floor(totalCount * this.config.ilotConfig.largeIlots / 100);
    
    // Generate îlots with random valid positions
    for (let i = 0; i < smallCount; i++) {
      const ilot = this.createRandomIlot('small');
      if (ilot && this.isValidIlotPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
    }
    
    for (let i = 0; i < mediumCount; i++) {
      const ilot = this.createRandomIlot('medium');
      if (ilot && this.isValidIlotPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
    }
    
    for (let i = 0; i < largeCount; i++) {
      const ilot = this.createRandomIlot('large');
      if (ilot && this.isValidIlotPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
    }
    
    return ilots;
  }

  private createRandomIlot(size: 'small' | 'medium' | 'large'): Ilot | null {
    const maxAttempts = 50;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const dimensions = this.getIlotDimensions(size);
      const position = {
        x: Math.random() * (this.floorPlan.bounds.width - dimensions.width),
        y: Math.random() * (this.floorPlan.bounds.height - dimensions.height)
      };
      
      const ilot: Ilot = {
        id: nanoid(),
        position,
        width: dimensions.width,
        height: dimensions.height,
        area: dimensions.width * dimensions.height,
        size,
        rotation: Math.floor(Math.random() * 4) * 90,
        accessible: true,
        corridorConnections: []
      };
      
      // Check if position is valid
      if (this.isValidIlotPosition(ilot, [])) {
        return ilot;
      }
      
      attempts++;
    }
    
    return null;
  }

  private getIlotDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
    switch (size) {
      case 'small':
        return { width: 2 + Math.random() * 2, height: 2 + Math.random() * 2 };
      case 'medium':
        return { width: 3 + Math.random() * 3, height: 3 + Math.random() * 3 };
      case 'large':
        return { width: 4 + Math.random() * 4, height: 4 + Math.random() * 4 };
    }
  }

  private isValidIlotPosition(ilot: Ilot, existingIlots: Ilot[]): boolean {
    // Check bounds
    if (ilot.position.x < 0 || ilot.position.y < 0 ||
        ilot.position.x + ilot.width > this.floorPlan.bounds.width ||
        ilot.position.y + ilot.height > this.floorPlan.bounds.height) {
      return false;
    }
    
    // Check overlap with existing îlots
    const minClearance = this.config.ilotConfig.minClearance || 1.2;
    for (const existing of existingIlots) {
      if (this.isOverlapping(ilot, existing, minClearance)) {
        return false;
      }
    }
    
    // Check overlap with restricted areas
    for (const restricted of this.floorPlan.restrictedAreas) {
      if (this.isOverlappingRect(ilot, restricted)) {
        return false;
      }
    }
    
    return true;
  }

  private isOverlapping(ilot1: Ilot, ilot2: Ilot, clearance: number): boolean {
    return !(
      ilot1.position.x + ilot1.width + clearance <= ilot2.position.x ||
      ilot2.position.x + ilot2.width + clearance <= ilot1.position.x ||
      ilot1.position.y + ilot1.height + clearance <= ilot2.position.y ||
      ilot2.position.y + ilot2.height + clearance <= ilot1.position.y
    );
  }

  private isOverlappingRect(ilot: Ilot, rect: { x: number; y: number; width: number; height: number }): boolean {
    return !(
      ilot.position.x + ilot.width <= rect.x ||
      rect.x + rect.width <= ilot.position.x ||
      ilot.position.y + ilot.height <= rect.y ||
      rect.y + rect.height <= ilot.position.y
    );
  }

  private generateCorridorNetwork(ilots: Ilot[]): Corridor[] {
    const corridors: Corridor[] = [];
    
    if (ilots.length < 2) return corridors;
    
    // Use minimum spanning tree to connect all îlots
    const mst = this.calculateMST(ilots);
    
    for (const edge of mst) {
      const path = this.findPath(edge.from, edge.to);
      if (path.length > 0) {
        const corridor: Corridor = {
          id: nanoid(),
          path,
          width: this.config.ilotConfig.corridorWidth,
          connectedIlots: [edge.fromId, edge.toId],
          accessible: true,
          length: this.calculatePathLength(path)
        };
        
        corridors.push(corridor);
        
        // Update îlot connections
        const fromIlot = ilots.find(i => i.id === edge.fromId);
        const toIlot = ilots.find(i => i.id === edge.toId);
        
        if (fromIlot) fromIlot.corridorConnections.push(corridor.id);
        if (toIlot) toIlot.corridorConnections.push(corridor.id);
      }
    }
    
    return corridors;
  }

  private calculateMST(ilots: Ilot[]): Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    fromId: string;
    toId: string;
    distance: number;
  }> {
    const edges: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      fromId: string;
      toId: string;
      distance: number;
    }> = [];
    
    // Generate all possible edges
    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const from = {
          x: ilots[i].position.x + ilots[i].width / 2,
          y: ilots[i].position.y + ilots[i].height / 2
        };
        const to = {
          x: ilots[j].position.x + ilots[j].width / 2,
          y: ilots[j].position.y + ilots[j].height / 2
        };
        
        edges.push({
          from,
          to,
          fromId: ilots[i].id,
          toId: ilots[j].id,
          distance: Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))
        });
      }
    }
    
    // Sort by distance
    edges.sort((a, b) => a.distance - b.distance);
    
    // Kruskal's algorithm
    const mst: typeof edges = [];
    const unionFind = new UnionFind(ilots.map(i => i.id));
    
    for (const edge of edges) {
      if (!unionFind.connected(edge.fromId, edge.toId)) {
        unionFind.union(edge.fromId, edge.toId);
        mst.push(edge);
        
        if (mst.length === ilots.length - 1) break;
      }
    }
    
    return mst;
  }

  private findPath(from: { x: number; y: number }, to: { x: number; y: number }): Array<{ x: number; y: number }> {
    // Simple path generation - in production, use A* pathfinding
    return [
      from,
      { x: (from.x + to.x) / 2, y: from.y },
      { x: (from.x + to.x) / 2, y: to.y },
      to
    ];
  }

  private calculatePathLength(path: Array<{ x: number; y: number }>): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i-1].x;
      const dy = path[i].y - path[i-1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  private calculateFitness(individual: Individual): number {
    const metrics = individual.metrics;
    const weights = this.optimizationConfig.fitnessWeights;
    
    return (
      metrics.spaceUtilization * weights.spaceUtilization +
      metrics.accessibility * weights.accessibility +
      metrics.corridorEfficiency * weights.corridorEfficiency +
      metrics.adaCompliance * weights.adaCompliance
    );
  }

  private calculateMetrics(individual: Individual): Individual['metrics'] {
    const totalArea = this.floorPlan.bounds.width * this.floorPlan.bounds.height;
    const usedArea = individual.ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    
    const spaceUtilization = Math.min(usedArea / totalArea, 1);
    
    // Calculate accessibility (all îlots connected to entrances)
    const accessibility = this.calculateAccessibility(individual);
    
    // Calculate corridor efficiency (minimize total corridor length)
    const totalCorridorLength = individual.corridors.reduce((sum, corridor) => sum + corridor.length, 0);
    const optimalCorridorLength = this.calculateOptimalCorridorLength(individual.ilots);
    const corridorEfficiency = optimalCorridorLength > 0 ? 
      Math.max(0, 1 - (totalCorridorLength - optimalCorridorLength) / optimalCorridorLength) : 1;
    
    // Calculate ADA compliance
    const adaCompliance = this.calculateADACompliance(individual);
    
    return {
      spaceUtilization,
      accessibility,
      corridorEfficiency,
      adaCompliance
    };
  }

  private calculateAccessibility(individual: Individual): number {
    // Check if all îlots are reachable from entrances
    if (this.floorPlan.entrances.length === 0) return 1; // No entrances defined
    
    const reachableIlots = new Set<string>();
    
    // Simple reachability check - in production, use graph traversal
    for (const ilot of individual.ilots) {
      if (ilot.corridorConnections.length > 0) {
        reachableIlots.add(ilot.id);
      }
    }
    
    return individual.ilots.length > 0 ? reachableIlots.size / individual.ilots.length : 1;
  }

  private calculateOptimalCorridorLength(ilots: Ilot[]): number {
    if (ilots.length < 2) return 0;
    
    // Estimate optimal corridor length based on îlot positions
    const centers = ilots.map(ilot => ({
      x: ilot.position.x + ilot.width / 2,
      y: ilot.position.y + ilot.height / 2
    }));
    
    let totalDistance = 0;
    for (let i = 0; i < centers.length - 1; i++) {
      const dx = centers[i + 1].x - centers[i].x;
      const dy = centers[i + 1].y - centers[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalDistance;
  }

  private calculateADACompliance(individual: Individual): number {
    if (!this.config.ilotConfig.adaCompliance) return 1;
    
    const minCorridorWidth = 1.22; // ADA minimum
    const compliantCorridors = individual.corridors.filter(
      corridor => corridor.width >= minCorridorWidth
    );
    
    return individual.corridors.length > 0 ? 
      compliantCorridors.length / individual.corridors.length : 1;
  }

  private tournamentSelection(): Individual {
    const tournamentSize = 3;
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(parent1: Individual, parent2: Individual): Individual {
    // Single-point crossover on îlot positions
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.ilots.length, parent2.ilots.length));
    
    const ilots = [
      ...parent1.ilots.slice(0, crossoverPoint),
      ...parent2.ilots.slice(crossoverPoint)
    ];
    
    // Remove duplicates and ensure valid positions
    const validIlots = this.filterValidIlots(ilots);
    const corridors = this.generateCorridorNetwork(validIlots);
    
    const offspring: Individual = {
      id: nanoid(),
      ilots: validIlots,
      corridors,
      fitness: 0,
      metrics: {
        spaceUtilization: 0,
        accessibility: 0,
        corridorEfficiency: 0,
        adaCompliance: 0
      }
    };
    
    offspring.metrics = this.calculateMetrics(offspring);
    return offspring;
  }

  private mutate(individual: Individual): Individual {
    const mutatedIlots = [...individual.ilots];
    
    // Mutate a random îlot position
    if (mutatedIlots.length > 0) {
      const randomIndex = Math.floor(Math.random() * mutatedIlots.length);
      const ilot = { ...mutatedIlots[randomIndex] };
      
      // Small random position change
      ilot.position.x += (Math.random() - 0.5) * 20;
      ilot.position.y += (Math.random() - 0.5) * 20;
      
      // Ensure still within bounds
      ilot.position.x = Math.max(0, Math.min(ilot.position.x, this.floorPlan.bounds.width - ilot.width));
      ilot.position.y = Math.max(0, Math.min(ilot.position.y, this.floorPlan.bounds.height - ilot.height));
      
      mutatedIlots[randomIndex] = ilot;
    }
    
    const validIlots = this.filterValidIlots(mutatedIlots);
    const corridors = this.generateCorridorNetwork(validIlots);
    
    const mutated: Individual = {
      id: nanoid(),
      ilots: validIlots,
      corridors,
      fitness: 0,
      metrics: {
        spaceUtilization: 0,
        accessibility: 0,
        corridorEfficiency: 0,
        adaCompliance: 0
      }
    };
    
    mutated.metrics = this.calculateMetrics(mutated);
    return mutated;
  }

  private filterValidIlots(ilots: Ilot[]): Ilot[] {
    const valid: Ilot[] = [];
    
    for (const ilot of ilots) {
      if (this.isValidIlotPosition(ilot, valid)) {
        valid.push(ilot);
      }
    }
    
    return valid;
  }

  private deepCopyIndividual(individual: Individual): Individual {
    return {
      id: nanoid(),
      ilots: individual.ilots.map(ilot => ({ ...ilot, corridorConnections: [...ilot.corridorConnections] })),
      corridors: individual.corridors.map(corridor => ({ ...corridor, path: [...corridor.path], connectedIlots: [...corridor.connectedIlots] })),
      fitness: individual.fitness,
      metrics: { ...individual.metrics }
    };
  }
}

// Union-Find data structure for MST algorithm
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  constructor(items: string[]) {
    for (const item of items) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
    }
  }

  find(item: string): string {
    const parent = this.parent.get(item);
    if (!parent || parent === item) {
      return item;
    }
    
    const root = this.find(parent);
    this.parent.set(item, root); // Path compression
    return root;
  }

  union(item1: string, item2: string): void {
    const root1 = this.find(item1);
    const root2 = this.find(item2);
    
    if (root1 === root2) return;
    
    const rank1 = this.rank.get(root1) || 0;
    const rank2 = this.rank.get(root2) || 0;
    
    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }
  }

  connected(item1: string, item2: string): boolean {
    return this.find(item1) === this.find(item2);
  }
}

interface FloorPlan {
  bounds: { x: number; y: number; width: number; height: number };
  walls: any[];
  obstacles: any[];
  entrances: { x: number; y: number }[];
  restrictedAreas: { x: number; y: number; width: number; height: number }[];
}
