import { Point, Rectangle, Wall, Room } from "@/types/analysis";

export class GeometryUtils {
  /**
   * Calculate the distance between two points
   */
  static distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calculate the angle between two points in radians
   */
  static angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Rotate a point around another point by a given angle
   */
  static rotatePoint(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  static pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Calculate the area of a polygon using the shoelace formula
   */
  static polygonArea(polygon: Point[]): number {
    let area = 0;
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }
    
    return Math.abs(area) / 2;
  }

  /**
   * Calculate the centroid of a polygon
   */
  static polygonCentroid(polygon: Point[]): Point {
    const area = this.polygonArea(polygon);
    let cx = 0;
    let cy = 0;
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const factor = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * factor;
      cy += (polygon[i].y + polygon[j].y) * factor;
    }
    
    const factor = 1 / (6 * area);
    return {
      x: cx * factor,
      y: cy * factor
    };
  }

  /**
   * Get the bounding rectangle of a polygon
   */
  static getPolygonBounds(polygon: Point[]): Rectangle {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const point of polygon) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Check if two line segments intersect
   */
  static lineSegmentsIntersect(
    p1: Point, p2: Point, 
    p3: Point, p4: Point
  ): boolean {
    const d1 = this.orientation(p3, p4, p1);
    const d2 = this.orientation(p3, p4, p2);
    const d3 = this.orientation(p1, p2, p3);
    const d4 = this.orientation(p1, p2, p4);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    
    if (d1 === 0 && this.onSegment(p3, p1, p4)) return true;
    if (d2 === 0 && this.onSegment(p3, p2, p4)) return true;
    if (d3 === 0 && this.onSegment(p1, p3, p2)) return true;
    if (d4 === 0 && this.onSegment(p1, p4, p2)) return true;
    
    return false;
  }

  /**
   * Calculate orientation of three points
   */
  private static orientation(p: Point, q: Point, r: Point): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  /**
   * Check if point q lies on segment pr
   */
  private static onSegment(p: Point, q: Point, r: Point): boolean {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
           q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
  }

  /**
   * Calculate the intersection area between two polygons
   */
  static polygonIntersectionArea(poly1: Point[], poly2: Point[]): number {
    // Simplified implementation using Sutherland-Hodgman clipping
    let outputList = [...poly1];
    
    for (let i = 0; i < poly2.length; i++) {
      if (outputList.length === 0) break;
      
      const inputList = [...outputList];
      outputList = [];
      
      const clipVertex1 = poly2[i];
      const clipVertex2 = poly2[(i + 1) % poly2.length];
      
      if (inputList.length > 0) {
        let s = inputList[inputList.length - 1];
        
        for (const e of inputList) {
          if (this.isInside(e, clipVertex1, clipVertex2)) {
            if (!this.isInside(s, clipVertex1, clipVertex2)) {
              const intersection = this.lineIntersection(s, e, clipVertex1, clipVertex2);
              if (intersection) {
                outputList.push(intersection);
              }
            }
            outputList.push(e);
          } else if (this.isInside(s, clipVertex1, clipVertex2)) {
            const intersection = this.lineIntersection(s, e, clipVertex1, clipVertex2);
            if (intersection) {
              outputList.push(intersection);
            }
          }
          s = e;
        }
      }
    }
    
    return outputList.length > 2 ? this.polygonArea(outputList) : 0;
  }

  /**
   * Check if a point is inside relative to a clipping edge
   */
  private static isInside(point: Point, clipStart: Point, clipEnd: Point): boolean {
    return (clipEnd.x - clipStart.x) * (point.y - clipStart.y) > 
           (clipEnd.y - clipStart.y) * (point.x - clipStart.x);
  }

  /**
   * Calculate intersection point of two lines
   */
  static lineIntersection(
    p1: Point, p2: Point, 
    p3: Point, p4: Point
  ): Point | null {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Lines are parallel
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  /**
   * Find the closest point on a line segment to a given point
   */
  static closestPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return lineStart; // Line segment is a point
    
    const param = dot / lenSq;
    
    if (param < 0) return lineStart;
    if (param > 1) return lineEnd;
    
    return {
      x: lineStart.x + param * C,
      y: lineStart.y + param * D
    };
  }

  /**
   * Calculate the minimum distance from a point to a line segment
   */
  static distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const closest = this.closestPointOnLineSegment(point, lineStart, lineEnd);
    return this.distance(point, closest);
  }

  /**
   * Simplify a polygon by removing collinear points
   */
  static simplifyPolygon(polygon: Point[], tolerance: number = 1e-10): Point[] {
    if (polygon.length < 3) return polygon;
    
    const simplified: Point[] = [];
    
    for (let i = 0; i < polygon.length; i++) {
      const prev = polygon[(i - 1 + polygon.length) % polygon.length];
      const curr = polygon[i];
      const next = polygon[(i + 1) % polygon.length];
      
      // Check if current point is collinear with previous and next
      const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
      
      if (Math.abs(cross) > tolerance) {
        simplified.push(curr);
      }
    }
    
    return simplified.length >= 3 ? simplified : polygon;
  }

  /**
   * Create a buffer (offset) around a polygon
   */
  static bufferPolygon(polygon: Point[], distance: number): Point[] {
    // Simplified buffer implementation
    const buffered: Point[] = [];
    
    for (let i = 0; i < polygon.length; i++) {
      const prev = polygon[(i - 1 + polygon.length) % polygon.length];
      const curr = polygon[i];
      const next = polygon[(i + 1) % polygon.length];
      
      // Calculate perpendicular vectors
      const v1 = this.normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
      const v2 = this.normalize({ x: next.x - curr.x, y: next.y - curr.y });
      
      const perp1 = { x: -v1.y, y: v1.x };
      const perp2 = { x: -v2.y, y: v2.x };
      
      // Calculate offset point
      const offset = {
        x: (perp1.x + perp2.x) * distance,
        y: (perp1.y + perp2.y) * distance
      };
      
      buffered.push({
        x: curr.x + offset.x,
        y: curr.y + offset.y
      });
    }
    
    return buffered;
  }

  /**
   * Normalize a vector
   */
  static normalize(vector: Point): Point {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }

  /**
   * Check if two rectangles intersect
   */
  static rectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  /**
   * Calculate the intersection area of two rectangles
   */
  static rectangleIntersectionArea(rect1: Rectangle, rect2: Rectangle): number {
    if (!this.rectanglesIntersect(rect1, rect2)) return 0;
    
    const left = Math.max(rect1.x, rect2.x);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const top = Math.max(rect1.y, rect2.y);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    return (right - left) * (bottom - top);
  }

  /**
   * Generate a regular polygon with n sides
   */
  static generateRegularPolygon(center: Point, radius: number, sides: number): Point[] {
    const polygon: Point[] = [];
    const angleStep = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      polygon.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    
    return polygon;
  }

  /**
   * Calculate the convex hull of a set of points using Graham scan
   */
  static convexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;
    
    // Find the bottom-most point (or left most if tie)
    let start = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[start].y ||
          (points[i].y === points[start].y && points[i].x < points[start].x)) {
        start = i;
      }
    }
    
    // Sort points by polar angle with respect to start point
    const startPoint = points[start];
    const sortedPoints = points.filter((_, i) => i !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
        const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
        if (angleA !== angleB) return angleA - angleB;
        return this.distance(startPoint, a) - this.distance(startPoint, b);
      });
    
    const hull: Point[] = [startPoint];
    
    for (const point of sortedPoints) {
      while (hull.length > 1 && 
             this.orientation(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }
    
    return hull;
  }

  /**
   * Check if a rectangle is completely inside a polygon
   */
  static rectangleInPolygon(rect: Rectangle, polygon: Point[]): boolean {
    const corners: Point[] = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];
    
    return corners.every(corner => this.pointInPolygon(corner, polygon));
  }

  /**
   * Calculate minimum clearance around a rectangle within a room
   */
  static calculateClearance(
    rect: Rectangle,
    room: Room,
    walls: Wall[],
    minClearance: number = 1.2
  ): { north: number; south: number; east: number; west: number } {
    const clearances = {
      north: Infinity,
      south: Infinity,
      east: Infinity,
      west: Infinity
    };
    
    // Check against room boundaries
    const roomBounds = this.getPolygonBounds(room.boundary);
    clearances.north = (rect.y + rect.height) - roomBounds.y;
    clearances.south = (roomBounds.y + roomBounds.height) - rect.y;
    clearances.east = (roomBounds.x + roomBounds.width) - (rect.x + rect.width);
    clearances.west = rect.x - roomBounds.x;
    
    // Check against walls
    for (const wall of walls) {
      const distToWall = this.distanceToLineSegment(
        { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        wall.start,
        wall.end
      );
      
      // Determine which side of rectangle is closest to wall
      // This is simplified - a full implementation would check all sides
      const minDist = Math.min(clearances.north, clearances.south, clearances.east, clearances.west);
      if (distToWall < minDist) {
        // Update appropriate clearance based on wall orientation
        // Simplified logic here
      }
    }
    
    return clearances;
  }
}

export default GeometryUtils;
