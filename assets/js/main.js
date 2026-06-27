// Utility selectors
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Global defaults mapping
const defaults = {
  school: 'Enfance Pre School',
  phone: '+91 98765 43210',
  email: 'info@enfancepreschool.com',
  address: 'Ahmedabad, Gujarat',
  heroTitle: 'A Happy Start For Your Child’s Bright Future',
  heroText: 'Safe, playful and activity based preschool where children learn with love, stories, art, music and confidence.',
  admission: 'Admissions Open 2026-27',
  programs: [
    ['Play Group', 'Age 2+ Years', 'Fun activities, rhymes, sensory play and social development.', 'assets/images/classes01.png?v=2'],
    ['Nursery', 'Age 3+ Years', 'Language, numbers, stories, creativity and daily good habits.', 'assets/images/classes02.png?v=2'],
    ['Junior KG', 'Age 4+ Years', 'Concept learning, phonics, writing readiness and personality growth.', 'assets/images/classes03.png?v=2'],
    ['Senior KG', 'Age 5+ Years', 'School readiness, communication, confidence and foundational skills.', 'assets/images/classes04.png?v=2']
  ]
};

// Data Retrieval functions
function getData() {
  let d;
  try {
    const raw = localStorage.getItem('enfanceData');
    d = raw ? JSON.parse(raw) : defaults;
  } catch (e) {
    d = defaults;
  }
  // Clean up older paths in programs cached in user's localStorage
  if (d && Array.isArray(d.programs)) {
    d.programs = d.programs.map(p => {
      if (p && p[3] && p[3].includes('classes')) {
        let path = p[3];
        // Convert old .jpg to .png
        if (path.includes('.jpg')) {
          path = path.replace('.jpg', '.png');
        }
        // Append version parameter if missing
        if (!path.includes('?v=')) {
          path = path + '?v=2';
        }
        p[3] = path;
      }
      return p;
    });
  } else {
    d.programs = defaults.programs;
  }
  return d;
}

function setData(d) {
  localStorage.setItem('enfanceData', JSON.stringify(d));
}

