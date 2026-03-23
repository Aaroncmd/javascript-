const API_KEY = "87fd279a";
const BASE_URL = "https://www.omdbapi.com/";
const detailsShellEl = document.querySelector(".details-shell");
const watchlistCountEls = document.querySelectorAll(".watchlist-count");
const imdbID = localStorage.getItem("screenscout_selected_id");

function getWatchlist() {
  return JSON.parse(localStorage.getItem("screenscout_watchlist") || "[]");
}

function setWatchlist(items) {
  localStorage.setItem("screenscout_watchlist", JSON.stringify(items));
  renderWatchlistCount();
}

function renderWatchlistCount() {
  const count = getWatchlist().length;
  watchlistCountEls.forEach((element) => {
    element.textContent = count;
  });
}

function isSaved(id) {
  return getWatchlist().some((item) => item.imdbID === id);
}

function toggleWatchlistForMovie(movie) {
  const watchlist = getWatchlist();
  const exists = watchlist.some((saved) => saved.imdbID === movie.imdbID);

  if (exists) {
    setWatchlist(watchlist.filter((saved) => saved.imdbID !== movie.imdbID));
  } else {
    setWatchlist([{
      imdbID: movie.imdbID,
      Title: movie.Title,
      Poster: movie.Poster,
      Year: movie.Year,
      Type: movie.Type,
    }, ...watchlist]);
  }

  renderMovie(movie);
}

function renderLoading() {
  detailsShellEl.innerHTML = `
    <section class="details-layout card loading-card">
      <div class="poster-skeleton shimmer"></div>
      <div class="details-skeleton">
        <div class="line shimmer"></div>
        <div class="line short shimmer"></div>
        <div class="line shimmer"></div>
        <div class="line shimmer"></div>
      </div>
    </section>`;
}

function renderError(message) {
  detailsShellEl.innerHTML = `
    <section class="card error-state">
      <h2>Could not load that title</h2>
      <p>${message}</p>
      <a href="./index.html" class="text-link">Back to explore</a>
    </section>`;
}

function renderMovie(movie) {
  const poster = movie.Poster && movie.Poster !== "N/A"
    ? `<img class="details-poster" src="${movie.Poster}" alt="${movie.Title}" />`
    : `<div class="details-poster media-card__poster--placeholder">No poster</div>`;

  detailsShellEl.innerHTML = `
    <section class="details-layout card">
      ${poster}

      <div class="details-copy">
        <a href="./index.html" class="text-link">← Back to explore</a>

        <div class="title-header-row">
          <div>
            <p class="eyebrow">${movie.Type}</p>
            <h1 class="section-title left">${movie.Title}</h1>
          </div>
          <button
            type="button"
            class="save-button details-save ${isSaved(movie.imdbID) ? "saved" : ""}"
            onclick='toggleWatchlistFromPage(${JSON.stringify({
              imdbID: "ID_PLACEHOLDER",
              Title: "TITLE_PLACEHOLDER",
              Poster: "POSTER_PLACEHOLDER",
              Year: "YEAR_PLACEHOLDER",
              Type: "TYPE_PLACEHOLDER",
            }).replace(/"/g, "&quot;")})'
          >
            ${isSaved(movie.imdbID) ? "In watchlist ♥" : "Save ♡"}
          </button>
        </div>

        <div class="detail-badges">
          <span class="badge">${movie.Year}</span>
          <span class="badge">${movie.Rated}</span>
          <span class="badge">${movie.Runtime}</span>
          <span class="badge">IMDb ${movie.imdbRating}</span>
        </div>

        <p class="plot-text">${movie.Plot}</p>

        <div class="info-grid">
          <div><span class="info-label">Genre</span><p>${movie.Genre}</p></div>
          <div><span class="info-label">Released</span><p>${movie.Released}</p></div>
          <div><span class="info-label">Director</span><p>${movie.Director}</p></div>
          <div><span class="info-label">Writer</span><p>${movie.Writer}</p></div>
          <div><span class="info-label">Cast</span><p>${movie.Actors}</p></div>
          <div><span class="info-label">Language</span><p>${movie.Language}</p></div>
          <div><span class="info-label">Awards</span><p>${movie.Awards}</p></div>
          <div><span class="info-label">Box office</span><p>${movie.BoxOffice}</p></div>
        </div>
      </div>
    </section>`;

  const safeJson = JSON.stringify({
    imdbID: movie.imdbID,
    Title: movie.Title,
    Poster: movie.Poster,
    Year: movie.Year,
    Type: movie.Type,
  }).replace(/"/g, "&quot;");

  detailsShellEl.innerHTML = detailsShellEl.innerHTML
    .replace("ID_PLACEHOLDER", movie.imdbID.replace(/"/g, "&quot;"))
    .replace("TITLE_PLACEHOLDER", (movie.Title || "").replace(/"/g, "&quot;"))
    .replace("POSTER_PLACEHOLDER", (movie.Poster || "").replace(/"/g, "&quot;"))
    .replace("YEAR_PLACEHOLDER", (movie.Year || "").replace(/"/g, "&quot;"))
    .replace("TYPE_PLACEHOLDER", (movie.Type || "").replace(/"/g, "&quot;"))
    .replace(/toggleWatchlistFromPage\([^)]*\)/, `toggleWatchlistFromPage(${safeJson})`);
}

function toggleWatchlistFromPage(movie) {
  toggleWatchlistForMovie(movie);
}

async function loadMovie() {
  renderWatchlistCount();

  if (!imdbID) {
    renderError("No title selected yet.");
    return;
  }

  renderLoading();

  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${encodeURIComponent(imdbID)}&plot=full`);
    const data = await response.json();

    if (data.Response === "False") {
      renderError(data.Error || "Unable to load title details.");
      return;
    }

    renderMovie(data);
  } catch (error) {
    renderError("Something went wrong while loading title details.");
  }
}

loadMovie();
