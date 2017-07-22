import resolve from 'rollup-plugin-node-resolve';

export default {
  moduleName: 'mazer',
  entry: 'src/main.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  plugins: [
    resolve({
      
    })
  ]
};
