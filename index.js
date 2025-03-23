/******************************
 * Global Data & Filter State
 ******************************/
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;
let pageSize = 50; // default

// Filter state: empty strings mean no filter applied
const filters = {
  search: "",
  topic: "",
  difficulty: "",
  company: ""
};

// Companies sidebar pagination state (handled via scroll)
let currentCompanyPage = 1;

/* Star state helpers */
function isStarred(id) {
  return localStorage.getItem(`starred-${id}`) === "true";
}
function toggleStar(id) {
  const current = isStarred(id);
  localStorage.setItem(`starred-${id}`, !current);
}

/******************************
 * Filtering & Rendering
 ******************************/
// Applies all filters to allQuestions
function applyFilters() {
  filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(filters.search);
    const matchesTopic = filters.topic
      ? q.topic.toLowerCase() === filters.topic
      : true;
    const matchesDifficulty = filters.difficulty
      ? q.difficulty.toLowerCase() === filters.difficulty
      : true;
    const matchesCompany = filters.company
      ? q.companies.includes(filters.company)
      : true;
    return matchesSearch && matchesTopic && matchesDifficulty && matchesCompany;
  });
}

// Call this after any filter update
function updateAll() {
  applyFilters();
  currentPage = 1;
  renderTable();
  updatePagination();
  populateCompanySidebar();
}

/******************************
 * Data Fetch & Initialization
 ******************************/
document.addEventListener("DOMContentLoaded", () => {
  fetch("questionsData.json")
    .then((res) => res.json())
    .then((data) => {
      allQuestions = data;
      updateAll();

      populateTopicDropdown();
      populateDifficultyDropdown();
      populateCompanySidebar();
    })
    .catch((err) => console.error("Error loading questionsData.json:", err));

  // Search input for questions table
  document
    .getElementById("search-input")
    .addEventListener("input", function () {
      filters.search = this.value.toLowerCase().trim();
      updateAll();
    });

  // Page size dropdown
  document.getElementById("page-size").addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    renderTable();
    updatePagination();
  });

  // Pagination controls for questions table
  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      updatePagination();
    }
  });
  document.getElementById("next-page").addEventListener("click", () => {
    if (currentPage < Math.ceil(filteredQuestions.length / pageSize)) {
      currentPage++;
      renderTable();
      updatePagination();
    }
  });

  // Company search input
  document
    .getElementById("company-search-input")
    .addEventListener("input", function () {
      currentCompanyPage = 1;
      populateCompanySidebar();
    });

  // Company pagination controls (using scrolling)
  document.getElementById("prev-company-page").addEventListener("click", () => {
    if (currentCompanyPage > 1) {
      currentCompanyPage--;
      const container = document.getElementById("companies-container");
      container.scrollTop = (currentCompanyPage - 1) * container.clientHeight;
    }
  });
  document.getElementById("next-company-page").addEventListener("click", () => {
    const container = document.getElementById("companies-container");
    const totalCompanyPages = Math.ceil(container.scrollHeight / container.clientHeight);
    if (currentCompanyPage < totalCompanyPages) {
      currentCompanyPage++;
      container.scrollTop = (currentCompanyPage - 1) * container.clientHeight;
    }
  });

  // Topic header clickable area
  const topicHeader = document.getElementById("topic-header-click");
  topicHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("topicDropdown").classList.toggle("hidden");
    const arrow = document.querySelector(".topic-arrow");
    arrow.textContent = arrow.textContent === "►" ? "▼" : "►";
  });

  // Difficulty header clickable area
  const difficultyHeader = document.getElementById("difficulty-header-click");
  difficultyHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("difficultyDropdown").classList.toggle("hidden");
    const arrow = document.querySelector(".difficulty-arrow");
    arrow.textContent = arrow.textContent === "►" ? "▼" : "►";
  });
});

/******************************
 * Render Questions Table
 ******************************/
function renderTable() {
  const tbody = document.getElementById("questions-tbody");
  tbody.innerHTML = "";

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredQuestions.slice(startIndex, endIndex);

  pageItems.forEach((q) => {
    const tr = document.createElement("tr");

    // Name cell
    const nameTd = document.createElement("td");
    nameTd.textContent = q.title;
    tr.appendChild(nameTd);

    // Topic cell
    const topicTd = document.createElement("td");
    topicTd.textContent = capitalize(q.topic);
    tr.appendChild(topicTd);

    // Difficulty cell with star button
    const diffTd = document.createElement("td");
    diffTd.textContent = capitalize(q.difficulty);

    const starSpan = document.createElement("span");
    starSpan.classList.add("star-btn");
    if (isStarred(q.id)) {
      starSpan.classList.add("solved");
      starSpan.textContent = "★";
    } else {
      starSpan.textContent = "☆";
    }
    starSpan.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStar(q.id);
      starSpan.classList.toggle("solved", isStarred(q.id));
      starSpan.textContent = isStarred(q.id) ? "★" : "☆";
    });
    diffTd.appendChild(starSpan);
    tr.appendChild(diffTd);

    tbody.appendChild(tr);
  });

  // Update the results count based on filtered questions
  document.getElementById("results-count").textContent = filteredQuestions.length;
}

