let model;
let webcamStream = null;
let isPredicting = false;
let currentMode = "webcam";
let predictionHistoryBuffer = [];
const SMOOTHING_FRAMES = 8; // smooth over last 8 frames for stable expression
let lastTopExpression = "";

const imageUpload = document.getElementById("imageUpload");
const uploadedPreview = document.getElementById("uploadedPreview");
const webcam = document.getElementById("webcam");
const placeholderState = document.getElementById("placeholderState");
const modelStatus = document.getElementById("modelStatus");
const cameraMessage = document.getElementById("cameraMessage");
const predictionList = document.getElementById("predictionList");
const topClass = document.getElementById("topClass");
const topConfidence = document.getElementById("topConfidence");
const predictionState = document.getElementById("predictionState");
const currentModeText = document.getElementById("currentModeText");
const classCount = document.getElementById("classCount");
const historyBox = document.getElementById("historyBox");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const expressionEmoji = document.getElementById("expressionEmoji");

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/P8bbHDV3K/";

function getEmojiForExpression(expr) {
    const e = expr.toLowerCase();
    if (e.includes("happy")) return "😁";
    if (e.includes("sad")) return "😢";
    if (e.includes("angry")) return "😡";
    if (e.includes("surprise")) return "😲";
    if (e.includes("neutral")) return "😐";
    return "🧐";
}

imageUpload.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    switchMode("upload");

    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedPreview.onload = async () => {
            setMessage("Image loaded. Analyzing...", "info");
            await classifyUploadedImage();
        };
        uploadedPreview.src = e.target.result;
        uploadedPreview.classList.remove("hidden");
        webcam.classList.add("hidden");
        placeholderState.classList.add("hidden");
    };
    reader.readAsDataURL(file);
});

async function loadModel() {
    try {
        if (!MODEL_URL || MODEL_URL.includes("YOUR_MODEL_ID")) {
            setMessage("Please add your Model URL in app.js", "error");
            modelStatus.textContent = "URL Missing";
            return;
        }

        const modelJSON = MODEL_URL + "model.json";
        const metadataJSON = MODEL_URL + "metadata.json";
        
        console.log("Loading hosted model from:", MODEL_URL);
        model = await tmImage.load(modelJSON, metadataJSON);
        
        classCount.textContent = model.getTotalClasses();
        modelStatus.textContent = "Model Connected";
        modelStatus.className = "status-chip success";
        setMessage("Connected to Teachable Machine.", "success");
    } catch (error) {
        modelStatus.textContent = "Connection Error";
        modelStatus.className = "status-chip loading";
        setMessage("Failed to connect to hosted model URL.", "error");
        console.error("Hosted Model Error:", error);
    }
}

function setMessage(text, type = "info") {
    cameraMessage.textContent = text;
    cameraMessage.className = `message-box ${type}`;
}

function switchMode(mode) {
    currentMode = mode;
    currentModeText.textContent = mode === "webcam" ? "Webcam" : "Upload";

    document.getElementById("webcamTab").classList.toggle("active", mode === "webcam");
    document.getElementById("uploadTab").classList.toggle("active", mode === "upload");

    if (mode === "webcam") {
        uploadedPreview.classList.add("hidden");
        if (!webcamStream) {
            placeholderState.classList.remove("hidden");
            webcam.classList.add("hidden");
        }
    } else {
        stopCamera();
        webcam.classList.add("hidden");
        
        if (uploadedPreview.getAttribute("src")) {
            uploadedPreview.classList.remove("hidden");
            placeholderState.classList.add("hidden");
        } else {
            uploadedPreview.classList.add("hidden");
            placeholderState.classList.remove("hidden");
        }
    }
}

async function startCamera() {
    switchMode("webcam");

    try {
        const constraints = { video: true, audio: false };
        webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = webcamStream;
        
        webcam.onloadeddata = () => {
            webcam.play();
            webcam.classList.remove("hidden");
            uploadedPreview.classList.add("hidden");
            placeholderState.classList.add("hidden");
            
            setMessage("Camera Live.", "success");
            predictionState.textContent = "Live";
            startPredictionLoop();
        };

    } catch (error) {
        setMessage("Camera access denied.", "error");
        predictionState.textContent = "Error";
        console.error("Camera Error:", error);
    }
}

function stopCamera() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    isPredicting = false;
    webcam.srcObject = null;
    webcam.classList.add("hidden");

    if (currentMode === "webcam") {
        placeholderState.classList.remove("hidden");
    }

    setMessage("Camera Stopped.", "info");
    predictionState.textContent = "Stopped";
}

async function startPredictionLoop() {
    if (!model || !webcamStream) return;

    isPredicting = true;
    predictionHistoryBuffer = []; 

    const loop = async () => {
        if (!isPredicting || !webcamStream) return;
        
        try {
            if (webcam.readyState === 4) {
                // Webcam feed should be flipped horizontally for user perception
                await runPrediction(webcam, true); 
            }
        } catch (e) {
            console.warn("Loop error:", e);
        }
        
        if (isPredicting) {
            requestAnimationFrame(loop);
        }
    };
    
    requestAnimationFrame(loop);
}

