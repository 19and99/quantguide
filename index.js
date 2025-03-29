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
  company: "",
  solved: "" // "" (all), "solved", or "unsolved"
};

/* Star state helpers */
function isStarred(id) {
  return localStorage.getItem(`starred-${id}`) === "true";
}
function toggleStar(id) {
  const current = isStarred(id);
  localStorage.setItem(`starred-${id}`, !current);
}

/* Solved state helpers */
function isSolved(id) {
  return localStorage.getItem(`solved-${id}`) === "true";
}
function toggleSolved(id) {
  const current = isSolved(id);
  localStorage.setItem(`solved-${id}`, !current);
}

/******************************
 * Filtering & Rendering
 ******************************/
function applyFilters() {
  filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(filters.search);
    const matchesTopic = filters.topic ? q.topic.toLowerCase() === filters.topic : true;
    const matchesDifficulty = filters.difficulty ? q.difficulty.toLowerCase() === filters.difficulty : true;
    const matchesCompany = filters.company ? q.companies.includes(filters.company) : true;
    const matchesSolved = filters.solved
      ? (filters.solved === "solved" ? isSolved(q.id) : !isSolved(q.id))
      : true;
    return matchesSearch && matchesTopic && matchesDifficulty && matchesCompany && matchesSolved;
  });
}

function updateAll() {
  applyFilters();
  currentPage = 1;
  renderTable();
  updatePagination();
  populateCompanySidebar();
  localStorage.setItem("filters", JSON.stringify(filters));
}

/******************************
 * Data Fetch & Initialization
 ******************************/
document.addEventListener("DOMContentLoaded", () => {
  // Restore filters from localStorage if available
  const savedFilters = localStorage.getItem("filters");
  if (savedFilters) {
    Object.assign(filters, JSON.parse(savedFilters));
  }

// Update header titles for Topic and Difficulty based on saved filters
  if (filters.topic) {
    document.getElementById("topic-col-title").textContent = capitalize(filters.topic);
  }
  if (filters.difficulty) {
    document.getElementById("difficulty-col-title").textContent = capitalize(filters.difficulty);
  }

  // Set the solved filter select element to the saved value and add event listener
  const solvedFilterEl = document.getElementById("solved-filter");
  if (solvedFilterEl) {
    solvedFilterEl.value = filters.solved;
    solvedFilterEl.addEventListener("change", (e) => {
      filters.solved = e.target.value;
      updateAll();
    });
  }

  // Add event listener for "Clear Filters" button
  const clearFiltersBtn = document.getElementById("clear-filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      // Reset all filters
      filters.search = "";
      filters.topic = "";
      filters.difficulty = "";
      filters.company = "";
      filters.solved = "";
      // Clear input fields
      document.getElementById("search-input").value = "";
      document.getElementById("company-search-input").value = "";
      if (solvedFilterEl) solvedFilterEl.value = "";
      // Reset dropdown header titles
      document.getElementById("topic-col-title").textContent = "Topic";
      document.getElementById("difficulty-col-title").textContent = "Difficulty";
      updateAll();
    });
  }


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
  document.getElementById("search-input").addEventListener("input", function () {
    filters.search = this.value.toLowerCase().trim();
    updateAll();
  });

  document.getElementById("page-size").addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    renderTable();
    updatePagination();
  });

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

  // Company search input (simply re-render sidebar on input)
  document.getElementById("company-search-input").addEventListener("input", function () {
    populateCompanySidebar();
  });

  const topicHeader = document.getElementById("topic-header-click");
  topicHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("topicDropdown").classList.toggle("hidden");
    const arrow = document.querySelector(".topic-arrow");
    arrow.textContent = arrow.textContent === "►" ? "▼" : "►";
  });

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

    const nameTd = document.createElement("td");
    nameTd.innerHTML = `<a href="question.html?id=${q.id}">${q.title}</a>`;
    tr.appendChild(nameTd);

    const topicTd = document.createElement("td");
    topicTd.textContent = capitalize(q.topic);
    tr.appendChild(topicTd);

    const diffTd = document.createElement("td");
    diffTd.textContent = capitalize(q.difficulty);

    // Create a container for the action buttons (star & solved)
    const btnContainer = document.createElement("span");
    btnContainer.classList.add("btn-container");

    // Star button remains unchanged
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

    // Revised Solved/Unsolved button using a styled button element
    const solvedBtn = document.createElement("button");
    solvedBtn.classList.add("solved-btn");
    solvedBtn.textContent = isSolved(q.id) ? "Solved" : "Unsolved";
    solvedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSolved(q.id);
      solvedBtn.textContent = isSolved(q.id) ? "Solved" : "Unsolved";
      updateAll(); // refresh in case solved filter is active
    });

    // Append the star and solved buttons to the container
    btnContainer.appendChild(starSpan);
    btnContainer.appendChild(solvedBtn);
    diffTd.appendChild(btnContainer);

    tr.appendChild(diffTd);
    tbody.appendChild(tr);
  });

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

  const uniqueTopics = [...new Set(allQuestions.map((q) => q.topic.toLowerCase()))];
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

  const uniqueDiffs = [...new Set(allQuestions.map((q) => q.difficulty.toLowerCase()))];
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
  
  // Set container height to fixed 400px
  container.style.height = "400px";
  
  const searchVal = document.getElementById("company-search-input").value.toLowerCase().trim();

  let companies = [];
  allQuestions.forEach((q) => {
    q.companies.forEach((c) => companies.push(c));
  });
  companies = [...new Set(companies)].filter((c) => c.toLowerCase().includes(searchVal));
  companies.sort();

  companies.forEach((company) => {
    const chip = document.createElement("div");
    chip.classList.add("company-chip");
    if (filters.company === company) {
      chip.classList.add("selected");
    }
    const count = allQuestions.filter((q) => {
      const matchesBase =
        (!filters.search || q.title.toLowerCase().includes(filters.search)) &&
        (!filters.topic || q.topic.toLowerCase() === filters.topic) &&
        (!filters.difficulty || q.difficulty.toLowerCase() === filters.difficulty);
      return matchesBase && q.companies.includes(company);
    }).length;
    chip.innerHTML = `<span>${company}</span><span>${count}</span>`;
    chip.addEventListener("click", () => {
      filters.company = filters.company === company ? "" : company;
      updateAll();
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
