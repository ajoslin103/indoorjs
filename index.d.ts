// Type definitions for @ajoslin23/schematic
// Project: https://github.com/ajoslin103/schematic

import { Canvas as FabricCanvas, Object as FabricObject, Point as FabricPoint } from 'fabric';

// Base types
export class Base {
  constructor(options?: Record<string, any>);
  _options: Record<string, any>;
}

// Constants
export enum MAP {
  STEP = 10,
  SCALE = 100,
  WIDTH = 1000,
  HEIGHT = 1000,
  ORIGIN = 'NONE',
  MARGIN = 10
}

export enum Modes {
  NONE = 'NONE',
  SELECT = 'SELECT',
  DRAG = 'DRAG',
  DRAW = 'DRAW',
  EDIT = 'EDIT'
}

export function initializeFabric(canvasId: string): FabricCanvas;

// Geometry
export class Point {
  constructor(x: number, y: number);
  x: number;
  y: number;
  clone(): Point;
  set(x: number, y: number): this;
  add(point: Point): this;
  sub(point: Point): this;
  multiply(scalar: number): this;
  divide(scalar: number): this;
  invert(): this;
  distance(point: Point): number;
  angle(point: Point): number;
  normalize(): this;
  toString(): string;
}

// Grid components
export class Axis extends Base {
  constructor(options?: Record<string, any>);
  object: FabricObject;
}

export class Grid extends Base {
  constructor(container: HTMLElement, options?: Record<string, any>);
  container: HTMLElement;
  canvas: FabricCanvas;
  width: number;
  height: number;
  visible: boolean;
  step: number;
  scale: number;
  scaleLines: number[];
  bgColor: string;
  lineColor: string;
  axisColor: string;
  showAxis: boolean;
  axisWidth: number;
  lineWidth: number;
  
  initialize(): void;
  recalculate(): void;
  show(visible?: boolean): void;
  hide(): void;
  setStep(step: number): void;
  setScale(scale: number): void;
  setSize(width: number, height: number): void;
  draw(): void;
  clear(): void;
}

// Map components
export class Map extends Base {
  constructor(options?: Record<string, any>);
  container: HTMLElement;
  zoom: number;
  onResize(width: number, height: number): void;
}

export function map(options?: Record<string, any>): Map;

// Schematic
export interface SchematicOptions {
  container?: HTMLElement;
  width?: number;
  height?: number;
  showGrid?: boolean;
  gridStep?: number;
  gridScale?: number;
  zoomDebounceDelay?: number;
  zoomOnCenter?: boolean;
}

export class Schematic extends Base {
  constructor(container: HTMLElement | string, options?: SchematicOptions);
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  fabric: FabricCanvas;
  width: number;
  height: number;
  listeners: Record<string, Function[]>;
  mapInstance: Map;
  
  initialize(): void;
  on(event: string, callback: Function): void;
  off(event: string, callback?: Function): void;
  trigger(event: string, data?: any): void;
  setZoom(zoom: number): void;
  setZoomLimits(min: number, max: number): void;
  setOriginPin(origin: string, margin: number): void;
  resetView(): void;
  showGrid(visible: boolean): void;
  setShowScrollbars(show: boolean): void;
}

export function schematic(container: HTMLElement | string, options?: SchematicOptions): Schematic;
