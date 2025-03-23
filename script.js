// Global variables and DOM references
let questionsData = [];
let solvedQuestions = {};
let selectedCompany = null;  // active company filter
let baseFiltered = [];       // filtered by search/topic/difficulty (excluding company)
let filteredData = [];       // final filtered data (including company filter)
let currentPage = 1;
let pageSize = 50;           // default page size

const tableBody = document.getElementById("questionsTableBody");
const searchInput = document.getElementById("searchInput");
const topicFilter = document.getElementById("topicFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const companiesSection = document.getElementById("companiesSection");
const problemCount = document.getElementById("problemCount");
const currentPageSpan = document.getElementById("currentPage");
const totalPagesSpan = document.getElementById("totalPages");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageSizeSelect = document.getElementById("pageSize");

// Helper: Capitalize first letter of a string
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// --- Dropdown Toggling Functions ---

function toggleTitleDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('titleDropdown');
  // Close the other dropdown if open
  const diffDropdown = document.getElementById('difficultyDropdown');
  diffDropdown.style.display = 'none';
  diffDropdown.parentElement.classList.remove('active');

  // Toggle Title dropdown
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    e.currentTarget.classList.remove('active');
  } else {
    dropdown.style.display = 'block';
    e.currentTarget.classList.add('active');
  }
}

function toggleDifficultyDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('difficultyDropdown');
  // Close the other dropdown if open
  const titleDropdown = document.getElementById('titleDropdown');
  titleDropdown.style.display = 'none';
  titleDropdown.parentElement.classList.remove('active');

  // Toggle Difficulty dropdown
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    e.currentTarget.classList.remove('active');
  } else {
    dropdown.style.display = 'block';
    e.currentTarget.classList.add('active');
  }
}

// Close dropdowns if clicking elsewhere
document.addEventListener('click', () => {
  const titleDropdown = document.getElementById('titleDropdown');
  const difficultyDropdown = document.getElementById('difficultyDropdown');
  titleDropdown.style.display = 'none';
  difficultyDropdown.style.display = 'none';
  titleDropdown.parentElement.classList.remove('active');
  difficultyDropdown.parentElement.classList.remove('active');
});

// Attach dropdown event listeners after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const headerCells = document.querySelectorAll(".sortable-header");
  if (headerCells[0]) {
    headerCells[0].addEventListener("click", toggleTitleDropdown);
  }
  if (headerCells[1]) {
    headerCells[1].addEventListener("click", toggleDifficultyDropdown);
  }
});

// --- End Dropdown Functions ---

// Load solved questions from localStorage then load questions data
function loadSolvedQuestions() {
  const saved = localStorage.getItem('solvedQuestions');
  solvedQuestions = saved ? JSON.parse(saved) : {};
  loadQuestionsData();
}

// Save solved questions to localStorage
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
      applyFilters(); // Also renders companies
    })
    .catch(err => console.error("Error loading questions JSON:", err));
}

// Populate dropdowns for topic and difficulty filters
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
    option.textContent = capitalizeFirst(topic);
    topicFilter.appendChild(option);
  });

  difficulties.forEach(diff => {
    const option = document.createElement("option");
    option.value = diff;
    option.textContent = capitalizeFirst(diff);
    difficultyFilter.appendChild(option);
  });
}

// Render company filter buttons based on filtered data (excluding company filter)
function renderCompanies() {
  const companyCounts = {};
  baseFiltered.forEach(q => {
    q.companies.forEach(comp => {
      companyCounts[comp] = (companyCounts[comp] || 0) + 1;
    });
  });
  
  const companySearchInput = document.getElementById("companySearch");
  const searchText = companySearchInput ? companySearchInput.value.toLowerCase() : "";
  
  companiesSection.innerHTML = "";
  Object.keys(companyCounts).forEach(comp => {
    if (searchText && !comp.toLowerCase().includes(searchText)) return;
    
    const span = document.createElement("span");
    span.textContent = `${comp} (${companyCounts[comp]})`;
    if (selectedCompany === comp) span.classList.add("selected");
    
    span.addEventListener("click", () => {
      selectedCompany = selectedCompany === comp ? null : comp;
      applyFilters();
      renderCompanies();
    });
    companiesSection.appendChild(span);
  });
}

