declare module 'fabric' {
  namespace fabric {
    export const Object: any;
    export const Group: any;
    export const Circle: any;
    export const Path: any;
    export const Rect: any;
    export const StaticCanvas: any;
    export const util: {
      groupSVGElements(objects: any[], options: any): any;
    };
    export function loadSVGFromURL(url: string, callback: (objects: any[], options: any) => void): void;

    export class Image {
      constructor(element: HTMLImageElement, options?: any);
      static fromURL(url: string, callback: (image: Image) => void, options?: any): void;
      scaleToWidth(width: number): Image;
    }

    export class Text {
      constructor(text: string, options?: any);
      fontSize: number;
      fill: string;
    }

    export class Point {
      x: number;
      y: number;
      constructor(x?: number, y?: number);
      constructor(input?: any);
      distanceFrom(other: Point): number;
    }

    export interface IObjectOptions {
      originX?: string;
      originY?: string;
      lockUniScaling?: boolean;
      lockScalingFlip?: boolean;
      transparentCorners?: boolean;
      centeredScaling?: boolean;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      scaleX?: number;
      scaleY?: number;
      angle?: number;
      flipX?: boolean;
      flipY?: boolean;
      opacity?: number;
      visible?: boolean;
      selectable?: boolean;
      hasControls?: boolean;
      hasBorders?: boolean;
      hasRotatingPoint?: boolean;
      cornerSize?: number;
      cornerColor?: string;
      cornerStyle?: string;
      borderColor?: string;
      borderScaleFactor?: number;
      borderOpacityWhenMoving?: number;
      padding?: number;
      objectCaching?: boolean;
      snapAngle?: number;
      snapThreshold?: number;
      centeredRotation?: boolean;
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
    }

    export class Object {
      constructor(options?: IObjectOptions);
      constructor(options?: any);
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
      constructor(objects?: Object[], options?: IObjectOptions);
      constructor(objects?: Object[], options?: any);
      addWithUpdate(object: Object): Group;
      removeWithUpdate(object: Object): Group;
    }

    export class Canvas {
      width: number;
      height: number;
      backgroundColor: string | null;
      backgroundImage: any | null;
      overlayColor: string | null;
      overlayImage: any | null;
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
      
      constructor(element: string | HTMLCanvasElement, options?: any);
      add(...objects: any[]): Canvas;
      remove(...objects: any[]): Canvas;
      clear(): Canvas;
      renderAll(): Canvas;
      requestRenderAll(): void;
      getObjects(): any[];
      getActiveObject(): any | null;
      getActiveObjects(): any[];
      setActiveObject(object: any): Canvas;
      discardActiveObject(): Canvas;
      forEachObject(callback: (obj: any, index: number, array: any[]) => void): void;
      findObject(callback: (obj: any) => boolean): any | undefined;
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
      moveTo(obj: any, index: number): void;
      calcOffset(): void;
      dispose(): void;
      on(eventName: string, handler: (e: any) => void): void;
      off(eventName: string, handler?: (e: any) => void): void;
      fire(eventName: string, options?: any): void;
      static supports(methodName: string): boolean;
    }
  }

  export = fabric;
}

// Also declare the global fabric object for browser usage
declare global {
  const fabric: typeof import('fabric');
}
