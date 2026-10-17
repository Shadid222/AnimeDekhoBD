
/* ==========================================
   FEATURED ANIME - WATCH SERIES BUTTON
   Login ছাড়াই Watch Page খোলা যাবে
========================================== */
function watchAnime() {
  // Featured anime-এর ID সংগ্রহ
  const animeId =
    window.featuredAnimeId ||
    document.getElementById('featured-title')?.dataset.animeId;

  // ID না থাকলে ভুল পেজে পাঠাবে না
  if (!animeId) {
    alert('Featured anime-এর ID পাওয়া যায়নি।');
    console.error('Featured anime ID is missing.');
    return;
  }

  // Login ছাড়াই সরাসরি Watch Page-এ যাও
  window.location.href =
    'watch-anime.html?id=' + encodeURIComponent(animeId);
}


// RESPONSIVE NAVBAR TOGGLE (for mobile)
function toggleNavMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

// HANDLE CLICK OUTSIDE TO CLOSE MENUS
document.addEventListener('click', (e) => {
  const navbar = document.querySelector('.navbar');
  if (navbar && !navbar.contains(e.target)) {
    // Close any open menus if needed
  }
});

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// LOG WHEN PAGE LOADS
console.log('✅ Frontend loaded successfully');
console.log('Backend API URL: http://localhost:5000/api');
console.log('Waiting for backend to connect...');