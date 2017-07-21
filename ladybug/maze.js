(function() {

    // Get the URL query string parameters
    // Initialize with defaults
    var url_params = {
        d:   false,  // debug
        r:   20,     // number of rows
        c:   20,     // number of cols
        wt:  10,     // wall thickness
        clr: 'red',  // wall color
        nt:  false,  // don't leave breadcrumb trail
        s:   5,      // speed, from 0 - 9
        ns:  false,  // don't play sound effects
        je:  'easeInSine'   // jump easing (http://fabricjs.com/animation-easing/)
    };
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        while (match = search.exec(query)) {
            var k = decode(match[1]);
            var v = decode(match[2]);
            vlc = v.toLowerCase();
            if (k in url_params) {
                var t = typeof url_params[k];
                if (t == 'boolean') {
                    var first = vlc.substring(0, 1);
                    url_params[k] = (first == 't' || first == 'y');
                }
                else if (t == 'number') {
                    url_params[k] = v - 0;
                }
                else {  // string
                    url_params[k] = v;
                }
            }
        }
    })();

    // Initialize a bunch of stuff derived from the url params
    var debug = url_params.d,
        num_rows = url_params.r,
        num_cols = url_params.c,
        wall_thickness = url_params.wt,
        color = url_params.clr,
        leave_trail = !url_params.nt,
        speed = Math.min(Math.max(url_params.s, 0), 9),
        anim_duration_move = 5 + (9 - speed) * 100,  // speed of animation
        anim_duration_turn = anim_duration_move / 5,
        //no_sound = url_params.ns,
        // Turn sound off, because MediaController isn't supported by any browsers anymore
        no_sound = true,
        jump_easing = url_params.je;
    if (debug) console.info("speed is " + speed);

    // Function to make the form sticky.  This is called on document load
    function make_form_sticky() {
        // Make the form sticky:
        $('#r').val(num_rows);
        $('#c').val(num_cols);
        $('#wt').val(wall_thickness);
        $('#clr').val(color);
        $('#s').val(url_params.s);
        $('#nt').prop('checked', url_params.nt);
        $('#ns').prop('checked', url_params.ns);
    }


    // Initialize canvas context
    var canvas;
    function init_canvas() {
        canvas = new fabric.Canvas('canvas');
        canvas.selection = false;
    }

    var canvas_width = 1000,
        canvas_height = 1000;

    // Create audio context object
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audio_context = window.AudioContext ? new AudioContext() : null;


    // The music_controller, for the background music, will be initialized after
    // page load.
    var music_controller;

    // Load the sounds
    var sounds = {
        boing: {
            filename: 'try-audio/Boing-Low.mp3',
            buffer: null
        },
        squink: {
            filename: 'try-audio/squink.mp3',
            buffer: null
        },
        goal: {
            filename: 'try-audio/goal.mp3',
            buffer: null
        }
    };
    if (!no_sound) {
        var start_loading_sounds = new Date().getTime();
        if (debug) console.info("Starting to load sounds, " + start_loading_sounds);
        for (var sn in sounds) {
            if (debug) console.info("Loading " + sn);

            // Use an IIFE to make sure each request gets saved independently
            (function() {
                var request = new XMLHttpRequest();
                request.sound_name = sn;   // Save the sound name in the request object
                request.open('GET', sounds[sn].filename, true);
                request.responseType = 'arraybuffer';

                request.onload = function() {
                    var _sn = this.sound_name;
                    audio_context.decodeAudioData(request.response,
                        function(buffer) {  // success
                            if (debug) console.info("Successfully decoded " + _sn);
                            sounds[_sn].buffer = buffer;
                        },
                        function() {  // error
                            if (debug) console.info("Error trying to decode audio data: " + _sn);
                        }
                    );
                }
                request.send();
            })();
        }
    }
    function playSound(sound) {
        if (no_sound) return;
        var source = audio_context.createBufferSource();
        source.buffer = sounds[sound].buffer;
        source.connect(audio_context.destination);
        source.start(0);
    }

  /*
    function p() {
        console.info("playing");
        playSound('boing');
        window.setTimeout(p, 5000);
    }
    window.setTimeout(p, 5000);
  */

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

        if (debug) console.info(fabric_path);
        var path = new fabric.Path(fabric_path);
        path.set({
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            selectable: false,
            fill: "none",
            stroke: color,
            strokeWidth: wall_thickness,
            strokeLineCap: 'round'
        });
        canvas.add(path);
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

        fabric_path += 'M ' + left + ' ' + top + ' ' +
            'l ' + (o == 'horizontal' ? cw : 0) + ' ' +
                   (o == 'horizontal' ? 0 : ch) + ' ';
    }

    function make_maze() {
        var num_rows = maze.num_rows;
        var num_cols = maze.num_cols;
        var num_cells = num_rows * num_cols;
        var cells = maze.cells;
        var walls = maze.walls;

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
                        maze.start_col = c;
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
                        cell.finish = true;
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

        // Prepare the background music
        var music_elem = $('#audio');
        //music_controller = new MediaController;
        //music_elem[0].controller = music_controller;
        //music_controller.volume = 0.4;

        init_canvas();
        make_form_sticky();
        make_maze();
        var nr = maze.num_rows,
            nc = maze.num_cols,
            wt = maze.wall_thickness,
            cw = maze.cell_width,
            ch = maze.cell_height,
            cw_free = cw - wt,   // free space between walls
            ch_free = ch - wt,
            start_col = maze.start_col,
            sprite_size = Math.min(cw_free * 0.8, ch_free * 0.8);

        var sprite;
        var sprite_data = {
            row: 0,
            col: start_col,
            dir: 'S'
        };

        // This function computes the `left` and `top`, given a cell row and col
        function coords(row, col) {
            return {
                left: col * cw + (cw + wt)/2,
                top: row * ch + (ch + wt)/2
            };
        }

        // Call this function when the sprite image has finished loading
        function sprite_loaded(oImg) {
            sprite = oImg;
            var size = sprite_size;
            var start_coords = coords(0, maze.start_col);
            sprite.set({
                left: start_coords.left,
                top: start_coords.top,
                width: size,
                height: size,
                angle: 180
            });
            canvas.add(sprite);
            var animation_in_progress = false;

            $('body').on('keydown', function(evt) {
                var k = evt.keyCode;
                // Return if it's not one of the arrow keys
                if (k < 37 || k > 40) return true;

                // Return if our previous animation isn't finished yet
                if (animation_in_progress) return false;

                // Start the music if it isn't playing already
                //if (!no_sound && music_controller.playbackState != 'playing')
                //    music_controller.play();

                var dir,    // new direction
                    prop,   // property to animate
                    delta,  // amount to animate
                    angle,  // angle of the image, in degrees
                    new_cell;

                if (k == 37) {
                    dir = 'W';
                    prop = 'left';
                    delta = '-=' + cw;
                    angle = 270;
                }
                else if (k == 38) {
                    dir = 'N';
                    prop = 'top';
                    delta = '-=' + ch;
                    angle = 0;
                }
                else if (k == 39) {
                    dir = 'E';
                    prop = 'left';
                    delta = '+=' + cw;
                    angle = 90;
                }
                else {
                    dir = 'S';
                    prop = 'top';
                    delta = '+=' + ch;
                    angle = 180;
                }

                // Where are we, and can we go the way he wants?
                var r = sprite_data.row,
                    c = sprite_data.col,
                    cell = maze.cells[r][c],
                    can_move = false,
                    new_cell = null;

                if (!cell.walls[dir].exists) {
                    if (dir == 'W' && c != 0) {
                        can_move = true;
                        new_cell = maze.cells[r][c-1];
                    }
                    else if (dir == 'N' && r != 0) {
                        can_move = true;
                        new_cell = maze.cells[r-1][c];
                    }
                    else if (dir == 'E' && c != nc - 1) {
                        can_move = true;
                        new_cell = maze.cells[r][c+1];
                    }
                    else if (dir == 'S' && r != nr - 1) {
                        can_move = true;
                        new_cell = maze.cells[r+1][c];
                    }
                }
                if (debug) console.info("can_move = " + can_move);
                if (!can_move) playSound('boing');

                // Define a function that will handle the move (as opposed to the rotation)
                var animate_move = can_move ?
                    function() {
                        playSound('squink');
                        if (dir == 'W')
                            sprite_data.col--;
                        else if (dir == 'N')
                            sprite_data.row--;
                        else if (dir == 'E')
                            sprite_data.col++;
                        else
                            sprite_data.row++;

                        if (debug) {
                            console.info("Setting easing to " + jump_easing + ", %o",
                                         fabric.util.ease[jump_easing]);
                        }
                        sprite.animate(prop, delta, {
                            duration: anim_duration_move,
                            onChange: canvas.renderAll.bind(canvas),
                            easing: fabric.util.ease[jump_easing],
                            onComplete: function() {
                                animation_in_progress = false;
                                if (new_cell.finish) playSound('goal');
                            }
                        });
                        if (leave_trail && !cell.seen) {
                            if (debug) console.info("adding trail dot");
                            var dot_coords = coords(r, c);
                            var circle = new fabric.Circle({
                                radius: sprite_size/5,
                                fill: 'black',
                                left: dot_coords.left,
                                top: dot_coords.top
                            });
                            canvas.add(circle);
                            canvas.sendToBack(circle);
                            maze.cells[r][c].seen = true;
                        }
                    } :
                    function() {
                        animation_in_progress = false;
                        if (debug) console.info("sorry");
                    };

                if (debug) {
                    console.info("dir = " + dir + "\nprop = " + prop + "\ndelta = " + delta +
                    "\nangle = " + angle + "\nnew row = " + sprite_data.row +
                    "\nnew col = " + sprite_data.col);
                }

                // Do we need to change direction?
                animation_in_progress = true;
                if (sprite_data.dir != dir) {

                    // These next checks fix the problem when you rotate between 0 and 270 degrees,
                    // to make sure it doesn't go the long way around
                    if (sprite_data.dir == 'N' && dir == 'W') {
                        sprite.set('angle', 360);
                    }
                    else if (sprite_data.dir == 'W' && dir == 'N') {
                        sprite.set('angle', -90);
                    }

                    sprite_data.dir = dir;
                    sprite.animate('angle', angle, {
                        duration: anim_duration_turn,
                        onChange: canvas.renderAll.bind(canvas),
                        onComplete: animate_move
                    });
                }
                else {
                    animate_move();
                }

                return false;
            });

        };

        // Load the sprite image and kick things off
        fabric.Image.fromURL('ladybug_red-100.png', sprite_loaded);
    });
})();
