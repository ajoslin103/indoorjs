export interface PointCoordinates {
  x: number;
  y: number;
}

export type PointInput = 
  | [number, number] 
  | { x: number; y: number } 
  | [PointCoordinates] 
  | number[];

export class Point extends fabric.Point {
  constructor(x?: number, y?: number);
  constructor(input?: PointInput);
  constructor(...params: any[]) {
    let x: number;
    let y: number;

    if (params.length > 1) {
      [x, y] = params;
    } else if (params.length === 0 || !params[0]) {
      [x, y] = [0, 0];
    } else if (typeof params[0] === 'object' && 'x' in params[0]) {
      x = params[0].x;
      y = params[0].y;
    } else if (Array.isArray(params[0]) && params[0].length >= 2) {
      [x, y] = params[0];
    } else {
      console.error(
        'Parameter for Point is not valid. Use Point(x,y) or Point({x,y}) or Point([x,y])',
        params
      );
      [x, y] = [0, 0];
    }

    super(x, y);
  }

  setX(x: number): void {
    this.x = x || 0;
  }

  setY(y: number): void {
    this.y = y || 0;
  }

  copy(point: Point): void {
    this.x = point.x;
    this.y = point.y;
  }

  getArray(): [number, number] {
    return [this.x, this.y];
  }
}

export const point = (...params: any[]): Point => new Point(...params);
