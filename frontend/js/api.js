
/* =========================================================
   AnimeDekhoBD - HOMEPAGE JAVASCRIPT

   SECTION 1  : Configuration and shared data
   SECTION 2  : Featured Anime
   SECTION 3  : Continue Watching
   SECTION 4  : Top 10 Series
   SECTION 5  : Load Anime and Movies
   SECTION 6  : Display Anime and Movie Cards
   SECTION 7  : Search
   SECTION 8  : Open Anime Watch Page
   SECTION 9  : See All / Show Less
   SECTION 10 : Genre Filter
   SECTION 11 : Scroll Reveal Animation
   SECTION 12 : Initialize Homepage

   Note: Keep function names used by index.html unchanged.
========================================================= */


/* =========================================================
   SECTION 1: CONFIGURATION AND SHARED DATA
   কাজ: Backend URL এবং Anime/Movie-এর Data রাখা
========================================================= */

const API_URL = 'http://localhost:5000/api';

let allAnimeData = [];
let allMovieData = [];


/* =========================================================
   SECTION 2: LOAD FEATURED ANIME
   কাজ: Homepage-এর Featured Banner-এ Anime দেখানো
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

    // Backend-এ Featured Anime না থাকলে
    if (!featured) {
      if (titleEl) titleEl.textContent = 'No Anime Available';
      if (descEl) {
        descEl.textContent = 'Add anime from the Admin Panel.';
      }
      if (posterEl) posterEl.removeAttribute('src');
      return;
    }
    // Featured Anime-এর ID সংরক্ষণ
window.featuredAnimeId = featured._id || featured.id;

    // Featured Anime-এর তথ্য দেখানো
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
   কাজ: Login করা User-এর Watch History দেখানো
========================================================= */

async function loadWatchHistory() {
  const container = document.getElementById('watchHistory');

  // HTML-এ Watch History Section না থাকলে থামবে
  if (!container) return;

  // Login Token পরীক্ষা করা
  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center;">' +
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
        '<p style="grid-column: 1/-1; text-align: center;">' +
        'No watch history yet</p>';
      return;
    }

    // প্রতিটি Watch History Item-এর Card তৈরি করা
    container.innerHTML = history.map(item => `
      <div class="anime-card" onclick="openAnime('${item.animeId}')">
        <img
          src="${item.posterUrl || ''}"
          alt="${item.animeTitle || 'Anime'}"
          loading="lazy"
        >
        <h4>${item.animeTitle || 'Untitled Anime'}</h4>
        <p>Episode: ${item.episodeWatched ?? 0}</p>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading watch history:', error);

    container.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center;">' +
      'Unable to load watch history</p>';
  }
}


/* =========================================================
   SECTION 4: TOP 10 SERIES
   কাজ: Rating অনুযায়ী সর্বোচ্চ ১০টি Series দেখানো
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

    // মূল Data পরিবর্তন না করে Rating অনুযায়ী Sort করা
    const topSeries = Array.isArray(data)
      ? [...data]
          .sort((a, b) =>
            (Number(b.rating) || 0) - (Number(a.rating) || 0)
          )
          .slice(0, 10)
      : [];

    if (topSeries.length === 0) {
      container.innerHTML =
        '<p style="grid-column: 1/-1; text-align: center;">' +
        'No series available</p>';
      return;
    }

    container.innerHTML = topSeries.map((anime, index) => `
      <div class="top10-item" onclick="openAnime('${anime._id}')">
        <div class="rank">${index + 1}</div>
        <img
          src="${anime.poster || 'https://via.placeholder.com/350x450?text=Anime'}"
          alt="${anime.title || 'Anime'}"
          loading="lazy"
        >
        <h4>${anime.title || 'Untitled Anime'}</h4>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading top series:', error);

    container.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center;">' +
      'Unable to load series</p>';
  }
}


/* =========================================================
   SECTION 5: LOAD ALL ANIME AND MOVIES
   কাজ: Backend থেকে Data নিয়ে Series ও Movie আলাদা করা
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

    // Backend-এর Response Array কি না পরীক্ষা করা
    if (!Array.isArray(data)) {
      throw new Error('Anime API did not return an array');
    }

    // Series-এর Data
    allAnimeData = data.filter(anime =>
      (anime.type || 'Series').toLowerCase() !== 'movie'
    );

    // Movie-এর Data
    allMovieData = data.filter(anime =>
      (anime.type || '').toLowerCase() === 'movie'
    );

    // Homepage-এ দুই ধরনের Card দেখানো
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
   কাজ: Anime-এর Poster, Title, Rating ও Year দেখানো
========================================================= */

function renderAnime(animes, targetId = 'allAnime') {
  const container = document.getElementById(targetId);

  if (!container) return;

  if (!Array.isArray(animes) || animes.length === 0) {
    container.innerHTML = '<p>No anime found</p>';
    return;
  }

  container.innerHTML = animes.map(anime => `
    <div class="anime-card" onclick="openAnime('${anime._id}')">
      <img
        src="${anime.poster || ''}"
        alt="${anime.title || 'Anime'}"
        loading="lazy"
      >
      <h4>${anime.title || 'Untitled'}</h4>
      <p>⭐ ${anime.rating ?? 0} • ${anime.year || ''}</p>
    </div>
  `).join('');
}


/* =========================================================
   SECTION 6B: DISPLAY MOVIE CARDS
   কাজ: Anime Movies Section-এ Movie দেখানো
========================================================= */

