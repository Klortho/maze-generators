const PDFDocument = require('pdfkit');
const fs = require('fs');
const hsl = require('color-space/hsl');

import {allDirections, cellWidth, cellHeight, hexSide, hexVertex} from './hex-maze.js';

const round = num => Math.round(num*100000 + 0.1)/100000;
const pathPoint = p => `${round(p[0])} ${round(p[1])}`;

function drawSeg(doc, points) {
  const [start, end] = points;
  doc.write(`${pathPoint(start)} m ${pathPoint(end)} ls\n`);
}

// Computes the hue based on depth
const hue = depth => (depth*5)%360;

function colorCell(doc, cell) {
  doc.g(() => {
    const rgb = hsl.rgb([hue(cell.depth), 100, 70]);
    doc.setColor(rgb);
    const boundary = allDirections.map(dir =>
      pathPoint(hexVertex(cell.coords, dir)) + (dir === 0 ? ' m ' : ' l ')
    ).join('') + 'closepath fill';
    doc.write(boundary + '\n');
  })
}

class PSDocument {
  constructor(filename) {
    this.output = fs.createWriteStream(filename);
    this.output.write('%!PS-Adobe-1.0\n' +
      '%%Title: Hex maze\n' +
      '%%Pages: 49\n' +
      '%%EndComments\n' +
      '/m  {moveto} def\n' +
      '/ls {lineto stroke} def\n' +
      '/l  {lineto} def\n' +
      '%%EndProlog\n')
  }
  addPage(cb) {
    this.output.write('%%Page: 0-0\n');
    cb();
    this.output.write('showpage\n');
  }
  g(cb1) {
    this.output.write('gsave\n');
    cb1();
    this.output.write('grestore\n');
  }
  write(c) {
    this.output.write(c);
  }
  setColor(rgb) {
    this.output.write(`${rgb[0]} ${rgb[1]} ${rgb[2]} setrgbcolor\n`);
  }
  translate(x, y) {
    this.output.write(`${x} ${y} translate\n`);
  }
  scale(x, y) {
    this.output.write(`${x} ${y} scale\n`);
  }
}

export function draw(maze) {
  const width = maze.width;
  const height = maze.height;
  const rows = maze.rows;
  const cols = maze.cols;
  console.log(`Drawing, width: ${width}, height: ${height}, rows: ${rows}, cols: ${cols}`);

  const doc = new PSDocument('amazing.ps');

  // page geometry - in original coords
  const marginX = 36;
  const marginY = 36;
  const pageWidth = 540;
  const pageHeight = 720;

  // cell size in original coords
  const realCellWidth = width / (cols + 0.5);
  const realCellHeight = height / (rows + 0.25);

  const colsPerPage = Math.floor(pageWidth / realCellWidth);
  const rowsPerPage = Math.floor(pageHeight / realCellHeight);

  // scale factor - converts between original and scaled coordinates
  const scaleX = realCellWidth / cellWidth;
  const scaleY = realCellHeight / cellHeight;

  const pageCols = Math.floor(width / pageWidth) + 1;
  const pageRows = Math.floor(height / pageHeight) + 1;
  console.log(`margin: ${marginX}, ${marginY}; scale: ${scaleX}, ${scaleY}`);

  var pageCol, pageRow;
  for (pageCol = 0; pageCol < pageCols; ++pageCol) {
    for (pageRow = 0; pageRow < pageRows; ++pageRow) {
      doc.addPage(() => {
        doc.g(() => {
          doc.translate(marginX - pageCol * pageWidth, marginY - pageRow * pageHeight);
          doc.scale(scaleX, scaleY);

          // Draw each cell that falls within this page
          const startCol = pageCol * colsPerPage;
          const endCol = Math.min(cols, startCol + colsPerPage);
          const startRow = pageRow * rowsPerPage;
          const endRow = Math.min(rows, startRow + rowsPerPage);
          console.log(`page: startCol=${startCol}, endCol=${endCol}, ` +
            `startRow=${startRow}, endRow=${endRow}`);
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
        });
      });
    }
  }
}
