// Global variables and DOM references
let questionsData = [];
let solvedQuestions = {};
const tableBody = document.getElementById("questionsTableBody");
const searchInput = document.getElementById("searchInput");
const topicFilter = document.getElementById("topicFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const companiesSection = document.getElementById("companiesSection");

// Load questions data
function loadQuestionsData() {
  fetch("questionsData.json")
    .then(res => res.json())
    .then(data => {
      questionsData = data;
      populateDropdowns();
      renderCompanies();
      renderTable(questionsData);
    })
    .catch(err => console.error("Error loading questions JSON:", err));
}

// Load solved questions data from solvedQuestions.json
function loadSolvedQuestions() {
    fetch('solvedQuestions.json')
    .then(res => res.json())
    .then(data => {
      solvedQuestions = data;
      loadQuestionsData(); // After loading solved questions, load the questions data
    })
    .catch(err => {
      console.error("Error loading solved questions JSON:", err);
      solvedQuestions = {}; // Fallback: initialize as an empty object if loading fails
      loadQuestionsData();
    });
}

// Save solved questions data to solvedQuestions.json
function saveSolvedQuestions() {
  // Simulating saving to the server by using a POST request (you'll need a server that handles this).
  fetch("solvedQuestions.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(solvedQuestions)
  })
    .then(res => res.json())
    .then(data => {
      console.log("Solved questions saved:", data);
    })
    .catch(err => console.error("Error saving solved questions data:", err));
}

// Populate topic and difficulty dropdowns
function populateDropdowns() {
  const topics = new Set();
  const difficulties = new Set();
  questionsData.forEach(q => {
    topics.add(q.topic);
    difficulties.add(q.difficulty);
  });
  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
  difficulties.forEach(diff => {
    const option = document.createElement("option");
    option.value = diff;
    option.textContent = diff;
    difficultyFilter.appendChild(option);
  });
}

// Render companies section with clickable names and counts
function renderCompanies() {
  const companyCounts = {};
  questionsData.forEach(q => {
    q.companies.forEach(comp => {
      companyCounts[comp] = (companyCounts[comp] || 0) + 1;
    });
  });
  companiesSection.innerHTML = "";
  Object.keys(companyCounts).forEach(comp => {
    const span = document.createElement("span");
    span.textContent = `${comp} (${companyCounts[comp]})`;
    span.addEventListener("click", () => {
      const filtered = questionsData.filter(q => q.companies.includes(comp));
      searchInput.value = "";
      topicFilter.value = "";
      difficultyFilter.value = "";
      renderTable(filtered);
    });
    companiesSection.appendChild(span);
  });

  // Clear filter option
  const clearSpan = document.createElement("span");
  clearSpan.textContent = "Clear Company Filter";
  clearSpan.classList.add("clear");
  clearSpan.addEventListener("click", () => {
    renderTable(questionsData);
  });
  companiesSection.appendChild(clearSpan);
}

// Render table rows based on a given questions array
function renderTable(questions) {
  tableBody.innerHTML = "";
  questions.forEach(q => {
    const row = document.createElement("tr");

    // Create star cell with solved state loaded from external file.
    const starCell = document.createElement("td");
    const starBtn = document.createElement("span");
    starBtn.innerHTML = solvedQuestions[q.id] ? "&#9733;" : "&#9734;"; // filled vs outline star
    starBtn.classList.add("star");
    if (!solvedQuestions[q.id]) {
      starBtn.classList.add("unsolved");
    }
    starBtn.addEventListener("click", () => {
      solvedQuestions[q.id] = !solvedQuestions[q.id];
      starBtn.innerHTML = solvedQuestions[q.id] ? "&#9733;" : "&#9734;";
      starBtn.classList.toggle("unsolved", !solvedQuestions[q.id]);
      saveSolvedQuestions();
    });
    starCell.appendChild(starBtn);

    // Title cell with link.
    const titleCell = document.createElement("td");
    titleCell.innerHTML = `<a href="question.html?id=${q.id}">${q.title}</a>`;

    // Topic and Difficulty cells.
    const topicCell = document.createElement("td");
    topicCell.textContent = q.topic;
    const diffCell = document.createElement("td");
    diffCell.textContent = q.difficulty;

    row.appendChild(starCell);
    row.appendChild(titleCell);
    row.appendChild(topicCell);
    row.appendChild(diffCell);

    tableBody.appendChild(row);
  });
}

// Filter questions based on search input and dropdown filters
function filterQuestions() {
  const searchText = searchInput.value.toLowerCase();
  const selectedTopic = topicFilter.value;
  const selectedDiff = difficultyFilter.value;
  const filtered = questionsData.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchText) ||
      q.topic.toLowerCase().includes(searchText) ||
      q.difficulty.toLowerCase().includes(searchText);
    const matchesTopic = selectedTopic ? q.topic === selectedTopic : true;
    const matchesDiff = selectedDiff ? q.difficulty === selectedDiff : true;
    return matchesSearch && matchesTopic && matchesDiff;
  });
  renderTable(filtered);
}

// Event listeners for filters
searchInput.addEventListener("input", filterQuestions);
topicFilter.addEventListener("change", filterQuestions);
difficultyFilter.addEventListener("change", filterQuestions);

// Load solved questions from the server (solvedQuestions.json)
loadSolvedQuestions();
