// Type definitions for fabric-pure-browser
declare module 'fabric-pure-browser' {
  export = fabric;
}

declare namespace fabric {
  const Object: any;
  const Group: any;
  const Circle: any;
  const Path: any;
  const StaticCanvas: any;
  const Image: any;
  const Rect: any;
  const util: any;
  function loadSVGFromURL(url: string, callback: (objects: any[], options: any) => void): void;
  const version: string;
  
  class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
  }

  interface IObjectOptions {
    originX: string;
    originY: string;
    lockUniScaling?: boolean;
    lockScalingFlip?: boolean;
    transparentCorners?: boolean;
    centeredScaling?: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    flipX: boolean;
    flipY: boolean;
    opacity: number;
    visible: boolean;
    selectable: boolean;
    hasControls: boolean;
    hasBorders: boolean;
    hasRotatingPoint: boolean;
    transparentCorners: boolean;
    cornerSize: number;
    cornerColor: string;
    cornerStyle: string;
    borderColor: string;
    borderScaleFactor: number;
    borderOpacityWhenMoving: number;
    padding: number;
    objectCaching: boolean;
    snapAngle: number;
    snapThreshold: number;
    centeredRotation: boolean;
    centeredScaling: boolean;
    cornerStrokeColor?: string;
    borderDashArray?: number[];
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
    
    constructor(options?: any);
    setOptions(options: any): void;
    set(key: string, value: any): void;
    get(key: string): any;
    setCoords(): void;
    render(ctx: CanvasRenderingContext2D): void;
    toObject(): any;
    toJSON(): string;
    clone(callback: (obj: Object) => void): void;
    cloneAsImage(callback: (img: Image) => void): void;
  }

  export class Group extends Object {
    objects: Object[];
    objectCaching?: boolean;
    selectionBackgroundColor?: string;
    constructor(objects?: Object[], options?: any);
    addWithUpdate(object: Object): Group;
    removeWithUpdate(object: Object): Group;
  }

  export class Canvas {
    width: number;
    height: number;
    backgroundColor: string | null;
    backgroundImage: Object | null;
    overlayColor: string | null;
    overlayImage: Object | null;
    isDrawingMode: boolean;
    interactive: boolean;
    selection: boolean;
    selectionColor: string;
    selectionDashArray: number[];
    selectionBorderColor: string;
    selectionLineWidth: number;
    hoverCursor: string;
    moveCursor: string;
    defaultCursor: string;
    freeDrawingCursor: string;
    rotationCursor: string;
    notAllowedCursor: string;
    containerClass: string;
    perPixelTargetFind: boolean;
    targetFindTolerance: number;
    skipTargetFind: boolean;
    preserveObjectStacking: boolean;
    freeDrawingBrush: any;
    wrapperEl?: HTMLElement;
    viewportTransform?: number[];
    _objects?: Object[];
    
    constructor(element: string | HTMLCanvasElement, options?: any);
    
    // Methods
    add(...objects: Object[]): Canvas;
    remove(...objects: Object[]): Canvas;
    clear(): Canvas;
    renderAll(): Canvas;
    requestRenderAll(): void;
    getObjects(): Object[];
    getActiveObject(): Object | null;
    getActiveObjects(): Object[];
    setActiveObject(object: Object): Canvas;
    discardActiveObject(): Canvas;
    forEachObject(callback: (obj: Object, index: number, array: Object[]) => void): void;
    findObject(callback: (obj: Object) => boolean): Object | undefined;
    getWidth(): number;
    getHeight(): number;
    setWidth(width: number): Canvas;
    setHeight(height: number): Canvas;
    setDimensions(dimensions: { width?: number; height?: number }): Canvas;
    zoomToPoint(point: Point, value: number): void;
    absolutePan(point: Point): void;
    relativePan(point: Point): void;
    getCenter(): Point;
    getZoom(): number;
    setZoom(value: number): Canvas;
    getContext(type: string): CanvasRenderingContext2D;
    moveTo(obj: Object, index: number): void;
    calcOffset(): void;
    dispose(): void;
    
    // Event handling
    on(eventName: string, handler: (e: any) => void): void;
    off(eventName: string, handler?: (e: any) => void): void;
    fire(eventName: string, options?: any): void;
    
    // Static methods
    static supports(methodName: string): boolean;
  }
}

// Also declare the global fabric object for browser usage
declare global {
  const fabric: typeof import('fabric');
}
