/******************************
 * Global Data/State
 ******************************/
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;
let pageSize = 50; // default is 50

// Companies sidebar pagination
let currentCompanyPage = 1;
const companiesPerPage = 8; // ensure 8 per page

function isStarred(id) {
  return localStorage.getItem(`starred-${id}`) === "true";
}
function toggleStar(id) {
  const current = isStarred(id);
  localStorage.setItem(`starred-${id}`, !current);
}

/******************************
 * Fetch Data & Initialize
 ******************************/
document.addEventListener("DOMContentLoaded", () => {
  fetch("questionsData.json")
    .then((res) => res.json())
    .then((data) => {
      allQuestions = data;
      filteredQuestions = [...allQuestions];

      populateTopicDropdown();
      populateDifficultyDropdown();
      populateCompanySidebar();
      renderTable();
      updatePagination();
    })
    .catch((err) => console.error("Error loading questionsData.json:", err));

  // Search input
  document
    .getElementById("search-input")
    .addEventListener("input", onSearchChange);

  // Page size dropdown
  document.getElementById("page-size").addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    renderTable();
    updatePagination();
  });

  // Pagination controls
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

  // Company search
  document
    .getElementById("company-search-input")
    .addEventListener("input", () => {
      currentCompanyPage = 1;
      populateCompanySidebar();
    });

  // Company pagination
  document
    .getElementById("prev-company-page")
    .addEventListener("click", () => {
      if (currentCompanyPage > 1) {
        currentCompanyPage--;
        populateCompanySidebar();
      }
    });
  document
    .getElementById("next-company-page")
    .addEventListener("click", () => {
      currentCompanyPage++;
      populateCompanySidebar();
    });

  // Topic header clickable
  const topicHeader = document.getElementById("topic-header-click");
  topicHeader.addEventListener("click", () => {
    document.getElementById("topicDropdown").classList.toggle("hidden");
    const arrow = document.querySelector(".topic-arrow");
    arrow.textContent = arrow.textContent === "►" ? "▼" : "►";
  });

  // Difficulty header clickable
  const difficultyHeader = document.getElementById("difficulty-header-click");
  difficultyHeader.addEventListener("click", () => {
    document.getElementById("difficultyDropdown").classList.toggle("hidden");
    const arrow = document.querySelector(".difficulty-arrow");
    arrow.textContent = arrow.textContent === "►" ? "▼" : "►";
  });
});

/******************************
 * Render Table
 ******************************/
function renderTable() {
  const tbody = document.getElementById("questions-tbody");
  tbody.innerHTML = "";

  // Pagination slice
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredQuestions.slice(startIndex, endIndex);

  pageItems.forEach((q) => {
    const tr = document.createElement("tr");

    // Name
    const nameTd = document.createElement("td");
    nameTd.textContent = q.title;
    tr.appendChild(nameTd);

    // Topic
    const topicTd = document.createElement("td");
    topicTd.textContent = capitalize(q.topic);
    tr.appendChild(topicTd);

    // Difficulty + star
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
      if (isStarred(q.id)) {
        starSpan.classList.add("solved");
        starSpan.textContent = "★";
      } else {
        starSpan.classList.remove("solved");
        starSpan.textContent = "☆";
      }
    });
    diffTd.appendChild(starSpan);
    tr.appendChild(diffTd);

    tbody.appendChild(tr);
  });

  // Update results count
  document.getElementById("results-count").textContent =
    filteredQuestions.length;
}

/******************************
 * Update Pagination
 ******************************/
function updatePagination() {
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  document.getElementById("current-page").textContent = currentPage;
  document.getElementById("total-pages").textContent = totalPages;
}

/******************************
 * Search
 ******************************/
function onSearchChange() {
  const val = this.value.toLowerCase().trim();
  filteredQuestions = allQuestions.filter((q) =>
    q.title.toLowerCase().includes(val)
  );
  currentPage = 1;
  renderTable();
  updatePagination();
}

/******************************
 * Topic & Difficulty Dropdowns
 ******************************/
