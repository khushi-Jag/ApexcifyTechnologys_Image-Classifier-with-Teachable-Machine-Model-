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

const modelURL = "./tm-model/model.json";
const metadataURL = "./tm-model/metadata.json";

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
        uploadedPreview.src = e.target.result;
        uploadedPreview.classList.remove("hidden");
        webcam.classList.add("hidden");
        placeholderState.classList.add("hidden");
        setMessage("Image uploaded successfully. Click 'Classify Upload'.", "success");
    };
    reader.readAsDataURL(file);
});

async function loadModel() {
    try {
        model = await tmImage.load(modelURL, metadataURL);
        classCount.textContent = model.getTotalClasses();
        modelStatus.textContent = "Model Loaded";
        modelStatus.className = "status-chip success";
    } catch (error) {
        modelStatus.textContent = "Model Error";
        modelStatus.className = "status-chip loading";
        setMessage("Model files could not be loaded. Check tm-model folder.", "error");
        console.error(error);
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
        
        // Restore uploaded image view if it exists
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
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcam.srcObject = webcamStream;
        webcam.classList.remove("hidden");
        uploadedPreview.classList.add("hidden");
        placeholderState.classList.add("hidden");

        setMessage("Camera started successfully. Real-time prediction is active.", "success");
        predictionState.textContent = "Live";
        startPredictionLoop();
    } catch (error) {
        setMessage("Camera permission denied or camera unavailable. Please allow access and try again.", "error");
        predictionState.textContent = "Error";
        console.error(error);
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

    setMessage("Camera stopped.", "info");
    predictionState.textContent = "Stopped";
}

async function startPredictionLoop() {
    if (!model || !webcamStream) return;

    isPredicting = true;
    predictionHistoryBuffer = []; // reset buffer

    while (isPredicting && webcamStream) {
        await runPrediction(webcam);
        await new Promise(resolve => setTimeout(resolve, 150)); // Fast loop for smoother real-time feel
    }
}

async function classifyUploadedImage() {
    if (!model) return;
    if (!uploadedPreview.src) {
        setMessage("Please upload an image first.", "error");
        return;
    }

    predictionState.textContent = "Upload Mode";
    predictionHistoryBuffer = []; // reset for single image
    await runPrediction(uploadedPreview);
}

async function runPrediction(sourceElement) {
    try {
        const rawPredictions = await model.predict(sourceElement);
        
        // Add to buffer
        predictionHistoryBuffer.push(rawPredictions);
        if (predictionHistoryBuffer.length > SMOOTHING_FRAMES) {
            predictionHistoryBuffer.shift();
        }

        // Calculate Average Predictions over buffer safely by class name
        const avgPredictions = rawPredictions.map((pred) => {
            let sum = 0;
            let validCount = 0;
            for(let j=0; j<predictionHistoryBuffer.length; j++) {
                const pastPred = predictionHistoryBuffer[j].find(p => p.className === pred.className);
                if (pastPred && typeof pastPred.probability === 'number' && !isNaN(pastPred.probability)) {
                    sum += pastPred.probability;
                    validCount++;
                }
            }
            
            let finalProb = validCount > 0 ? sum / validCount : pred.probability;
            if (isNaN(finalProb) || finalProb === undefined) finalProb = 0;

            return {
                className: pred.className,
                probability: finalProb
            };
        });

        avgPredictions.sort((a, b) => b.probability - a.probability);

        renderPredictions(avgPredictions);
    } catch (error) {
        console.error(error);
        if (currentMode !== "webcam") {
            setMessage("Prediction failed. Please check model files and input source.", "error");
        }
    }
}

function renderPredictions(predictions) {
    predictionList.innerHTML = "";

    if (!predictions || predictions.length === 0) return;

    const top = predictions[0];
    const confidenceValue = top.probability * 100;
    const confidenceStr = confidenceValue.toFixed(1);

    topClass.textContent = top.className;
    topConfidence.textContent = `Confidence: ${confidenceStr}%`;
    predictionState.textContent = confidenceValue >= 80 ? "High Confidence" : confidenceValue >= 50 ? "Medium Confidence" : "Low Confidence";

    // Handle Expression Animation
    if (lastTopExpression !== top.className && confidenceValue > 60) {
        lastTopExpression = top.className;
        expressionEmoji.textContent = getEmojiForExpression(top.className);
        
        // Trigger Animation via CSS classes
        expressionEmoji.classList.remove("pop-in");
        void expressionEmoji.offsetWidth; // trigger reflow
        expressionEmoji.classList.add("pop-in");
        
        // Optionally add to history if it changed and holds a decent confidence
        addHistory(top);
    }

    predictions.forEach((item, index) => {
        const value = (item.probability * 100).toFixed(1);
        const card = document.createElement("div");
        card.className = "prediction-item";
        
        // Make the top card stand out
        if (index === 0 && confidenceValue > 50) card.classList.add("active-prediction");

        card.innerHTML = `
            <div class="prediction-row">
                <div class="prediction-name">${item.className}</div>
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