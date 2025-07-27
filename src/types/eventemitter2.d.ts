declare module 'eventemitter2' {
  export class EventEmitter2 {
    constructor(options?: any);
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener?: (...args: any[]) => void): this;
    emit(event: string | symbol, ...args: any[]): boolean;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener?: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    listeners(event: string | symbol): Function[];
  }
  export default EventEmitter2;
}
