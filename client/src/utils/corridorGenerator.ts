export interface Point {
  x: number;
  y: number;
}

export interface PathNode {
  point: Point;
  g: number; // actual cost from start
  h: number; // heuristic cost to goal
  f: number; // total cost (g + h)
  parent?: PathNode;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CorridorPath {
  points: Point[];
  length: number;
  width: number;
}

export class AStarPathfinder {
  private gridSize: number;
  private bounds: { width: number; height: number };
  private obstacles: Obstacle[];
  private grid: boolean[][]; // true = walkable, false = blocked

  constructor(bounds: { width: number; height: number }, obstacles: Obstacle[], gridSize: number = 0.5) {
    this.gridSize = gridSize;
    this.bounds = bounds;
    this.obstacles = obstacles;
    this.initializeGrid();
  }

  private initializeGrid(): void {
    const cols = Math.ceil(this.bounds.width / this.gridSize);
    const rows = Math.ceil(this.bounds.height / this.gridSize);

    // Initialize all cells as walkable
    this.grid = Array(rows).fill(null).map(() => Array(cols).fill(true));

    // Mark obstacle cells as blocked
    for (const obstacle of this.obstacles) {
      const startCol = Math.floor(obstacle.x / this.gridSize);
      const endCol = Math.ceil((obstacle.x + obstacle.width) / this.gridSize);
      const startRow = Math.floor(obstacle.y / this.gridSize);
      const endRow = Math.ceil((obstacle.y + obstacle.height) / this.gridSize);

      for (let row = startRow; row < endRow && row < this.grid.length; row++) {
        for (let col = startCol; col < endCol && col < this.grid[0].length; col++) {
          if (row >= 0 && col >= 0) {
            this.grid[row][col] = false;
          }
        }
      }
    }
  }

