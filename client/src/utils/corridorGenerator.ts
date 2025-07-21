import { Point, Corridor, Ilot } from "@/types/analysis";

export class AStarPathfinder {
  private grid: Grid;
  private openSet: Node[] = [];
  private closedSet: Set<string> = new Set();

  constructor(
    private width: number,
    private height: number,
    private cellSize: number = 0.5 // 0.5m grid resolution
  ) {
    this.grid = new Grid(width, height, cellSize);
  }

  public addObstacle(x: number, y: number, width: number, height: number): void {
    this.grid.addObstacle(x, y, width, height);
  }

  public findPath(start: Point, end: Point, corridorWidth: number = 1.2): Point[] {
    const startNode = this.grid.getNode(start.x, start.y);
    const endNode = this.grid.getNode(end.x, end.y);

    if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
      return [];
    }

    this.openSet = [startNode];
    this.closedSet = new Set();

    startNode.gCost = 0;
    startNode.hCost = this.getDistance(startNode, endNode);
    startNode.fCost = startNode.gCost + startNode.hCost;

    while (this.openSet.length > 0) {
      // Get node with lowest fCost
      let currentNode = this.openSet[0];
      for (let i = 1; i < this.openSet.length; i++) {
        if (this.openSet[i].fCost < currentNode.fCost ||
            (this.openSet[i].fCost === currentNode.fCost && this.openSet[i].hCost < currentNode.hCost)) {
          currentNode = this.openSet[i];
        }
      }

      this.openSet.splice(this.openSet.indexOf(currentNode), 1);
      this.closedSet.add(`${currentNode.gridX},${currentNode.gridY}`);

      if (currentNode === endNode) {
        return this.retracePath(startNode, endNode);
      }

      const neighbors = this.grid.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        if (!neighbor.walkable || this.closedSet.has(`${neighbor.gridX},${neighbor.gridY}`)) {
          continue;
        }

        const newCostToNeighbor = currentNode.gCost + this.getDistance(currentNode, neighbor);
        if (newCostToNeighbor < neighbor.gCost || !this.openSet.includes(neighbor)) {
          neighbor.gCost = newCostToNeighbor;
          neighbor.hCost = this.getDistance(neighbor, endNode);
          neighbor.fCost = neighbor.gCost + neighbor.hCost;
          neighbor.parent = currentNode;

          if (!this.openSet.includes(neighbor)) {
            this.openSet.push(neighbor);
          }
        }
      }
    }

    return []; // No path found
  }

  private getDistance(nodeA: Node, nodeB: Node): number {
    const dstX = Math.abs(nodeA.gridX - nodeB.gridX);
    const dstY = Math.abs(nodeA.gridY - nodeB.gridY);

    if (dstX > dstY) {
      return 14 * dstY + 10 * (dstX - dstY);
    }
    return 14 * dstX + 10 * (dstY - dstX);
  }

  private retracePath(startNode: Node, endNode: Node): Point[] {
    const path: Point[] = [];
    let currentNode: Node | null = endNode;

    while (currentNode !== startNode && currentNode !== null) {
      path.unshift({
        x: currentNode.worldX,
        y: currentNode.worldY
      });
      currentNode = currentNode.parent;
    }

    path.unshift({
      x: startNode.worldX,
      y: startNode.worldY
    });

    return this.smoothPath(path);
  }

  private smoothPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const smoothedPath: Point[] = [path[0]];
    let currentIndex = 0;

    while (currentIndex < path.length - 1) {
      let nextIndex = currentIndex + 1;

      // Find the furthest point we can reach directly
      for (let i = currentIndex + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[currentIndex], path[i])) {
          nextIndex = i;
        } else {
          break;
        }
      }

      smoothedPath.push(path[nextIndex]);
      currentIndex = nextIndex;
    }

    return smoothedPath;
  }

  private hasLineOfSight(from: Point, to: Point): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const x0 = from.x;
    const y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;

    const xIncrement = x1 > x0 ? 1 : -1;
    const yIncrement = y1 > y0 ? 1 : -1;

    let error = dx - dy;
    let x = Math.floor(x0 / this.cellSize);
    let y = Math.floor(y0 / this.cellSize);

    const targetX = Math.floor(x1 / this.cellSize);
    const targetY = Math.floor(y1 / this.cellSize);

    while (x !== targetX || y !== targetY) {
      const node = this.grid.nodes[x]?.[y];
      if (!node || !node.walkable) {
        return false;
      }

      const error2 = 2 * error;
      if (error2 > -dy) {
        error -= dy;
        x += xIncrement;
      }
      if (error2 < dx) {
        error += dx;
        y += yIncrement;
      }
    }

    return true;
  }
}

