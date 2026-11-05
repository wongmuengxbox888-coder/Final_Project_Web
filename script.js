const form    = document.getElementById('searchForm');
const chips   = document.querySelectorAll('.chip');
const btn     = document.getElementById('findBtn');
const status  = document.getElementById('formStatus');
const keyword = document.getElementById('keyword');
const place   = document.getElementById('location');
const items   = document.querySelectorAll('.item');
const viewAll = document.getElementById('viewAll');

// true on mouse devices, false on phones/tablets
const canHover = window.matchMedia('(hover: hover)').matches;

let selected = 'General Practice';

/* ---------- Helpers ---------- */
function setStatus(message, type) {
  status.textContent = message;
  status.className = 'status' + (type ? ' ' + type : '');
}

function clearError(input) {
  input.closest('.field').classList.remove('error');
  setStatus('', '');
}

/* ---------- Chips: select on HOVER (click = touch / keyboard fallback) ---------- */
function activateHeroChip(chip) {
  if (chip.classList.contains('active')) return;

  chips.forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-checked', 'false');
  });

  chip.classList.add('active');
  chip.setAttribute('aria-checked', 'true');
  selected = chip.dataset.value;
}

chips.forEach(chip => {
  if (canHover) chip.addEventListener('mouseenter', () => activateHeroChip(chip));
  chip.addEventListener('click', () => activateHeroChip(chip));   // touch + Enter key
});

/* ---------- Clear error while typing ---------- */
[keyword, place].forEach(input => {
  input.addEventListener('input', () => clearError(input));
});

/* ---------- Submit (this is an action, so it stays on click/submit) ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();

  const k = keyword.value.trim();
  const l = place.value.trim();

  // Nothing filled in
  if (!k && !l && !selected) {
    const field = keyword.closest('.field');
    field.classList.add('error');
    setTimeout(() => field.classList.remove('error'), 600);
    keyword.focus();
    setStatus('Please enter a keyword, location or choose a specialty.', 'error');
    return;
  }

  // Loading state
  btn.classList.add('loading');
  btn.disabled = true;
  setStatus('', '');

  // Replace this timeout with your real search, e.g.:
  // window.location.href = `/search?q=${encodeURIComponent(k)}&loc=${encodeURIComponent(l)}&spec=${encodeURIComponent(selected)}`;
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;
    const parts = [k, selected, l].filter(Boolean).join(' · ');
    setStatus('Searching for: ' + parts, 'success');
  }, 1200);
});

/* ---------- Specialty icons: fill the search box on HOVER ---------- */
function fillKeyword(item) {
  if (keyword.value === item.dataset.name) return;
  keyword.value = item.dataset.name;
  clearError(keyword);
}

items.forEach(item => {
  if (canHover) item.addEventListener('mouseenter', () => fillKeyword(item));

  // touch + keyboard fallback
  item.addEventListener('click', e => {
    e.preventDefault();
    fillKeyword(item);
    if (!canHover) keyword.focus();
  });
});

/* ---------- View all (navigation, stays on click) ---------- */
viewAll.addEventListener('click', e => {
  e.preventDefault();
  // window.location.href = '/specialties';
  alert('Go to all specialties page');
});

// ===== Hub cards =====
// Hover look is 100% CSS (.hub-card:hover). No "selected" class any more.
// Click is only used to navigate.
const hubCards  = document.querySelectorAll('.hub-card');
const hubSearch = document.getElementById('hubSearch');

hubCards.forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();

    switch (card.dataset.action) {
      case 'ai':
        hubSearch?.focus();
        break;
      case 'track':
        // window.location.href = 'track.html';
        break;
      case 'care':
        // window.location.href = 'find-care.html';
        break;
    }
  });
});

