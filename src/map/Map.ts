import panzoom from '../lib/panzoom';
import { clamp } from '../lib/mumath/index';

import Base from '../core/Base';
import { MAP, Modes } from '../core/Constants';
import Grid from '../grid/Grid';
import { Point } from '../geometry/Point';
import ModesMixin from './ModesMixin';
import Measurement from '../measurement/Measurement';
import { mix } from '../lib/mix';
import { MapOptions, Layer, FloorPlan } from '../types/common';

// Extend fabric types
declare global {
  namespace fabric {
    interface Canvas {
      _objects?: Object[];
      requestRenderAll(): void;
      moveTo(obj: any, index: number): void;
    }
    interface Object {
      class?: string;
      id?: string;
      parent?: any;
      clickable?: boolean;
      dragging?: boolean;
      keepOnZoom?: boolean;
      inGroup?: boolean;
      orgYaw?: number;
      yaw?: number;
      zIndex?: number;
      getBounds?(): any[];
      set?(key: string, value: any): void;
      setCoords?(): void;
    }
  }
}

export class Map extends mix(Base).with(ModesMixin) {
  canvas: fabric.Canvas;
  context: CanvasRenderingContext2D;
  container: HTMLElement;
  center: Point;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  gridEnabled: boolean;
  zoomEnabled: boolean;
  selectEnabled: boolean;
  mode: string;
  showGrid: boolean;
  defaults: any;
  _options: any;
  panzoomInstance: any;
  grid: Grid;
  layers: Layer[] = [];
  floorplan: FloorPlan | null = null;
  measurement: Measurement;

  constructor(options?: MapOptions) {
    super();
    this.defaults = MAP;
    this._options = Object.assign({}, this.defaults, options);
    this.zoom = this._options.zoom || 1;
    this.minZoom = this._options.minZoom || 0;
    this.maxZoom = this._options.maxZoom || 20;
    this.gridEnabled = this._options.gridEnabled !== false;
    this.zoomEnabled = this._options.zoomEnabled !== false;
    this.selectEnabled = this._options.selectEnabled !== false;
    this.mode = this._options.mode || Modes.SELECT;
    this.showGrid = this._options.showGrid !== false;
    this.center = this._options.center || new Point();
    this.container = this.getContainer(this._options.container);
    this.measurement = new Measurement(this);
    this.grid = new Grid(this.canvas.wrapperEl as HTMLCanvasElement);
    this.init();
  }

  private getContainer(container?: HTMLElement | string): HTMLElement {
    if (!container) return document.body;
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) throw new Error(`Container ${container} not found`);
      return element as HTMLElement;
    }
    return container;
  }

  init() {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'indoors-map-canvas');
    canvas.width = this._options.width || this.container.clientWidth;
    canvas.height = this._options.height || this.container.clientHeight;
    
    this.container.appendChild(canvas);
    
    this.canvas = new fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true
    });
    
    this.context = this.canvas.getContext('2d');
    
    const originX = -this.canvas.width! / 2;
    const originY = -this.canvas.height! / 2;

    this.canvas.absolutePan({ x: originX, y: originY });

    this.setMode(this.mode);
    this.bindEvents();
    this.bindPanZoom();

    if (this.showGrid) {
      this.grid.render();
    }

    this.emit('ready', this);
  }

  private bindEvents() {
    this.canvas.on('mouse:down', (e: any) => this.emit('mouse:down', e));
    this.canvas.on('mouse:move', (e: any) => this.emit('mouse:move', e));
    this.canvas.on('mouse:up', (e: any) => this.emit('mouse:up', e));
    this.canvas.on('mouse:wheel', (e: any) => this.emit('mouse:wheel', e));
  }

  private bindPanZoom() {
    if (!this.zoomEnabled) return;

    this.panzoomInstance = panzoom(this.canvas.wrapperEl as HTMLElement, (e: any) => {
      this.zoom = clamp(e.zoom, this.minZoom, this.maxZoom);
      this.canvas.setZoom(this.zoom);
      this.emit('zoom', this.zoom);
      this.canvas.requestRenderAll();
    });

    this.panzoomInstance.enable();
  }

  addLayer(layer: Layer) {
    if (!layer.shape) {
      console.error('shape is undefined');
      return;
    }
    
    this.layers.push(layer);
    this.canvas.add(layer.shape);
    
    if (this.canvas._objects) {
      this.canvas._objects.sort((o1: any, o2: any) => (o1.zIndex || 0) - (o2.zIndex || 0));
    }

    if (layer.shape.keepOnZoom) {
      const scale = 1.0 / this.zoom;
      layer.shape.set('scaleX', scale);
      layer.shape.set('scaleY', scale);
      layer.shape.setCoords();
    }

    if (layer.class) {
      this.emit(`${layer.class}:added`, layer);
    }

    this.canvas.requestRenderAll();
  }

  removeLayer(layer: Layer) {
    if (!layer || !layer.shape) return;
    if (layer.class) {
      this.emit(`${layer.class}:removed`, layer);
    }
    this.canvas.remove(layer.shape);
    this.canvas.requestRenderAll();
  }

  setFloorplan(floorplan: FloorPlan) {
    this.floorplan = floorplan;
    this.emit('floorplan:changed', floorplan);
    this.canvas.requestRenderAll();
  }

  clear() {
    this.canvas.clear();
    this.layers = [];
    this.floorplan = null;
    this.emit('clear');
  }

  render() {
    this.canvas.renderAll();
  }

  getObjects() {
    return this.canvas.getObjects();
  }

  addObject(obj: any) {
    this.canvas.add(obj);
    this.canvas.requestRenderAll();
  }

  removeObject(obj: any) {
    this.canvas.remove(obj);
    this.canvas.requestRenderAll();
  }

  setZoom(zoom: number) {
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.canvas.setZoom(this.zoom);
    this.canvas.requestRenderAll();
    this.emit('zoom', this.zoom);
  }

  getZoom() {
    return this.zoom;
  }

  panTo(point: Point) {
    this.canvas.absolutePan({ x: point.x, y: point.y });
    this.canvas.requestRenderAll();
  }

  getCenter() {
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return new Point();
    return new Point(-vpt[4], -vpt[5]);
  }

  setCenter(point: Point) {
    this.center = point;
    this.panTo(point);
  }

  resize(width: number, height: number) {
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.calcOffset();
    this.canvas.renderAll();
    this.emit('resize', { width, height });
  }

  destroy() {
    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
    this.canvas.dispose();
    this.emit('destroy');
  }
}