class Grid {
  public nodes: Node[][];
  private cellSize: number;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);

    this.nodes = [];
    for (let x = 0; x < gridWidth; x++) {
      this.nodes[x] = [];
      for (let y = 0; y < gridHeight; y++) {
        this.nodes[x][y] = new Node(
          true,
          x * cellSize,
          y * cellSize,
          x,
          y
        );
      }
    }
  }

  public getNode(worldX: number, worldY: number): Node | null {
    const gridX = Math.floor(worldX / this.cellSize);
    const gridY = Math.floor(worldY / this.cellSize);

    return this.nodes[gridX]?.[gridY] || null;
  }

  public addObstacle(x: number, y: number, width: number, height: number): void {
    const startX = Math.floor(x / this.cellSize);
    const endX = Math.ceil((x + width) / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endY = Math.ceil((y + height) / this.cellSize);

    for (let gridX = startX; gridX < endX && gridX < this.nodes.length; gridX++) {
      for (let gridY = startY; gridY < endY && gridY < this.nodes[gridX].length; gridY++) {
        if (this.nodes[gridX][gridY]) {
          this.nodes[gridX][gridY].walkable = false;
        }
      }
    }
  }

  public getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (x === 0 && y === 0) continue;

        const checkX = node.gridX + x;
        const checkY = node.gridY + y;

        if (checkX >= 0 && checkX < this.nodes.length &&
            checkY >= 0 && checkY < this.nodes[0].length) {
          neighbors.push(this.nodes[checkX][checkY]);
        }
      }
    }

    return neighbors;
  }
}

class Node {
  public walkable: boolean;
  public worldX: number;
  public worldY: number;
  public gridX: number;
  public gridY: number;
  public gCost: number = 0;
  public hCost: number = 0;
  public fCost: number = 0;
  public parent: Node | null = null;

  constructor(
    walkable: boolean,
    worldX: number,
    worldY: number,
    gridX: number,
    gridY: number
  ) {
    this.walkable = walkable;
    this.worldX = worldX;
    this.worldY = worldY;
    this.gridX = gridX;
    this.gridY = gridY;
  }
}

export class CorridorNetworkGenerator {
  private pathfinder: AStarPathfinder;
  private corridors: Corridor[] = [];

  constructor(
    private floorWidth: number,
    private floorHeight: number,
    private corridorWidth: number = 1.2
  ) {
    this.pathfinder = new AStarPathfinder(floorWidth, floorHeight);
  }

  public addObstacles(walls: any[], restrictedAreas: any[]): void {
    // Add walls as obstacles
    for (const wall of walls) {
      this.pathfinder.addObstacle(
        Math.min(wall.start.x, wall.end.x) - wall.thickness / 2,
        Math.min(wall.start.y, wall.end.y) - wall.thickness / 2,
        Math.abs(wall.end.x - wall.start.x) + wall.thickness,
        Math.abs(wall.end.y - wall.start.y) + wall.thickness
      );
    }

    // Add restricted areas as obstacles
    for (const area of restrictedAreas) {
      const bounds = this.getPolygonBounds(area.boundary);
      this.pathfinder.addObstacle(
        bounds.minX,
        bounds.minY,
        bounds.maxX - bounds.minX,
        bounds.maxY - bounds.minY
      );
    }
  }