// Apply search/topic/difficulty filters (excluding company filter)
function applyFilters() {
  const searchText = searchInput.value.toLowerCase();
  const selectedTopic = topicFilter.value || null;
  const selectedDiff = difficultyFilter.value || null;
  
  baseFiltered = questionsData.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchText) ||
                          q.topic.toLowerCase().includes(searchText) ||
                          q.difficulty.toLowerCase().includes(searchText);
    const matchesTopic = selectedTopic ? q.topic === selectedTopic : true;
    const matchesDiff = selectedDiff ? q.difficulty === selectedDiff : true;
    return matchesSearch && matchesTopic && matchesDiff;
  });
  
  // Apply company filter if one is selected
  filteredData = selectedCompany ? baseFiltered.filter(q => q.companies.includes(selectedCompany)) : baseFiltered;
  
  currentPage = 1;
  renderTable();
  updatePaginationInfo();
  renderCompanies();
}

// Render the questions table
function renderTable() {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  pageData.forEach(q => {
    const row = document.createElement("tr");

    // Star cell (indicates solved state)
    const starCell = document.createElement("td");
    const starBtn = document.createElement("span");
    starBtn.innerHTML = solvedQuestions[q.id] ? "&#9733;" : "&#9734;";
    starBtn.classList.add("star");
    if (!solvedQuestions[q.id]) starBtn.classList.add("unsolved");
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

    // Topic cell (capitalize display)
    const topicCell = document.createElement("td");
    topicCell.textContent = capitalizeFirst(q.topic);

    // Difficulty cell with label (capitalize display)
    const diffCell = document.createElement("td");
    diffCell.style.textAlign = "center";
    const diffLabel = document.createElement("span");
    diffLabel.className = "difficulty-label";
    diffLabel.textContent = capitalizeFirst(q.difficulty);
    const diffLower = q.difficulty.toLowerCase();
    if (diffLower === "hard") {
      diffLabel.style.backgroundColor = "#ffcccc"; // light red
    } else if (diffLower === "medium") {
      diffLabel.style.backgroundColor = "#ffccff"; // light magenta
    } else if (diffLower === "easy") {
      diffLabel.style.backgroundColor = "#cce5ff"; // light blue
    }
    diffCell.appendChild(diffLabel);

    row.appendChild(starCell);
    row.appendChild(titleCell);
    row.appendChild(topicCell);
    row.appendChild(diffCell);

    tableBody.appendChild(row);
  });
  
  problemCount.textContent = `Showing ${filteredData.length} problem${filteredData.length !== 1 ? "s" : ""}`;
}

// Update pagination information
function updatePaginationInfo() {
  const totalPages = Math.max(Math.ceil(filteredData.length / pageSize), 1);
  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages;
  
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// Pagination event handlers
function goToPage(newPage) {
  const totalPages = Math.ceil(filteredData.length / pageSize);
  if (newPage < 1 || newPage > totalPages) return;
  currentPage = newPage;
  renderTable();
  updatePaginationInfo();
}

prevPageBtn.addEventListener("click", () => goToPage(currentPage - 1));
nextPageBtn.addEventListener("click", () => goToPage(currentPage + 1));

function updatePageSize(newSize) {
  pageSize = newSize;
  currentPage = 1;
  renderTable();
  updatePaginationInfo();
}

pageSizeSelect.addEventListener("change", (e) => {
  updatePageSize(parseInt(e.target.value, 10));
});

// Filter event listeners
searchInput.addEventListener("input", applyFilters);
topicFilter.addEventListener("change", applyFilters);
difficultyFilter.addEventListener("change", applyFilters);

// Company search input event listener
const companySearchInput = document.getElementById("companySearch");
if (companySearchInput) {
  companySearchInput.addEventListener("input", renderCompanies);
}

// Initial load
loadSolvedQuestions();