/******************************
 * Update Pagination (Questions)
 ******************************/
function updatePagination() {
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  document.getElementById("current-page").textContent = currentPage;
  document.getElementById("total-pages").textContent = totalPages;
}

/******************************
 * Topic & Difficulty Dropdowns
 ******************************/
function populateTopicDropdown() {
  const topicDropdown = document.getElementById("topicDropdown");
  topicDropdown.innerHTML = "";

  // "All" option resets topic filter
  const allDiv = document.createElement("div");
  allDiv.textContent = "All";
  allDiv.addEventListener("click", () => {
    filters.topic = "";
    document.getElementById("topic-col-title").textContent = "Topic";
    topicDropdown.classList.add("hidden");
    document.querySelector(".topic-arrow").textContent = "►";
    updateAll();
  });
  topicDropdown.appendChild(allDiv);

  // Unique topics
  const uniqueTopics = [
    ...new Set(allQuestions.map((q) => q.topic.toLowerCase()))
  ];
  uniqueTopics.forEach((topic) => {
    const div = document.createElement("div");
    div.textContent = capitalize(topic);
    div.addEventListener("click", () => {
      filters.topic = topic;
      document.getElementById("topic-col-title").textContent = capitalize(topic);
      topicDropdown.classList.add("hidden");
      document.querySelector(".topic-arrow").textContent = "►";
      updateAll();
    });
    topicDropdown.appendChild(div);
  });
}

function populateDifficultyDropdown() {
  const difficultyDropdown = document.getElementById("difficultyDropdown");
  difficultyDropdown.innerHTML = "";

  // "All" option resets difficulty filter
  const allDiv = document.createElement("div");
  allDiv.textContent = "All";
  allDiv.addEventListener("click", () => {
    filters.difficulty = "";
    document.getElementById("difficulty-col-title").textContent = "Difficulty";
    difficultyDropdown.classList.add("hidden");
    document.querySelector(".difficulty-arrow").textContent = "►";
    updateAll();
  });
  difficultyDropdown.appendChild(allDiv);

  // Unique difficulties
  const uniqueDiffs = [
    ...new Set(allQuestions.map((q) => q.difficulty.toLowerCase()))
  ];
  uniqueDiffs.forEach((diff) => {
    const div = document.createElement("div");
    div.textContent = capitalize(diff);
    div.addEventListener("click", () => {
      filters.difficulty = diff;
      document.getElementById("difficulty-col-title").textContent = capitalize(diff);
      difficultyDropdown.classList.add("hidden");
      document.querySelector(".difficulty-arrow").textContent = "►";
      updateAll();
    });
    difficultyDropdown.appendChild(div);
  });
}

/******************************
 * Companies Sidebar (Chips)
 ******************************/
function populateCompanySidebar() {
  const container = document.getElementById("companies-container");
  container.innerHTML = "";

  const searchVal = document
    .getElementById("company-search-input")
    .value.toLowerCase()
    .trim();

  // Gather unique companies from allQuestions (ignoring current company filter)
  let companies = [];
  allQuestions.forEach((q) => {
    q.companies.forEach((c) => companies.push(c));
  });
  companies = [...new Set(companies)].filter((c) =>
    c.toLowerCase().includes(searchVal)
  );
  companies.sort();

  // Render all company chips and update their counts based on current filters (except company)
  companies.forEach((company) => {
    const chip = document.createElement("div");
    chip.classList.add("company-chip");
    if (filters.company === company) {
      chip.classList.add("selected");
    }

    // Count questions matching search, topic, and difficulty, that include this company.
    const count = allQuestions.filter((q) => {
      const matchesBase =
        (!filters.search || q.title.toLowerCase().includes(filters.search)) &&
        (!filters.topic || q.topic.toLowerCase() === filters.topic) &&
        (!filters.difficulty || q.difficulty.toLowerCase() === filters.difficulty);
      return matchesBase && q.companies.includes(company);
    }).length;

    chip.innerHTML = `<span>${company}</span><span>${count}</span>`;
    chip.addEventListener("click", () => {
      // Toggle company filter
      filters.company = filters.company === company ? "" : company;
      updateAll();
    });
    container.appendChild(chip);
  });

  // After rendering, compute total pages based on container's scroll height and set scrollTop accordingly.
  const totalCompanyPages = Math.ceil(container.scrollHeight / container.clientHeight) || 1;
  if (currentCompanyPage > totalCompanyPages) {
    currentCompanyPage = totalCompanyPages;
  }
  container.scrollTop = (currentCompanyPage - 1) * container.clientHeight;
}

/******************************
 * Helpers
 ******************************/
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
