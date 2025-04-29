const API_URL = "https://mushroom-disease-predictor.onrender.com/predict";

const classColors = {
  "Bacterial Blotch": "orange",
  "Dry Bubble": "red",
  "Healthy": "lime",
  "Trichoderma": "purple",
  "Wilt": "blue",
};

const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const predictBtn = document.getElementById("predictBtn");
const cameraWrapper = document.getElementById("cameraWrapper");
const previewWrapper = document.getElementById("previewWrapper");
const camera = document.getElementById("camera");
const openCameraBtn = document.getElementById("openCameraBtn");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");

let currentStream = null;
let usingFrontCamera = false;

function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => track.stop());
}

function switchCamera() {
  if (!currentStream) return;
  stopMediaTracks(currentStream);
  usingFrontCamera = !usingFrontCamera;
  const constraints = { video: { facingMode: usingFrontCamera ? "user" : "environment" } };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      camera.srcObject = stream;
    })
    .catch(error => {
      console.error("Error switching camera:", error);
      alert("Error switching camera.");
    });
}

openCameraBtn.addEventListener("click", () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        currentStream = stream;
        cameraWrapper.style.display = "block";
        previewWrapper.style.display = "none";
        camera.srcObject = stream;
        usingFrontCamera = false;
      })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            currentStream = stream;
            cameraWrapper.style.display = "block";
            previewWrapper.style.display = "none";
            camera.srcObject = stream;
            usingFrontCamera = true;
          })
          .catch(() => alert("Camera not accessible"));
      });
  } else {
    alert("Camera not supported");
  }
});

capturePhotoBtn.addEventListener("click", () => {
  if (!currentStream) return;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!camera.videoWidth || !camera.videoHeight) {
    alert("Camera not ready yet.");
    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    if (blob) {
      const file = new File([blob], "captured.png", { type: "image/png" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;

      clearOldPreview();

      preview.src = URL.createObjectURL(blob);
      previewWrapper.style.display = "block";
      cameraWrapper.style.display = "none";
      stopMediaTracks(currentStream);
      currentStream = null;
    }
  }, "image/png");
});

switchCameraBtn.addEventListener("click", switchCamera);

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    clearOldPreview();
    preview.src = URL.createObjectURL(file);
    previewWrapper.style.display = "block";
  }
});

function clearOldPreview() {
  const oldCanvas = document.getElementById("overlayCanvas");
  if (oldCanvas) oldCanvas.remove();
  results.innerHTML = '';
  results.style.display = 'none';
}

async function predict() {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload or capture an image.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  loading.style.display = "block";
  predictBtn.disabled = true;
  const scanner = document.getElementById("scanner");
  scanner.style.display = "block";

  const currentLang = localStorage.getItem("lang") || "en";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const filteredDetections = data.detections.filter(det => det.confidence >= 0.4);

    if (filteredDetections.length > 0) {
      const imgElement = document.getElementById("preview");
      clearOldPreview();

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const image = new Image();
      image.src = imgElement.src;

      image.onload = function () {
        const previewWidth = imgElement.clientWidth;
        const previewHeight = imgElement.clientHeight;

        console.log("Image loaded:");
        console.log("→ Natural size:", image.naturalWidth, image.naturalHeight);
        console.log("→ Preview size:", previewWidth, previewHeight);

        if (previewWidth === 0 || previewHeight === 0) {
          console.warn("Image has zero width or height — skipping boxes.");
          return;
        }

        canvas.width = previewWidth;
        canvas.height = previewHeight;
        canvas.style.position = "absolute";
        canvas.style.left = "0px";
        canvas.style.top = "0px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = 10;
        canvas.id = "overlayCanvas";

        // Optional red background to confirm canvas visibility
        context.fillStyle = "rgba(255,0,0,0.05)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        previewWrapper.appendChild(canvas);

        const xScale = previewWidth / image.naturalWidth;
        const yScale = previewHeight / image.naturalHeight;

        filteredDetections.forEach(det => {
          const [xmin, ymin, xmax, ymax] = det.box;
          const x1 = xmin * xScale;
          const y1 = ymin * yScale;
          const x2 = xmax * xScale;
          const y2 = ymax * yScale;

          const boxColor = classColors[det.class] || "lime";
          context.strokeStyle = boxColor;
          context.lineWidth = 2;
          context.strokeRect(x1, y1, x2 - x1, y2 - y1);

          context.fillStyle = boxColor;
          context.font = "16px Arial";
          context.fillText(`${det.class} ${(det.confidence * 100).toFixed(1)}%`, x1, y1 > 20 ? y1 - 5 : y1 + 20);
        });
      };

      const groupedDetections = {};
      filteredDetections.forEach(det => {
        if (!groupedDetections[det.class]) {
          groupedDetections[det.class] = [];
        }
        groupedDetections[det.class].push(det.confidence);
      });

      let resultsHTML = `<h3>${translations[currentLang].results}</h3>`;
      for (const [disease, confidences] of Object.entries(groupedDetections)) {
        const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        const assessment = generateAssessment(disease, avg, currentLang);
        const color = classColors[disease] || "#4e4e4e";

        resultsHTML += `
          <div class="result-card" style="border-left: 5px solid ${color}; padding-left:10px;">
            <strong style="color:${color}">${disease}</strong> - Confidence: ${(avg * 100).toFixed(2)}%<br/>
            <p>${assessment}</p>
          </div>
        `;
      }

      results.innerHTML = resultsHTML;
      results.style.display = "block";

    } else {
      results.style.display = "none";
    }

  } catch (error) {
    console.error("Prediction error:", error);
    alert("An error occurred during prediction. Please try again.");
  } finally {
    loading.style.display = "none";
    predictBtn.disabled = false;
    scanner.style.display = "none";
  }
}

