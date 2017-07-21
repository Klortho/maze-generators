/*
  See try-path.html
*/

(function() {
    var canvas;   // fabric object
    function init_canvas() {
        canvas = new fabric.Canvas('canvas');
    }

    function draw() {
        var path = new fabric.Path('M 0 0 L 200 100 l 170 300 ' +
            'M100,350 l 50,-25 a25,25 -30 0,1 50,-25 l 50,-25 ' +
            'a25,50 -30 0,1 50,-25 l 50,-25 ' +
            'a25,75 -30 0,1 50,-25 l 50,-25 ' +
            'a25,100 -30 0,1 50,-25 l 50,-25');
        path.set({
            left: 500,
            top: 500,
            fill: "none",
            stroke: "red",
            'stroke-width': 10
        });
        canvas.add(path);
    }

    // document ready function
    $(function() {
        init_canvas();
        draw();
    });
})();
