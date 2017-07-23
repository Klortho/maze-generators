import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default {
  moduleName: 'mazer',
  entry: 'src/main-cli.js',
  dest: 'dist/bundle-cli.js',
  format: 'umd',
  external: [ 'PDFDocument' ],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
    }),
    commonjs({}),
  ],
  watch: {
    exclude: ['node_modules/**'],
  },
};
