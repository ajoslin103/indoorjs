import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/index.js',
    output: [
      { file: 'dist/schematic.cjs.js', format: 'cjs' },
      { file: 'dist/schematic.esm.js', format: 'esm' },
      { 
        file: 'dist/schematic.umd.js', 
        format: 'umd',
        name: 'Schematic',
        globals: {
          'fabric': 'fabric'
        }
      }
    ],
    plugins: [
      resolve()
    ],
    external: ['fabric']
  }
];