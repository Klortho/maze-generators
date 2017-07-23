# Mazer

To build and run the browser bundle:

```
rollup -c rollup-browser.js
```

Then bring up index.html in your browser.

To build and run the command-line tool:

```
rollup -c rollup-cli.js
node dist/bundle-cli.js --rows=100 --cols=100
# output is written to amazing.pdf
```

To run rollup in "watch" mode, so that it automatically rebuilds whenever
there's a source code change, just add the `-w` switch to the `rollup`
command.