async function classifyUploadedImage() {
    if (!model) return;
    if (!uploadedPreview.src) {
        setMessage("Please upload an image first.", "error");
        return;
    }

    try {
        predictionState.textContent = "Analyzing...";
        // Final decoding check
        if (uploadedPreview.decode) await uploadedPreview.decode();
        
        // Use a standardized canvas capture for the model
        // Teachable Machine Image models expect 224x224
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(uploadedPreview, 0, 0, 224, 224);
        
        // Pass false for 'flip' (it's a photo)
        await runPrediction(canvas, false);
        predictionState.textContent = "Analysis Done";
    } catch (e) {
        console.error("Analysis Error:", e);
        setMessage("Failed to analyze image.", "error");
    }
}

async function runPrediction(sourceElement, flip = false) {
    try {
        if (!model) return;
        
        // Model Prediction with Teachable Machine high-level API
        const rawPredictions = await model.predict(sourceElement, flip);
        
        if (!rawPredictions || rawPredictions.length === 0) return;

        // Diagnostic Log (Uncomment to debug in browser)
        // console.log("Raw Output:", rawPredictions);

        const predictions = rawPredictions.map(p => ({
            className: p.className,
            probability: Number(p.probability) || 0
        })).sort((a, b) => b.probability - a.probability);

        renderPredictions(predictions);
    } catch (error) {
        console.error("Prediction Error:", error);
    }
}

function formatLabel(label) {
    const mapping = {
        "HAPPY FACE": "Happy Face",
        "SAD FACE": "Sad Face",
        "NEUTRAL FACE": "Neutral Face"
    };
    return mapping[label] || label;
}

function renderPredictions(predictions) {
    predictionList.innerHTML = "";
    if (!predictions || predictions.length === 0) return;

    const top = predictions[0];
    const confidenceValue = (top.probability * 100);
    const readableLabel = formatLabel(top.className);
    
    topClass.textContent = readableLabel;
    topConfidence.textContent = `Confidence: ${confidenceValue.toFixed(1)}%`;
    
    // Improved confidence thresholds
    predictionState.textContent = confidenceValue >= 75 ? "High Confidence" : confidenceValue >= 25 ? "Medium Confidence" : "Low Confidence";

    // Handle Emoji and History (Confidence > 20% for better feedback)
    if (confidenceValue > 20) {
        expressionEmoji.textContent = getEmojiForExpression(top.className);
        expressionEmoji.classList.remove("pop-in");
        void expressionEmoji.offsetWidth;
        expressionEmoji.classList.add("pop-in");
        
        if (lastTopExpression !== top.className) {
            lastTopExpression = top.className;
            addHistory({ className: readableLabel, probability: top.probability });
        }
    }

    predictions.forEach((item, index) => {
        const itemLabel = formatLabel(item.className);
        const value = (item.probability * 100).toFixed(1);
        const card = document.createElement("div");
        card.className = "prediction-item";
        if (index === 0 && item.probability > 0.25) card.classList.add("active-prediction");

        card.innerHTML = `
            <div class="prediction-row">
                <div class="prediction-name">${itemLabel}</div>
                <div class="prediction-value">${value}%</div>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${value}%; background: ${index === 0 ? 'var(--gradient-primary)' : 'var(--gradient-secondary)'};"></div>
            </div>
        `;
        predictionList.appendChild(card);
    });
}

function addHistory(topPrediction) {
    if (!topPrediction) return;

    const time = new Date().toLocaleTimeString();
    const confidence = (topPrediction.probability * 100).toFixed(1);

    const empty = historyBox.querySelector(".history-empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = "history-item slide-down";
    item.innerHTML = `<strong>${getEmojiForExpression(topPrediction.className)} ${topPrediction.className}</strong><br><span style="font-size:12px;color:var(--text-light)">${time} — ${confidence}%</span>`;

    historyBox.prepend(item);

    requestAnimationFrame(() => {
        item.classList.remove("slide-down");
    });

    while (historyBox.children.length > 6) {
        historyBox.removeChild(historyBox.lastChild);
    }
}

function clearHistory() {
    historyBox.innerHTML = `<div class="history-empty">No predictions yet</div>`;
}

function captureSnapshot() {
    if (!webcamStream || webcam.classList.contains("hidden")) {
        setMessage("Start the camera first to capture a snapshot.", "error");
        return;
    }

    snapshotCanvas.width = webcam.videoWidth;
    snapshotCanvas.height = webcam.videoHeight;
    const ctx = snapshotCanvas.getContext("2d");
    
    // mirror ctx to match webcam if needed, usually teachable machine models expect unmirrored, 
    // but the viewer shouldn't be confusing. Let's just draw it.
    ctx.drawImage(webcam, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

    uploadedPreview.src = snapshotCanvas.toDataURL("image/png");
    uploadedPreview.classList.remove("hidden");
    webcam.classList.add("hidden");
    placeholderState.classList.add("hidden");

    switchMode("upload");
    stopCamera();
    setMessage("Snapshot captured successfully. You can classify or download it.", "success");
}

function downloadSnapshot() {
    if (!uploadedPreview.src || uploadedPreview.classList.contains("hidden")) {
        setMessage("No snapshot or uploaded image available to download.", "error");
        return;
    }

    const link = document.createElement("a");
    link.href = uploadedPreview.src;
    link.download = "ai_expression_snapshot.png";
    link.click();
}

window.addEventListener("load", async () => {
    // initialize emoji
    expressionEmoji.textContent = "🧐";
    
    await loadModel();
    predictionState.textContent = "Idle";
    currentModeText.textContent = "Webcam";
    setMessage("Model loaded. Start camera or upload an image to begin.", "info");
});
