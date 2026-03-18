# 🎭 AI Face Classifier — Teachable Machine

[![Contributors](https://img.shields.io/github/contributors/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-/network/members)
[![Stars](https://img.shields.io/github/stars/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-/stargazers)
[![Issues](https://img.shields.io/github/issues/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-/issues)
[![License](https://img.shields.io/github/license/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-/blob/main/LICENSE)

> Detect and classify facial expressions — **😄 Happy**, **😢 Sad**, or **😐 Neutral** — directly from your webcam using a Google Teachable Machine model powered by TensorFlow.js. Runs fully in the browser with zero setup required.

---

## 📌 Table of Contents

* [About The Project](#-about-the-project)
* [Key Features](#-key-features)
* [Built With](#-built-with)
* [How It Works](#-how-it-works)
* [Classification Classes](#-classification-classes)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [Troubleshooting](#-troubleshooting)
* [Contributing](#-contributing)
* [License](#-license)
* [Contact](#-contact)

---

## 💡 About The Project

The **AI Face Classifier** is a lightweight, browser-based machine learning application that leverages a **Google Teachable Machine** model (built on a MobileNet backbone) to recognize and classify facial expressions from a live webcam feed in real time.

There's no Python, no backend, and no installation involved. All processing happens directly in your browser via **TensorFlow.js** — the model is fetched from Teachable Machine's hosting service and inference is performed locally on your machine.

---

## ✨ Key Features

* **Real-Time Inference** – Continuously classifies each webcam frame on every animation tick.
* **3-Class Detection** – Identifies Happy, Sad, and Neutral expressions with live confidence scores.
* **Fully In-Browser** – TensorFlow.js handles all ML computations — no server or backend needed.
* **Transfer Learning** – Uses MobileNet as a pre-trained feature extractor for efficient inference.
* **Animated Confidence Bars** – Smooth, color-coded bars show prediction probabilities at a glance.
* **Sleek Dark UI** – Glassmorphism-inspired design with a mirrored webcam view and animated scan ring.
* **Robust Error Handling** – Clear status indicators and error banners for any camera or model issues.

---

## 🛠 Built With

| Tool | Role |
|---|---|
| Google Teachable Machine | Model training & cloud hosting |
| TensorFlow.js | In-browser ML inference engine |
| @teachablemachine/image | High-level API wrapper for TM image models |
| HTML5 / CSS3 / Vanilla JS | UI layout, webcam integration & animations |

---

## 🧠 How It Works

```
Webcam Frame
     │
     ▼
Hidden <canvas>  ←  drawImage() called on every animation frame
     │
     ▼
tmImage.predict()  ←  Teachable Machine model (MobileNet backbone)
     │
     ▼
Probabilities:  Happy  |  Sad  |  Neutral
     │
     ▼
Update UI  ←  top predicted label + animated confidence bars
```

### Core Concepts

| Concept | Explanation |
|---|---|
| **Model** | A mathematical function trained on labeled image data to map inputs to predicted outputs |
| **Image Classification** | The process of assigning a category label to an image based on its visual content |
| **Transfer Learning** | Reusing MobileNet (pretrained on millions of images) and fine-tuning only the final classifier layer |
| **Confidence Score** | A probability (0–1) indicating how certain the model is about a given prediction |
| **Inference** | Feeding new data (webcam frame) through the trained model to generate live predictions |

---

## 🎯 Classification Classes

| Emoji | Label | Description |
|---|---|---|
| 😄 | **Happy Face** | A smiling or joyful facial expression |
| 😢 | **Sad Face** | A frowning or sorrowful facial expression |
| 😐 | **Neutral** | A resting or expressionless face |

---

## 📁 Project Structure

```
Image-Classifier/
│
├── index.html      # Main page — webcam feed + prediction results panel
├── style.css       # Dark-mode UI with glassmorphism effects and animations
├── app.js          # Teachable Machine integration and inference loop
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Chrome 90+ or Edge 90+
* A built-in or USB webcam
* An internet connection (required on first load to fetch TensorFlow.js and model weights — cached afterwards)

### Option A — Open Directly *(Chrome/Edge)*

```bash
# Just double-click index.html to open it in your browser
```

> ⚠️ Some browsers restrict webcam access on `file://` URIs. If your camera doesn't initialize, use **Option B**.

### Option B — Local HTTP Server *(Recommended)*

```bash
npx -y serve .
```

Then navigate to **http://localhost:3000** in your browser.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| Camera doesn't initialize | Run `npx -y serve .` and open via `http://localhost:3000` |
| Model fails to load | Verify your internet connection — model files are hosted on teachablemachine.withgoogle.com |
| Permission denied error | Click the camera icon in the browser's address bar and grant access |
| Blank or broken page | Ensure `index.html`, `style.css`, and `app.js` are all in the same folder |

---

## 📚 What You'll Learn

* The fundamentals of how machine learning **models** work
* How **image classification** pipelines are structured end-to-end
* Using **pre-trained models** to skip training from scratch
* **Transfer learning** — leveraging MobileNet as a feature extractor
* Running ML inference entirely **in the browser** using TensorFlow.js
* Parsing and displaying **confidence scores** across multiple classes
* Working with browser **webcam APIs** (`getUserMedia`) in JavaScript

---

## 🤝 Contributing

Contributions are welcome and appreciated!

1. Fork the repository
2. Create a new feature branch:

```bash
git checkout -b feature/YourFeatureName
```

3. Commit your changes:

```bash
git commit -m "Add YourFeatureName"
```

4. Push and open a Pull Request:

```bash
git push origin feature/YourFeatureName
```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for full details.

---

## 📫 Contact

**Khushi Jag**
GitHub: [https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-](https://github.com/khushi-Jag/ApexcifyTechnologys_Image-Classifier-with-Teachable-Machine-Model-)

---

## 🙏 Acknowledgments

* [Google Teachable Machine](https://teachablemachine.withgoogle.com/)
* [TensorFlow.js Documentation](https://www.tensorflow.org/js)
* [@teachablemachine/image](https://www.npmjs.com/package/@teachablemachine/image)
* The Open Source Community ❤️
