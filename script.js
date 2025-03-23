// Global variables and DOM references
let questionsData = [];
let solvedQuestions = {};
let selectedCompany = null;  // active company filter
let baseFiltered = [];       // filtered by search/topic/difficulty (excluding company)
let filteredData = [];       // final filtered data (including company filter)
let currentPage = 1;
let pageSize = 50;           // default page size

// New global variables for our custom filters and sorting
let selectedTopicFilter = null;
let selectedDifficultyFilter = null;
let sortColumn = null;
let sortOrder = 'asc';

const tableBody = document.getElementById("questionsTableBody");
const searchInput = document.getElementById("searchInput");
const companiesSection = document.getElementById("companiesSection");
const problemCount = document.getElementById("problemCount");
const currentPageSpan = document.getElementById("currentPage");
const totalPagesSpan = document.getElementById("totalPages");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageSizeSelect = document.getElementById("pageSize");

// Helper: Convert string to Title Case
function toTitleCase(str) {
  if (!str) return "";
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

// --- Dropdown Toggle Functions ---

function toggleDropdown(dropdownId, arrowId) {
  const dropdown = document.getElementById(dropdownId);
  const arrow = document.getElementById(arrowId);
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    arrow.innerHTML = "&#9654;"; // right arrow
  } else {
    // Close any open dropdowns first
    closeDropdown("topicDropdown");
    closeDropdown("difficultyDropdown");
    dropdown.style.display = 'block';
    arrow.innerHTML = "&#9660;"; // down arrow
  }
}

function closeDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.style.display = 'none';
    if (dropdownId === "topicDropdown") {
      document.getElementById("topicArrow").innerHTML = "&#9654;";
    } else if (dropdownId === "difficultyDropdown") {
      document.getElementById("difficultyArrow").innerHTML = "&#9654;";
    }
  }
}

// Close dropdowns if clicking outside
document.addEventListener('click', (e) => {
  const topicHeader = document.getElementById("topicHeader");
  const difficultyHeader = document.getElementById("difficultyHeader");
  if (!topicHeader.contains(e.target)) {
    closeDropdown("topicDropdown");
  }
  if (!difficultyHeader.contains(e.target)) {
    closeDropdown("difficultyDropdown");
  }
});

// --- Sorting Functionality ---

function sortByColumn(column) {
  if (sortColumn === column) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortOrder = 'asc';
  }
  applyFilters();
  updateSortIndicators();
}

function updateSortIndicators() {
  // Update headers to visually indicate sorted column (e.g., via a CSS class)
  const titleHeader = document.getElementById("titleHeader");
  const topicHeader = document.getElementById("topicHeader");
  const difficultyHeader = document.getElementById("difficultyHeader");
  
  titleHeader.classList.toggle("sorted", sortColumn === "title");
  topicHeader.classList.toggle("sorted", sortColumn === "topic");
  difficultyHeader.classList.toggle("sorted", sortColumn === "difficulty");
}

// --- Event Listeners on Header Cells for Sorting and Dropdowns ---

document.getElementById("titleHeader").addEventListener("click", (e) => {
  // Clicking title header (excluding any nested elements) sorts by title.
  sortByColumn("title");
});

document.getElementById("topicHeader").addEventListener("click", (e) => {
  if (e.target.id === "topicArrow") {
    toggleDropdown("topicDropdown", "topicArrow");
  } else {
    sortByColumn("topic");
  }
});

document.getElementById("difficultyHeader").addEventListener("click", (e) => {
  if (e.target.id === "difficultyArrow") {
    toggleDropdown("difficultyDropdown", "difficultyArrow");
  } else {
    sortByColumn("difficulty");
  }
});

// --- LocalStorage Handling for Solved Questions ---

function loadSolvedQuestions() {
  const saved = localStorage.getItem('solvedQuestions');
  solvedQuestions = saved ? JSON.parse(saved) : {};
  loadQuestionsData();
}

function saveSolvedQuestions() {
  localStorage.setItem('solvedQuestions', JSON.stringify(solvedQuestions));
}

