const controls = window;
const drawingUtils = window;
const mpFaceMesh = window;
const config = { locateFile: (file) => {
  let filename = `node_modules/@mediapipe/face_mesh/${file}`;
  //console.log(filename)
  return filename
} };
// Our input frames will come from here.
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const statsElement = document.getElementsByClassName('stats')[0];
const eyeLvlElement = document.getElementsByClassName('eyeLvl')[0];
const canvasCtx = canvasElement.getContext('2d');
let hiResCanvas = null
let capturing = 0
let downloadLink = document.createElement("a");
document.body.appendChild(downloadLink);
downloadLink.style = "display: none";
class HiddenCanvas{
  constructor(width, height){
    this.w = width;
    this.h = height
    this.canvas = new OffscreenCanvas(width, height)
    this.ctx = this.canvas.getContext("2d")
    this.ctx.scale(-1, 1)
  }

  captureImage(videoElm){
    if(capturing){
      return 
    }
    capturing = true
    console.log("draw")
    this.ctx.drawImage(videoElm, 0, 0, -this.w, this.h)
    console.log("convert")
    this.canvas.convertToBlob({type:"image/jpeg", quality:0.6}).then(blob=>{
      console.log("download")
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `selfie-r${Date.now()}.jpg`;
      console.log("click")
      downloadLink.click();
      window.URL.revokeObjectURL(url);
    })
    capturing = false
  }

}
/**
 * Solution options.
 */