  public findPath(start: Point, goal: Point, corridorWidth: number): CorridorPath | null {
    const startGrid = this.worldToGrid(start);
    const goalGrid = this.worldToGrid(goal);

    if (!this.isValidGridPoint(startGrid) || !this.isValidGridPoint(goalGrid)) {
      return null;
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const startNode: PathNode = {
      point: startGrid,
      g: 0,
      h: this.heuristic(startGrid, goalGrid),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f cost
      openSet.sort((a, b) => a.f - b.f);
      const currentNode = openSet.shift()!;

      const currentKey = `${currentNode.point.x},${currentNode.point.y}`;
      closedSet.add(currentKey);

      // Check if we reached the goal
      if (this.distance(currentNode.point, goalGrid) < 1.5) {
        return this.reconstructPath(currentNode, corridorWidth);
      }

      // Explore neighbors
      const neighbors = this.getNeighbors(currentNode.point);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey) || !this.isWalkableWithWidth(neighbor, corridorWidth)) {
          continue;
        }

        const g = currentNode.g + this.distance(currentNode.point, neighbor);
        const h = this.heuristic(neighbor, goalGrid);
        const f = g + h;

        // Check if this path to neighbor is better
        const existingNode = openSet.find(n => 
          n.point.x === neighbor.x && n.point.y === neighbor.y
        );

        if (!existingNode) {
          openSet.push({
            point: neighbor,
            g,
            h,
            f,
            parent: currentNode
          });
        } else if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = g + existingNode.h;
          existingNode.parent = currentNode;
        }
      }
    }

    // No path found, return straight line as fallback
    return {
      points: [start, goal],
      length: this.distance(start, goal),
      width: corridorWidth
    };
  }

  private worldToGrid(point: Point): Point {
    return {
      x: Math.floor(point.x / this.gridSize),
      y: Math.floor(point.y / this.gridSize)
    };
  }

  private gridToWorld(point: Point): Point {
    return {
      x: point.x * this.gridSize + this.gridSize / 2,
      y: point.y * this.gridSize + this.gridSize / 2
    };
  }

  private isValidGridPoint(point: Point): boolean {
    return point.x >= 0 && point.x < this.grid[0].length &&
           point.y >= 0 && point.y < this.grid.length;
  }

  private isWalkableWithWidth(gridPoint: Point, corridorWidth: number): boolean {
    const widthInCells = Math.ceil(corridorWidth / this.gridSize);
    const halfWidth = Math.floor(widthInCells / 2);

    // Check if corridor width fits at this position
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dy = -halfWidth; dy <= halfWidth; dy++) {
        const checkPoint = {
          x: gridPoint.x + dx,
          y: gridPoint.y + dy
        };

        if (!this.isValidGridPoint(checkPoint) || !this.grid[checkPoint.y][checkPoint.x]) {
          return false;
        }
      }
    }

    return true;
  }

  private heuristic(a: Point, b: Point): number {
    // Manhattan distance for grid-based pathfinding
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private distance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];

    // 8-directional movement
    const directions = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                    { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
    ];

    for (const dir of directions) {
      const neighbor = {
        x: point.x + dir.x,
        y: point.y + dir.y
      };

      if (this.isValidGridPoint(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  private reconstructPath(goalNode: PathNode, corridorWidth: number): CorridorPath {
    const gridPath: Point[] = [];
    let currentNode: PathNode | undefined = goalNode;

    // Trace back through parents
    while (currentNode) {
      gridPath.unshift(currentNode.point);
      currentNode = currentNode.parent;
    }

    // Convert grid path to world coordinates
    const worldPath = gridPath.map(p => this.gridToWorld(p));

    // Smooth the path by removing unnecessary waypoints
    const smoothPath = this.smoothPath(worldPath);

    // Calculate total length
    let totalLength = 0;
    for (let i = 1; i < smoothPath.length; i++) {
      totalLength += this.distance(smoothPath[i - 1], smoothPath[i]);
    }

    return {
      points: smoothPath,
      length: totalLength,
      width: corridorWidth
    };
  }

  private smoothPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const smoothed: Point[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = smoothed[smoothed.length - 1];
      const current = path[i];
      const next = path[i + 1];

      // Check if we can skip current point by going directly from prev to next
      if (!this.isDirectPathClear(prev, next)) {
        smoothed.push(current);
      }
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  private isDirectPathClear(start: Point, end: Point): boolean {
    const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));

    for (let i = 0; i <= steps; i++) {
      const t = steps > 0 ? i / steps : 0;
      const point = {
        x: Math.floor(start.x + (end.x - start.x) * t),
        y: Math.floor(start.y + (end.y - start.y) * t)
      };

      const gridPoint = this.worldToGrid(point);
      if (!this.isValidGridPoint(gridPoint) || !this.grid[gridPoint.y][gridPoint.x]) {
        return false;
      }
    }

    return true;
  }
}

// Real corridor generation functions
export function generateCorridorNetwork(
  ilots: Array<{ id: string; position: Point; width: number; height: number }>,
  obstacles: Obstacle[],
  bounds: { width: number; height: number },
  corridorWidth: number
): Array<{ 
  id: string; 
  path: Point[]; 
  width: number; 
  connectedIlots: string[]; 
  length: number;
  accessible: boolean;
}> {
  const pathfinder = new AStarPathfinder(bounds, obstacles, 0.5);
  const corridors: Array<{ 
    id: string; 
    path: Point[]; 
    width: number; 
    connectedIlots: string[]; 
    length: number;
    accessible: boolean;
  }> = [];

  if (ilots.length < 2) return corridors;

  // Calculate minimum spanning tree for optimal connectivity
  const edges = calculateMST(ilots);

  for (const edge of edges) {
    const startPoint = {
      x: edge.from.position.x + edge.from.width / 2,
      y: edge.from.position.y + edge.from.height / 2
    };

    const endPoint = {
      x: edge.to.position.x + edge.to.width / 2,
      y: edge.to.position.y + edge.to.height / 2
    };

    const corridorPath = pathfinder.findPath(startPoint, endPoint, corridorWidth);

    if (corridorPath) {
      corridors.push({
        id: `corridor_${edge.from.id}_${edge.to.id}`,
        path: corridorPath.points,
        width: corridorWidth,
        connectedIlots: [edge.from.id, edge.to.id],
        length: corridorPath.length,
        accessible: corridorWidth >= 1.22 // ADA compliance
      });
    }
  }

  return corridors;
}

function calculateMST(ilots: Array<{ id: string; position: Point; width: number; height: number }>): Array<{
  from: { id: string; position: Point; width: number; height: number };
  to: { id: string; position: Point; width: number; height: number };
  distance: number;
}> {
  const edges: Array<{
    from: { id: string; position: Point; width: number; height: number };
    to: { id: string; position: Point; width: number; height: number };
    distance: number;
  }> = [];

  // Generate all possible edges
  for (let i = 0; i < ilots.length; i++) {
    for (let j = i + 1; j < ilots.length; j++) {
      const ilot1 = ilots[i];
      const ilot2 = ilots[j];

      const center1 = {
        x: ilot1.position.x + ilot1.width / 2,
        y: ilot1.position.y + ilot1.height / 2
      };

      const center2 = {
        x: ilot2.position.x + ilot2.width / 2,
        y: ilot2.position.y + ilot2.height / 2
      };

      const distance = Math.sqrt(
        Math.pow(center2.x - center1.x, 2) + 
        Math.pow(center2.y - center1.y, 2)
      );

      edges.push({ from: ilot1, to: ilot2, distance });
    }
  }

  // Sort by distance
  edges.sort((a, b) => a.distance - b.distance);

  // Kruskal's algorithm with Union-Find
  const mst: typeof edges = [];
  const unionFind = new Map<string, string>();

  // Initialize Union-Find
  for (const ilot of ilots) {
    unionFind.set(ilot.id, ilot.id);
  }

  function find(id: string): string {
    const parent = unionFind.get(id);
    if (!parent || parent === id) return id;
    const root = find(parent);
    unionFind.set(id, root);
    return root;
  }

  function union(id1: string, id2: string): boolean {
    const root1 = find(id1);
    const root2 = find(id2);

    if (root1 === root2) return false;

    unionFind.set(root1, root2);
    return true;
  }

  // Build MST
  for (const edge of edges) {
    if (union(edge.from.id, edge.to.id)) {
      mst.push(edge);
      if (mst.length === ilots.length - 1) break;
    }
  }

  return mst;
}

export function optimizeCorridorPath(
  path: Point[],
  obstacles: Obstacle[],
  corridorWidth: number
): Point[] {
  if (path.length <= 2) return path;

  const optimized: Point[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const current = path[i];
    const prev = optimized[optimized.length - 1];
    const next = path[i + 1];

    // Check if we can skip this waypoint
    if (!canSkipWaypoint(prev, current, next, obstacles, corridorWidth)) {
      optimized.push(current);
    }
  }

  optimized.push(path[path.length - 1]);
  return optimized;
}

function canSkipWaypoint(
  prev: Point,
  current: Point,
  next: Point,
  obstacles: Obstacle[],
  corridorWidth: number
): boolean {
  // Check if direct path from prev to next is clear
  const steps = 50;
  const halfWidth = corridorWidth / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = {
      x: prev.x + (next.x - prev.x) * t,
      y: prev.y + (next.y - prev.y) * t
    };

    // Check if corridor area at this point collides with obstacles
    for (const obstacle of obstacles) {
      if (circleRectIntersection(point, halfWidth, obstacle)) {
        return false;
      }
    }
  }

  return true;
}

function circleRectIntersection(
  center: Point,
  radius: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const closestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));

  const dx = center.x - closestX;
  const dy = center.y - closestY;

  return (dx * dx + dy * dy) <= (radius * radius);
}