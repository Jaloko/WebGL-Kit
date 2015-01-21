var canvas;
var wk;

function init() {
	canvas = document.getElementById("canvas");
    wk = new WebGLKit(canvas);

    update();
}

function update() {
    render();
    requestAnimationFrame(update);
}

function render() {
    wk.clear();
    var colour = { r: 125, g: 0, b: 0, a: 255 };
    wk.drawPolygon(300, 300, 0, 8, 50, colour);
    wk.drawImage(100, 100, 50, 50, 0, "img/brick.png");
}