function populateTopicDropdown() {
  const topicDropdown = document.getElementById("topicDropdown");
  topicDropdown.innerHTML = "";

  // "All" option
  const allDiv = document.createElement("div");
  allDiv.textContent = "All";
  allDiv.addEventListener("click", () => {
    // Remove topic filter
    filteredQuestions = [...allQuestions];
    currentPage = 1;
    renderTable();
    updatePagination();

    // Reset column title
    document.getElementById("topic-col-title").textContent = "Topic";

    // Close dropdown
    topicDropdown.classList.add("hidden");
    document.querySelector(".topic-arrow").textContent = "►";
  });
  topicDropdown.appendChild(allDiv);

  // Unique topics
  const uniqueTopics = [
    ...new Set(allQuestions.map((q) => q.topic.toLowerCase())),
  ];

  uniqueTopics.forEach((topic) => {
    const div = document.createElement("div");
    div.textContent = capitalize(topic);
    div.addEventListener("click", () => {
      // Filter
      filteredQuestions = allQuestions.filter(
        (q) => q.topic.toLowerCase() === topic
      );
      currentPage = 1;
      renderTable();
      updatePagination();

      // Update the column title
      document.getElementById("topic-col-title").textContent = capitalize(topic);

      // Close dropdown
      topicDropdown.classList.add("hidden");
      document.querySelector(".topic-arrow").textContent = "►";
    });
    topicDropdown.appendChild(div);
  });
}

function populateDifficultyDropdown() {
  const difficultyDropdown = document.getElementById("difficultyDropdown");
  difficultyDropdown.innerHTML = "";

  // "All" option
  const allDiv = document.createElement("div");
  allDiv.textContent = "All";
  allDiv.addEventListener("click", () => {
    // Remove difficulty filter
    filteredQuestions = [...allQuestions];
    currentPage = 1;
    renderTable();
    updatePagination();

    // Reset column title
    document.getElementById("difficulty-col-title").textContent = "Difficulty";

    // Close dropdown
    difficultyDropdown.classList.add("hidden");
    document.querySelector(".difficulty-arrow").textContent = "►";
  });
  difficultyDropdown.appendChild(allDiv);

  // Unique difficulties
  const uniqueDiffs = [
    ...new Set(allQuestions.map((q) => q.difficulty.toLowerCase())),
  ];

  uniqueDiffs.forEach((diff) => {
    const div = document.createElement("div");
    div.textContent = capitalize(diff);
    div.addEventListener("click", () => {
      // Filter
      filteredQuestions = allQuestions.filter(
        (q) => q.difficulty.toLowerCase() === diff
      );
      currentPage = 1;
      renderTable();
      updatePagination();

      // Update the column title
      document.getElementById("difficulty-col-title").textContent =
        capitalize(diff);

      // Close dropdown
      difficultyDropdown.classList.add("hidden");
      document.querySelector(".difficulty-arrow").textContent = "►";
    });
    difficultyDropdown.appendChild(div);
  });
}

/******************************
 * Companies Sidebar
 ******************************/
function populateCompanySidebar() {
  const container = document.getElementById("companies-container");
  container.innerHTML = "";

  const searchVal = document
    .getElementById("company-search-input")
    .value.toLowerCase()
    .trim();

  // Gather all companies from questions
  let companies = [];
  allQuestions.forEach((q) => {
    q.companies.forEach((c) => companies.push(c));
  });
  // Unique + filter by search
  companies = [...new Set(companies)].filter((c) =>
    c.toLowerCase().includes(searchVal)
  );
  // Sort (optional)
  companies.sort();

  // Pagination
  const totalCompanyPages = Math.ceil(companies.length / companiesPerPage) || 1;
  if (currentCompanyPage > totalCompanyPages) {
    currentCompanyPage = totalCompanyPages;
  }
  const startIndex = (currentCompanyPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const pageCompanies = companies.slice(startIndex, endIndex);

  // Render as chips
  pageCompanies.forEach((company) => {
    const chip = document.createElement("div");
    chip.classList.add("company-chip");

    // Count how many questions have this company
    const count = allQuestions.filter((q) => q.companies.includes(company))
      .length;

    chip.innerHTML = `
      <span>${company}</span>
      <span>${count}</span>
    `;

    chip.addEventListener("click", () => {
      // Filter questions by selected company
      filteredQuestions = allQuestions.filter((q) =>
        q.companies.includes(company)
      );
      currentPage = 1;
      renderTable();
      updatePagination();
    });

    container.appendChild(chip);
  });
}

/******************************
 * Helpers
 ******************************/
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
