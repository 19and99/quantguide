// Global variables and DOM references
let questionsData = [];
let solvedQuestions = {};
let selectedCompany = null;  // to track the currently selected company

const tableBody = document.getElementById("questionsTableBody");
const searchInput = document.getElementById("searchInput");
const topicFilter = document.getElementById("topicFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const companiesSection = document.getElementById("companiesSection");

// Load solved questions data from localStorage
function loadSolvedQuestions() {
  const saved = localStorage.getItem('solvedQuestions');
  if (saved) {
    solvedQuestions = JSON.parse(saved);
  } else {
    solvedQuestions = {};
  }
  loadQuestionsData();
}

// Save solved questions data to localStorage
function saveSolvedQuestions() {
  localStorage.setItem('solvedQuestions', JSON.stringify(solvedQuestions));
}

// Load questions data from JSON file
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

// Populate topic and difficulty dropdowns
function populateDropdowns() {
  const topics = new Set();
  const difficulties = new Set();
  questionsData.forEach(q => {
    topics.add(q.topic);
    difficulties.add(q.difficulty);
  });
  
  // Populate topicFilter select – default option already present ("Topic")
  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
  
  // Populate difficultyFilter select – default option already present ("Difficulty")
  difficulties.forEach(diff => {
    const option = document.createElement("option");
    option.value = diff;
    option.textContent = diff;
    difficultyFilter.appendChild(option);
  });
}

// Render companies section with clickable names and counts, including a search filter
function renderCompanies() {
  const companyCounts = {};
  questionsData.forEach(q => {
    q.companies.forEach(comp => {
      companyCounts[comp] = (companyCounts[comp] || 0) + 1;
    });
  });
  
  // Get the search text for companies (if any)
  const companySearchInput = document.getElementById("companySearch");
  const searchText = companySearchInput ? companySearchInput.value.toLowerCase() : "";
  
  companiesSection.innerHTML = "";
  Object.keys(companyCounts).forEach(comp => {
    if (searchText && !comp.toLowerCase().includes(searchText)) return;
    
    const span = document.createElement("span");
    span.textContent = `${comp} (${companyCounts[comp]})`;
    
    if (selectedCompany === comp) {
      span.classList.add("selected");
    }
    
    span.addEventListener("click", () => {
      if (selectedCompany === comp) {
        selectedCompany = null;
        renderTable(questionsData);
      } else {
        selectedCompany = comp;
        const filtered = questionsData.filter(q => q.companies.includes(comp));
        renderTable(filtered);
      }
      renderCompanies();
    });
    companiesSection.appendChild(span);
  });
  
  // Clear filter option
  const clearSpan = document.createElement("span");
  clearSpan.textContent = "Clear Company Filter";
  clearSpan.classList.add("clear");
  clearSpan.addEventListener("click", () => {
    selectedCompany = null;
    renderTable(questionsData);
    renderCompanies();
  });
  companiesSection.appendChild(clearSpan);
}

// Render table rows based on a given questions array
function renderTable(questions) {
  tableBody.innerHTML = "";
  questions.forEach(q => {
    const row = document.createElement("tr");

    // Create star cell (using localStorage for solved state)
    const starCell = document.createElement("td");
    const starBtn = document.createElement("span");
    starBtn.innerHTML = solvedQuestions[q.id] ? "&#9733;" : "&#9734;";
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

    // Title cell with link
    const titleCell = document.createElement("td");
    titleCell.innerHTML = `<a href="question.html?id=${q.id}">${q.title}</a>`;

    // Topic and Difficulty cells
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
  const selectedTopic = topicFilter.value ? topicFilter.value : null;
  const selectedDiff = difficultyFilter.value ? difficultyFilter.value : null;
  
  let filtered = questionsData.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchText) ||
      q.topic.toLowerCase().includes(searchText) ||
      q.difficulty.toLowerCase().includes(searchText);
    const matchesTopic = selectedTopic ? q.topic === selectedTopic : true;
    const matchesDiff = selectedDiff ? q.difficulty === selectedDiff : true;
    return matchesSearch && matchesTopic && matchesDiff;
  });
  
  // If a company filter is active, further filter the questions
  if (selectedCompany) {
    filtered = filtered.filter(q => q.companies.includes(selectedCompany));
  }
  
  renderTable(filtered);
}

// Event listeners for filters
searchInput.addEventListener("input", filterQuestions);
topicFilter.addEventListener("change", filterQuestions);
difficultyFilter.addEventListener("change", filterQuestions);

// Event listener for the company search input
const companySearchInput = document.getElementById("companySearch");
if (companySearchInput) {
  companySearchInput.addEventListener("input", renderCompanies);
}

// Load solved questions from localStorage on page load
loadSolvedQuestions();
