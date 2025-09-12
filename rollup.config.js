import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/index.js',
    output: [
      { 
        file: 'dist/schematic-map.cjs.js', 
        format: 'cjs',
        exports: 'named'
      },
      { 
        file: 'dist/schematic-map.esm.js', 
        format: 'esm'
      },
      { 
        file: 'dist/schematic-map.umd.js', 
        format: 'umd',
        name: 'SchematicMap',
        globals: {
          'fabric': 'fabric'
        },
        exports: 'named'
      }
    ],
    plugins: [
      resolve(),
      commonjs()
    ],
    external: ['fabric']
  }
];