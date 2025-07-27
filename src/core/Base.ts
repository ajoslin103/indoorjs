import { EventEmitter2 } from 'eventemitter2';

export interface BaseOptions {
  [key: string]: any;
}

export interface BaseClass {
  new (...args: any[]): Base;
  prototype: Base;
}

class Base extends EventEmitter2 {
  protected _options: BaseOptions;
  protected defaults: any = {};

  constructor(options?: BaseOptions) {
    super();
    this._options = options || {};
    Object.assign(this, options);
  }
}

export default Base;