// Generate Assessment
function generateAssessment(disease, confidence, lang) {
  let severity;
  if (confidence > 0.85) {
    severity = translations[lang].severityStrong;
  } else if (confidence > 0.6) {
    severity = translations[lang].severityModerate;
  } else {
    severity = translations[lang].severityWeak;
  }

  let advice;
  switch (disease) {
    case "Bacterial Blotch":
      advice = translations[lang].adviceBacterialBlotch;
      break;
    case "Dry Bubble":
      advice = translations[lang].adviceDryBubble;
      break;
    case "Healthy":
      advice = translations[lang].adviceHealthy;
      break;
    case "Trichoderma":
      advice = translations[lang].adviceTrichoderma;
      break;
    case "Wilt":
      advice = translations[lang].adviceWilt;
      break;
    default:
      advice = "Consult agricultural experts for specific guidance.";
  }

  return `${severity} ${translations[lang].basedOnAnalysis} <strong>${disease}</strong> ${translations[lang].wasDetected} ${advice}`;
}

// Close disclaimer modal
function closeDisclaimer() {
  document.getElementById("disclaimerModal").style.display = "none";
}

// Language Handling
const translations = {
  en: {
    disclaimerTitle: "Disclaimer",
    disclaimerContent: "This Oyster Mushroom Disease Classifier is currently under development. Predictions may not always be accurate and should be used for informational purposes only. Always consult agricultural experts for critical decisions.",
    buttonUnderstand: "I Understand",
    chooseImage: "Choose Image",
    predictButton: "Predict Disease",
    loading: "Loading...",
    results: "Results:",
    severityStrong: "This is a strong match, indicating a high probability.",
    severityModerate: "This is a moderate match. Some caution is advised.",
    severityWeak: "This is a weak match. Re-evaluation may be necessary.",
    adviceBacterialBlotch: "Ensure good air circulation and avoid overhead watering to prevent spread.",
    adviceDryBubble: "Remove infected mushrooms immediately and sanitize the environment.",
    adviceHealthy: "Maintain optimal growing conditions to continue healthy development.",
    adviceTrichoderma: "Lower humidity levels and remove infected substrates immediately.",
    adviceWilt: "Adjust watering schedules and monitor nutrient supply carefully.",
    basedOnAnalysis: "Based on the analysis, signs of",
    wasDetected: "were detected.",
    capturePhoto: "Capture Photo",
  },
  fil: {
    disclaimerTitle: "Paunawa",
    disclaimerContent: "Ang Oyster Mushroom Disease Classifier na ito ay kasalukuyang nasa ilalim ng pag-develop. Maaaring hindi laging tama ang mga prediksyon at ito ay para sa layuning pampagbigay-impormasyon lamang. Laging kumonsulta sa mga eksperto sa agrikultura para sa mahahalagang desisyon.",
    buttonUnderstand: "Nauunawaan Ko",
    chooseImage: "Pumili ng Larawan ng Kabute",
    predictButton: "Hulaan ang Sakit",
    loading: "Naglo-load...",
    results: "Mga Resulta:",
    severityStrong: "Ito ay isang malakas na tugma, nagpapakita ng mataas na posibilidad.",
    severityModerate: "Ito ay isang katamtamang tugma. Mag-ingat.",
    severityWeak: "Ito ay isang mahina na tugma. Maaaring kailanganin ang muling pagsusuri.",
    adviceBacterialBlotch: "Siguraduhing may maayos na daloy ng hangin at iwasan ang pagdidilig sa itaas upang maiwasan ang pagkalat.",
    adviceDryBubble: "Agad alisin ang mga apektadong kabute at linisin ang kapaligiran.",
    adviceHealthy: "Panatilihin ang mga optimal na kondisyon para magpatuloy ang malusog na pag-unlad.",
    adviceTrichoderma: "Bawasan ang mga antas ng halumigmig at agad na alisin ang mga apektadong substrato.",
    adviceWilt: "Ayusin ang iskedyul ng pagdidilig at obserbahan ang suplay ng sustansya.",
    basedOnAnalysis: "Batay sa pagsusuri, mga senyales ng",
    wasDetected: "ay natukoy.",
    capturePhoto: "Kuhanan ng Larawan",
  },
  ilo: {
    disclaimerTitle: "Pakaammo",
    disclaimerContent: "Daytoy nga Oyster Mushroom Disease Classifier ket agtultuloy pay ti panagaramidna. Saan a masiguro nga amin a prediksion ket eksakto, ket para laeng iti pampanunot a pakaammo. Itultuloy a kumonsulta kadagiti eksperto ti agrikultura para kadagiti napateg a desision.",
    buttonUnderstand: "Maawatak",
    chooseImage: "Agpili ti Ladawan ti Kabute",
    predictButton: "Ipredict ti Sakit",
    loading: "Agkarkar-load...",
    results: "Dagiti Resulta:",
    severityStrong: "Nakasagrap a kasla agtultuloy a gundaway, nagpakita ti dakkel a posibilidad.",
    severityModerate: "Nakasagrap a kasla agtultuloy a gundaway. Agin-inut.",
    severityWeak: "Nakasagrap a kasla awan ti kabusor. Kasapulan ti panangsurat.",
    adviceBacterialBlotch: "Siguradwen a nalawag ti aglawlaw ket iwasan ti agtultuloy a pang-dilig tapno malapdaan.",
    adviceDryBubble: "Ial-alay dagiti nadadael a kabute ken limpan ti lugar.",
    adviceHealthy: "Ipatpatuloy ti optimal nga pag-uneg tapno agtultuloy ti nalusluso nga progreso.",
    adviceTrichoderma: "Aglawlaw ti nadumaduma a klima ken alisin dagiti nadadael a substrates kasla uneg.",
    adviceWilt: "Aglaksid ti oras ti panangdilig ken ikabina ti nutrisyon nga itedna.",
    basedOnAnalysis: "Base ti analisis, senyales ti",
    wasDetected: "ket naipakita.",
    capturePhoto: "Mangala ti Ladawan",
  }
};

