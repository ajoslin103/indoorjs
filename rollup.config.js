import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/map/Map.js',
    output: [
      { file: 'dist/indoor.cjs.js', format: 'cjs' },
      { file: 'dist/indoor.esm.js', format: 'esm' },
      { 
        file: 'dist/indoor.umd.js', 
        format: 'umd',
        name: 'IndoorMap',
        globals: {
          'fabric-pure-browser': 'fabric'
        }
      }
    ],
    plugins: [
      resolve()
    ],
    external: ['fabric-pure-browser']
  }
];