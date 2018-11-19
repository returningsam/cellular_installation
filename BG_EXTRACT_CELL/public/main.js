
/******************************************************************************/
/********************** UI ****************************************************/
/******************************************************************************/

function handleCalibButton(ev) {
    calibrating = !calibrating;
    if (calibrating)
        document.getElementById("c_button_text").innerHTML = "stop calibration";
    else
        document.getElementById("c_button_text").innerHTML = "calibrate";
}

function initUI() {
    document.getElementById("c_button").addEventListener("click",handleCalibButton);
}

/******************************************************************************/
/********************** VFX ***************************************************/
/******************************************************************************/


var container;
var camera, calibScene, blurScene, renderer, video, videoTexture;
var calibUniforms, blurUniforms;
var mainBuffer,feedbackBuffer;

var calibrating = true;

function initWebcam() {

    video = document.createElement('video');
    video.width = window.innerWidth*2;
    video.height = window.innerHeight*2;
    video.playbackRate = 3.0;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
        video.srcObject = stream;
        video.play();
    }).catch(function(err) {
        console.log("An error occured! " + err);
    });
}

function init() {
    initWebcam();
    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    videoTexture = new THREE.Texture(video);
    videoTexture.minFilter = THREE.LinearFilter;


    ////////////////////////////////////////////////////////////////////////////

    calibScene = new THREE.Scene();

    var calibGeometry = new THREE.PlaneBufferGeometry( 2, 2 );

    calibUniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        vid_texture: { type: "t", value: videoTexture },
        u_vid_dims: { type: "v2", value: new THREE.Vector2(video.videoWidth,video.videoHeight) },
        backbuffer: { type: "t", value: null },
        is_calib: {type: "b", value: calibrating}
    };

    var calibMaterial = new THREE.ShaderMaterial( {
        uniforms: calibUniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'calibFragShader' ).textContent
    } );

    var calibMesh = new THREE.Mesh( calibGeometry, calibMaterial );
    calibScene.add( calibMesh );

    calibMainBuffer = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    calibFeedbackBuffer = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });

    ////////////////////////////////////////////////////////////////////////////

    blurScene = new THREE.Scene();

    var blurGeometry = new THREE.PlaneBufferGeometry( 2, 2 );

    blurUniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        vid_texture: { type: "t", value: videoTexture },
        u_vid_dims: { type: "v2", value: new THREE.Vector2(video.videoWidth,video.videoHeight) },
        backbuffer: { type: "t", value: null },
        is_calib: {type: "b", value: calibrating}
    };

    var blurMaterial = new THREE.ShaderMaterial( {
        uniforms: blurUniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'blurFragShader' ).textContent
    } );

    var blurMesh = new THREE.Mesh( blurGeometry, blurMaterial );
    blurScene.add( blurMesh );

    ////////////////////////////////////////////////////////////////////////////

    cellularScene = new THREE.Scene();

    var cellularGeometry = new THREE.PlaneBufferGeometry( 2, 2 );

    cellularUniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        vid_texture: { type: "t", value: videoTexture },
        u_vid_dims: { type: "v2", value: new THREE.Vector2(video.videoWidth,video.videoHeight) },
        backbuffer: { type: "t", value: null },
        inputbuffer: { type: "t", value: null },
        is_calib: {type: "b", value: calibrating},
        u_mouse_down: {type: "b", value: false}
    };

    var cellularMaterial = new THREE.ShaderMaterial( {
        uniforms: cellularUniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'cellularFragShader' ).textContent
    } );

    var cellularMesh = new THREE.Mesh( cellularGeometry, cellularMaterial );
    cellularScene.add( cellularMesh );

    cellularInputBuffer = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    cellularMainBuffer = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    cellularFeedbackBuffer = new THREE.WebGLRenderTarget(window.innerWidth*2, window.innerHeight*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });

    ////////////////////////////////////////////////////////////////////////////



    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );

    document.onmousemove = function(e){
        calibUniforms.u_mouse.value.x = e.pageX;
        calibUniforms.u_mouse.value.y = e.pageY;

        blurUniforms.u_mouse.value.x  = e.pageX;
        blurUniforms.u_mouse.value.y  = e.pageY;

        cellularUniforms.u_mouse.value.x  = e.pageX;
        cellularUniforms.u_mouse.value.y  = e.pageY;
    }

    document.onmousedown = function (e) {
        console.log("click");
        cellularUniforms.u_mouse_down.value = true;
    }

    document.onmouseup = function (e) {
        console.log("click");
        cellularUniforms.u_mouse_down.value = false;
    }
}

function onWindowResize( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    calibUniforms.u_resolution.value.x = renderer.domElement.width;
    calibUniforms.u_resolution.value.y = renderer.domElement.height;
    blurUniforms.u_resolution.value.x = renderer.domElement.width;
    blurUniforms.u_resolution.value.y = renderer.domElement.height;
    cellularUniforms.u_resolution.value.x = renderer.domElement.width;
    cellularUniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function swapCalibBuffer() {
    var tempBuffer      = calibFeedbackBuffer;
    calibFeedbackBuffer = calibMainBuffer;
    calibMainBuffer     = tempBuffer;

    calibUniforms.backbuffer.value = calibFeedbackBuffer.texture;

    blurUniforms.backbuffer.value = calibMainBuffer.texture;
}

function swapCellularBuffer() {
    var tempBuffer         = cellularFeedbackBuffer;
    cellularFeedbackBuffer = cellularMainBuffer;
    cellularMainBuffer     = tempBuffer;

    cellularUniforms.inputbuffer.value = cellularInputBuffer.texture;

    cellularUniforms.backbuffer.value = cellularFeedbackBuffer.texture;
}

function updateUniforms() {
    calibUniforms.is_calib.value = calibrating;
    console.log(calibrating);
    calibUniforms.u_time.value += 1;
    calibUniforms.u_vid_dims.value.x = video.videoWidth;
    calibUniforms.u_vid_dims.value.y = video.videoHeight;

    blurUniforms.is_calib.value = calibrating;
    blurUniforms.u_time.value += 1;
    blurUniforms.u_vid_dims.value.x = video.videoWidth;
    blurUniforms.u_vid_dims.value.y = video.videoHeight;

    cellularUniforms.is_calib.value = calibrating;
    cellularUniforms.u_time.value += 0.05;
    cellularUniforms.u_vid_dims.value.x = video.videoWidth;
    cellularUniforms.u_vid_dims.value.y = video.videoHeight;
}

var videoReady = false;

function render() {


    if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
        videoTexture.needsUpdate = true;
        videoReady = true;
    }

    if (videoReady) {
        updateUniforms();
        if (calibrating) {
            renderer.render(calibScene, camera, calibMainBuffer, false);
            renderer.render(calibScene, camera);
            swapCalibBuffer();
        }
        else {
            renderer.render(calibScene, camera, calibMainBuffer, false);
            renderer.render(blurScene, camera, cellularInputBuffer, false);

            renderer.render(cellularScene, camera, cellularMainBuffer, false);
            renderer.render(cellularScene, camera);

            swapCellularBuffer();
        }
    }
}

window.onload = function () {
    init();
    initUI();
    animate();
}