// ===== Find your Doctor =====
(() => {
  const grid = document.getElementById('docGrid');
  if (!grid) return;

  const empty      = document.getElementById('docEmpty');
  const search     = document.getElementById('docSearch');
  const docChips   = document.querySelectorAll('.doc-chip');
  const filterWrap = document.querySelector('.doc-filter-wrap');
  const filterBtn  = document.getElementById('docFilterBtn');
  const fRating    = document.getElementById('fRating');
  const fPrice     = document.getElementById('fPrice');

  const IMG = 'image/image 7.png';   // <- your doctor image

  // 8 base doctors, repeated to 24
  const base = [
    { name: 'Dr.Beaver',  spec: 'Covid · Internal Medicine', rating: 4.9, reviews: 1280, price: 200, exp: 15, today: true  },
    { name: 'Dr.Sarah',   spec: 'Cardiology',                rating: 4.7, reviews:  860, price: 300, exp: 12, today: false },
    { name: 'Dr.Niran',   spec: 'Pediatrics',                rating: 4.5, reviews:  540, price: 150, exp:  8, today: true  },
    { name: 'Dr.Mali',    spec: 'Dermatology',               rating: 4.8, reviews:  970, price: 250, exp: 10, today: false },
    { name: 'Dr.Anan',    spec: 'Orthopedics',               rating: 4.3, reviews:  410, price: 220, exp: 18, today: true  },
    { name: 'Dr.Pim',     spec: 'Covid · General Practice',  rating: 4.6, reviews:  720, price: 120, exp:  6, today: true  },
    { name: 'Dr.Somchai', spec: 'Neurology',                 rating: 4.9, reviews: 1500, price: 350, exp: 22, today: false },
    { name: 'Dr.Lina',    spec: 'Dentistry',                 rating: 4.4, reviews:  380, price: 180, exp:  9, today: false }
  ];
  const doctors = Array.from({ length: 24 }, (_, i) => {
    const d = base[i % base.length];
    const round = Math.floor(i / base.length);
    return { ...d, id: i, price: d.price + round * 10, reviews: d.reviews + round * 37 };
  });

  const state = { chip: 'all', q: '', rating: false, price: false };

  const cardHTML = d => `
    <article class="doc-card">
      <div class="doc-photo"><img src="${IMG}" alt="${d.name}" loading="lazy"></div>
      <div class="doc-info">
        <h3 class="doc-name">${d.name}</h3>
        <p class="doc-spec">${d.spec}</p>
        <div class="doc-rate">
          <i class="fa-solid fa-star" aria-hidden="true"></i>${d.rating.toFixed(1)}
          <small>(${d.reviews.toLocaleString()})</small>
        </div>
        <hr>
        <div class="doc-meta"><span>1 Que</span><strong>$${d.price}</strong></div>
        <button type="button" class="doc-hire" data-id="${d.id}">
          Hire now <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </article>`;

  function render() {
    const q = state.q.trim().toLowerCase();
    let list = doctors.filter(d =>
      (!q || d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q)) &&
      (state.chip !== 'today' || d.today) &&
      (!state.rating || d.rating >= 4.5) &&
      (!state.price  || d.price <= 250)
    );

    if (state.chip === 'fee')   list = [...list].sort((a, b) => a.price  - b.price);
    if (state.chip === 'exp')   list = [...list].sort((a, b) => b.exp    - a.exp);
    if (state.chip === 'rated') list = [...list].sort((a, b) => b.rating - a.rating);

    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
  }

  // ---------- chips: activate on HOVER (click = touch / keyboard fallback) ----------
  function activateChip(chip) {
    if (chip.dataset.chip === state.chip) return;   // already active, skip re-render
    docChips.forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
    state.chip = chip.dataset.chip;
    render();
  }

  docChips.forEach(chip => {
    if (canHover) chip.addEventListener('mouseenter', () => activateChip(chip));
    chip.addEventListener('click', () => activateChip(chip));
  });

  // ---------- search (typing, live) ----------
  search.addEventListener('input', () => { state.q = search.value; render(); });

  // ---------- filter popover ----------
  // Mouse: opens by CSS :hover. Touch: tap toggles .open
  filterBtn.addEventListener('click', e => {
    if (canHover) return;
    e.stopPropagation();
    const open = filterWrap.classList.toggle('open');
    filterBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (!filterWrap.contains(e.target)) {
      filterWrap.classList.remove('open');
      filterBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      filterWrap.classList.remove('open');
      filterBtn.setAttribute('aria-expanded', 'false');
      filterBtn.blur();
    }
  });

  fRating.addEventListener('change', () => { state.rating = fRating.checked; render(); });
  fPrice.addEventListener('change',  () => { state.price  = fPrice.checked;  render(); });

  // ---------- "Hire now" (click, because it is an action) ----------
  grid.addEventListener('click', e => {
    const hire = e.target.closest('.doc-hire');
    if (!hire) return;
    const d = doctors.find(x => x.id === Number(hire.dataset.id));
    console.log('Hire:', d.name);   // replace with your booking page / modal
  });

  render();
})();

// ===== Latest Health Updates =====
(() => {
  const list = document.getElementById('newsList');
  if (!list) return;

  // use your own images here
  const articles = [
    { img: 'image/rectangle 367.png', title: 'The Future of Medical Technology', cat: 'Medical Innovation', min: 5  },
    { img: 'image/rectangle 366.png', title: 'The Future of Medical Technology', cat: 'Medicine',           min: 4  },
    { img: 'image/banner.png', title: 'New Doctor “Sir Beaver”',          cat: 'Medicine',           min: 43 }
  ];

  // more articles so the scrollbar has something to scroll (20 total)
  const extraTitles = [
    'Robotic Surgery Reaches New Hospitals',
    'How AI Is Changing Diagnosis',
    'Five Habits for a Healthier Heart',
    'Understanding the Latest Vaccine Research',
    'Sleep and Immunity: What Doctors Say',
    'Telemedicine: Care From Your Living Room',
    'New Clinic Opens in Bangkok',
    'Nutrition Myths, Explained',
    'Meet Our Pediatrics Team',
    'Mental Health in the Workplace',
    'A Guide to Annual Check-ups',
    'Breakthroughs in Cancer Screening',
    'Staying Active After 50',
    'What to Know About Seasonal Flu',
    'Inside a Modern Laboratory',
    'Dental Care for the Whole Family',
    'Wearable Devices and Your Health'
  ];
  const cats = ['Medical Innovation', 'Medicine', 'Wellness', 'Research'];

  extraTitles.forEach((title, i) => {
    articles.push({
      img: articles[i % 3].img,
      title,
      cat: cats[i % cats.length],
      min: 3 + ((i * 7) % 12)
    });
  });

  list.innerHTML = articles.map((a, i) => `
    <article class="news-item">
      <a class="news-img" href="#" aria-label="${a.title}">
        <img src="${a.img}" alt="${a.title}" loading="lazy">
      </a>
      <div class="news-body">
        <h3 class="news-name">${a.title}</h3>
        <p class="news-meta">${a.cat} · ${a.min} min read</p>
        <div class="news-actions">
          <a class="news-btn news-btn--solid" href="#" data-id="${i}">Read</a>
          <a class="news-btn news-btn--ghost" href="#" data-id="${i}">Save</a>
        </div>
      </div>
    </article>`).join('');

  // stop href="#" from jumping to the top of the page
  // (replace with real links / a modal when you have them)
  list.addEventListener('click', e => {
    const link = e.target.closest('a[href="#"]');
    if (link) e.preventDefault();
  });
})();