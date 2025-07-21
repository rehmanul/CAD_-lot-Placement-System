
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
    console.log('Starting real genetic algorithm optimization...');
    console.log(`Floor plan: ${this.floorPlan.bounds.width} x ${this.floorPlan.bounds.height}`);
    console.log(`Walls: ${this.floorPlan.walls.length}, Obstacles: ${this.floorPlan.obstacles.length}`);

    // Initialize population with diverse random solutions
    this.initializePopulation();

    let stagnationCounter = 0;
    let previousBestFitness = 0;

    // Evolution loop with real optimization
    for (let gen = 0; gen < this.optimizationConfig.generations; gen++) {
      this.generation = gen;

      // Evaluate fitness for all individuals with real calculations
      for (const individual of this.population) {
        individual.metrics = this.calculateRealMetrics(individual);
        individual.fitness = this.calculateRealFitness(individual);
      }

      // Sort by fitness (descending)
      this.population.sort((a, b) => b.fitness - a.fitness);

      // Track best fitness with real convergence
      const currentBestFitness = this.population[0].fitness;
      this.bestFitness = currentBestFitness;

      // Check for improvement
      if (Math.abs(currentBestFitness - previousBestFitness) < 0.001) {
        stagnationCounter++;
      } else {
        stagnationCounter = 0;
      }

      // Log real progress
      if (gen % 10 === 0 || stagnationCounter > 0) {
        console.log(`Generation ${gen}: Best fitness = ${this.bestFitness.toFixed(4)} (Space: ${this.population[0].metrics.spaceUtilization.toFixed(3)}, Access: ${this.population[0].metrics.accessibility.toFixed(3)})`);
      }

      // Early termination with realistic conditions
      if (this.bestFitness > 0.9 || stagnationCounter > 20) {
        console.log(`Optimization ${this.bestFitness > 0.9 ? 'converged' : 'stagnated'} at generation ${gen} with fitness ${this.bestFitness.toFixed(4)}`);
        break;
      }

      // Create next generation with real genetic operations
      const newPopulation: Individual[] = [];

      // Elite selection (keep best solutions)
      for (let i = 0; i < this.optimizationConfig.eliteSize; i++) {
        newPopulation.push(this.deepCopyIndividual(this.population[i]));
      }

      // Fill rest with crossover and mutation
      while (newPopulation.length < this.optimizationConfig.populationSize) {
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();

        let offspring = this.realCrossover(parent1, parent2);

        if (Math.random() < this.optimizationConfig.mutationRate) {
          offspring = this.realMutation(offspring);
        }

        newPopulation.push(offspring);
      }

      this.population = newPopulation;
      previousBestFitness = currentBestFitness;
    }

    // Return best real solution
    const bestIndividual = this.population[0];
    const totalIlotArea = bestIndividual.ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    
    console.log(`Real optimization complete. Final fitness: ${bestIndividual.fitness.toFixed(4)}`);
    console.log(`Placed ${bestIndividual.ilots.length} îlots using ${totalIlotArea.toFixed(1)} m²`);

    return {
      ilots: bestIndividual.ilots,
      corridors: bestIndividual.corridors,
      metrics: {
        totalIlots: bestIndividual.ilots.length,
        totalArea: this.floorPlan.bounds.width * this.floorPlan.bounds.height,
        usedArea: totalIlotArea,
        spaceUtilization: bestIndividual.metrics.spaceUtilization,
        accessibilityCompliance: bestIndividual.metrics.accessibility,
        corridorEfficiency: bestIndividual.metrics.corridorEfficiency
      },
      fitness: bestIndividual.fitness,
      generation: this.generation
    };
  }

  private createFloorPlan(cadFile: CADFile): FloorPlan {
    // Extract real geometric data from CAD file
    const walls = cadFile.elements.filter(el => el.type === 'wall' || el.type === 'line');
    const obstacles = cadFile.elements.filter(el => 
      el.type === 'furniture' || el.type === 'room' || el.type === 'rectangle'
    );

    const bounds = {
      x: 0,
      y: 0,
      width: cadFile.dimensions.width || 100,
      height: cadFile.dimensions.height || 80
    };

    console.log(`Creating floor plan with bounds: ${bounds.width} x ${bounds.height}`);

    return {
      bounds,
      walls,
      obstacles,
      entrances: this.findRealEntrances(cadFile.elements),
      restrictedAreas: this.findRealRestrictedAreas(cadFile.elements)
    };
  }

  private findRealEntrances(elements: any[]): { x: number; y: number }[] {
    const doors = elements.filter(el => el.type === 'door');
    
    if (doors.length === 0) {
      // Create default entrances at floor plan edges
      return [
        { x: this.floorPlan?.bounds.width * 0.1 || 10, y: 0 },
        { x: this.floorPlan?.bounds.width * 0.9 || 90, y: 0 }
      ];
    }

    return doors.map(door => ({
      x: door.geometry?.bounds?.x + (door.geometry?.bounds?.width || 0) / 2 || Math.random() * (this.floorPlan?.bounds.width || 100),
      y: door.geometry?.bounds?.y + (door.geometry?.bounds?.height || 0) / 2 || Math.random() * (this.floorPlan?.bounds.height || 80)
    }));
  }

  private findRealRestrictedAreas(elements: any[]): { x: number; y: number; width: number; height: number }[] {
    return elements
      .filter(el => el.type === 'furniture' || el.layer === 'RESTRICTED' || el.type === 'room')
      .map(el => ({
        x: el.geometry?.bounds?.x || 0,
        y: el.geometry?.bounds?.y || 0,
        width: el.geometry?.bounds?.width || 5,
        height: el.geometry?.bounds?.height || 5
      }));
  }

  private initializePopulation(): void {
    this.population = [];

    for (let i = 0; i < this.optimizationConfig.populationSize; i++) {
      const individual = this.createDiverseIndividual(i);
      this.population.push(individual);
    }

    console.log(`Initialized diverse population of ${this.population.length} individuals`);
  }

  private createDiverseIndividual(index: number): Individual {
    const id = nanoid();
    const ilots = this.generateDiverseIlots(index);
    const corridors = this.generateRealCorridorNetwork(ilots);

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

    return individual;
  }

  private generateDiverseIlots(populationIndex: number): Ilot[] {
    const ilots: Ilot[] = [];
    const targetUtilization = 0.3 + (populationIndex / this.optimizationConfig.populationSize) * 0.4; // 30-70% utilization
    
    const totalArea = this.floorPlan.bounds.width * this.floorPlan.bounds.height;
    const targetIlotArea = totalArea * targetUtilization;

    const smallCount = Math.floor(targetIlotArea * this.config.ilotConfig.smallIlots / 100 / 4); // 4m² per small îlot
    const mediumCount = Math.floor(targetIlotArea * this.config.ilotConfig.mediumIlots / 100 / 16); // 16m² per medium îlot  
    const largeCount = Math.floor(targetIlotArea * this.config.ilotConfig.largeIlots / 100 / 36); // 36m² per large îlot

    // Generate îlots with real placement attempts
    let attempts = 0;
    const maxAttempts = 1000;

    // Small îlots
    for (let i = 0; i < smallCount && attempts < maxAttempts; i++) {
      const ilot = this.createRealIlot('small');
      if (ilot && this.isValidRealPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
      attempts++;
    }

    // Medium îlots
    for (let i = 0; i < mediumCount && attempts < maxAttempts; i++) {
      const ilot = this.createRealIlot('medium');
      if (ilot && this.isValidRealPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
      attempts++;
    }

    // Large îlots
    for (let i = 0; i < largeCount && attempts < maxAttempts; i++) {
      const ilot = this.createRealIlot('large');
      if (ilot && this.isValidRealPosition(ilot, ilots)) {
        ilots.push(ilot);
      }
      attempts++;
    }

    return ilots;
  }

  private createRealIlot(size: 'small' | 'medium' | 'large'): Ilot | null {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const dimensions = this.getRealIlotDimensions(size);
      const position = {
        x: Math.random() * Math.max(0, this.floorPlan.bounds.width - dimensions.width),
        y: Math.random() * Math.max(0, this.floorPlan.bounds.height - dimensions.height)
      };

      const ilot: Ilot = {
        id: nanoid(),
        position,
        width: dimensions.width,
        height: dimensions.height,
        area: dimensions.width * dimensions.height,
        size,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
        accessible: true,
        corridorConnections: []
      };

      return ilot;
    }

    return null;
  }

  private getRealIlotDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
    switch (size) {
      case 'small':
        return { 
          width: 1.5 + Math.random() * 1.5,  // 1.5-3m
          height: 1.5 + Math.random() * 1.5
        };
      case 'medium':
        return { 
          width: 3 + Math.random() * 2,      // 3-5m
          height: 3 + Math.random() * 2
        };
      case 'large':
        return { 
          width: 5 + Math.random() * 3,      // 5-8m
          height: 5 + Math.random() * 3
        };
    }
  }

  private isValidRealPosition(ilot: Ilot, existingIlots: Ilot[]): boolean {
    // Real boundary checks
    if (ilot.position.x < 0 || ilot.position.y < 0 ||
        ilot.position.x + ilot.width > this.floorPlan.bounds.width ||
        ilot.position.y + ilot.height > this.floorPlan.bounds.height) {
      return false;
    }

    // Real clearance checks
    const minClearance = this.config.ilotConfig.minClearance || 1.2;
    for (const existing of existingIlots) {
      if (this.hasRealOverlap(ilot, existing, minClearance)) {
        return false;
      }
    }

    // Real obstacle collision checks
    for (const restricted of this.floorPlan.restrictedAreas) {
      if (this.hasRealRectOverlap(ilot, restricted)) {
        return false;
      }
    }

    return true;
  }

  private hasRealOverlap(ilot1: Ilot, ilot2: Ilot, clearance: number): boolean {
    return !(
      ilot1.position.x + ilot1.width + clearance <= ilot2.position.x ||
      ilot2.position.x + ilot2.width + clearance <= ilot1.position.x ||
      ilot1.position.y + ilot1.height + clearance <= ilot2.position.y ||
      ilot2.position.y + ilot2.height + clearance <= ilot1.position.y
    );
  }

  private hasRealRectOverlap(ilot: Ilot, rect: { x: number; y: number; width: number; height: number }): boolean {
    return !(
      ilot.position.x + ilot.width <= rect.x ||
      rect.x + rect.width <= ilot.position.x ||
      ilot.position.y + ilot.height <= rect.y ||
      rect.y + rect.height <= ilot.position.y
    );
  }

  private generateRealCorridorNetwork(ilots: Ilot[]): Corridor[] {
    const corridors: Corridor[] = [];

    if (ilots.length < 2) return corridors;

    // Real minimum spanning tree implementation
    const mst = this.calculateRealMST(ilots);

    for (const edge of mst) {
      const path = this.findRealPath(edge.from, edge.to);
      if (path.length > 0) {
        const corridor: Corridor = {
          id: nanoid(),
          path,
          width: this.config.ilotConfig.corridorWidth,
          connectedIlots: [edge.fromId, edge.toId],
          accessible: this.config.ilotConfig.corridorWidth >= 1.22, // Real ADA compliance
          length: this.calculateRealPathLength(path)
        };

        corridors.push(corridor);

        // Update real îlot connections
        const fromIlot = ilots.find(i => i.id === edge.fromId);
        const toIlot = ilots.find(i => i.id === edge.toId);

        if (fromIlot) fromIlot.corridorConnections.push(corridor.id);
        if (toIlot) toIlot.corridorConnections.push(corridor.id);
      }
    }

    return corridors;
  }

  private calculateRealMST(ilots: Ilot[]): Array<{
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

    // Generate all possible edges with real distances
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

        const realDistance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));

        edges.push({
          from,
          to,
          fromId: ilots[i].id,
          toId: ilots[j].id,
          distance: realDistance
        });
      }
    }

    // Sort by real distance
    edges.sort((a, b) => a.distance - b.distance);

    // Real Kruskal's algorithm implementation
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

  private findRealPath(from: { x: number; y: number }, to: { x: number; y: number }): Array<{ x: number; y: number }> {
    // Simplified A* implementation - create L-shaped path avoiding obstacles
    const midX = from.x + (to.x - from.x) * 0.5;
    const midY = from.y + (to.y - from.y) * 0.5;

    // Check if direct path is clear
    if (this.isPathClear(from, to)) {
      return [from, to];
    }

    // Try L-shaped paths
    const path1 = [from, { x: to.x, y: from.y }, to];
    const path2 = [from, { x: from.x, y: to.y }, to];

    // Choose path with fewer obstacles
    if (this.isPathClear(from, path1[1]) && this.isPathClear(path1[1], to)) {
      return path1;
    } else if (this.isPathClear(from, path2[1]) && this.isPathClear(path2[1], to)) {
      return path2;
    }

    // Fallback to waypoint path
    return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  }

  private isPathClear(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
    // Simple line-rectangle intersection test
    for (const obstacle of this.floorPlan.obstacles) {
      const bounds = obstacle.geometry?.bounds;
      if (bounds && this.lineIntersectsRect(from, to, bounds)) {
        return false;
      }
    }
    return true;
  }

  private lineIntersectsRect(p1: { x: number; y: number }, p2: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }): boolean {
    // Basic line-rectangle intersection
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    return !(p1.x < left && p2.x < left) &&
           !(p1.x > right && p2.x > right) &&
           !(p1.y < top && p2.y < top) &&
           !(p1.y > bottom && p2.y > bottom);
  }

  private calculateRealPathLength(path: Array<{ x: number; y: number }>): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i-1].x;
      const dy = path[i].y - path[i-1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  private calculateRealFitness(individual: Individual): number {
    const metrics = individual.metrics;
    const weights = this.optimizationConfig.fitnessWeights;

    // Real weighted fitness calculation
    const fitness = (
      metrics.spaceUtilization * weights.spaceUtilization +
      metrics.accessibility * weights.accessibility +
      metrics.corridorEfficiency * weights.corridorEfficiency +
      metrics.adaCompliance * weights.adaCompliance
    );

    return Math.max(0, Math.min(1, fitness));
  }

  private calculateRealMetrics(individual: Individual): Individual['metrics'] {
    // Real space utilization calculation
    const totalArea = this.floorPlan.bounds.width * this.floorPlan.bounds.height;
    const usedArea = individual.ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    const spaceUtilization = totalArea > 0 ? Math.min(usedArea / totalArea, 1) : 0;

    // Real accessibility calculation (graph connectivity)
    const accessibility = this.calculateRealAccessibility(individual);

    // Real corridor efficiency
    const corridorEfficiency = this.calculateRealCorridorEfficiency(individual);

    // Real ADA compliance
    const adaCompliance = this.calculateRealADACompliance(individual);

    return {
      spaceUtilization,
      accessibility,
      corridorEfficiency,
      adaCompliance
    };
  }

  private calculateRealAccessibility(individual: Individual): number {
    if (individual.ilots.length === 0) return 1;
    if (this.floorPlan.entrances.length === 0) return 0.5;

    // Real graph traversal to check connectivity
    const graph = new Map<string, Set<string>>();
    
    // Build connectivity graph
    for (const ilot of individual.ilots) {
      graph.set(ilot.id, new Set());
    }

    for (const corridor of individual.corridors) {
      const [id1, id2] = corridor.connectedIlots;
      if (graph.has(id1) && graph.has(id2)) {
        graph.get(id1)!.add(id2);
        graph.get(id2)!.add(id1);
      }
    }

    // Find connected components
    const visited = new Set<string>();
    const components: Set<string>[] = [];

    for (const ilotId of graph.keys()) {
      if (!visited.has(ilotId)) {
        const component = new Set<string>();
        this.dfsVisit(ilotId, graph, visited, component);
        components.push(component);
      }
    }

    // Largest component accessibility
    const largestComponent = Math.max(...components.map(c => c.size));
    return individual.ilots.length > 0 ? largestComponent / individual.ilots.length : 0;
  }

  private dfsVisit(nodeId: string, graph: Map<string, Set<string>>, visited: Set<string>, component: Set<string>): void {
    visited.add(nodeId);
    component.add(nodeId);

    const neighbors = graph.get(nodeId) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfsVisit(neighbor, graph, visited, component);
      }
    }
  }

  private calculateRealCorridorEfficiency(individual: Individual): number {
    if (individual.corridors.length === 0) return 1;

    const totalCorridorLength = individual.corridors.reduce((sum, corridor) => sum + corridor.length, 0);
    const optimalLength = this.calculateOptimalCorridorLength(individual.ilots);

    if (optimalLength === 0) return 1;

    // Efficiency = optimal / actual (penalty for excessive corridor length)
    return Math.min(1, optimalLength / totalCorridorLength);
  }

  private calculateOptimalCorridorLength(ilots: Ilot[]): number {
    if (ilots.length < 2) return 0;

    // MST length as optimal baseline
    const mst = this.calculateRealMST(ilots);
    return mst.reduce((sum, edge) => sum + edge.distance, 0);
  }

  private calculateRealADACompliance(individual: Individual): number {
    if (!this.config.ilotConfig.adaCompliance) return 1;

    const minWidth = 1.22; // Real ADA requirement (4 feet)
    const compliantCorridors = individual.corridors.filter(c => c.width >= minWidth);

    return individual.corridors.length > 0 ? compliantCorridors.length / individual.corridors.length : 1;
  }

  private tournamentSelection(): Individual {
    const tournamentSize = 3;
    const tournament: Individual[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }

    return tournament.reduce((best, current) => current.fitness > best.fitness ? current : best);
  }

  private realCrossover(parent1: Individual, parent2: Individual): Individual {
    // Real genetic crossover: combine spatial regions
    const childIlots: Ilot[] = [];
    
    // Divide space into regions and inherit from different parents
    const midX = this.floorPlan.bounds.width / 2;
    
    // Left side from parent1, right side from parent2
    for (const ilot of parent1.ilots) {
      if (ilot.position.x < midX) {
        childIlots.push({ ...ilot, id: nanoid(), corridorConnections: [] });
      }
    }
    
    for (const ilot of parent2.ilots) {
      if (ilot.position.x >= midX && this.isValidRealPosition(ilot, childIlots)) {
        childIlots.push({ ...ilot, id: nanoid(), corridorConnections: [] });
      }
    }

    const corridors = this.generateRealCorridorNetwork(childIlots);

    return {
      id: nanoid(),
      ilots: childIlots,
      corridors,
      fitness: 0,
      metrics: { spaceUtilization: 0, accessibility: 0, corridorEfficiency: 0, adaCompliance: 0 }
    };
  }

  private realMutation(individual: Individual): Individual {
    const mutatedIlots = [...individual.ilots];

    // Real mutations: position adjustment, size change, or removal/addition
    const mutationType = Math.random();
    
    if (mutationType < 0.5 && mutatedIlots.length > 0) {
      // Position mutation
      const randomIndex = Math.floor(Math.random() * mutatedIlots.length);
      const ilot = { ...mutatedIlots[randomIndex] };

      const maxShift = 5.0; // 5 meter maximum shift
      ilot.position.x += (Math.random() - 0.5) * maxShift;
      ilot.position.y += (Math.random() - 0.5) * maxShift;

      // Keep within bounds
      ilot.position.x = Math.max(0, Math.min(ilot.position.x, this.floorPlan.bounds.width - ilot.width));
      ilot.position.y = Math.max(0, Math.min(ilot.position.y, this.floorPlan.bounds.height - ilot.height));

      mutatedIlots[randomIndex] = ilot;
    } else if (mutationType < 0.8) {
      // Add new îlot
      const newIlot = this.createRealIlot(['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as any);
      if (newIlot && this.isValidRealPosition(newIlot, mutatedIlots)) {
        mutatedIlots.push(newIlot);
      }
    } else if (mutatedIlots.length > 1) {
      // Remove îlot
      const randomIndex = Math.floor(Math.random() * mutatedIlots.length);
      mutatedIlots.splice(randomIndex, 1);
    }

    const validIlots = mutatedIlots.filter(ilot => this.isValidRealPosition(ilot, []));
    const corridors = this.generateRealCorridorNetwork(validIlots);

    return {
      id: nanoid(),
      ilots: validIlots,
      corridors,
      fitness: 0,
      metrics: { spaceUtilization: 0, accessibility: 0, corridorEfficiency: 0, adaCompliance: 0 }
    };
  }

  private deepCopyIndividual(individual: Individual): Individual {
    return {
      id: nanoid(),
      ilots: individual.ilots.map(ilot => ({ 
        ...ilot, 
        id: nanoid(),
        position: { ...ilot.position },
        corridorConnections: []
      })),
      corridors: individual.corridors.map(corridor => ({ 
        ...corridor, 
        id: nanoid(),
        path: corridor.path.map(p => ({ ...p })),
        connectedIlots: [...corridor.connectedIlots]
      })),
      fitness: individual.fitness,
      metrics: { ...individual.metrics }
    };
  }
}

// Real Union-Find implementation for MST
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
    this.parent.set(item, root);
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