// --- Load questions data from JSON file ---

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

// --- Populate Dropdown Menus for Topic and Difficulty Filters ---
function populateDropdowns() {
  const topics = new Set();
  const difficulties = new Set();
  questionsData.forEach(q => {
    topics.add(q.topic);
    difficulties.add(q.difficulty);
  });

  // Populate Topic dropdown
  const topicDropdown = document.getElementById("topicDropdown");
  topicDropdown.innerHTML = '<div class="dropdown-item" data-value="">All</div>';
  topics.forEach(topic => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = toTitleCase(topic);
    item.dataset.value = topic;
    item.addEventListener("click", () => {
      selectedTopicFilter = topic;
      closeDropdown("topicDropdown");
      applyFilters();
    });
    topicDropdown.appendChild(item);
  });

  // Populate Difficulty dropdown
  const difficultyDropdown = document.getElementById("difficultyDropdown");
  difficultyDropdown.innerHTML = '<div class="dropdown-item" data-value="">All</div>';
  difficulties.forEach(diff => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = toTitleCase(diff);
    item.dataset.value = diff;
    item.addEventListener("click", () => {
      selectedDifficultyFilter = diff;
      closeDropdown("difficultyDropdown");
      applyFilters();
    });
    difficultyDropdown.appendChild(item);
  });
}

// --- Render Companies in Sidebar ---
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

// --- Apply Filters, Sorting, and Render Table ---
function applyFilters() {
  const searchText = searchInput.value.toLowerCase();
  const selectedTopic = selectedTopicFilter;
  const selectedDiff = selectedDifficultyFilter;
  
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
  
  // Apply sorting if a column is selected
  if (sortColumn) {
    filteredData.sort((a, b) => {
      let aVal = a[sortColumn].toLowerCase();
      let bVal = b[sortColumn].toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  currentPage = 1;
  renderTable();
  updatePaginationInfo();
  renderCompanies();
}

// --- Render the Questions Table ---
function renderTable() {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  pageData.forEach(q => {
    const row = document.createElement("tr");

    // Title cell with link
    const titleCell = document.createElement("td");
    titleCell.innerHTML = `<a href="question.html?id=${q.id}">${q.title}</a>`;

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

    // Topic cell (display in Title Case)
    const topicCell = document.createElement("td");
    topicCell.textContent = toTitleCase(q.topic);

    // Difficulty cell with label (display in Title Case)
    const diffCell = document.createElement("td");
    diffCell.style.textAlign = "center";
    const diffLabel = document.createElement("span");
    diffLabel.className = "difficulty-label";
    diffLabel.textContent = toTitleCase(q.difficulty);
    const diffLower = q.difficulty.toLowerCase();
    if (diffLower === "hard") {
      diffLabel.style.backgroundColor = "#ffcccc"; // light red
    } else if (diffLower === "medium") {
      diffLabel.style.backgroundColor = "#ffccff"; // light magenta
    } else if (diffLower === "easy") {
      diffLabel.style.backgroundColor = "#cce5ff"; // light blue
    }
    diffCell.appendChild(diffLabel);

    // Append cells in new column order: Title, Star, Topic, Difficulty
    row.appendChild(titleCell);
    row.appendChild(starCell);
    row.appendChild(topicCell);
    row.appendChild(diffCell);

    tableBody.appendChild(row);
  });
  
  problemCount.textContent = `Showing ${filteredData.length} problem${filteredData.length !== 1 ? "s" : ""}`;
}

// --- Update Pagination Information ---
function updatePaginationInfo() {
  const totalPages = Math.max(Math.ceil(filteredData.length / pageSize), 1);
  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages;
  
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// --- Pagination Event Handlers ---
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

// --- Filter Event Listeners ---
searchInput.addEventListener("input", applyFilters);

// Company search input event listener
const companySearchInput = document.getElementById("companySearch");
if (companySearchInput) {
  companySearchInput.addEventListener("input", renderCompanies);
}

// Initial load
loadSolvedQuestions();