const solutionOptions = {
    selfieMode: true,
    enableFaceGeometry: false,
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
};
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const metrics = {

}
function getDist(p1, p2){
  return 0
}
const GOLDEN_RATIO = 0.618
const GOLDEN_RATIO_2 = GOLDEN_RATIO * GOLDEN_RATIO
const GOLDEN_RATIO_4 = GOLDEN_RATIO_2 * GOLDEN_RATIO_2
function onResults(results) {
    window.requestAnimationFrame(runModel)
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
  //fpsControl.tick();
    // Draw the overlays.
  //canvasCtx.save();
  //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    let w = canvasElement.width
    let h = canvasElement.height
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          /*
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYE, { color: '#FF3030' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYE, { color: '#30FF30' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' });
            if (solutionOptions.refineLandmarks) {
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_IRIS, { color: '#30FF30' });
            }
            */
          let leftEyebrowDistance = getDist(landmarks[385], landmarks[295])
          let leftEyebrowDistance2 = getDist(landmarks[386], landmarks[282])
          let rightEyebrowDistance = getDist(landmarks[158], landmarks[65])
          let rightEyebrowDistance2 = getDist(landmarks[159], landmarks[52])
          // z pos
          // IPD should be 0.618^4 of video width
          let leftEyeCenter = (landmarks[476].x + landmarks[474].x)/2
          let rightEyeCenter = (landmarks[471].x + landmarks[469].x)/2
          let currentIPD = Math.abs(leftEyeCenter - rightEyeCenter)
          let idealIPD = GOLDEN_RATIO_4
          let ipdDiff = (currentIPD - idealIPD)/idealIPD/3
          let zPosIcon = ipdDiff < 0? " Closer "  : " Further " 
          let zPosOpacity = Math.abs(ipdDiff) > 0.1?1: Math.abs(ipdDiff)/0.1
          // X Rotate 
          // chin -> mouth vs chin -> eye ratio
          let chinTopLip = landmarks[152].y - landmarks[13].y
          let eyeLvl = (landmarks[133].y + landmarks[463].y)/2
          let chinEye = landmarks[152].y - eyeLvl
          let ideaEyeLip = 0.381
          let currentEyeLip = chinTopLip/chinEye
          let diff = currentEyeLip - ideaEyeLip
          let upDownIcon = diff>0? " ⬇️   "  : " ⬆️  " 
          let upDownOpacity = Math.abs(diff) > 0.1?1: Math.abs(diff)/0.1
          let mgTop = diff< 0? -150: 150
          // Y pos
          let eyeLvlDiff = (eyeLvl - GOLDEN_RATIO_2)/ GOLDEN_RATIO_2
          let yPosOpacity = Math.abs(eyeLvlDiff) > 0.5?1: Math.abs(eyeLvlDiff)/0.5
          // Y Rotate
          // 2 eyes should be same width
          let leftEyeWidth = landmarks[263].x - landmarks[362].x
          let rightEyeWidth = landmarks[133].x - landmarks[33].x
          let lrDiff =  (leftEyeWidth - rightEyeWidth)/leftEyeWidth
          let lrOpacity = Math.abs(lrDiff) > 0.2?1: Math.abs(lrDiff)/0.2
          let lrIcon = lrDiff < 0? " ⬅️   "  : " ➡️  " 
          let mgLeft = lrDiff < 0? -150: 150
          if(upDownOpacity < 0.025 && lrOpacity < 0.025){
            captureImage()
          }
          // Z rotate
          // should be 0
          statsElement.innerHTML= `
          <div style="opacity1:${upDownOpacity};
          position:absolute; top:${mgTop}px">
          ${upDownIcon} ${diff.toFixed(3)} </div>
          <div style="opacity1:${lrOpacity};
          position:absolute; left:${mgLeft}px">
          ${lrIcon} ${lrDiff.toFixed(3)} </div>
          <div style="opacity1:${zPosOpacity}; width: 120px;
          left:-60px;
          position:absolute;">
          ${zPosIcon} ${ipdDiff.toFixed(3)} </div>
            `
          eyeLvlElement.style.opacity= yPosOpacity
          
          return
          console.log({
            leftEyebrowDistance,
            rightEyebrowDistance,
            chinTopLip,
            chinEye,
          })
          
        }
    }
    canvasCtx.restore();
}
let currentStream;
function stopMediaTracks(stream) {
  if(!currentStream){
    return;
  }
  stream.getTracks().forEach(track => {
    track.stop();
  });
}
window.onChangeDevice = (e) => {
  const facing = e.target.value
  stopMediaTracks(currentStream)
  if(facing=="user"){
    videoElement.classList.add("selfie")
  } else {
    videoElement.classList.remove("selfie")
  }
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      height: {"ideal": 5000},
      width: {"ideal": 5000},
      facingMode:{"ideal": facing}
    }
  }).then((stream) => {
    currentStream=stream
    videoElement.srcObject = stream;
  }).catch(e=>{
    alert(e)
  });
}
window.captureImage = () => {
  document.getElementById("capture").disabled=true
  document.getElementById("input_video").classList.add("capturing")
  hiResCanvas.captureImage(videoElement)
  setTimeout(() => {
    document.getElementById("capture").disabled=false
    document.getElementById("input_video").classList.remove("capturing")
  }, 300)
}
const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);
// Attach the video stream to the video element and autoplay.
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    height: {ideal: 5000},
    width: {ideal: 5000},
    facingMode: { ideal: "user" }
  }
}).then((stream) => {
    currentStream = stream
    videoElement.srcObject = stream;
});
async function runModel(){
  let size = {
    height: videoElement.videoHeight,
    width: videoElement.videoWidth
  }
  if (size.height==0){
    window.requestAnimationFrame(runModel)
    return
  }
  if(hiResCanvas==null){
    hiResCanvas = new HiddenCanvas(size.width, size.height);
  }
  const aspect = size.height / size.width;
  let width, height;
  if (window.innerWidth > window.innerHeight) {
    height = window.innerHeight;
    width = height / aspect;
  }
  else {
    width = window.innerWidth;
    height = width * aspect;
  }
  canvasElement.width = width;
  canvasElement.height = height;
  await faceMesh.send({ image: videoElement});
}
runModel()
// Present a control panel through which the user can manipulate the solution
// options.
/*
new controls
    .ControlPanel(controlsElement, solutionOptions)
    .add([
    fpsControl,
    new controls.SourcePicker({
        onFrame: async (input, size) => {
          return
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await faceMesh.send({ image: input });
        },
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    faceMesh.setOptions(options);
});
*/
