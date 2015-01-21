function Object(width, height, vertices, colour, textureURL) {
    this.width = width,
    this.height = height,
    this.vertices = vertices,
    this.colour = colour,
    this.textureURL = textureURL,
    this.textureIndex,
    this.bufferIndex
}

function WebGLKit(canvas) {
    this.gl,
    this.canvas = canvas,
    this.mvMatrix = mat4.create(),
    this.pMatrix = mat4.create(),
    this.mvMatrixStack = [],
    this.xOffset = 0,
    this.yOffset = 0,
    this.currentProgram,
    this.shaderPrograms = [];

    // Drawing arrays
    this.objects = [],
    this.objectBuffers = [],
    this.objectColourBuffers = [],
    this.objectTextureBuffers = [],

    this.textures = []

    // Init WebGL
    try {
        this.gl = this.canvas.getContext("webgl");
        this.gl.viewportWidth = canvas.width;
        this.gl.viewportHeight = canvas.height;
        this.gl.viewportRatio = canvas.width / canvas.height;
    } catch(e) {
    }
    if (!this.gl) {
        alert("Failed to initialize WebGL!");
    }

    // Init Base Shaders
    var basicVertexShader = getShaderFromVar(this.gl, webglkitMainVertShader, "Vert");
    var basicFragmentShader = getShaderFromVar(this.gl, webglkitColourFragShader, "Frag");
    var textureVertexShader = getShaderFromVar(this.gl, webglkitTextureVertShader, "Vert");
    var textureFragmentShader = getShaderFromVar(this.gl, webglkitTextureFragShader, "Frag");
    var shader1 = createShader(this.gl, shader1, false, basicVertexShader, basicFragmentShader);
    var shader2 = createShader(this.gl, shader2, true, textureVertexShader, textureFragmentShader);
    this.shaderPrograms.push(shader1);
    this.shaderPrograms.push(shader2);

    // Init matrices and prep GL
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    mat4.ortho(this.pMatrix, -this.gl.viewportRatio, this.gl.viewportRatio, -1.0, 1.0, 0.1, 100.0);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix, [-this.gl.viewportRatio , -1.0 , -1.0]);

    this.initPolygonBuffer = function(i) {
        for(var ii = i; ii >= 0; ii--) {
            if(this.objects[i] != this.objects[ii] && this.objects[i].vertices.length == this.objects[ii].vertices.length &&
                this.objects[i].width == this.objects[ii].width && this.objects[i].height == this.objects[ii].height
                && this.objects[i].colour.r == this.objects[ii].colour.r && this.objects[i].colour.g == this.objects[ii].colour.g 
                && this.objects[i].colour.b == this.objects[ii].colour.b && this.objects[i].colour.a == this.objects[ii].colour.a) {
                this.objects[i].bufferIndex = this.objects[ii].bufferIndex;
            } else if(ii == 0) {
                this.objects[i].bufferIndex = this.objectBuffers.length;
                this.objectBuffers[this.objectBuffers.length] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectBuffers[this.objects[i].bufferIndex]);

                var vertices = [];

                if(this.objects[i].textureURL != null) {
                    vertices = [
                        convertToMatrix(this.gl, this.objects[i].width, true), convertToMatrix(this.gl, this.objects[i].height, false),  0.0,
                        0,  convertToMatrix(this.gl, this.objects[i].height, false),  0.0,
                        convertToMatrix(this.gl, this.objects[i].width, true), 0,  0.0,
                        0, 0,  0.0,
                    ];
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

                } else {
                    for(var v = 0; v < this.objects[i].vertices.length; v++) {
                        vertices.push(convertToMatrix(this.gl, this.objects[i].vertices[v].x, true), 
                        convertToMatrix(this.gl, this.objects[i].vertices[v].y, false),
                        0.0);

                        if(v % 3 == 1) {
                            vertices.push(0.0, 0.0, 0.0); 
                        }
                    }
                    var validation = [7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52];
                    for(var val = 0; val < validation.length; val++) {
                        if(this.objects[i].vertices.length == validation[val]) {
                            vertices.push(0.0, 0.0, 0.0); 
                            break; 
                        }
                    }

                    vertices.push(convertToMatrix(this.gl, this.objects[i].vertices[0].x, true));
                    vertices.push(convertToMatrix(this.gl, this.objects[i].vertices[0].y, false));
                    vertices.push(0.0); 

                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
                }

                this.objectBuffers[this.objects[i].bufferIndex].itemSize = 3;
                this.objectBuffers[this.objects[i].bufferIndex].numItems = vertices.length / 3;  

                // Color vertices
                if(this.objects[i].textureURL == null) {
                    this.objectColourBuffers[this.objects[i].bufferIndex] = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectColourBuffers[this.objects[i].bufferIndex]);
                    colors = [];
                    for (var c = 0; c < vertices.length; c++) {
                      colors = colors.concat([this.objects[i].colour.r / 255, this.objects[i].colour.g / 255, this.objects[i].colour.b / 255, this.objects[i].colour.a / 255]);
                    }
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
                    this.objectColourBuffers[this.objects[i].bufferIndex].itemSize = 4;
                    this.objectColourBuffers[this.objects[i].bufferIndex].numItems = vertices.length / 3;
                } else {
                    this.objectTextureBuffers[this.objects[i].bufferIndex] = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectTextureBuffers[this.objects[i].bufferIndex]);
                    var textureCoords = [
                        1.0, 1.0,
                        0.0, 1.0,
                        1.0, 0.0, 
                        0.0, 0.0,
                    ];
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
                    this.objectTextureBuffers[this.objects[i].bufferIndex].itemSize = 2;
                    this.objectTextureBuffers[this.objects[i].bufferIndex].numItems = 4;
                }
            }
        }
    },
    this.assignTextureIndices = function(i) {
        var self = this;
        var createNew = true;
        for(var t = 0; t < this.textures.length; t++) {
            // Required for the equals check bellow
            var temp = this.gl.createTexture();
            temp.image = new Image();
            temp.image.src = this.objects[i].textureURL;
            //
            if(temp.image.src == this.textures[t].image.src) {
                this.objects[i].textureIndex = t;
                createNew = false;
                break;
            }
        }
        if(createNew == true) {
            var texture = this.gl.createTexture();
            this.textures.push(texture);
            this.textures[this.textures.length -1].image = new Image();
            this.textures[this.textures.length -1].image.onload = function() {
                for(var i = 0; i < self.textures.length; i++) {
                    if(self.textures[i].hasLoaded == false) {
                        self.handleLoadedTexture(self.textures[i]);
                        break; 
                    } 
                }
            }
            this.textures[this.textures.length -1].image.src = this.objects[i].textureURL; 
            this.textures[this.textures.length -1].hasLoaded = false;
            this.objects[i].textureIndex = this.textures.length -1;
        }
    },
    this.handleLoadedTexture = function(texture) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        texture.hasLoaded = true;
    },
    this.renderObject = function(x, y, rotation, i) {
        this.setCurrentShaderProgram(this.shaderPrograms[0]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectBuffers[this.objects[i].bufferIndex]);
        this.gl.vertexAttribPointer(this.currentProgram.vertexPositionAttribute, this.objectBuffers[this.objects[i].bufferIndex].itemSize, this.gl.FLOAT, false, 0, 0);

        if(this.objects[i].textureURL == null) {
            this.setCurrentShaderProgram(this.shaderPrograms[0]);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectColourBuffers[this.objects[i].bufferIndex]);
            this.gl.vertexAttribPointer(this.shaderPrograms[0].vertexColorAttribute, this.objectColourBuffers[this.objects[i].bufferIndex].itemSize, this.gl.FLOAT, false, 0, 0);
            var matrixPos = convertVertToMatrix(this.gl, x, y);
            mat4.translate(this.mvMatrix, this.mvMatrix, [matrixPos.x, matrixPos.y, 0.0]);
            this.mvPushMatrix();
            mat4.rotate(this.mvMatrix, this.mvMatrix, degToRad(rotation), [0, 0, 1]);
            this.setMatrixUniforms(this.shaderPrograms[0]);  
        } else {
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
            this.setCurrentShaderProgram(this.shaderPrograms[1]);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.objectTextureBuffers[this.objects[i].bufferIndex]);
            this.gl.vertexAttribPointer(this.currentProgram.textureCoordAttribute, this.objectTextureBuffers[this.objects[i].bufferIndex].itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.objects[i].textureIndex]);
            this.gl.uniform1i(this.currentProgram.samplerUniform, 0); 
            var matrixPos = convertVertToMatrix(this.gl, x, y);
            var matrixX = convertToMatrix(this.gl, this.objects[i].width / 2, true);
            var matrixY = convertToMatrix(this.gl, this.objects[i].height / 2, false);
            mat4.translate(this.mvMatrix, this.mvMatrix, [matrixPos.x, matrixPos.y, 0.0]);
            this.mvPushMatrix();
            // Move matrix to center of shape
            mat4.translate(this.mvMatrix, this.mvMatrix, [matrixX, matrixY, 0.0]);
            mat4.rotate(this.mvMatrix, this.mvMatrix, degToRad(rotation), [0, 0, 1]);
            mat4.translate(this.mvMatrix, this.mvMatrix, [-matrixX, -matrixY, 0.0]);
            this.setMatrixUniforms(this.shaderPrograms[1]); 
        }
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.objectBuffers[this.objects[i].bufferIndex].numItems);
        this.mvPopMatrix();
        mat4.translate(this.mvMatrix, this.mvMatrix, [-matrixPos.x, -matrixPos.y, 0.0]); 
        this.gl.disable(this.gl.BLEND);
    },
    this.setClearColour = function(r, g, b, a) {
        this.gl.clearColor(r / 255, g / 255, b / 255, a / 255);
    },
    this.clear = function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    },
    this.drawPolygon = function(x, y, rotation, numberOfVertices, faceSize, colour) {
        if(numberOfVertices < 3) {
            console.log("Error: To create a polygon it must have at least 3 vertices!");
        } else {           
            var index = null;
            for(var o = 0; o < this.objects.length; o++) {
                if(this.objects[o].width == faceSize && this.objects[o].height == faceSize && 
                    this.objects[o].vertices.length == numberOfVertices && this.objects[o].colour.r == colour.r &&
                    this.objects[o].colour.g == colour.g && this.objects[o].colour.b == colour.b && 
                    this.objects[o].colour.a == colour.a) {
                    index = o;
                }
            }
            if(index == null) {
                var polygonVertices = [];
                for(var i = 0; i < numberOfVertices; i++) {
                    polygonVertices.push( { x: (Math.sin(i/numberOfVertices*2*Math.PI) * faceSize), y: (Math.cos(i/numberOfVertices*2*Math.PI) * faceSize)} );
                }  

                this.objects.push(new Object(faceSize, faceSize, polygonVertices, colour)); 
                this.initPolygonBuffer(this.objects.length - 1);  
            } else {
                this.renderObject(x, y, rotation, index);
            }
        }
    },
    this.drawImage = function(x, y, width, height, rotation, textureURL) {
        var index = null;
        for(var o = 0; o < this.objects.length; o++) {
            if(this.objects[o].textureURL == textureURL && this.objects[o].width == width && 
                this.objects[o].height == height) {
                index = o;
            }
        }
        if(index == null) {
            var polygonVertices = [
                {x: 0, y: 0},
                {x: 0, y: height},
                {x: width, y: height},
                {x: width, y: 0}
            ];
            var colour ={
                r: null,
                g: null,
                b: null,
                a: null
            }
            this.objects.push(new Object(width, height, polygonVertices, colour, textureURL)); 
            this.initPolygonBuffer(this.objects.length - 1);  
            this.assignTextureIndices(this.objects.length - 1);
        } else {
            this.renderObject(x, y, rotation, index);
        }
    }
    this.setCurrentShaderProgram = function(shaderProgram) {
        this.gl.useProgram(shaderProgram);
        this.currentProgram = shaderProgram;
    },
    this.setMatrixUniforms = function(shaderProgram) {
        this.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
        this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    }, 
    this.mvPushMatrix = function() {
        var copy = mat4.create();
        mat4.copy(copy, this.mvMatrix);
        this.mvMatrixStack.push(copy);  
    },
    this.mvPopMatrix = function() {
        if (this.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        this.mvMatrix = this.mvMatrixStack.pop();
    }
}

