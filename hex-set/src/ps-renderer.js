const PDFDocument = require('pdfkit');
const fs = require('fs');

import {round} from './utils.js';
import {allDirections, cellWidth, cellHeight, hexSide, hexVertex} from './hex-maze.js';

export var debug = false;

const pathPoint = p => `${round(p[0])} ${round(p[1])}`;

function drawSeg(doc, points) {
  const [start, end] = points;
  doc.print(`${pathPoint(start)} m ${pathPoint(end)} ls`);
}

// Computes the hue based on depth
const hue = depth => ((depth * 5) % 360) / 360;

function colorCell(doc, cell) {
  doc.g(() => {
    doc.setColor(hue(cell.depth), 0.1, 1);
    const boundary = allDirections.map(dir =>
      pathPoint(hexVertex(cell.coords, dir)) + (dir === 0 ? ' m ' : ' l ')
    ).join('') + 'closepath fill';
    doc.print(boundary);
  })
}

class PSDocument {
  constructor(filename, numPages) {
    this.indentWidth = debug ? 2 : 0;
    this.indentLevel = 0;
    this.currentIndent = '';

    this.output = fs.createWriteStream(filename);
    this.print(
      '%!PS-Adobe-1.0',
      '%%Title: Hex maze',
      `%%Pages: ${numPages}`,
      '%%EndComments',
      '',
      '/m  {moveto} def',
      '/ls {lineto 0.15 setlinewidth stroke} def',
      '/l  {lineto} def',
      '',
      '%%EndProlog');
  }

  // Helper that sets currentIndent based on other params
  _setIndent() {
    this.currentIndent = ' '.repeat(this.indentWidth * this.indentLevel);
    return this;
  }

  indent() {
    this.indentLevel++;
    return this._setIndent();
  }
  undent() {
    this.indentLevel--;
    return this._setIndent();
  }


  addPage(num, cb) {
    this.print('', `%%Page: ${num}`);
    this.indent();
    cb();
    this.undent();
    return this.print('showpage');
  }

  g(cb) {
    this.print('gsave');
    this.indent();
    cb();
    this.undent();
    return this.print('grestore');
  }

  setColor(h, s, b) {
    return this.print(`${round(h)} ${round(s)} ${round(b)} sethsbcolor`);
  }

  translate(x, y) {
    return this.print(`${x} ${y} translate`);
  }

  scale(x, y) {
    return this.print(`${round(x)} ${round(y)} scale`);
  }

  setlinewidth(lw) {
    return this.print(`${lw} setlinewidth`);
  }

  print(...lines) {
    lines.forEach(line => {
      this.output.write(this.currentIndent + line + '\n');
    })
    return this;
  }
}

export function draw(maze) {
  const width = maze.width;
  const height = maze.height;
  const rows = maze.rows;
  const cols = maze.cols;
  //console.log(`Drawing, width: ${width}, height: ${height}, rows: ${rows}, cols: ${cols}`);

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
  //console.log(`margin: ${marginX}, ${marginY}; scale: ${scaleX}, ${scaleY}`);

  const doc = new PSDocument('amazing.ps', pageCols * pageRows);


  var pageCol, pageRow;
  for (pageCol = 0; pageCol < pageCols; ++pageCol) {
    for (pageRow = 0; pageRow < pageRows; ++pageRow) {
      doc.addPage(`${pageCol},${pageRow}`, () => {
        doc.g(() => {
          doc.translate(marginX - pageCol * pageWidth, marginY - pageRow * pageHeight)
             .scale(scaleX, scaleY)
             .setlinewidth(0.15);

          // Draw each cell that falls within this page
          const startCol = Math.max(0, pageCol * colsPerPage - 3);
          const endCol = Math.min(cols, startCol + colsPerPage + 6);
          const startRow = Math.max(0, pageRow * rowsPerPage - 3);
          const endRow = Math.min(rows, startRow + rowsPerPage + 6);
          //console.log(`page: startCol=${startCol}, endCol=${endCol}, ` +
          //  `startRow=${startRow}, endRow=${endRow}`);
          for (var c = startCol; c < endCol; ++c) {
            for (var r = startRow; r < endRow; ++r) {
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