// Render dynamic fields throughout the page
function renderCommon() {
  const d = getData();
  $$('[data-school]').forEach(e => e.textContent = d.school);
  $$('[data-phone]').forEach(e => e.textContent = d.phone);
  $$('[data-email]').forEach(e => e.textContent = d.email);
  $$('[data-address]').forEach(e => e.textContent = d.address);
  $$('[data-admission]').forEach(e => e.textContent = d.admission);
  
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

// Render home programs dynamically
function renderPrograms() {
  const wrap = $('#programList');
  if (!wrap) return;
  wrap.innerHTML = getData().programs.map((p, idx) => `
    <article class="program reveal-up">
      <div class="program-img-wrap">
        <img src="${p[3]}" alt="${p[0]}">
      </div>
      <div class="program-body">
        <span class="tag">${p[1]}</span>
        <h3>${p[0]}</h3>
        <p>${p[2]}</p>
        <a class="btn alt outline" href="admission.html?program=${encodeURIComponent(p[0])}">Admission Enquiry</a>
      </div>
    </article>
  `).join('');
}

/* --- CAROUSEL SLIDER --- */
let slideIndex = 0;
let carouselTimer = null;

function initCarousel() {
  const slides = $$('.carousel-slide');
  const dotsContainer = $('.carousel-dots');
  if (slides.length === 0) return;

  // Render dots indicators
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: slides.length })
      .map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`)
      .join('');
      
    $$('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        showSlide(idx);
      });
    });
  }

  // Prev/Next handlers
  const prevBtn = $('.carousel-prev');
  const nextBtn = $('.carousel-next');
  if (prevBtn) prevBtn.addEventListener('click', () => showSlide(slideIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide(slideIndex + 1));

  // Auto cycling
  startCarouselTimer();

  // Pause on hover
  const container = $('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopCarouselTimer);
    container.addEventListener('mouseleave', startCarouselTimer);
  }
}

function startCarouselTimer() {
  stopCarouselTimer();
  carouselTimer = setInterval(() => {
    showSlide(slideIndex + 1);
  }, 5000);
}

function stopCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer);
}

function showSlide(index) {
  const slides = $$('.carousel-slide');
  if (slides.length === 0) return;

  // Reset indices
  if (index >= slides.length) slideIndex = 0;
  else if (index < 0) slideIndex = slides.length - 1;
  else slideIndex = index;

  // Toggle active classes
  slides.forEach((slide, idx) => {
    if (idx === slideIndex) slide.classList.add('active');
    else slide.classList.remove('active');
  });

  // Toggle dot states
  $$('.carousel-dot').forEach((dot, idx) => {
    if (idx === slideIndex) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}


/* --- GALLERY FILTERING & LIGHTBOX --- */
let galleryItemsData = [];
let lightboxCurrentIndex = 0;

function initGallery() {
  const gallery = $('.gallery');
  if (!gallery) return;

  const items = $$('.gallery-item');
  galleryItemsData = Array.from(items);

  // Setup click handler for items to open lightbox
  galleryItemsData.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  // Setup Lightbox actions
  const lightbox = $('#lightbox');
  if (lightbox) {
    const closeBtn = $('.lightbox-close');
    const prevBtn = $('.lightbox-prev');
    const nextBtn = $('.lightbox-next');

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content-wrap')) {
        closeLightbox();
      }
    });

    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  // Filter functionality
  const filters = $$('.filter-btn');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');
      filterGallery(filterVal);
    });
  });
}

function filterGallery(category) {
  const items = $$('.gallery-item');
  items.forEach(item => {
    const itemCats = item.getAttribute('data-category').split(' ');
    if (category === 'all' || itemCats.includes(category)) {
      item.style.display = 'block';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
      }, 50);
    } else {
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';
      setTimeout(() => {
        item.style.display = 'none';
      }, 300);
    }
  });

  // Re-build indexed array of currently visible elements for lightbox navigation
  setTimeout(() => {
    galleryItemsData = Array.from($$('.gallery-item')).filter(item => item.style.display !== 'none');
  }, 350);
}

function openLightbox(index) {
  const lightbox = $('#lightbox');
  const img = $('#lightbox-img');
  if (!lightbox || !img) return;

  lightboxCurrentIndex = index;
  const targetItem = galleryItemsData[index];
  if (!targetItem) return;

  const imgSrc = targetItem.querySelector('img').getAttribute('src');
  img.setAttribute('src', imgSrc);
  
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // prevent page scroll
}

function closeLightbox() {
  const lightbox = $('#lightbox');
  if (!lightbox) return;
  
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  if (galleryItemsData.length <= 1) return;
  
  let newIdx = lightboxCurrentIndex + direction;
  if (newIdx >= galleryItemsData.length) newIdx = 0;
  if (newIdx < 0) newIdx = galleryItemsData.length - 1;

  lightboxCurrentIndex = newIdx;
  const targetItem = galleryItemsData[newIdx];
  if (!targetItem) return;

  const img = $('#lightbox-img');
  // Transition animation for changing image
  img.style.transform = 'scale(0.95)';
  img.style.opacity = '0.5';
  
  setTimeout(() => {
    img.setAttribute('src', targetItem.querySelector('img').getAttribute('src'));
    img.style.transform = 'scale(1)';
    img.style.opacity = '1';
  }, 150);
}


/* --- INTERACTIVE FAQS ACCORDION --- */
function initAccordion() {
  const questions = $$('.faq-question');
  questions.forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const answer = q.nextElementSibling;
      const isActive = item.classList.contains('active');

      // Close all other items first
      $$('.faq-item').forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        // Calculate and set max height
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}


/* --- CUSTOM MODAL & ENQUIRY SUBMISSION --- */
function initFormSubmit() {
  $$('form[data-enquiry]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const item = {
        name: form.name.value,
        phone: form.phone.value,
        course: form.course?.value || 'Admission General',
        msg: form.message?.value || '',
        date: new Date().toLocaleString()
      };

      // Save enquiry to local storage
      const list = JSON.parse(localStorage.getItem('enfanceEnquiries') || '[]');
      list.unshift(item);
      localStorage.setItem('enfanceEnquiries', JSON.stringify(list));
      
      form.reset();
      showSuccessModal(item.name);
    });
  });
}

function showSuccessModal(parentName) {
  // Create success modal elements if not already present
  let overlay = $('#successModal');
  if (!overlay) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="successModal" class="modal-overlay">
        <div class="modal-box">
          <div class="modal-icon">🎉</div>
          <h2>Thank You!</h2>
          <p id="successModalMsg"></p>
          <button class="btn" id="closeSuccessModal">Close</button>
        </div>
      </div>
    `);
    
    overlay = $('#successModal');
    $('#closeSuccessModal').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }

  $('#successModalMsg').innerHTML = `Dear <strong>${parentName}</strong>, your enquiry has been submitted successfully.<br>Our admissions advisor will contact you soon.`;
  overlay.classList.add('active');
}


