// API 1: "https://www.omdbapi.com/?apikey=87fd279a&s=:query"
// API 2: "https://www.omdbapi.com/?apikey=87fd279a&i=:id"

const API_KEY = "87fd279a";
const BASE_URL = "https://www.omdbapi.com/";

const movieListEl = document.querySelector(".movie-list");
const emptyStateEl = document.querySelector(".empty-state");
const errorBannerEl = document.querySelector(".error-banner");
const recentSearchesWrapEl = document.querySelector(".recent-searches");
const recentSearchListEl = document.querySelector(".recent-search-list");
const watchlistCountEls = document.querySelectorAll(".watchlist-count");
const resultsCountEl = document.querySelector(".results-count");
const searchInputEl = document.querySelector("#search-input");

let moviesData = [];
let currentQuery = localStorage.getItem("screenscout_last_query") || "";
let sortMode = "relevance";
let watchlistOnly = false;

function getWatchlist() {
  return JSON.parse(localStorage.getItem("screenscout_watchlist") || "[]");
}

function getRecentSearches() {
  return JSON.parse(localStorage.getItem("screenscout_recent_searches") || "[]");
}

function setWatchlist(items) {
  localStorage.setItem("screenscout_watchlist", JSON.stringify(items));
  renderWatchlistCount();
}

function setRecentSearches(items) {
  localStorage.setItem("screenscout_recent_searches", JSON.stringify(items));
  renderRecentSearches();
}

function renderWatchlistCount() {
  const count = getWatchlist().length;
  watchlistCountEls.forEach((element) => {
    element.textContent = count;
  });
}

function addRecentSearch(query) {
  const cleaned = query.trim();
  if (!cleaned) return;

  const recent = getRecentSearches();
  const next = [cleaned, ...recent.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, 5);
  setRecentSearches(next);
}

function renderRecentSearches() {
  const recent = getRecentSearches();

  if (!recent.length) {
    recentSearchesWrapEl.classList.add("hidden");
    recentSearchListEl.innerHTML = "";
    return;
  }

  recentSearchesWrapEl.classList.remove("hidden");
  recentSearchListEl.innerHTML = recent
    .map((item) => `<button class="chip" onclick="quickSearch('${item.replace(/'/g, "\\'")}')">${item}</button>`)
    .join("");
}

function sortMovies(items) {
  const sorted = [...items];

  switch (sortMode) {
    case "year-desc":
      return sorted.sort((a, b) => Number(b.Year) - Number(a.Year));
    case "year-asc":
      return sorted.sort((a, b) => Number(a.Year) - Number(b.Year));
    case "title-asc":
      return sorted.sort((a, b) => a.Title.localeCompare(b.Title));
    case "title-desc":
      return sorted.sort((a, b) => b.Title.localeCompare(a.Title));
    case "type":
      return sorted.sort((a, b) => a.Type.localeCompare(b.Type) || a.Title.localeCompare(b.Title));
    default:
      return sorted;
  }
}

function getVisibleMovies() {
  const watchlist = getWatchlist();

  const baseMovies = watchlistOnly
    ? moviesData.filter((movie) => watchlist.some((saved) => saved.imdbID === movie.imdbID))
    : moviesData;

  return sortMovies(baseMovies);
}

function toggleEmptyState(show) {
  emptyStateEl.classList.toggle("hidden", !show);
}

function setError(message) {
  errorBannerEl.textContent = message || "";
  errorBannerEl.classList.toggle("hidden", !message);
}

function showMovieDetails(id) {
  localStorage.setItem("screenscout_selected_id", id);
  window.location.href = "./movie.html";
}

function toggleWatchlist(event, imdbID) {
  event.stopPropagation();

  const watchlist = getWatchlist();
  const exists = watchlist.some((saved) => saved.imdbID === imdbID);

  if (exists) {
    setWatchlist(watchlist.filter((saved) => saved.imdbID !== imdbID));
  } else {
    const movie = moviesData.find((item) => item.imdbID === imdbID);
    if (!movie) return;
    setWatchlist([movie, ...watchlist]);
  }

  renderMovies();
}

function movieHTML(movie) {
  const saved = getWatchlist().some((item) => item.imdbID === movie.imdbID);
  const poster = movie.Poster && movie.Poster !== "N/A"
    ? `<img class="media-card__poster" src="${movie.Poster}" alt="${movie.Title}" />`
    : `<div class="media-card__poster media-card__poster--placeholder">No poster</div>`;

  return `<article class="media-card card" onclick="showMovieDetails('${movie.imdbID}')">
      <button class="save-button ${saved ? "saved" : ""}" onclick="toggleWatchlist(event, '${movie.imdbID}')" aria-label="Toggle watchlist">
        ${saved ? "♥" : "♡"}
      </button>
      ${poster}
      <div class="media-card__body">
        <span class="badge">${movie.Type}</span>
        <a class="media-card__title-link">
          <h3>${movie.Title}</h3>
        </a>
        <p class="muted">${movie.Year}</p>
      </div>
    </article>`;
}

function renderMovies() {
  const visibleMovies = getVisibleMovies();
  resultsCountEl.textContent = visibleMovies.length;

  if (!visibleMovies.length) {
    movieListEl.innerHTML = "";
    toggleEmptyState(true);
    return;
  }

  toggleEmptyState(false);
  movieListEl.innerHTML = visibleMovies.map((movie) => movieHTML(movie)).join("");
}

async function searchMovies(query) {
  const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
  const data = await response.json();

  if (data.Response === "False") {
    moviesData = [];
    setError(data.Error || "No titles found.");
    renderMovies();
    return;
  }

  moviesData = data.Search || [];
  setError("");
  renderMovies();
}

async function onSearchSubmit(event) {
  event.preventDefault();
  const query = searchInputEl.value.trim();

  if (!query) return;

  currentQuery = query;
  localStorage.setItem("screenscout_last_query", query);
  addRecentSearch(query);
  await searchMovies(query);
}

async function quickSearch(query) {
  searchInputEl.value = query;
  currentQuery = query;
  localStorage.setItem("screenscout_last_query", query);
  await searchMovies(query);
}

function onSortChange(event) {
  sortMode = event.target.value;
  renderMovies();
}

function toggleWatchlistOnly(event) {
  watchlistOnly = event.target.checked;
  renderMovies();
}

async function main() {
  renderWatchlistCount();
  renderRecentSearches();

  if (currentQuery) {
    searchInputEl.value = currentQuery;
    await searchMovies(currentQuery);
    return;
  }

  toggleEmptyState(true);
}

main();
