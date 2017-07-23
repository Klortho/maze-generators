import resolve from 'rollup-plugin-node-resolve';

export default {
  moduleName: 'mazer',
  entry: 'src/main-browser.js',
  dest: 'dist/bundle-browser.js',
  format: 'umd',
  plugins: [
    resolve({
      jsnext: true,
      main: true,
    }),
  ],
};
