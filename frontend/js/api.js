
/* =========================================================
   AnimeDekhoBD - HOMEPAGE JAVASCRIPT
   Rating + Episode Badges for Anime, Genre, Top 10,
   Continue Watching and Movies
========================================================= */

const API_URL = 'https://animedekhobd.onrender.com/api';

let allAnimeData = [];
let allMovieData = [];
let externalAnimeData = [];


/* =========================================================
   SECTION 1: BADGE HELPERS
========================================================= */

function getCardRating(item) {
  const rating = Number(item?.rating);

  if (
    item?.rating === null ||
    item?.rating === undefined ||
    item?.rating === '' ||
    !Number.isFinite(rating)
  ) {
    return '0.0';
  }

  return rating.toFixed(1);
}


function getCardBadges(item, isMovie = false) {
  const rating = getCardRating(item);

  const isMovieItem =
    isMovie ||
    String(item?.type || '').toLowerCase() === 'movie';

  let badge = '';

  if (isMovieItem) {
    badge = 'MOVIE';
  } else {
    const season =
      item?.seasonNumber ??
      item?.season ??
      item?.season_number ??
      1;

    const episode =
      item?.latestEpisodeNumber ??
      item?.episodeNumber ??
      item?.episode ??
      item?.latestEpisode ??
      item?.totalEpisodes ??
      item?.episodeWatched;

    if (episode != null && episode !== '') {
      badge = `S${season} E${episode}`;
    }
  }

  return `
    <span class="rating-badge">★ ${rating}</span>
    ${
      badge
        ? `<span class="episode-badge">${badge}</span>`
        : ''
    }
  `;
}


/* =========================================================
   SECTION 2: FEATURED ANIME
========================================================= */

async function loadFeatured() {
  try {
    const response = await fetch(`${API_URL}/anime/featured`);

    if (!response.ok) {
      throw new Error('Failed to load featured anime');
    }

    const data = await response.json();
    const featured = Array.isArray(data) ? data[0] : data;

    const titleEl = document.getElementById('featured-title');
    const descEl = document.getElementById('featured-desc');
    const ratingEl = document.getElementById('featured-rating');
    const yearEl = document.getElementById('featured-year');
    const durationEl = document.getElementById('featured-duration');
    const posterEl = document.getElementById('featured-poster');

    if (!featured) {
      if (titleEl) titleEl.textContent = 'No Anime Available';

      if (descEl) {
        descEl.textContent = 'Add anime from the Admin Panel.';
      }

      if (posterEl) posterEl.removeAttribute('src');
      return;
    }

    window.featuredAnimeId = featured._id || featured.id;

    if (titleEl) {
      titleEl.textContent = featured.title || 'Featured Anime';
    }

    if (descEl) {
      descEl.textContent =
        featured.description || 'Amazing anime series';
    }

    if (ratingEl) {
      ratingEl.textContent = `⭐ ${featured.rating ?? 0}`;
    }

    if (yearEl) {
      yearEl.textContent = featured.year || '2024';
    }

    if (durationEl) {
      durationEl.textContent = featured.duration || '24m';
    }

    if (posterEl) {
      posterEl.src =
        featured.poster ||
        'https://via.placeholder.com/350x450?text=Featured';

      posterEl.alt = featured.title || 'Featured Anime';
    }
  } catch (error) {
    console.error('Error loading featured anime:', error);

    const titleEl = document.getElementById('featured-title');
    const descEl = document.getElementById('featured-desc');

    if (titleEl) titleEl.textContent = 'Featured Anime';

    if (descEl) {
      descEl.textContent = 'Unable to load anime right now.';
    }
  }
}


/* =========================================================
   SECTION 3: CONTINUE WATCHING
========================================================= */