function renderMovies(movies) {
  const container = document.getElementById('animeMovies');

  if (!container) return;

  if (!Array.isArray(movies) || movies.length === 0) {
    container.innerHTML = '<p>No movies available</p>';
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="anime-card" onclick="openAnime('${movie._id}')">
      <img
        src="${movie.poster || ''}"
        alt="${movie.title || 'Movie'}"
        loading="lazy"
      >
      <h4>${movie.title || 'Untitled Movie'}</h4>
      <p>🎬 Movie • ⭐ ${movie.rating ?? 0} • ${movie.year || ''}</p>
    </div>
  `).join('');
}


/* =========================================================
   SECTION 7A: SEARCH ANIME AND MOVIES
   কাজ: Search Box-এ লেখা নাম দিয়ে Content খোঁজা
========================================================= */

function searchAnimes(query) {
  const term = query.trim().toLowerCase();

  // Search Box খালি হলে আগের তালিকা ফিরিয়ে আনবে
  if (!term) {
    renderAnime(allAnimeData);
    renderMovies(allMovieData);
    return;
  }

  // Series ও Movie একসঙ্গে Search করা
  const allContent = [...allAnimeData, ...allMovieData];

  const results = allContent.filter(anime =>
    (anime.title || '').toLowerCase().includes(term)
  );

  renderSearchResults(results);
}


/* =========================================================
   SECTION 7B: DISPLAY SEARCH RESULTS
   কাজ: Series ও Movie-এর Search Result আলাদা Section-এ দেখানো
========================================================= */

function renderSearchResults(results) {
  const filteredAnime = results.filter(anime =>
    (anime.type || 'Series').toLowerCase() !== 'movie'
  );

  const filteredMovies = results.filter(anime =>
    (anime.type || '').toLowerCase() === 'movie'
  );

  renderAnime(filteredAnime);
  renderMovies(filteredMovies);
}


/* =========================================================
   SECTION 8: OPEN ANIME WATCH PAGE
   কাজ: নির্বাচিত Anime-এর Watch Page খোলা
========================================================= */

function openAnime(animeId) {
  if (!animeId) return;

  window.location.href =
    `watch-anime.html?id=${encodeURIComponent(animeId)}`;
}


/* =========================================================
   SECTION 9A: SEE ALL / SHOW LESS
   কাজ: Card-এর তালিকা Expand ও Collapse করা
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
   কাজ: Card সংখ্যা অনুযায়ী Button দেখানো বা লুকানো
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

    // বর্তমান Section-এর Button Update করা
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

    // একই Container-এ একাধিক Observer তৈরি হওয়া আটকানো
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
   কাজ: Genre অনুযায়ী Anime Filter করা
========================================================= */

function setupGenreFilter() {
  const toggleButton = document.getElementById('toggleGenres');
  const genreSidebar = document.getElementById('genreSidebar');
  const genreButtons = document.querySelectorAll('.genre-btn');
  const genreTitle = document.getElementById('genreTitle');
  const genreMessage = document.getElementById('genreMessage');
  const genreResults = document.getElementById('genreAnimeResults');

  // প্রয়োজনীয় HTML Element আছে কি না পরীক্ষা করা
  if (!toggleButton || !genreSidebar) {
    console.warn('Genre section HTML was not found.');
    return;
  }

  // শুরুতে Genre List ও Result লুকানো থাকবে
  genreSidebar.classList.remove('genres-visible');

  if (genreResults) genreResults.style.display = 'none';
  if (genreTitle) genreTitle.style.display = 'none';
  if (genreMessage) genreMessage.style.display = 'none';

  toggleButton.textContent = 'Show All ▼';
  toggleButton.setAttribute('aria-expanded', 'false');

  // Genre List Show / Hide করা
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

    // List বন্ধ হলে নির্বাচিত Genre ও Result Reset করা
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

  // Genre Button Click করলে Anime Filter করা
  genreButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedGenre = button.dataset.genre;

      // নির্বাচিত Button-এ Active Class যোগ করা
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

      // Anime Data এখনো Load না হলে
      if (allAnimeData.length === 0) {
        if (genreMessage) {
          genreMessage.textContent =
            'No anime data loaded yet. Please refresh and try again.';
        }

        if (genreResults) genreResults.innerHTML = '';
        return;
      }

      // Database-এ Genre Array অথবা String—দুই ধরনের Data সমর্থন
      const filteredAnime = allAnimeData.filter(anime => {
        if (selectedGenre === 'All') return true;

        let genres = anime.genre ?? anime.genres ?? [];

        if (!Array.isArray(genres)) {
          genres = String(genres).split(/[,|/]/);
        }

        return genres.some(genre =>
          String(genre).trim().toLowerCase() ===
          selectedGenre.trim().toLowerCase()
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
   কাজ: স্ক্রল করে Section-এ গেলে Animation দেখানো
========================================================= */

function setupAnimeDekhoScrollReveal() {
  // User Reduced Motion পছন্দ করলে Animation বন্ধ রাখা
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  // যেসব Section-এ Scroll Animation থাকবে
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

  // Browser-এ IntersectionObserver না থাকলে স্বাভাবিকভাবে দেখানো
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
   কাজ: HTML Load হলে Homepage-এর Function চালু করা
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Homepage-এর Data Load করা
  loadFeatured();
  loadWatchHistory();
  loadTopSeries();
  loadAllAnime();

  // Search Box চালু করা
  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchAnimes(searchInput.value);
    });
  }

  // See All Button ও Genre Filter চালু করা
  setupSeeAllSections();
  setupGenreFilter();

  // Scroll Animation চালু করা
  setupAnimeDekhoScrollReveal();
});