// Load previously selected language
const savedLang = localStorage.getItem("lang") || "en";
document.querySelector(`input[name="language"][value="${savedLang}"]`).checked = true;
changeLanguage(savedLang);

// Language selector change event
document.querySelectorAll('input[name="language"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });
});

// Function to update texts according to selected language
function changeLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  localStorage.setItem("lang", lang);

  // Update disclaimer modal
  document.querySelector('#disclaimerModal h2').textContent = t.disclaimerTitle;
  document.querySelector('#disclaimerModal p').textContent = t.disclaimerContent;
  document.querySelector('#disclaimerModal button').textContent = t.buttonUnderstand;

  // Update image upload and prediction
  document.querySelector('.custom-file-upload').textContent = t.chooseImage;
  document.querySelector('#predictBtn').textContent = t.predictButton;
  document.querySelector('#loading').textContent = t.loading;
  document.querySelector('#results').innerHTML = `<h3>${t.results}</h3>`;
}

// Close preview button functionality
document.getElementById('closePreviewBtn').addEventListener('click', () => {
  preview.src = '';
  previewWrapper.style.display = 'none';
  imageInput.value = '';
  clearOldPreview();
});

document.getElementById('closeCameraBtn').addEventListener('click', () => {
  if (currentStream) {
    stopMediaTracks(currentStream);
    currentStream = null;
  }
  cameraWrapper.style.display = "none";
});