async function loadWatchHistory() {
  const container = document.getElementById('watchHistory');

  if (!container) return;

  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;">' +
      'Please login to see watch history</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/watch-history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load watch history');
    }

    const history = await response.json();

    if (!Array.isArray(history) || history.length === 0) {
      container.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;">' +
        'No watch history yet</p>';
      return;
    }

    container.innerHTML = history.map(item => {
      const animeId = item.animeId || item._id || '';

      const savedAnime = [
        ...allAnimeData,
        ...allMovieData
      ].find(anime =>
        String(anime._id || anime.id) === String(animeId)
      );

      const cardData = {
        ...(savedAnime || {}),
        ...item,
        rating: item.rating ?? savedAnime?.rating,
        type: item.type ?? savedAnime?.type,
        seasonNumber:
          item.seasonNumber ?? savedAnime?.seasonNumber,
        episodeNumber:
          item.episodeNumber ??
          item.episodeWatched ??
          savedAnime?.latestEpisodeNumber
      };

      return `
        <div class="anime-card"
             onclick="openAnime('${animeId}')">

          <div class="poster-wrap">
            <img
              src="${item.posterUrl || savedAnime?.poster || ''}"
              alt="${item.animeTitle || savedAnime?.title || 'Anime'}"
              loading="lazy"
            >

            ${getCardBadges(cardData)}
          </div>

          <h4>${item.animeTitle || savedAnime?.title || 'Untitled Anime'}</h4>

          <p>Episode: ${item.episodeWatched ?? 0}</p>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading watch history:', error);

    container.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;">' +
      'Unable to load watch history</p>';
  }
}


/* =========================================================
   SECTION 4: TOP 10 SERIES
========================================================= */

async function loadTopSeries() {
  const container = document.getElementById('topSeries');

  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/anime/top-series`);

    if (!response.ok) {
      throw new Error('Failed to load top series');
    }

    const data = await response.json();

    const topSeries = Array.isArray(data)
      ? [...data]
          .sort((a, b) =>
            (Number(b.rating) || 0) - (Number(a.rating) || 0)
          )
          .slice(0, 10)
      : [];

    if (topSeries.length === 0) {
      container.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;">' +
        'No series available</p>';
      return;
    }

    container.innerHTML = topSeries.map((anime, index) => `
      <div class="top10-item"
          ${anime.source === 'tmdb'
  ? ''
  : `onclick="openAnime('${anime._id || anime.id || ''}')"`}>

        <div class="rank">${index + 1}</div>

        <div class="poster-wrap">
          <img
            src="${anime.poster || 'https://via.placeholder.com/350x450?text=Anime'}"
            alt="${anime.title || 'Anime'}"
            loading="lazy"
          >

          ${getCardBadges(anime)}
        </div>

        <h4>${anime.title || 'Untitled Anime'}</h4>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading top series:', error);

    container.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;">' +
      'Unable to load series</p>';
  }
}


/* =========================================================
   SECTION 5: LOAD ALL ANIME AND MOVIES
========================================================= */

async function loadAllAnime() {
  const container = document.getElementById('allAnime');

  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/anime`);

    if (!response.ok) {
      throw new Error('Failed to load anime');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Anime API did not return an array');
    }

    allAnimeData = data.filter(anime =>
      String(anime.type || 'Series').toLowerCase() !== 'movie'
    );

    allMovieData = data.filter(anime =>
      String(anime.type || '').toLowerCase() === 'movie'
    );

    renderAnime(allAnimeData);
    renderMovies(allMovieData);

  } catch (error) {
    console.error('Anime loading error:', error);

    container.innerHTML = '<p>Unable to load anime</p>';

    const movieContainer = document.getElementById('animeMovies');

    if (movieContainer) {
      movieContainer.innerHTML = '<p>Unable to load movies</p>';
    }
  }
}


/* =========================================================
   SECTION 6A: DISPLAY ANIME CARDS
   Anime + Genre + Search Results
========================================================= */

function renderAnime(animes, targetId = 'allAnime') {
  const container = document.getElementById(targetId);

  if (!container) return;

  if (!Array.isArray(animes) || animes.length === 0) {
    container.innerHTML = '<p>No anime found</p>';
    return;
  }

  container.innerHTML = animes.map(anime => `
    <div class="anime-card"
         onclick="openAnime('${anime._id || anime.id || ''}')">

      <div class="poster-wrap">
        <img
        src="${anime.poster || anime.posterUrl || ''}"
          alt="${anime.title || 'Anime'}"
          loading="lazy"
        >

        ${getCardBadges(anime)}
      </div>
<h4>${anime.title || 'Untitled'}</h4>

<p>⭐ ${anime.rating ?? 0} • ${anime.year || ''}</p>

${anime.source === 'tmdb'
  ? `<p class="anime-genres">${
      (Array.isArray(anime.genres) ? anime.genres : [])
        .join(' • ') || 'Genre unavailable'
    }</p>`
  : ''}
    </div>
  `).join('');
}


/* =========================================================
   SECTION 6B: DISPLAY MOVIE CARDS
========================================================= */