  public generateCorridors(ilots: Ilot[]): Corridor[] {
    if (ilots.length < 2) return [];

    this.corridors = [];

    // 1. Detect rows of islands facing each other
    const facingRows = this.detectFacingRows(ilots);
    
    // 2. Generate corridors between facing rows
    for (const rowPair of facingRows) {
      const corridor = this.createCorridorBetweenRows(rowPair.row1, rowPair.row2);
      if (corridor) {
        this.corridors.push(corridor);
      }
    }

    // 3. Connect remaining isolated îlots using optimized pathfinding
    const connectedIlots = new Set<string>();
    for (const corridor of this.corridors) {
      corridor.connectedIlots.forEach(id => connectedIlots.add(id));
    }

    const unconnectedIlots = ilots.filter(ilot => !connectedIlots.has(ilot.id));
    if (unconnectedIlots.length > 0) {
      const connectionCorridors = this.connectRemainingIlots(unconnectedIlots, ilots);
      this.corridors.push(...connectionCorridors);
    }

    return this.corridors;
  }

  private detectFacingRows(ilots: Ilot[]): Array<{ row1: Ilot[]; row2: Ilot[]; axis: 'horizontal' | 'vertical' }> {
    const facingRows: Array<{ row1: Ilot[]; row2: Ilot[]; axis: 'horizontal' | 'vertical' }> = [];
    
    // Group îlots by rows (horizontal and vertical alignment)
    const horizontalRows = this.groupIlotsByHorizontalAlignment(ilots);
    const verticalRows = this.groupIlotsByVerticalAlignment(ilots);

    // Check for horizontal facing rows (rows aligned vertically, facing horizontally)
    for (let i = 0; i < horizontalRows.length; i++) {
      for (let j = i + 1; j < horizontalRows.length; j++) {
        const row1 = horizontalRows[i];
        const row2 = horizontalRows[j];
        
        if (this.areRowsFacing(row1, row2, 'horizontal')) {
          facingRows.push({ row1, row2, axis: 'horizontal' });
        }
      }
    }

    // Check for vertical facing rows (rows aligned horizontally, facing vertically)
    for (let i = 0; i < verticalRows.length; i++) {
      for (let j = i + 1; j < verticalRows.length; j++) {
        const row1 = verticalRows[i];
        const row2 = verticalRows[j];
        
        if (this.areRowsFacing(row1, row2, 'vertical')) {
          facingRows.push({ row1, row2, axis: 'vertical' });
        }
      }
    }

    return facingRows;
  }

  private groupIlotsByHorizontalAlignment(ilots: Ilot[]): Ilot[][] {
    const tolerance = 0.5; // 50cm tolerance for alignment
    const rows: Ilot[][] = [];

    for (const ilot of ilots) {
      const centerY = ilot.position.y + ilot.height / 2;
      
      // Find existing row with similar Y coordinate
      let foundRow = false;
      for (const row of rows) {
        const rowCenterY = row[0].position.y + row[0].height / 2;
        if (Math.abs(centerY - rowCenterY) <= tolerance) {
          row.push(ilot);
          foundRow = true;
          break;
        }
      }
      
      if (!foundRow) {
        rows.push([ilot]);
      }
    }

    // Filter out single-îlot rows and sort by X position
    return rows
      .filter(row => row.length >= 2)
      .map(row => row.sort((a, b) => a.position.x - b.position.x));
  }

  private groupIlotsByVerticalAlignment(ilots: Ilot[]): Ilot[][] {
    const tolerance = 0.5; // 50cm tolerance for alignment
    const rows: Ilot[][] = [];

    for (const ilot of ilots) {
      const centerX = ilot.position.x + ilot.width / 2;
      
      // Find existing column with similar X coordinate
      let foundRow = false;
      for (const row of rows) {
        const rowCenterX = row[0].position.x + row[0].width / 2;
        if (Math.abs(centerX - rowCenterX) <= tolerance) {
          row.push(ilot);
          foundRow = true;
          break;
        }
      }
      
      if (!foundRow) {
        rows.push([ilot]);
      }
    }

    // Filter out single-îlot rows and sort by Y position
    return rows
      .filter(row => row.length >= 2)
      .map(row => row.sort((a, b) => a.position.y - b.position.y));
  }

