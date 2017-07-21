(function() {

    // Get the URL query string parameters
    //
    var url_params;
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        url_params = {};
        while (match = search.exec(query))
           url_params[decode(match[1])] = decode(match[2]);
    })();

    var use = 'use' in url_params ? url_params.use : "native";

    // Canvas context
    var canvas;
    function init_canvas() {
        if (use == 'fabric' || use == 'paths') {
            canvas = new fabric.Canvas('canvas');
            canvas.selection = false;
        }
        else {
            var canvas_el = document.getElementById('canvas');
            if (canvas_el.getContext) {
                canvas = canvas_el.getContext('2d');
            }
        }
    }

    var canvas_width = 1000,
        canvas_height = 1000;

    var num_rows = 'r' in url_params ? url_params.r - 0 : 20,
        num_cols = 'c' in url_params ? url_params.c - 0 : 20,
        wall_thickness = 'wt' in url_params ? url_params.wt - 0 : 10,
        color = 'clr' in url_params ? url_params.clr : 'red';

    var maze = {
        num_rows: num_rows,
        num_cols: num_cols,
        wall_thickness: wall_thickness,
        color: color,
        cell_width: (canvas_width - wall_thickness) / num_cols,
        cell_height: (canvas_height - wall_thickness) / num_rows,
        cells: [],   // 2d array of objects
        walls: []
    };

    var fabric_path = '';
    function draw_maze() {
        var walls = maze.walls;
        var num_walls = walls.length;
        for (var wn = 0; wn < num_walls; ++wn) {
            var w = walls[wn];
            if (w.exists) {
                draw_wall(w);
            }
        }
        if (use = 'paths') {
            console.info(fabric_path);
            var path = new fabric.Path(fabric_path);
            path.set({
                left: canvas_width / 2 + maze.cell_width / 2,
                top: canvas_height / 2 + maze.cell_height / 2,
                selectable: false,
                fill: "none",
                stroke: color,
                strokeWidth: wall_thickness,
                strokeLineCap: 'round'
            });
            canvas.add(path);
        }
    }

    function draw_wall(w) {
        put_wall(w, maze.color);
    }
    function erase_wall(w) {
        put_wall(w, "white");
    }
    function put_wall(w, color) {
        var cw = maze.cell_width,
            ch = maze.cell_height,
            o = w.orientation,
            wt = maze.wall_thickness;

        var left = cw * w.col;
        var top = ch * w.row;
        var width  = o == "horizontal" ? cw + wt : wt;
        var height = o == "horizontal" ? wt : ch + wt;

        if (use == 'fabric') {
            left += (o == "horizontal" ? (cw + wt) / 2 : wt / 2);
            top += (o == "horizontal" ? wt / 2 : (cw + wt) / 2);
            canvas.add(new fabric.Rect({
                selectable: false,
                left: left,
                top: top,
                width: width,
                height: height,
                fill: color
            }));
        }
        else if (use == 'paths') {
            fabric_path += 'M ' + left + ' ' + top + ' ' +
                'l ' + (o == 'horizontal' ? cw : 0) + ' ' +
                       (o == 'horizontal' ? 0 : cw) + ' ';
        }
        else {
            canvas.fillStyle = color;
            canvas.fillRect(left, top, width, height);
        }
    }


    function make_maze() {
        var num_rows = maze.num_rows;
        var num_cols = maze.num_cols;
        var num_cells = num_rows * num_cols;
        var cells = maze.cells;
        var walls = maze.walls;

        // Make the form sticky:
        $('#r').val(num_rows);
        $('#c').val(num_cols);
        $('#wt').val(wall_thickness);
        $('#clr').val(color);

        // First initialize the two-dimensional array of the cell objects
        for (var r = 0; r < num_rows; ++r) {
            var cell_row = cells[r] = [];
            for (var c = 0; c < num_cols; ++c) {
                var cell = cell_row[c] = {
                    visited: false,
                    walls: {}
                };
            }
        }

        // Now initialize the wall objects, such that all the walls
        // have "exists: 1".
        for (var r = 0; r < num_rows; ++r) {
            var cell_row = cells[r];
            for (var c = 0; c < num_cols; ++c) {
                var cell = cell_row[c];

                // Add cell walls, taking into account that cells share walls
                var cw = cell.walls;

                // north: if there is a cell to the north, that already has
                // a southern wall, then use that.
                if (r > 0 && cells[r-1][c].walls.S) {
                    cw.N = cells[r-1][c].walls.S;
                }
                else {
                    cw.N = {
                        exists: true,
                        orientation: 'horizontal',
                        row: r,
                        col: c
                    };
                    walls.push(cw.N);
                }

                // east
                if (c < num_cols - 1 && cells[r][c+1].walls.W) {
                    cw.E = cells[r][c+1].walls.W;
                }
                else {
                    cw.E = {
                        exists: true,
                        orientation: 'vertical',
                        row: r,
                        col: c+1
                    };
                    walls.push(cw.E);
                }

                // south
                if (r < num_rows - 1 && cells[r+1][c].walls.N) {
                    cw.S = cells[r+1][c].walls.N;
                }
                else {
                    cw.S = {
                        exists: true,
                        orientation: 'horizontal',
                        row: r+1,
                        col: c
                    };
                    walls.push(cw.S);
                }

                // west
                if (c > 0 && cells[r][c-1].walls.E) {
                    cw.W = cells[r][c-1].walls.E;
                }
                else {
                    cw.W = {
                        exists: true,
                        orientation: 'vertical',
                        row: r,
                        col: c
                    };
                    walls.push(cw.W);
                }
            }
        }
        // If you want to see it work while debugging, uncomment:
        //draw_maze();

        // Set the mole to a random place to start, and initialize start
        // and finish flags
        var got_start = false;
        var got_finish = false;
        var mole = {};
        var num_cells_visited = 0;

        // Move the mole into a specific cell
        function move_mole(row, col) {
            mole.r = row;
            mole.c = col;
            cells[row][col].visited = true;
            num_cells_visited++;
        }

        // Start in a random cell
        move_mole(Math.floor(Math.random() * num_rows),
                  Math.floor(Math.random() * num_cols));

        // When we hit a dead-end, "hop" the mole to a cell that we've
        // already visited.
        function hop_mole() {
            do {
                mole.r = Math.floor(Math.random() * num_rows);
                mole.c = Math.floor(Math.random() * num_cols);
            }
            while (!cells[mole.r][mole.c].visited);
        }

        // This says when we're done
        function done_digging() {
            return got_start && got_finish && num_cells_visited == num_cells;
        }

        // Start digging
        while (!done_digging()) {
            var r = mole.r;
            var c = mole.c;
            var cell = cells[r][c];

            // which directions can we go from here?
            var good_directions = [];
            // North?
            if ((r == 0 && !got_start) || (r > 0 && !cells[r-1][c].visited)) {
                good_directions.push('N');
            }
            // East?
            if (c < num_cols - 1 && !cells[r][c+1].visited) {
                good_directions.push('E');
            }
            // South?
            if ((r == num_rows-1 && !got_finish) ||
                (r < num_rows-1 && !cells[r+1][c].visited)) {
                good_directions.push('S');
            }
            // West?
            if (c > 0 && !cells[r][c-1].visited) {
                good_directions.push('W');
            }

            // Can we go anywhere?
            var num_dirs = good_directions.length;
            if (num_dirs == 0) {
                // No, we need to hop the mole
                hop_mole(mole);
            }
            else {
                // Pick one of those directions, and dig there
                var dir = good_directions[ Math.floor(Math.random() * num_dirs) ];
                // Clear the wall
                cell.walls[dir].exists = false;
                // If you want to see it work while debugging, uncomment:
                //erase_wall(cell.walls[dir]);
                // Move the mole
                if (dir == 'N') {
                    if (r == 0) {
                        got_start = true;
                        if (!done_digging()) hop_mole();
                    }
                    else {
                        move_mole(r-1, c);
                    }
                }
                else if (dir == 'E') {
                    move_mole(r, c+1);
                }
                else if (dir == 'S') {
                    if (r == num_rows - 1) {
                        got_finish = true;
                        if (!done_digging()) hop_mole();
                    }
                    else {
                        move_mole(r+1, c);
                    }
                }
                else if (dir = 'W') {
                    move_mole(r, c-1);
                }
            }
        }

        draw_maze();
    }

    // document ready function
    $(function() {
        init_canvas();
        make_maze();
    });
})();
