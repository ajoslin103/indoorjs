import { Modes } from '../core/Constants';

interface ModesMixinConstructor {
  new (...args: any[]): {
    mode: string;
    canvas: any; // Using any for fabric.Canvas to avoid type issues
  };
}

interface ModesMixinInterface {
  setMode(mode: string): void;
  setModeAsDraw(): void;
  setModeAsSelect(): void;
  setModeAsMeasure(): void;
  setModeAsGrab(): void;
  isSelectMode(): boolean;
  isGrabMode(): boolean;
  isMeasureMode(): boolean;
  isDrawMode(): boolean;
}

const ModesMixin = <T extends ModesMixinConstructor>(superclass: T) =>
  class extends superclass implements ModesMixinInterface {
    /**
     * MODES
     */
    setMode(mode: string): void {
      this.mode = mode;

      switch (mode) {
        case Modes.SELECT:
          this.canvas.isDrawingMode = false;
          this.canvas.interactive = true;
          this.canvas.selection = true;
          this.canvas.hoverCursor = 'default';
          this.canvas.moveCursor = 'default';
          break;
        case Modes.GRAB:
          this.canvas.isDrawingMode = false;
          this.canvas.interactive = false;
          this.canvas.selection = false;
          this.canvas.discardActiveObject();
          this.canvas.hoverCursor = 'move';
          this.canvas.moveCursor = 'move';
          break;
        case Modes.MEASURE:
          this.canvas.isDrawingMode = true;
          this.canvas.freeDrawingBrush.color = 'transparent';
          this.canvas.discardActiveObject();
          break;
        case Modes.DRAW:
          this.canvas.isDrawingMode = true;
          break;

        default:
          break;
      }
    }

    setModeAsDraw(): void {
      this.setMode(Modes.DRAW);
    }

    setModeAsSelect(): void {
      this.setMode(Modes.SELECT);
    }

    setModeAsMeasure(): void {
      this.setMode(Modes.MEASURE);
    }

    setModeAsGrab(): void {
      this.setMode(Modes.GRAB);
    }

    isSelectMode(): boolean {
      return this.mode === Modes.SELECT;
    }

    isGrabMode(): boolean {
      return this.mode === Modes.GRAB;
    }

    isMeasureMode(): boolean {
      return this.mode === Modes.MEASURE;
    }

    isDrawMode(): boolean {
      return this.mode === Modes.DRAW;
    }
  };

export default ModesMixin;
