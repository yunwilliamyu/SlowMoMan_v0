"use strict";

var occupancyArray = false;
function blankOccupancyArray() {
    occupancyArray = new Array(width)
    for (var i=0; i<width; i++) {
        occupancyArray[i] = new Array(height);
        for (var j=0; j<height; j++) {
            occupancyArray[i][j] = [];
        }
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function listLabels(data) {
    var C = [];
    for (var i=0; i<data.length; i++) {
        if (data[0].length>2) {
            C[i] = data[i][2];
        }
    }
    var unique = C.filter( onlyUnique);
    return unique;
}

function drawEmbedding(canvas, data) {
    // data must be an array of 2D points
    var height = canvas.height;
    var width = canvas.width;

    var X = [];
    var Y = [];
    var C = [];
    for (var i=0; i<data.length; i++) {
        var pair = data[i];
        X[i]=Number(pair[0]);
        Y[i]=Number(-1*pair[1]); // Flip the Y-coordinate to force canvas to match normal mathematical orientation
        if (pair.length > 2) {
            C[i]=color_picker(pair[2]);
        } else {
            C[i]="#FF00FF";
        }
    }

    var x_min = Math.min(...X);
    var x_max = Math.max(...X);
    var x_mean = (x_max + x_min)/2;
    var x_int = x_max - x_min;
    x_int = x_int * 1.1;
    var y_min = Math.min(...Y);
    var y_max = Math.max(...Y);
    var y_mean = (y_max + y_min)/2;
    var y_int = y_max - y_min;
    y_int = y_int * 1.1;

    var ctx = canvas.getContext("2d");
    var canvasData = ctx.getImageData(0,0,canvas.width, canvas.height);

    var x2 = 0;
    var y2 = 0;
    for (var i = 0; i < data.length; i++) {
        x2 = Math.floor(width * (X[i]-x_mean)/x_int + width/2);
        y2 = Math.floor(height* (Y[i]-y_mean)/y_int + height/2);
        var pair = data[i];
        // Make the pixel 2x2 instead of 1x1
        draw1x1(canvasData, width, x2, y2, C[i]);
        draw1x1(canvasData, width, x2+1, y2, C[i]);
        draw1x1(canvasData, width, x2, y2+1, C[i]);
        draw1x1(canvasData, width, x2+1, y2+1, C[i]);

        // Stores all the items that ended up in a pixel

        occupancyArray[x2][y2].push(i);
    }
    ctx.putImageData(canvasData, 0, 0);
}

function draw1x1(canvasData, width, x, y, c) {
    var index = (x + y * width) * 4;
    var color_choice = hexToRgb(c);
    canvasData.data[index + 0] = color_choice.r;
    canvasData.data[index + 1] = color_choice.g;
    canvasData.data[index + 2] = color_choice.b;
    canvasData.data[index + 3] = 255;
}

function neighbor_shell(x, y, r) {
    // Gives a shell of all neighboring points within distance r
    var ans = [];
    var xpos = 0;
    var ypos = 0;
    // First test all boxes in a giant rectangle
    for (var i=-1*Math.ceil(r); i<Math.ceil(r); i++) {
        for (var j=-1*Math.ceil(r); j<Math.ceil(r); j++) {
            xpos = x + i;
            ypos = y + j;
            if (xpos >= 0 && xpos < width && ypos >= 0 && ypos < height &&
                Math.sqrt(i*i + j*j) < r) {
                ans.push([xpos, ypos]);
            }
        }
    }
    return ans;
}

function drawLine(canvas, Y, color) {
    var ctx = canvas.getContext("2d");
    var max = Math.max(...Y);
    var min = Math.min(...Y);
    var range = 2*Math.max(Math.abs(max), Math.abs(min)) + 1;
    var mean = 0;

    var y, y2 = 0;
    var height = canvas.height;
    var Y2 = new Array();
    for (var x=0; x<Y.length; x++) {
        y = Y[x];
        y2 = height * (y-mean)/range + height/2;
        y2 = height - y2;
        Y2.push(y2);
    }
    ctx.beginPath();
    ctx.fillStyle=color;
    ctx.strokeStyle=color;
    ctx.lineWidth=1;
    ctx.moveTo(0,Y2[0]);
    for (var x=1; x<Y2.length; x++) {
        ctx.lineTo(x, Y2[x]);
    }
    ctx.stroke();
    ctx.closePath();
}

