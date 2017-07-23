const PDFDocument = require('pdfkit');
const fs = require('fs');


import {allDirections, cellWidth, cellHeight, hexSide, hexVertex} from './hex-maze.js';

export function draw(maze) {
  const width = maze.width || 500;
  const height = maze.height || 500;
  const rows = maze.rows;
  const cols = maze.cols;
  console.log(`Drawing, width: ${width}, height: ${height}, rows: ${rows}, cols: ${cols}`);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('amazing.pdf'));

  const marginX = 72;
  const marginY = 72;
  const scaleX = (width - 2 * marginX) / (cols + 0.5) / cellWidth;
  const scaleY = (height - 2 * marginY) / (rows + 0.25) / cellHeight;

  console.log(`margin: ${marginX}, ${marginY}; scale: ${scaleX}, ${scaleY}`);
  doc.translate(marginX, marginY)
     .scale(scaleX, scaleY);

  const round = num => Math.round(num*100000 + 0.1)/100000;
  const pathPoint = p => `${round(p[0])},${round(p[1])}`;
  function drawSeg(points) {
    const [start, end] = points;
    doc.path(`M${pathPoint(start)}L${pathPoint(end)}`)
       .lineWidth(0.05)
       .lineCap('round')
       .stroke();
  }


  function colorCell(cell, hue) {
    const svgPath = allDirections.map(dir =>
      (dir === 0 ? 'M' : 'L') + pathPoint(hexVertex(cell.coords, dir)) + ' '
    ).join('') + 'Z';

    const rgb = hsl.rgb([hue, 100, 70]);
    doc.path(svgPath)
       .lineWidth(0)
       .fillOpacity(0.2)
       .fill(rgb);
  }

  for (var r = 0; r < rows; ++r) {
    for (var c = 0; c < cols; ++c) {
      const coords = [r, c];
      const cell = maze.fetchCell(coords);
      allDirections.forEach(dir => {
        if (cell.hasWall(dir)) drawSeg(hexSide(coords, dir));
      });
    }
  }

  // Computes the hue based on distance
  const hue = distance => (distance*5)%360;

  // Colorize
  maze.traverse(maze.startCell(), (cell, distance) => {
    colorCell(cell, hue(distance));
  });

  doc.end();
}
