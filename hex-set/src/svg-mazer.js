import * as d3 from "d3";
import 'd3-selection-multi';
import {cw, ch, allDirections, hexSide, hexVertex} from './hex-maze.js';

export function draw(selector, maze, opts) {
  const width = opts.width || 1000;
  const height = opts.height || 1000;
  const rows = maze.rows;
  const cols = maze.cols;

  const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.querySelector(selector).appendChild(svgElem);
  const svg = d3.select('svg')
    .attrs({
      width: width,
      height: height,
    });

  const marginX = 10;
  const marginY = 10;
  const scaleX = (width - 2 * marginX) / (cols + 0.5) / cw;
  const scaleY = (height - 2 * marginY) / (rows + 0.25) / ch;
  const drawingArea = svg.append('g')
    .attr('transform', `translate(${marginX}, ${marginY}) scale(${scaleX}, ${scaleY})`);

  const round = num => Math.round(num*100000 + 0.1)/100000;
  const pathPoint = p => `${round(p[0])},${round(p[1])}`;
  function drawSeg(points) {
    const [start, end] = points;
    drawingArea.append('path')
      .attrs({
        d: `M${pathPoint(start)}L${pathPoint(end)}`,
        stroke: 'black',
        'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
  }

  function colorizeCell(cell, h, s, l, a) {
    const svgPath = allDirections.map(dir =>
      (dir === 0 ? 'M' : 'L') + pathPoint(hexVertex(cell.coords, dir)) + ' '
    ).join('') + 'Z';
    drawingArea.append('path')
      .attrs({
        d: svgPath,
        stroke: 'none',
        fill: `hsla(${h},${s},${l},${a}`,
      });
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

  // colorize
  maze.traverse(maze.startCell(), (cell, distance) => {
    const hue = (distance * 5) % 360;
    colorizeCell(cell, hue, '100%', '70%', 0.2);
  });
}