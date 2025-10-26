const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const suggestionBox = document.getElementById("suggestionBox");
const aiIcon = document.getElementById("aiIcon"); // The 💡 icon
const downloadBtn = document.getElementById("downloadBtn");
const templateList = document.getElementById("templateList");

let selectedTemplate = null;

// ====== AI GENERATION LOGIC ======
generateBtn.addEventListener("click", async () => {
  const text = document.getElementById("resumeInput").value.trim();
  if (!text) {
    suggestionBox.innerHTML = "⚠️ Please enter some text first.";
    return;
  }

  // Start bulb spinning
  aiIcon.classList.add("spin");
  suggestionBox.innerHTML = "💡 Generating smart suggestions...";
  generateBtn.disabled = true;

  try {
    const tone = document.getElementById("toneSelect").value;
    const focus = document.getElementById("focusSelect").value;

    const res = await fetch("http://localhost:8000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone, focus }),
    });

    const data = await res.json();

    if (data.ok && data.suggestion) {
      suggestionBox.innerHTML = `<pre class="whitespace-pre-line">${data.suggestion}</pre>`;
    } else {
      suggestionBox.innerHTML = "⚠️ No AI suggestion received.";
    }
  } catch (error) {
    console.error("Error:", error);
    suggestionBox.innerHTML = "❌ Error connecting to backend.";
  } finally {
    // Stop bulb animation and enable button
    aiIcon.classList.remove("spin");
    generateBtn.disabled = false;
  }
});

// ====== DOWNLOAD LOGIC ======
downloadBtn.addEventListener("click", async () => {
  if (!selectedTemplate) {
    alert("Please select a resume template first!");
    return;
  }

  const res = await fetch(selectedTemplate.file);
  const templateHTML = await res.text();

  const userName = document.getElementById("userName")
    ? document.getElementById("userName").value
    : "John Doe";

  const filledTemplate = templateHTML.replace("{{name}}", userName);

  const opt = {
    margin: 0.5,
    filename: `${userName}_Resume.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(filledTemplate).save();
});

// ====== CLEAR BUTTON ======
clearBtn.addEventListener("click", () => {
  document.getElementById("resumeInput").value = "";
  suggestionBox.innerHTML = "No suggestions yet.";
});

// ====== TEMPLATE GALLERY ======
const templates = [
  {
    id: "modern",
    name: "Modern Resume",
    img: "/images/modern-preview.jpg",
    file: "/templates/modern.html",
  },
  {
    id: "minimal",
    name: "Minimal Resume",
    img: "/images/minimal-preview.jpg",
    file: "/templates/minimal.html",
  },
];

templates.forEach((t) => {
  const div = document.createElement("div");
  div.className = "template-item";
  div.innerHTML = `
    <img src="${t.img}" alt="${t.name}" />
    <p>${t.name}</p>
  `;
  div.addEventListener("click", () => selectTemplate(t));
  templateList.appendChild(div);
});

function selectTemplate(t) {
  selectedTemplate = t;

  document.querySelectorAll(".template-item").forEach((item) => {
    item.style.borderColor = "#ccc";
  });

  const selectedDiv = Array.from(templateList.children).find((child) =>
    child.querySelector("p").textContent.includes(t.name)
  );
  if (selectedDiv) selectedDiv.style.borderColor = "#007bff";

  alert(`Template "${t.name}" selected!`);
}