  private areRowsFacing(row1: Ilot[], row2: Ilot[], axis: 'horizontal' | 'vertical'): boolean {
    const minGap = this.corridorWidth + 0.2; // Minimum gap for corridor + clearance
    const maxGap = 8.0; // Maximum gap to consider as "facing"

    if (axis === 'horizontal') {
      // Check if rows are horizontally separated
      const row1MinY = Math.min(...row1.map(ilot => ilot.position.y));
      const row1MaxY = Math.max(...row1.map(ilot => ilot.position.y + ilot.height));
      const row2MinY = Math.min(...row2.map(ilot => ilot.position.y));
      const row2MaxY = Math.max(...row2.map(ilot => ilot.position.y + ilot.height));

      const gap = Math.min(
        Math.abs(row2MinY - row1MaxY),
        Math.abs(row1MinY - row2MaxY)
      );

      return gap >= minGap && gap <= maxGap;
    } else {
      // Check if rows are vertically separated
      const row1MinX = Math.min(...row1.map(ilot => ilot.position.x));
      const row1MaxX = Math.max(...row1.map(ilot => ilot.position.x + ilot.width));
      const row2MinX = Math.min(...row2.map(ilot => ilot.position.x));
      const row2MaxX = Math.max(...row2.map(ilot => ilot.position.x + ilot.width));

      const gap = Math.min(
        Math.abs(row2MinX - row1MaxX),
        Math.abs(row1MinX - row2MaxX)
      );

      return gap >= minGap && gap <= maxGap;
    }
  }

  private createCorridorBetweenRows(row1: Ilot[], row2: Ilot[], axis: 'horizontal' | 'vertical'): Corridor | null {
    const corridorId = `corridor_${this.corridors.length}`;
    
    if (axis === 'horizontal') {
      // Create horizontal corridor between vertically separated rows
      const row1Bottom = Math.max(...row1.map(ilot => ilot.position.y + ilot.height));
      const row2Top = Math.min(...row2.map(ilot => ilot.position.y));
      
      const corridorY = (row1Bottom + row2Top) / 2 - this.corridorWidth / 2;
      
      // Find the overlapping X range
      const row1MinX = Math.min(...row1.map(ilot => ilot.position.x));
      const row1MaxX = Math.max(...row1.map(ilot => ilot.position.x + ilot.width));
      const row2MinX = Math.min(...row2.map(ilot => ilot.position.x));
      const row2MaxX = Math.max(...row2.map(ilot => ilot.position.x + ilot.width));
      
      const startX = Math.max(row1MinX, row2MinX);
      const endX = Math.min(row1MaxX, row2MaxX);
      
      if (startX >= endX) return null; // No overlap
      
      const path: Point[] = [
        { x: startX, y: corridorY + this.corridorWidth / 2 },
        { x: endX, y: corridorY + this.corridorWidth / 2 }
      ];
      
      const connectedIlots = [...row1, ...row2].map(ilot => ilot.id);
      
      const corridor: Corridor = {
        id: corridorId,
        path,
        width: this.corridorWidth,
        connectedIlots,
        accessible: true,
        length: endX - startX
      };

      // Update îlot connections
      for (const ilot of [...row1, ...row2]) {
        ilot.corridorConnections.push(corridorId);
      }

      return corridor;
    } else {
      // Create vertical corridor between horizontally separated rows
      const row1Right = Math.max(...row1.map(ilot => ilot.position.x + ilot.width));
      const row2Left = Math.min(...row2.map(ilot => ilot.position.x));
      
      const corridorX = (row1Right + row2Left) / 2 - this.corridorWidth / 2;
      
      // Find the overlapping Y range
      const row1MinY = Math.min(...row1.map(ilot => ilot.position.y));
      const row1MaxY = Math.max(...row1.map(ilot => ilot.position.y + ilot.height));
      const row2MinY = Math.min(...row2.map(ilot => ilot.position.y));
      const row2MaxY = Math.max(...row2.map(ilot => ilot.position.y + ilot.height));
      
      const startY = Math.max(row1MinY, row2MinY);
      const endY = Math.min(row1MaxY, row2MaxY);
      
      if (startY >= endY) return null; // No overlap
      
      const path: Point[] = [
        { x: corridorX + this.corridorWidth / 2, y: startY },
        { x: corridorX + this.corridorWidth / 2, y: endY }
      ];
      
      const connectedIlots = [...row1, ...row2].map(ilot => ilot.id);
      
      const corridor: Corridor = {
        id: corridorId,
        path,
        width: this.corridorWidth,
        connectedIlots,
        accessible: true,
        length: endY - startY
      };

      // Update îlot connections
      for (const ilot of [...row1, ...row2]) {
        ilot.corridorConnections.push(corridorId);
      }

      return corridor;
    }
  }