var getShaderFromHTML = function(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
    if (k.nodeType == 3)
        str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var getShaderFromVar = function(gl, shaderSrc, type) {
    var shader;
    if(type == "Vert" || type == "Vertex" || type == "VertexShader") {
        shader = gl.createShader(gl.VERTEX_SHADER);  
    } else if(type == "Frag" || type == "Fragment" || type == "FragmentShader") {
        shader = gl.createShader(gl.FRAGMENT_SHADER); 
    } else {
        console.log("Error: Cannot get shader. Invalid type provided.");
        return;
    }
    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

var createShader = function(gl, shaderProgram, isTextureShader, vertexShader, fragmentShader) {
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shader: " + shaderProgram);
    }
    gl.useProgram(shaderProgram);
    if(isTextureShader == true) {
        enableTextureShaderAttribs(gl, shaderProgram);  
    } else {
        enableRegularShaderAttribs(gl, shaderProgram);  
    }
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    return shaderProgram;
}

var enableRegularShaderAttribs = function(gl, shaderProgram) {
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

var enableTextureShaderAttribs = function(gl, shaderProgram) {
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
}

var convertToMatrix = function(gl, value, isWidth) {
    if(isWidth == true) {
        return (value / gl.viewportWidth * gl.viewportRatio * 2);
    } else {
        return (value / gl.viewportHeight * 2);
    }
}

var convertVertToMatrix = function(gl, x, y) {
    return verts = { x: x / gl.viewportWidth * gl.viewportRatio * 2, y: y / gl.viewportHeight * 2 };
}

var degToRad = function(degrees) {
    return degrees * Math.PI / 180;
}

