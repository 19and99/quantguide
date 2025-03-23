/******************************
 * Global Data/State
 ******************************/
let allQuestions = [];        // All questions from questionsData.json
let filteredQuestions = [];   // Questions after search/topic/difficulty/company filters
let currentPage = 1;
const pageSize = 10; // number of questions per page

// Companies sidebar pagination
let currentCompanyPage = 1;
const companiesPerPage = 5;   // number of companies shown per page

// For storing star states in localStorage
// Key: "starred-[questionId]" => "true" or "false"
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
  // Fetch the questionsData.json
  fetch("questionsData.json")
    .then((response) => response.json())
    .then((data) => {
      allQuestions = data;
      filteredQuestions = [...allQuestions]; // initial copy
      populateTopicDropdown();
      populateDifficultyDropdown();
      populateCompanySidebar();
      renderTable();
      updatePagination();
    })
    .catch((error) => console.error("Error loading questionsData.json:", error));

  // Event listeners
  document
    .getElementById("search-input")
    .addEventListener("input", onSearchChange);

  // Pagination buttons
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
    .addEventListener("input", populateCompanySidebar);

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
      // We'll compute total pages in populateCompanySidebar()
      currentCompanyPage++;
      populateCompanySidebar();
    });

  // Topic dropdown toggle
  const topicArrow = document.querySelector(".topic-arrow");
  topicArrow.addEventListener("click", () => {
    document.getElementById("topicDropdown").classList.toggle("hidden");
    // Toggle arrow direction
    topicArrow.textContent =
      topicArrow.textContent === "►" ? "▼" : "►";
  });

  // Difficulty dropdown toggle
  const difficultyArrow = document.querySelector(".difficulty-arrow");
  difficultyArrow.addEventListener("click", () => {
    document.getElementById("difficultyDropdown").classList.toggle("hidden");
    // Toggle arrow direction
    difficultyArrow.textContent =
      difficultyArrow.textContent === "►" ? "▼" : "►";
  });
});

/******************************
 * Render Table
 ******************************/
function renderTable() {
  const tbody = document.getElementById("questions-tbody");
  tbody.innerHTML = "";

  // Calculate slice for pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredQuestions.slice(startIndex, endIndex);

  pageItems.forEach((q) => {
    const tr = document.createElement("tr");

    // Name cell
    const nameTd = document.createElement("td");
    nameTd.textContent = q.title;
    // If you want to link to a single-problem page later, you could do:
    // nameTd.addEventListener("click", () => {
    //   // navigate or show single question (not implemented yet)
    // });
    tr.appendChild(nameTd);

    // Topic cell
    const topicTd = document.createElement("td");
    topicTd.textContent = capitalize(q.topic);
    tr.appendChild(topicTd);

    // Difficulty cell (with star in the same cell to the right)
    const diffTd = document.createElement("td");
    diffTd.textContent = capitalize(q.difficulty);

    // Star button
    const starSpan = document.createElement("span");
    starSpan.classList.add("star-btn");
    if (isStarred(q.id)) {
      starSpan.classList.add("solved");
      starSpan.textContent = "★"; // gold star
    } else {
      starSpan.textContent = "☆"; // outlined star
    }
    starSpan.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStar(q.id);
      // Update star UI
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
 * Pagination UI
 ******************************/
function updatePagination() {
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  document.getElementById("current-page").textContent = currentPage;
  document.getElementById("total-pages").textContent = totalPages || 1;
}

/******************************
 * Search Filtering
 ******************************/
function onSearchChange() {
  const searchValue = this.value.toLowerCase().trim();

  // Filter by search
  filteredQuestions = allQuestions.filter((q) =>
    q.title.toLowerCase().includes(searchValue)
  );

  // Reset pagination
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

  // Get unique topics
  const uniqueTopics = [
    ...new Set(allQuestions.map((q) => q.topic.toLowerCase())),
  ];

  uniqueTopics.forEach((topic) => {
    const div = document.createElement("div");
    div.textContent = capitalize(topic);
    div.addEventListener("click", () => {
      // Filter by this topic
      filteredQuestions = allQuestions.filter(
        (q) => q.topic.toLowerCase() === topic
      );
      currentPage = 1;
      renderTable();
      updatePagination();
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

  // Get unique difficulties
  const uniqueDiffs = [
    ...new Set(allQuestions.map((q) => q.difficulty.toLowerCase())),
  ];

  uniqueDiffs.forEach((diff) => {
    const div = document.createElement("div");
    div.textContent = capitalize(diff);
    div.addEventListener("click", () => {
      // Filter by this difficulty
      filteredQuestions = allQuestions.filter(
        (q) => q.difficulty.toLowerCase() === diff
      );
      currentPage = 1;
      renderTable();
      updatePagination();
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
  const list = document.getElementById("companies-list");
  list.innerHTML = "";

  const searchVal = document
    .getElementById("company-search-input")
    .value.toLowerCase()
    .trim();

  // Collect all companies
  let companies = [];
  allQuestions.forEach((q) => {
    q.companies.forEach((c) => {
      companies.push(c);
    });
  });
  // Unique + filter by search
  companies = [...new Set(companies)].filter((c) =>
    c.toLowerCase().includes(searchVal)
  );

  // Sort or do any logic you want
  companies.sort();

  // Pagination for companies
  const totalCompanyPages = Math.ceil(companies.length / companiesPerPage);
  if (currentCompanyPage > totalCompanyPages) {
    currentCompanyPage = totalCompanyPages || 1;
  }
  const startIndex = (currentCompanyPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const pageCompanies = companies.slice(startIndex, endIndex);

  // Render
  pageCompanies.forEach((company) => {
    const li = document.createElement("li");

    // Count how many questions have this company
    const count = allQuestions.filter((q) =>
      q.companies.includes(company)
    ).length;

    li.innerHTML = `
      <span>${company}</span>
      <span>${count}</span>
    `;

    // On click, filter the main question list by this company
    li.addEventListener("click", () => {
      filteredQuestions = allQuestions.filter((q) =>
        q.companies.includes(company)
      );
      currentPage = 1;
      renderTable();
      updatePagination();
    });

    list.appendChild(li);
  });
}

/******************************
 * Helpers
 ******************************/
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
