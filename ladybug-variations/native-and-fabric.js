/*
  See native-and-fabric.html
*/

(function() {
    var canvas_n;   // native canvas
    var canvas_f;   // fabric object
    function init_canvas() {
        canvas_n = document.getElementById('canvas').getContext('2d');
        canvas_f = new fabric.Canvas('canvas');
    }

    function draw() {
        // Draw a native rectangle
        canvas_n.fillStyle = "red";
        canvas_n.fillRect(0, 0, 1000, 1000);

        // Draw a fabric rectangle
        canvas_f.add(new fabric.Rect({
            left: 100,
            top: 100,
            width: 10,
            height: 50,
            fill: "blue"
        }));
    }

    // document ready function
    $(function() {
        init_canvas();
        draw();
    });
})();
