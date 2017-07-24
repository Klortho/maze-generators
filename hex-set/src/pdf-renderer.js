const PDFDocument = require('pdfkit');
const fs = require('fs');
const hsl = require('color-space/hsl');

import {allDirections, cellWidth, cellHeight, hexSide, hexVertex} from './hex-maze.js';

const round = num => Math.round(num*100000 + 0.1)/100000;
const pathPoint = p => `${round(p[0])},${round(p[1])}`;

function drawSeg(doc, points) {
  const [start, end] = points;
  doc.path(`M${pathPoint(start)}L${pathPoint(end)}`)
     .lineWidth(0.05)
     .lineCap('round')
     .stroke();
}

// Computes the hue based on depth
const hue = depth => (depth*5)%360;

function colorCell(doc, cell) {
  const svgPath = allDirections.map(dir =>
    (dir === 0 ? 'M' : 'L') + pathPoint(hexVertex(cell.coords, dir)) + ' '
  ).join('') + 'Z';
  const rgb = hsl.rgb([hue(cell.depth), 100, 70]);
  doc.path(svgPath)
     .lineWidth(0)
     .fillOpacity(0.2)
     .fill(rgb);
}

export function draw(maze) {
  const width = maze.width || 500;
  const height = maze.height || 500;
  const rows = maze.rows;
  const cols = maze.cols;
  console.log(`Drawing, width: ${width}, height: ${height}, rows: ${rows}, cols: ${cols}`);

  const doc = new PDFDocument({autoFirstPage: false});
  doc.pipe(fs.createWriteStream('amazing.pdf'));

  const marginX = 36;
  const marginY = 36;
  const pageWidth = 720; // 10 inches in pts
  const pageHeight = 540;
  const realCellWidth = width / (cols + 0.5);
  const realCellHeight = height / (rows + 0.25);
  const scaleX = realCellWidth / cellWidth;
  const scaleY = realCellHeight / cellHeight;
  const colsPerPage = Math.floor(pageWidth / realCellWidth);
  const rowsPerPage = Math.floor(pageHeight / realCellHeight);

  const pageCols = Math.floor(width / pageWidth) + 1;
  const pageRows = Math.floor(height / pageHeight) + 1;
  console.log(`margin: ${marginX}, ${marginY}; scale: ${scaleX}, ${scaleY}`);

  var pageCol, pageRow;
  for (pageCol = 0; pageCol < pageCols; ++pageCol) {
    for (pageRow = 0; pageRow < pageRows; ++pageRow) {
      doc.addPage({
        size: 'letter',
        layout: 'landscape',
      })
      doc.save()
         .translate(marginX, marginY)
         .translate(-pageCol * pageWidth, -pageRow * pageHeight)
         //.translate(-100 * pageCol, -100 * pageRow)
         .scale(scaleX, scaleY);

      // Draw each cell that falls within this page
      const startCol = pageCol * colsPerPage;
      const endCol = Math.min(cols, startCol + colsPerPage);
      const startRow = pageRow * rowsPerPage;
      const endRow = Math.min(rows, startRow + rowsPerPage);
      console.log(`page: startCol=${startCol}, endCol=${endCol}, ` +
        `startRow=${startRow}, endRow=${endRow}`);
      //for (var c = startCol; (c < startCol + colsPerPage) && (c < cols); ++c) {
        //for (var r = startRow; (r < startRow + rowsPerPage) && (r < rows); ++r) {
      for (var c = 0; c < cols; ++c) {
        for (var r = 0; r < rows; ++r) {
          const coords = [r, c];
          const cell = maze.fetchCell(coords);
          allDirections.forEach(dir => {
            if (cell.hasWall(dir)) drawSeg(doc, hexSide(coords, dir));
          });
          colorCell(doc, cell);
        }
      }
      doc.restore();
    }
  }
  doc.end();
}
