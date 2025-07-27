declare module 'minimatch' {
  function minimatch(path: string, pattern: string, options?: any): boolean;
  namespace minimatch {
    function match(list: string[], pattern: string, options?: any): string[];
  }
  export = minimatch;
}
