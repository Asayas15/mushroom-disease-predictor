const API_URL = "https://mushroom-disease-predictor.onrender.com/predict";

const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const predictBtn = document.getElementById("predictBtn");

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
        document.getElementById('previewWrapper').style.display = 'block'; // Show wrapper too
    }
});

async function predict() {
    const file = imageInput.files[0];
    if (!file) {
        alert("Please upload an image.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    loading.style.display = "block";
    predictBtn.disabled = true;
    document.getElementById('scanner').style.display = 'block'; // SHOW scanner effect

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        results.innerHTML = `<h3>${translations[savedLang].results}</h3>`; // Translate the "Results:" title
        data.predictions.forEach(pred => {
            results.innerHTML += `
                <div class="result-card">
                    <strong>${pred.class}</strong> - Confidence: ${(pred.confidence * 100).toFixed(2)}%<br/>
                    <p>${generateAssessment(pred.class, pred.confidence)}</p> <!-- Display translated results -->
                </div>
            `;
        });

    } catch (error) {
        console.error("Prediction error:", error);
        results.innerHTML = "Something went wrong. Try again.";
    }

    loading.style.display = "none";
    predictBtn.disabled = false;
    document.getElementById('scanner').style.display = 'none'; // HIDE scanner effect
}

function generateAssessment(disease, confidence) {
    const lang = localStorage.getItem("lang") || "en"; // Ensure we always use the selected language

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
            advice = translations[lang].adviceBacterialBlotch; // Default advice if disease is not found
    }

    // Now, both sentences are translated based on the language
    return `
        ${severity} ${translations[lang].basedOnAnalysis} <strong>${disease}</strong> ${translations[lang].wasDetected}
        ${advice}
    `;
}


function closeDisclaimer() {
    document.getElementById("disclaimerModal").style.display = "none";
}

const translations = {
    en: {
        disclaimerTitle: "Disclaimer",
        disclaimerContent: "This Oyster Mushroom Disease Classifier is currently under development. Predictions may not always be accurate and should be used for informational purposes only. Always consult agricultural experts for critical decisions.",
        buttonUnderstand: "I Understand",
        chooseImage: "Choose a Mushroom Image",
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
    },
    fil: {
        disclaimerTitle: "Paunawa",
        disclaimerContent: "Ang Oyster Mushroom Disease Classifier na ito ay kasalukuyang nasa ilalim ng pag-unlad. Maaring hindi palaging tama ang mga hula at para lamang sa impormasyon. Kumonsulta pa rin sa mga eksperto sa agrikultura para sa mahahalagang desisyon.",
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
    },
    ilo: {
        disclaimerTitle: "Pakaammo",
        disclaimerContent: "Ti Oyster Mushroom Disease Classifier ket agtultuloy pay ti panagsardengna. Saan a kanayon nga eksakto ti prediction ket para laeng iti impormasyon. Agkonsulta kadagiti eksperto iti agrikultura para kadagiti importanteng desisyon.",
        buttonUnderstand: "Maawatan Ko",
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
    }
};

document.querySelectorAll('input[name="language"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });
});

// Load previously selected language from localStorage if available
const savedLang = localStorage.getItem("lang") || "en";
document.querySelector(`input[name="language"][value="${savedLang}"]`).checked = true;
changeLanguage(savedLang);

function changeLanguage(lang) {
    const t = translations[lang];
    if (!t) return; // Safety check

    // Save the language choice to localStorage
    localStorage.setItem("lang", lang);

    // Update text content
    document.querySelector('#disclaimerModal h2').textContent = t.disclaimerTitle;
    document.querySelector('#disclaimerModal p').textContent = t.disclaimerContent;
    document.querySelector('#disclaimerModal button').textContent = t.buttonUnderstand;
    document.querySelector('.custom-file-upload').textContent = t.chooseImage;
    document.querySelector('#predictBtn').textContent = t.predictButton;
    document.querySelector('#loading').textContent = t.loading;
    document.querySelector('#results').innerHTML = `<h3>${t.results}</h3>`; // Resets when switching language
}