function renderMovies(movies) {
  const container = document.getElementById('animeMovies');

  if (!container) return;

  if (!Array.isArray(movies) || movies.length === 0) {
    container.innerHTML = '<p>No movies available</p>';
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="anime-card"
         onclick="openAnime('${movie._id || movie.id || ''}')">

      <div class="poster-wrap">
        <img
          src="${movie.poster || ''}"
          alt="${movie.title || 'Movie'}"
          loading="lazy"
        >

        ${getCardBadges(movie, true)}
      </div>

      <h4>${movie.title || 'Untitled Movie'}</h4>

      <p>🎬 Movie • ⭐ ${movie.rating ?? 0} • ${movie.year || ''}</p>
    </div>
  `).join('');
}


/* =========================================================
   SECTION 7A: SEARCH ANIME AND MOVIES
========================================================= */

async function searchAnimes(query) {
  const term = query.trim().toLowerCase();

  if (!term) {
    renderAnime(allAnimeData);
    renderMovies(allMovieData);
    return;
  }

  const allContent = [...allAnimeData, ...allMovieData];

  const localResults = allContent.filter(anime =>
    (anime.title || '').toLowerCase().includes(term)
  );

  if (localResults.length > 0) {
    renderSearchResults(localResults);
    return;
  }

  if (term.length < 2) {
    renderAnime([]);
    renderMovies([]);
    return;
  }

  const container = document.getElementById('allAnime');

  if (container) {
    container.innerHTML = '<p>Searching TMDB...</p>';
  }

  try {
    const response = await fetch(
      `${API_URL}/external-anime/tmdb/search?q=${encodeURIComponent(query.trim())}`
    );

    if (!response.ok) {
      throw new Error('TMDB search failed');
    }

    const data = await response.json();

    const results = Array.isArray(data)
      ? data
      : data.results || data.anime || data.data || [];
      externalAnimeData = results.map(anime => ({
  ...anime,
  source: 'tmdb',
  poster: anime.poster || anime.posterUrl || '',
  type: 'Series'
}));

    renderSearchResults(
      results.map(anime => ({
        ...anime,
        source: 'tmdb',
        poster: anime.poster || anime.posterUrl || '',
        type: 'Series'
      }))
    );
  } catch (error) {
    console.error('TMDB search error:', error);

    if (container) {
      container.innerHTML =
        '<p>Search failed. Please try again.</p>';
    }
  }
}


/* =========================================================
   SECTION 7B: DISPLAY SEARCH RESULTS
========================================================= */

function renderSearchResults(results) {
  const filteredAnime = results.filter(anime =>
    String(anime.type || 'Series').toLowerCase() !== 'movie'
  );

  const filteredMovies = results.filter(anime =>
    String(anime.type || '').toLowerCase() === 'movie'
  );

  renderAnime(filteredAnime);
  renderMovies(filteredMovies);
}


/* =========================================================
   SECTION 8: OPEN ANIME WATCH PAGE
========================================================= */

function openAnime(animeId) {
  if (!animeId) return;

  window.location.href =
    `watch-anime.html?id=${encodeURIComponent(animeId)}`;
}


/* =========================================================
   SECTION 9A: SEE ALL / SHOW LESS
========================================================= */

function toggleSeeAll(button) {
  const targetId = button.dataset.target;
  const container = document.getElementById(targetId);

  if (!container) return;

  const isExpanded = container.classList.toggle('show-all');

  button.textContent = isExpanded ? 'Show Less' : 'See All';
}


/* =========================================================
   SECTION 9B: UPDATE SEE ALL BUTTONS
========================================================= */

function setupSeeAllSections() {
  const sections = [
    { id: 'watchHistory', limit: 4 },
    { id: 'allAnime', limit: 8 },
    { id: 'topSeries', limit: 5 },
    { id: 'animeMovies', limit: 8 }
  ];

  sections.forEach(({ id, limit }) => {
    const container = document.getElementById(id);

    const button = document.querySelector(
      `.see-all-btn[data-target="${id}"]`
    );

    if (!container || !button) return;

    function updateButton() {
      const cards = Array.from(container.children).filter(element =>
        element.classList.contains('anime-card') ||
        element.classList.contains('top10-item')
      );

      const shouldHideButton = cards.length <= limit;

      button.hidden = shouldHideButton;

      if (shouldHideButton) {
        container.classList.remove('show-all');
        button.textContent = 'See All';
      }
    }

    updateButton();

    if (container.dataset.seeAllObserver === 'true') return;

    const observer = new MutationObserver(updateButton);

    observer.observe(container, {
      childList: true
    });

    container.dataset.seeAllObserver = 'true';
  });
}


/* =========================================================
   SECTION 10: GENRE FILTER
========================================================= */

function setupGenreFilter() {
  const toggleButton = document.getElementById('toggleGenres');
  const genreSidebar = document.getElementById('genreSidebar');
  const genreButtons = document.querySelectorAll('.genre-btn');
  const genreTitle = document.getElementById('genreTitle');
  const genreMessage = document.getElementById('genreMessage');
  const genreResults = document.getElementById('genreAnimeResults');

  if (!toggleButton || !genreSidebar) {
    console.warn('Genre section HTML was not found.');
    return;
  }

  genreSidebar.classList.remove('genres-visible');

  if (genreResults) genreResults.style.display = 'none';
  if (genreTitle) genreTitle.style.display = 'none';
  if (genreMessage) genreMessage.style.display = 'none';

  toggleButton.textContent = 'Show All ▼';
  toggleButton.setAttribute('aria-expanded', 'false');

  toggleButton.addEventListener('click', () => {
    const isVisible =
      genreSidebar.classList.toggle('genres-visible');

    toggleButton.textContent = isVisible
      ? 'Show Less ▲'
      : 'Show All ▼';

    toggleButton.setAttribute(
      'aria-expanded',
      String(isVisible)
    );

    if (!isVisible) {
      genreButtons.forEach(button => {
        button.classList.toggle(
          'active',
          button.dataset.genre === 'All'
        );
      });

      if (genreResults) {
        genreResults.innerHTML = '';
        genreResults.style.display = 'none';
      }

      if (genreTitle) {
        genreTitle.textContent = 'All Anime';
        genreTitle.style.display = 'none';
      }

      if (genreMessage) {
        genreMessage.textContent =
          'Choose a genre to explore anime.';
        genreMessage.style.display = 'none';
      }
    }
  });

  genreButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedGenre = button.dataset.genre;

      genreButtons.forEach(item => {
        item.classList.toggle('active', item === button);
      });

      if (genreTitle) {
        genreTitle.textContent =
          selectedGenre === 'All'
            ? 'All Anime'
            : `${selectedGenre} Anime`;

        genreTitle.style.display = '';
      }

      if (genreMessage) {
        genreMessage.textContent = 'Loading anime...';
        genreMessage.style.display = '';
      }

      if (genreResults) {
        genreResults.style.display = 'grid';
      }

      if (
        allAnimeData.length === 0 &&
        externalAnimeData.length === 0
      ) {
        if (genreMessage) {
          genreMessage.textContent =
            'No anime data loaded yet. Please refresh and try again.';
        }

        if (genreResults) genreResults.innerHTML = '';
        return;
      }

      const genreSource = [
        ...allAnimeData,
        ...externalAnimeData
      ];

      const normalizedSelectedGenre =
        selectedGenre.trim().toLowerCase();

      const filteredAnime = genreSource.filter(anime => {
        if (selectedGenre === 'All') return true;

        let genres = anime.genre ?? anime.genres ?? [];

        if (!Array.isArray(genres)) {
          genres = String(genres).split(/[,|/]/);
        }

        return genres.some(genre =>
          String(genre)
            .toLowerCase()
            .split(',')
            .map(item => item.trim())
            .includes(normalizedSelectedGenre)
        );
      });

      renderAnime(filteredAnime, 'genreAnimeResults');

      if (genreMessage) {
        genreMessage.textContent = filteredAnime.length
          ? `Found ${filteredAnime.length} anime.`
          : `No anime found in the ${selectedGenre} genre.`;
      }
    });
  });
}



/* =========================================================
   SECTION 11: SCROLL REVEAL ANIMATION
========================================================= */

function setupAnimeDekhoScrollReveal() {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const selectors = [
    '.genre-layout',
    '#watchHistory',
    '#allAnime',
    '#topSeries',
    '#animeMovies'
  ];

  const elements = new Set();

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      const section = element.closest('section') || element;
      elements.add(section);
    });
  });

  if (!('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -35px 0px'
  });

  elements.forEach(element => {
    element.classList.add('reveal-on-scroll');
    observer.observe(element);
  });
}


/* =========================================================
   SECTION 12: INITIALIZE HOMEPAGE
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  loadFeatured();
  loadWatchHistory();
  loadTopSeries();
  loadAllAnime();

  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchAnimes(searchInput.value);
    });
  }

  setupSeeAllSections();
  setupGenreFilter();
  setupAnimeDekhoScrollReveal();
});
