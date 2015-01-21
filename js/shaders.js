var webglkitMainVertShader = 
	"attribute vec3 aVertexPosition;" +
	"attribute vec4 aVertexColor;" +
	"uniform mat4 uMVMatrix;" +
	"uniform mat4 uPMatrix;" +
	"varying vec4 vColor;" +
	"void main(void) {" +
		"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);" +
		"vColor = aVertexColor;" +
	"}";
	
var webglkitColourFragShader = 
	"precision mediump float;" +
	"varying vec4 vColor;" +
	"void main(void) {" +
		"gl_FragColor = vColor;" +
	"}";

var webglkitTextureFragShader = 
	"precision mediump float;" +
	"varying vec2 vTextureCoord;" +
	"uniform sampler2D uSampler;" +
	"void main(void) {" +
		"gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));" +
	"}";

var webglkitTextureVertShader = 
	"attribute vec3 aVertexPosition;" +
  	"attribute vec2 aTextureCoord;" +
	"uniform mat4 uMVMatrix;" +
	"uniform mat4 uPMatrix;" +
	"varying vec2 vTextureCoord;" +
	"void main(void) {" +
		"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);" +
		"vTextureCoord = aTextureCoord;" +
	"}";