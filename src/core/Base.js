
class Base {
  constructor(options) {
    this._options = options || {};
    Object.assign(this, options);
  }
}

export default Base;
