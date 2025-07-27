// Common type definitions for the indoorjs library

import { Point } from '../geometry/Point';
import { MapConfig } from '../core/Constants';

export interface Layer {
  shape?: fabric.Object;
  class?: string;
  zIndex?: number;
}

export interface FloorPlan {
  on: (event: string, callback: (img: any) => void) => void;
}

export interface PanZoomEvent {
  dx: number;
  dy: number;
  dz: number;
  x: number;
  y: number;
}

export interface ViewOptions {
  center: Point;
  zoom: number;
}

export interface MapOptions extends Partial<MapConfig> {
  width?: number;
  height?: number;
  autostart?: boolean;
  floorplan?: FloorPlan;
}

export interface BaseOptions {
  [key: string]: any;
}

export interface EventEmitter {
  on: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

export interface MeasurementOptions {
  [key: string]: any;
}

export interface GridOptions {
  [key: string]: any;
}
