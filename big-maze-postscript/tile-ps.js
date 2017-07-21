const fs = require('fs-extra');

const scale = 7;

const dataLines = fs.readFileSync('maze-data.txt', 'utf-8').split('\n');

var minX = 1000;
var minY = 1000;
var maxX = 0;
var maxY = 0;
dataLines.forEach(line => {
  const m = line.match('(-?\\d+) (-?\\d+) m (-?\\d+) (-?\\d+)');
  if (m) {
    minX = Math.min(minX, m[1], m[3]);
    minY = Math.min(minY, m[2], m[4]);
    maxX = Math.max(maxX, m[1], m[3]);
    maxY = Math.max(maxY, m[2], m[4]);
  }
});
console.log(`X: ${minX} - ${maxX}; Y: ${minY} - ${maxY}`);


const outFile = fs.createWriteStream(`./big-maze-${scale}X${scale}.ps`);

outFile.write(
  '%!PS-Adobe-1.0\n' +
  '%%Title: Hex maze\n' +
  `%%Pages: ${scale * scale}\n` +
  '%%EndComments\n' +
  '\n' +
  '/m  {moveto} def\n' +
  '/ls {lineto stroke} def\n' +
  '/l  {lineto} def\n' +
  '\n' +
  '%%EndProlog\n\n'
);

var r, c;
var pageNum = 1;
const pageXWidth = (maxX - minX) / scale;
const pageYHeight = (maxY - minY) / scale;

ROWS:
for (r = 0; r < scale; ++r) {
  for (c = 0; c < scale; ++c) {
    console.log('printing page ' + pageNum);
    outFile.write(
      `%%Page: ${r}-${c}\n` +

      'gsave\n' +
      '/Times-Roman findfont\n' +
      '56 scalefont\n' +
      'setfont\n' +
      '0.9 0.9 0.9 setrgbcolor\n' +
      'newpath\n' +
      '50 50 moveto\n' +
      `(${r} - ${c}) show\n` +
      'grestore\n\n' +


      'gsave\n' +
      '36 36 translate\n' +
      '540 720 scale\n' +
      'gsave\n' +
      `${-c} ${-r} translate\n` +
      `${scale} ${scale} scale\n` +
      'gsave\n' +
      '0.000951474786 0.001109878 scale\n' +
      '0.15 setlinewidth\n' +
      '2 1 translate\n\n'
    );

    const x1 = minX + pageXWidth * (c - 0.2);
    const y1 = minY + pageYHeight * (r - 0.2);
    dataLines.forEach(line => {
      const m = line.match('(-?\\d+) (-?\\d+)');
      if (m) {
        const x = m[1];
        const y = m[2];
        if (x >= x1 && x <= x1 + pageXWidth * 1.4 &&
            y >= y1 && y <= y1 + pageYHeight * 1.4) {
          outFile.write(line + '\n');
        }
      }
    });

    outFile.write(
      'grestore\n' +
      'grestore\n' +
      'grestore\n' +
      'showpage\n'
    );

    ++pageNum;
    //if (pageNum > 2) break ROWS;
  }
}
