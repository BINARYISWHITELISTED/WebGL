main();

function main() {
  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Initialize WEBGL_draw_buffers extension, for writing from fragment shader to multiple texturres.
  var extDrawBuffers = gl.getExtension('WEBGL_draw_buffers');
  if (!extDrawBuffers) {
    alert("Failed to load extension: WEBGL_draw_buffers");
    return;
  }

  // // Create and bind a frame buffer for holding multiple textures as frames.
  // var frameBuffer = gl.createFramebuffer();
  // gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  //
  // var tx = [];
  // tx.push(gl.createTexture());
  // tx.push(gl.createTexture());
  // tx.push(gl.createTexture());
  // tx.push(gl.createTexture());
  // gl.bindTexture(gl.TEXTURE_2D, tx[0]);
  // gl.bindTexture(gl.TEXTURE_2D, tx[1]);
  // gl.bindTexture(gl.TEXTURE_2D, tx[2]);
  // gl.bindTexture(gl.TEXTURE_2D, tx[3]);
  //
  //
  // // Reserve enough space for the render target textures needed for deferred shading. Position, Normals, TextureColor, and Depth
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, extDrawBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tx[0], 0);
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, extDrawBuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, tx[1], 0);
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, extDrawBuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, tx[2], 0);
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, extDrawBuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, tx[3], 0);

  // TEMP
  // Set up initial shaders for testing
  // VERTEX SHADER
  const vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // FRGMENT SHADER
  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Compile and link shader program
  const shaderProgram = initShaders(gl, vsSource, fsSource);

  // Data structure for holing refrences to shader atrributes and uniforms
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  }

  const buffers = initBuffers(gl);

  drawScene(gl, programInfo, buffers);

}

// Create a shader program from vertex and fragment shader source.
function initShaders(gl, vertexShaderSource, fragmentShaderSource) {
  // Compile shader sources.
  const vertextShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Create shader program from linking the compiled shaders.
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertextShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Alert if program linking failed.
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;

}

// Read and compile a GLSL shader
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Load source into shader then compile.
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check if the shader compiled. Exit if there is a problem.
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// TEMP
// This function hard-codes in a square to shaders on.
function initBuffers(gl) {

  // The verticies of the object being rendered.
  const vertexBuffer = gl.createBuffer();

  // Bind vertex buffer so that changes can be made to it.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // TEMP
  // Square vertex positions
  const positions = [
    1.0,  1.0,
   -1.0,  1.0,
    1.0, -1.0,
   -1.0, -1.0,
 ];

  // Set the bound buffer to be the square vertex positions
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
   vertices: vertexBuffer,
  };

}

function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