/* --- FLOATING ELEMENTS & SCROLL EVENTS --- */
function initScrollEvents() {
  const nav = $('.navbar');
  const topBtn = $('#backToTop');

  // Create back to top button dynamically if it doesn't exist
  if (!topBtn) {
    document.body.insertAdjacentHTML('beforeend', `
      <button id="backToTop" title="Go to top">▲</button>
    `);
    
    const newTopBtn = $('#backToTop');
    newTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Navbar visual adjustment
    if (nav) {
      if (scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }

    // Back to top button visibility
    const actBtn = $('#backToTop');
    if (actBtn) {
      if (scrollY > 300) actBtn.classList.add('show');
      else actBtn.classList.remove('show');
    }
  });
}


/* --- RESPONSIVE HAMBURGER MENU --- */
function initMobileMenu() {
  const hamb = $('.hamb');
  const menu = $('.menu');
  
  if (hamb && menu) {
    hamb.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      hamb.textContent = menu.classList.contains('open') ? '✕' : '☰';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !hamb.contains(e.target)) {
        menu.classList.remove('open');
        hamb.textContent = '☰';
      }
    });

    // Close menu on link click
    $$('.menu a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        hamb.textContent = '☰';
      });
    });
  }
}


/* --- PRE-FILL ENQUIRY FROM UTILS --- */
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const prog = params.get('program');
  const select = $('form select[name="course"]');
  if (prog && select) {
    for (let option of select.options) {
      if (option.value.toLowerCase() === prog.toLowerCase() || option.text.toLowerCase() === prog.toLowerCase()) {
        select.value = option.value;
        break;
      }
    }
  }
}


/* --- INTERACTIVE STACKED CARD CYCLE --- */
function initInteractiveImageCard() {
  const card = $('#aboutImageCard');
  if (!card) return;

  const cards = Array.from(card.querySelectorAll('.stack-card'));
  if (cards.length === 0) return;

  let isAnimating = false;

  card.addEventListener('click', () => {
    if (isAnimating) return;
    isAnimating = true;

    const topCard = card.querySelector('.card-depth-0');
    if (!topCard) {
      isAnimating = false;
      return;
    }

    // Animate the top card sliding out to the back
    topCard.classList.add('swipe-to-back');

    // Shift all other cards forward in depth
    cards.forEach(c => {
      if (c === topCard) return;

      let currentDepth = -1;
      for (let i = 0; i < cards.length; i++) {
        if (c.classList.contains(`card-depth-${i}`)) {
          currentDepth = i;
          break;
        }
      }

      if (currentDepth > 0) {
        c.classList.remove(`card-depth-${currentDepth}`);
        c.classList.add(`card-depth-${currentDepth - 1}`);
      }
    });

    // Move top card to the back immediately in classes,
    // but the .swipe-to-back class overrides its transform/opacity during transition.
    topCard.classList.remove('card-depth-0');
    topCard.classList.add(`card-depth-${cards.length - 1}`);

    // Clean up swipe class after transition completes (600ms)
    setTimeout(() => {
      topCard.classList.remove('swipe-to-back');
      isAnimating = false;
    }, 600);
  });
}

/* --- STATS COUNT UP ANIMATION --- */
function triggerCardCountUp(card) {
  const el = card.querySelector('.stat-number');
  if (!el) return;

  const target = parseInt(el.getAttribute('data-target'), 10);
  if (isNaN(target)) return;

  // Trigger count-up slightly after the card begins zooming in
  setTimeout(() => {
    const duration = 1800; // 1.8 seconds for smooth feel
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(easeProgress * target);
      
      el.textContent = currentVal;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(updateCount);
  }, 200); // 200ms delay to align with zoom animation
}

/* --- PRELOADER & INITIALIZATION --- */
function init() {
  renderCommon();
  renderPrograms();
  initCarousel();
  initGallery();
  initAccordion();
  initScrollEvents();
  initMobileMenu();
  initFormSubmit();
  checkUrlParams();
  initInteractiveImageCard();

  // Setup title content defaults on main pages
  const d = getData();
  const h = $('#heroTitle');
  const p = $('#heroText');
  if (h) h.textContent = d.heroTitle;
  if (p) p.textContent = d.heroText;

  // Initialize intersection observer reveals
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        
        // If it's a stats card, trigger count up
        if (entry.target.classList.contains('stat')) {
          triggerCardCountUp(entry.target);
        }
        
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal-up, .reveal-left, .reveal-right, .reveal-zoom').forEach(el => revealObserver.observe(el));

  // Fade out page preloader with custom delay
  const preloader = $('#preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('fade-out');
    }, 450); // delay to show off beautiful bouncing shapes
  }
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', () => {
  // Safe fallback to hide preloader if DOMContentLoaded fails to fire cleanly
  const preloader = $('#preloader');
  if (preloader && !preloader.classList.contains('fade-out')) {
    preloader.classList.add('fade-out');
  }
});