  private connectRemainingIlots(unconnectedIlots: Ilot[], allIlots: Ilot[]): Corridor[] {
    const corridors: Corridor[] = [];
    
    // Use minimum spanning tree for remaining connections
    const mst = this.calculateMinimumSpanningTree(unconnectedIlots);

    for (const edge of mst) {
      const path = this.pathfinder.findPath(
        this.getIlotCenter(edge.from),
        this.getIlotCenter(edge.to),
        this.corridorWidth
      );

      if (path.length > 0) {
        const corridor: Corridor = {
          id: `corridor_${this.corridors.length + corridors.length}`,
          path,
          width: this.corridorWidth,
          connectedIlots: [edge.from.id, edge.to.id],
          accessible: true,
          length: this.calculatePathLength(path)
        };

        corridors.push(corridor);

        // Update îlot connections
        edge.from.corridorConnections.push(corridor.id);
        edge.to.corridorConnections.push(corridor.id);
      }
    }

    return corridors;
  }

  private calculateMinimumSpanningTree(ilots: Ilot[]): Edge[] {
    const edges: Edge[] = [];
    const visited = new Set<string>();

    // Create all possible edges
    const allEdges: EdgeWithWeight[] = [];
    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const distance = this.calculateDistance(
          this.getIlotCenter(ilots[i]),
          this.getIlotCenter(ilots[j])
        );

        allEdges.push({
          from: ilots[i],
          to: ilots[j],
          weight: distance
        });
      }
    }

    // Sort by weight (Kruskal's algorithm)
    allEdges.sort((a, b) => a.weight - b.weight);

    // Build MST using Union-Find
    const parent: { [id: string]: string } = {};
    for (const ilot of ilots) {
      parent[ilot.id] = ilot.id;
    }

    const find = (id: string): string => {
      if (parent[id] !== id) {
        parent[id] = find(parent[id]);
      }
      return parent[id];
    };

    const union = (id1: string, id2: string): void => {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 !== root2) {
        parent[root1] = root2;
      }
    };

    for (const edge of allEdges) {
      const root1 = find(edge.from.id);
      const root2 = find(edge.to.id);

      if (root1 !== root2) {
        edges.push({
          from: edge.from,
          to: edge.to
        });
        union(edge.from.id, edge.to.id);

        if (edges.length === ilots.length - 1) {
          break; // MST complete
        }
      }
    }

    return edges;
  }

  private getIlotCenter(ilot: Ilot): Point {
    return {
      x: ilot.position.x + ilot.width / 2,
      y: ilot.position.y + ilot.height / 2
    };
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private calculatePathLength(path: Point[]): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      length += this.calculateDistance(path[i - 1], path[i]);
    }
    return length;
  }

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
}

interface Edge {
  from: Ilot;
  to: Ilot;
}

interface EdgeWithWeight extends Edge {
  weight: number;
}

export function generateCorridorNetwork(
  ilots: Ilot[],
  walls: any[],
  restrictedAreas: any[],
  floorBounds: { width: number; height: number },
  corridorWidth: number = 1.2
): Corridor[] {
  const generator = new CorridorNetworkGenerator(
    floorBounds.width,
    floorBounds.height,
    corridorWidth
  );

  generator.addObstacles(walls, restrictedAreas);
  return generator.generateCorridors(ilots);
}
