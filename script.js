/* =============================================
   EXPOTUNING NARIÑO — Main Script v3
   ============================================= */

/* ============================================
   PANTALLA DE ENTRADA + AUDIO AUTOPLAY
   El clic en "ENTRAR CON SONIDO" es el gesto
   de usuario que desbloquea el audio en todos
   los navegadores modernos.
   ============================================ */
(function initEnterScreen() {
  const screen   = document.getElementById('enter-screen');
  const enterBtn = document.getElementById('enter-btn');
  if (!screen || !enterBtn) return;

  // Archivo local descargado — garantiza reproducción sin depender de internet
  const TRACKS = [
    'music.mp3',
  ];

  const audio  = new Audio();
  audio.loop   = true;
  audio.volume = 0;
  let trackIdx = 0;

  function tryTrack(idx) {
    if (idx >= TRACKS.length) return;
    audio.src = TRACKS[idx];
    audio.load();
    audio.play()
      .then(() => fadeIn())
      .catch(() => tryTrack(idx + 1));
  }

  function fadeIn() {
    setPlayingUI(true);
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(0.6, v + 0.02);
      audio.volume = v;
      if (v >= 0.6) clearInterval(t);
    }, 50);
  }

  function fadeOut(cb) {
    let v = audio.volume;
    const t = setInterval(() => {
      v = Math.max(0, v - 0.04);
      audio.volume = v;
      if (v <= 0) { clearInterval(t); audio.pause(); if (cb) cb(); }
    }, 40);
  }

  // Si el track falla, pasa al siguiente
  audio.addEventListener('error', () => {
    trackIdx++;
    if (trackIdx < TRACKS.length) tryTrack(trackIdx);
  });

  enterBtn.addEventListener('click', () => {
    // Ocultar pantalla de entrada con animación
    screen.classList.add('gone');
    // Mostrar preloader
    document.getElementById('preloader').style.display = 'flex';
    // Iniciar música — el clic garantiza el desbloqueo del navegador
    tryTrack(trackIdx);
    // Después del preloader, iniciar lásers
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hidden');
      initLasers();
    }, 2600);
  });

  // Ocultar preloader hasta que el usuario entre
  const pre = document.getElementById('preloader');
  if (pre) pre.style.display = 'none';

  /* ---- Botón play/pause flotante ---- */
  const btn = document.getElementById('musicBtn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio.paused) {
        fadeOut(() => setPlayingUI(false));
      } else {
        audio.play().then(() => fadeIn()).catch(() => {});
      }
    });
  }

  function setPlayingUI(state) {
    const b = document.getElementById('musicBtn');
    if (!b) return;
    if (state) {
      b.innerHTML = `<div class="music-bars">
        <span></span><span></span><span></span><span></span><span></span>
      </div>`;
      b.classList.add('playing');
    } else {
      b.innerHTML = '▶';
      b.classList.remove('playing');
    }
  }
})();

/* ---------- PRELOADER ---------- */
// El preloader ahora lo controla initEnterScreen.
// Este listener es fallback por si alguien recarga sin la pantalla.
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  if (pre && pre.style.display !== 'none') {
    setTimeout(() => {
      pre.classList.add('hidden');
      initLasers();
    }, 2600);
  }
});

/* ---------- NAVBAR SCROLL ---------- */
const navbar = document.getElementById('navbar');
const backTop = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
    backTop.classList.add('show');
  } else {
    navbar.classList.remove('scrolled');
    backTop.classList.remove('show');
  }
});

/* ---------- MOBILE MENU ---------- */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (navMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  });
});

/* ---------- BACK TO TOP ---------- */
backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================
   RAYOS LÁSER — Canvas (velocidad ALTA)
   ============================================ */
function initLasers() {
  const canvas = document.getElementById('laser-canvas');
  if (!canvas) return;
  const banner = canvas.closest('.hero-banner');
  const ctx    = canvas.getContext('2d');

  const COLORS = [
    '#00ff88',  // verde neón
    '#00aaff',  // azul neón
    '#ffffff',  // blanco
    '#00ffee',  // cyan
    '#44ffcc',  // verde claro
    '#0055ff',  // azul intenso
    '#00ff44',  // verde brillante
    '#33bbff',  // azul claro
  ];

  let W, H, lasers = [], particles = [];

  function resize() {
    W = canvas.width  = banner.offsetWidth;
    H = canvas.height = banner.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---- Rayo láser ---- */
  class Laser {
    constructor() { this.reset(); }

    reset() {
      this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.life    = 0;
      // maxLife REDUCIDO → más rápido (antes 60-140, ahora 18-35)
      this.maxLife = 18 + Math.random() * 17;
      this.width   = 0.6 + Math.random() * 1.8;
      this.wobble  = (Math.random() - 0.5) * 30;

      // Tipo de láser: 0=borde→centro  1=borde→borde  2=arriba→abajo (scanning)
      this.type = Math.floor(Math.random() * 3);

      if (this.type === 0) {
        // Desde borde hacia punto central
        const side = Math.floor(Math.random() * 4);
        if (side === 0)      { this.x1 = Math.random() * W; this.y1 = 0; }
        else if (side === 1) { this.x1 = W; this.y1 = Math.random() * H; }
        else if (side === 2) { this.x1 = Math.random() * W; this.y1 = H; }
        else                 { this.x1 = 0; this.y1 = Math.random() * H; }
        this.x2 = W * 0.15 + Math.random() * W * 0.7;
        this.y2 = H * 0.1  + Math.random() * H * 0.8;

      } else if (this.type === 1) {
        // Borde izquierdo → borde derecho (horizontal sweeping)
        this.x1 = 0;
        this.y1 = Math.random() * H;
        this.x2 = W;
        this.y2 = Math.random() * H;

      } else {
        // Esquina → esquina opuesta
        const flip = Math.random() > 0.5;
        this.x1 = flip ? 0 : W;
        this.y1 = 0;
        this.x2 = flip ? W : 0;
        this.y2 = H;
      }
    }

    update() {
      this.life++;
      const half = this.maxLife / 2;
      this.alpha = this.life < half
        ? this.life / half
        : 1 - (this.life - half) / half;

      if (this.life >= this.maxLife) {
        // Explosión de partículas en el destino
        const burst = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < burst; i++) {
          particles.push(new Particle(this.x2, this.y2, this.color));
        }
        this.reset();
      }
    }

    draw() {
      const a  = Math.max(0, Math.min(1, this.alpha));
      const mx = (this.x1 + this.x2) / 2 + this.wobble;
      const my = (this.y1 + this.y2) / 2 + this.wobble;

      ctx.save();

      // Halo externo (glow grueso)
      ctx.globalAlpha = a * 0.22;
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.width * 7;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 28;
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.quadraticCurveTo(mx, my, this.x2, this.y2);
      ctx.stroke();

      // Cuerpo principal neón
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.width * 1.4;
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.quadraticCurveTo(mx, my, this.x2, this.y2);
      ctx.stroke();

      // Núcleo blanco brillante
      ctx.globalAlpha = a * 0.75;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = this.width * 0.35;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.quadraticCurveTo(mx, my, this.x2, this.y2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /* ---- Partículas de impacto ---- */
  class Particle {
    constructor(x, y, color) {
      this.x     = x;
      this.y     = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.vx    = Math.cos(angle) * speed;
      this.vy    = Math.sin(angle) * speed;
      this.alpha = 1;
      this.size  = 1.2 + Math.random() * 3;
      this.decay = 0.06 + Math.random() * 0.06;
    }
    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.vx   *= 0.94;
      this.vy   *= 0.94;
      this.alpha -= this.decay;
      this.size  *= 0.93;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle   = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    isDead() { return this.alpha <= 0; }
  }

  // Pool de 12 lásers simultáneos (antes 7)
  for (let i = 0; i < 12; i++) {
    const l = new Laser();
    l.life = Math.floor(Math.random() * l.maxLife);
    lasers.push(l);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    lasers.forEach(l => { l.update(); l.draw(); });
    particles = particles.filter(p => !p.isDead());
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.evento-card, .stat-item, .caraudio-text, .caraudio-visual, ' +
  '.galeria-item, .info-item, .cd-item, .section-header'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ---------- COUNTER ANIMATION ---------- */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

function animateCounter(el) {
  const target    = parseInt(el.dataset.target, 10);
  const step      = 16;
  const increment = target / (1800 / step);
  let current     = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString('es-CO') + (target >= 100 ? '+' : '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString('es-CO');
    }
  }, step);
}

/* ---------- COUNTDOWN ---------- */
// Domingo 26 de julio 2026 a las 10:00 AM hora Colombia (UTC-5)
const eventDate = new Date('2026-07-26T10:00:00-05:00');

function updateCountdown() {
  const diff = eventDate - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id =>
      document.getElementById(id).textContent = '00');
    return;
  }
  document.getElementById('cd-days').textContent  = String(Math.floor(diff / 86400000)).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
  document.getElementById('cd-mins').textContent  = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
  document.getElementById('cd-secs').textContent  = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- CONTACT FORM ---------- */
const form    = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = form.nombre.value.trim();
  const email  = form.email.value.trim();
  if (!nombre) { showFormMsg('Por favor ingresa tu nombre.', 'error'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFormMsg('Por favor ingresa un correo válido.', 'error'); return;
  }
  showFormMsg('✅ Mensaje enviado. ¡Te contactaremos pronto!', 'success');
  form.reset();
});

function showFormMsg(msg, type) {
  formMsg.textContent = msg;
  formMsg.style.color = type === 'success' ? 'var(--green)' : '#ff4466';
  setTimeout(() => { formMsg.textContent = ''; }, 5000);
}

/* ---------- ACTIVE NAV LINK ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-menu a');

new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id)
          link.style.color = 'var(--green)';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' }).observe
  && sections.forEach(s =>
      new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(link => {
              link.style.color = '';
              if (link.getAttribute('href') === '#' + entry.target.id)
                link.style.color = 'var(--green)';
            });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' }).observe(s)
    );

/* ============================================
   EXPOTUNING 2026 — SEDES & MODALES
   ============================================ */

// ---- Acordeón principal ----
const mainBtn   = document.getElementById('expo2026Btn');
const mainPanel = document.getElementById('expo2026Panel');

if (mainBtn && mainPanel) {
  mainBtn.addEventListener('click', () => {
    const open = mainPanel.classList.toggle('open');
    mainBtn.classList.toggle('active', open);
  });
}

// ---- Acordeón de cada sede ----
document.querySelectorAll('.sede-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sede  = btn.dataset.sede;
    const panel = document.getElementById('panel-' + sede);
    if (!panel) return;

    const isOpen = panel.classList.contains('open');

    // Cerrar todas las sedes primero
    document.querySelectorAll('.sede-panel').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.sede-btn').forEach(b => b.classList.remove('active'));

    // Abrir la seleccionada si estaba cerrada
    if (!isOpen) {
      panel.classList.add('open');
      btn.classList.add('active');
    }
  });
});

// ---- Contenido de los modales ----
const MODAL_DATA = {
  // GUALMATÁN
  'info-gualmatan': {
    titulo: 'INFORMACIÓN DEL EVENTO',
    sede:   '📍 GUALMATÁN · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Fecha, hora y lugar del evento en Gualmatán, Nariño. Convocatoria abierta para competidores de Car Audio, Tuning, Motocross, MX Freestyle, BMX, Moto Stunt y Motovelocidad.</p>
             <p>Inscripciones y detalles próximamente.</p>`,
    placeholder: '📅 FECHA · HORA · LUGAR — PRÓXIMAMENTE'
  },
  'galeria-gualmatan': {
    titulo: '🖼️ GALERÍA — GUALMATÁN',
    sede:   '📍 GUALMATÁN · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div id="galeria-gual-wrap"></div>`,
    placeholder: '',
    onOpen: 'galeria-gualmatan'
  },
  'puntuacion-gualmatan': {
    titulo: '🏅 PUNTUACIÓN — GUALMATÁN',
    sede:   '📍 GUALMATÁN · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/GUALMATAN PUNTUACION.jpg" alt="Puntuación Gualmatán" class="modal-img-full" /></div>`,
    placeholder: ''
  },
  // CONSACÁ
  'info-consaca': {
    titulo: 'INFORMACIÓN DEL EVENTO',
    sede:   '📍 CONSACÁ · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Fecha, hora y lugar del evento en Consacá, Nariño. Convocatoria abierta para todas las categorías.</p>
             <p>Inscripciones y detalles próximamente.</p>`,
    placeholder: '📅 FECHA · HORA · LUGAR — PRÓXIMAMENTE'
  },
  'galeria-consaca': {
    titulo: 'GALERÍA',
    sede:   '📍 CONSACÁ · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Las fotos y videos del evento en Consacá estarán disponibles próximamente.</p>`,
    placeholder: '🖼️ GALERÍA — PRÓXIMAMENTE'
  },
  'puntuacion-consaca': {
    titulo: '🏅 PUNTUACIÓN — CONSACÁ',
    sede:   '📍 CONSACÁ · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/CONSACA PUNTUACION.jpg" alt="Puntuación Consacá" class="modal-img-full" /></div>`,
    placeholder: ''
  },
  // HIGUERONES - BUESACO
  'info-higuerones': {
    titulo: 'INFORMACIÓN DEL EVENTO',
    sede:   '📍 HIGUERONES – BUESACO · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Fecha, hora y lugar del evento en Higuerones, Buesaco, Nariño. Convocatoria abierta para todas las categorías.</p>
             <p>Inscripciones y detalles próximamente.</p>`,
    placeholder: '📅 FECHA · HORA · LUGAR — PRÓXIMAMENTE'
  },
  'galeria-higuerones': {
    titulo: 'GALERÍA',
    sede:   '📍 HIGUERONES – BUESACO · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Las fotos y videos del evento en Higuerones – Buesaco estarán disponibles próximamente.</p>`,
    placeholder: '🖼️ GALERÍA — PRÓXIMAMENTE'
  },
  'puntuacion-higuerones': {
    titulo: 'PUNTUACIÓN',
    sede:   '📍 HIGUERONES – BUESACO · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Los resultados y tabla de puntuación por categoría se publicarán después del evento.</p>`,
    placeholder: '🏅 RESULTADOS — PRÓXIMAMENTE'
  },
};

// ---- Abrir modal ----
const overlay    = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');

document.querySelectorAll('.sede-action-btn[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key  = btn.dataset.modal;
    const data = MODAL_DATA[key];
    if (!data) return;

    modalContent.innerHTML = `
      <h3>${data.titulo}</h3>
      <span class="modal-sede-tag">${data.sede}</span>
      ${data.cuerpo}
      ${data.placeholder ? `<div class="modal-placeholder">${data.placeholder}</div>` : ''}
    `;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Ejecutar función especial si el modal la tiene
    if (data.onOpen === 'galeria-gualmatan') {
      renderGaleriaGualmatan();
    }
  });
});

// ---- Cerrar modal ----
function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (overlay)    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ============================================
   BOTÓN CLASIFICACIÓN GENERAL — abre modal directo
   ============================================ */
const clasificacionBtn = document.getElementById('clasificacionBtn');
if (clasificacionBtn) {
  clasificacionBtn.addEventListener('click', () => {
    abrirClasificacionGeneral();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

/* ============================================
   CLASIFICACIÓN GENERAL — categorías y puntos
   ============================================ */
const CATEGORIAS = [
  {
    id: 'basicos1', nombre: 'BÁSICOS 1',
    participantes: [
      { nombre: 'BELIKO',     puntos: 60 },
      { nombre: 'DEADPOOL',   puntos: 60 },
      { nombre: 'ANDARIEGO',  puntos: 40 },
      { nombre: 'TUTI',       puntos: 40 },
      { nombre: 'THE SONIC',  puntos: 20 },
      { nombre: 'PELUCHITO',  puntos: 20 },
    ]
  },
  {
    id: 'basicos2', nombre: 'BÁSICOS 2',
    participantes: [
      { nombre: 'EL MASTER',  puntos: 120 },
      { nombre: 'EL NENE',    puntos: 40  },
      { nombre: 'MR MACRAY',  puntos: 40  },
      { nombre: 'POPEYE',     puntos: 20  },
    ]
  },
  {
    id: 'calle1', nombre: 'CALLE 1',
    participantes: [
      { nombre: 'DIREN',      puntos: 60 },
      { nombre: 'EL TATHO',   puntos: 60 },
      { nombre: 'FENIX',      puntos: 40 },
      { nombre: 'THE MEK',    puntos: 40 },
      { nombre: 'CASPER',     puntos: 20 },
      { nombre: 'LOQUILLO',   puntos: 20 },
    ]
  },
  {
    id: 'calle2', nombre: 'CALLE 2',
    participantes: [
      { nombre: 'EL AGROPECUARIO', puntos: 60 },
      { nombre: 'ZEUS',            puntos: 60 },
      { nombre: 'EL MASHO',        puntos: 40 },
      { nombre: 'EL JEFE',         puntos: 40 },
      { nombre: 'EL GALENO',       puntos: 20 },
      { nombre: 'BARTO',           puntos: 20 },
    ]
  },
  {
    id: 'calle3', nombre: 'CALLE 3',
    participantes: [
      { nombre: '7 VIDAS',      puntos: 120 },
      { nombre: 'EL ANDARIEGO', puntos: 40  },
      { nombre: 'EL DIABLO',    puntos: 40  },
      { nombre: 'EL CHITO',     puntos: 20  },
    ]
  },
  {
    id: 'mini1', nombre: 'MINI 1',
    participantes: [
      { nombre: 'EL NIÑO',      puntos: 120 },
      { nombre: 'BILLS',        puntos: 60  },
      { nombre: 'DON REBELDE',  puntos: 40  },
      { nombre: 'EL BARRERA',   puntos: 20  },
    ]
  },
  {
    id: 'mini2', nombre: 'MINI 2',
    participantes: [
      { nombre: 'MR INCREIBLE',  puntos: 100 },
      { nombre: 'EL CUERVO',     puntos: 60  },
      { nombre: 'RIQUILLO',      puntos: 40  },
      { nombre: 'EL TIGRE',      puntos: 20  },
      { nombre: 'EL GRILLO',     puntos: 20  },
      { nombre: 'MAQUIAVELICO',  puntos: 20  },
    ]
  },
  {
    id: 'street', nombre: 'STREET',
    participantes: [
      { nombre: 'REY MISTERIO', puntos: 80 },
      { nombre: 'LA PATRONA',   puntos: 60 },
      { nombre: 'EL GUAPO',     puntos: 60 },
      { nombre: 'CASTOR',       puntos: 20 },
      { nombre: 'TOSCANO',      puntos: 20 },
    ]
  },
  {
    id: 'rocky', nombre: 'ROCKY',
    participantes: [
      { nombre: 'EL REYES',  puntos: 120 },
      { nombre: 'LA CANDY',  puntos: 80  },
      { nombre: 'BIG BOSS',  puntos: 20  },
      { nombre: 'PAKIRRI',   puntos: 20  },
    ]
  },
  {
    id: 'rockypro1', nombre: 'ROCKY PRO 1',
    participantes: [
      { nombre: 'EL ASESINO', puntos: 60 },
      { nombre: 'LA NORTEÑA', puntos: 40 },
    ]
  },
  {
    id: 'rockypro2', nombre: 'ROCKY PRO 2',
    participantes: [
      { nombre: 'RAMONCITO', puntos: 120 },
      { nombre: 'ATOM',      puntos: 40  },
    ]
  },
  {
    id: 'libre', nombre: 'LIBRE',
    participantes: [
      { nombre: 'DESTROYER', puntos: 80 },
      { nombre: 'CHUCKY',    puntos: 60 },
      { nombre: 'HULK',      puntos: 40 },
    ]
  },
];

function medalColor(pos) {
  if (pos === 0) return '#ffd700'; // oro
  if (pos === 1) return '#c0c0c0'; // plata
  if (pos === 2) return '#cd7f32'; // bronce
  return 'rgba(255,255,255,.45)';
}
function medalIcon(pos) {
  if (pos === 0) return '🥇';
  if (pos === 1) return '🥈';
  if (pos === 2) return '🥉';
  return `<span style="color:rgba(255,255,255,.4);font-size:.75rem">${pos + 1}°</span>`;
}
function puntosColor(puntos, max) {
  const pct = puntos / max;
  if (pct >= 1)   return '#ffd700';
  if (pct >= .6)  return '#00ff88';
  if (pct >= .35) return '#00aaff';
  return 'rgba(255,255,255,.5)';
}

function abrirClasificacionGeneral() {
  // Botones de categoría
  const btnsCat = CATEGORIAS.map(cat => `
    <button class="cat-tab-btn" data-cat="${cat.id}">${cat.nombre}</button>
  `).join('');

  // Tablas de cada categoría
  const tablas = CATEGORIAS.map(cat => {
    const max = cat.participantes[0].puntos;
    const filas = cat.participantes.map((p, i) => {
      const barW = Math.round((p.puntos / max) * 100);
      const col  = puntosColor(p.puntos, max);
      return `
        <tr class="cat-row">
          <td class="cat-pos">${medalIcon(i)}</td>
          <td class="cat-nombre">${p.nombre}</td>
          <td class="cat-pts" style="color:${medalColor(i)}">${p.puntos}</td>
          <td class="cat-bar-cell">
            <div class="cat-bar-bg">
              <div class="cat-bar-fill" style="width:${barW}%;background:${col}"></div>
            </div>
          </td>
        </tr>`;
    }).join('');
    return `
      <div class="cat-tabla" id="tabla-${cat.id}" style="display:none">
        <table class="clasi-table">
          <thead><tr><th>#</th><th>VEHÍCULO / PILOTO</th><th>PTS</th><th>BARRA</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }).join('');

  // Layout: columna izquierda (tabla) + columna derecha (imagen GENERAL)
  modalContent.innerHTML = `
    <div class="clasi-layout">

      <!-- IZQUIERDA: tabla de puntuaciones -->
      <div class="clasi-col-tabla">
        <h3>🏆 CLASIFICACIÓN GENERAL</h3>
        <span class="modal-sede-tag">🏆 EXPOTUNING NARIÑO 2026 — TODAS LAS SEDES</span>
        <div class="cat-tabs">${btnsCat}</div>
        <div class="cat-tablas-wrap">${tablas}</div>
      </div>

      <!-- DERECHA: imagen general ampliable -->
      <div class="clasi-col-img">
        <p class="clasi-img-label">📊 TABLA GENERAL</p>
        <div class="modal-img-wrap">
          <img src="IMAGENES/GENERAL.png"
               alt="Clasificación General ExpoTuning Nariño 2026"
               class="modal-img-full lightbox-img clasi-img-general" />
        </div>
        <p class="clasi-img-hint">🔍 Clic para ampliar</p>
      </div>

    </div>
  `;

  // Activar primera categoría por defecto
  activarCategoria(CATEGORIAS[0].id);

  // Eventos de los tabs
  modalContent.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activarCategoria(btn.dataset.cat));
  });
}

function activarCategoria(id) {
  // Tabs
  document.querySelectorAll('.cat-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === id);
  });
  // Tablas
  document.querySelectorAll('.cat-tabla').forEach(t => {
    t.style.display = t.id === 'tabla-' + id ? 'block' : 'none';
  });
}

// Datos de los modales de resultados
Object.assign(MODAL_DATA, {
  'res-podio-gualmatan': {
    titulo: '🥇 PODIO — GUALMATÁN',
    sede:   '📍 GUALMATÁN · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/GUALMATAN PUNTUACION.jpg" alt="Puntuación Gualmatán" class="modal-img-full lightbox-img" /></div>`,
    placeholder: ''
  },
  'res-tabla-gualmatan': {
    titulo: '📊 TABLA COMPLETA — GUALMATÁN',
    sede:   '📍 GUALMATÁN · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/GUALMATAN PUNTUACION.jpg" alt="Tabla Gualmatán" class="modal-img-full lightbox-img" /></div>`,
    placeholder: ''
  },
  'res-podio-consaca': {
    titulo: '🥇 PODIO — CONSACÁ',
    sede:   '📍 CONSACÁ · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/CONSACA PUNTUACION.jpg" alt="Puntuación Consacá" class="modal-img-full lightbox-img" /></div>`,
    placeholder: ''
  },
  'res-tabla-consaca': {
    titulo: '📊 TABLA COMPLETA — CONSACÁ',
    sede:   '📍 CONSACÁ · EXPOTUNING NARIÑO 2026',
    cuerpo: `<div class="modal-img-wrap"><img src="IMAGENES/CONSACA PUNTUACION.jpg" alt="Tabla Consacá" class="modal-img-full lightbox-img" /></div>`,
    placeholder: ''
  },
  'res-podio-higuerones': {
    titulo: '🥇 PODIO — HIGUERONES–BUESACO',
    sede:   '📍 HIGUERONES–BUESACO · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>Los ganadores por categoría del evento de Higuerones–Buesaco se publicarán al finalizar la competencia.</p>`,
    placeholder: '🥇 RESULTADOS — PRÓXIMAMENTE'
  },
  'res-tabla-higuerones': {
    titulo: '📊 TABLA COMPLETA — HIGUERONES–BUESACO',
    sede:   '📍 HIGUERONES–BUESACO · EXPOTUNING NARIÑO 2026',
    cuerpo: `<p>La tabla completa de puntuaciones estará disponible después del evento.</p>`,
    placeholder: '📊 TABLA — PRÓXIMAMENTE'
  },
  'res-clasificacion-general': {
    titulo: '🏆 CLASIFICACIÓN GENERAL',
    sede:   '🏆 EXPOTUNING NARIÑO 2026 — TODAS LAS SEDES',
    cuerpo: `<p>La clasificación general acumula los puntos de las tres sedes: <strong style="color:#00ff88">Gualmatán</strong>, <strong style="color:#00aaff">Consacá</strong> e <strong style="color:#00ff88">Higuerones–Buesaco</strong>.</p>
             <p>El campeón general será el participante con mayor puntaje acumulado en todas las fechas.</p>`,
    placeholder: '🏆 CLASIFICACIÓN GENERAL — PRÓXIMAMENTE'
  },
});

/* ============================================
   LIGHTBOX — ampliar imágenes al hacer clic
   ============================================ */
(function initLightbox() {

  // Crear el overlay del lightbox
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <button class="lb-close" aria-label="Cerrar">✕</button>
    <button class="lb-prev" aria-label="Anterior">&#8249;</button>
    <button class="lb-next" aria-label="Siguiente">&#8250;</button>
    <div class="lb-img-wrap">
      <img id="lb-img" src="" alt="" />
    </div>
    <div class="lb-caption" id="lb-caption"></div>
  `;
  document.body.appendChild(lb);

  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  let gallery = [];  // imágenes del contexto actual
  let current = 0;

  // Recopilar todas las imágenes clicables de la página
  function getPageImages() {
    return Array.from(document.querySelectorAll(
      '.galeria-item img, .proximo-afiche img, .hero-banner-img, ' +
      '.modal-img-full, .lightbox-img, .bass-circle img'
    ));
  }

  // Abrir lightbox
  function openLightbox(src, alt, imgs, idx) {
    gallery = imgs;
    current = idx;
    lbImg.src     = src;
    lbImg.alt     = alt;
    lbCaption.textContent = alt;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateNav();
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  function showImage(idx) {
    current = (idx + gallery.length) % gallery.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = gallery[current].src;
      lbImg.alt = gallery[current].alt || '';
      lbCaption.textContent = lbImg.alt;
      lbImg.style.opacity = '1';
    }, 150);
    updateNav();
  }

  function updateNav() {
    lb.querySelector('.lb-prev').style.display = gallery.length > 1 ? 'flex' : 'none';
    lb.querySelector('.lb-next').style.display = gallery.length > 1 ? 'flex' : 'none';
  }

  // Delegación de eventos — captura clics en imágenes estáticas de la página
  document.addEventListener('click', (e) => {
    const img = e.target.closest(
      '.galeria-item img, .proximo-afiche img, ' +
      '.modal-img-full, .lightbox-img'
    );
    if (!img) return;
    e.stopPropagation();

    // Buscar galería de contexto (dentro del mismo contenedor padre o toda la página)
    const container = img.closest('.galeria-grid, .modal-content, .proximo-afiche');
    let imgs;
    if (container) {
      imgs = Array.from(container.querySelectorAll('img'));
    } else {
      imgs = getPageImages();
    }
    const idx = imgs.indexOf(img);
    openLightbox(img.src, img.alt, imgs, idx >= 0 ? idx : 0);
  });

  // También activar en imágenes del banner
  document.querySelector('.hero-banner-img')?.addEventListener('click', (e) => {
    openLightbox(e.target.src, e.target.alt, [e.target], 0);
  });

  // Controles del lightbox
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => showImage(current - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => showImage(current + 1));

  // Clic en fondo cierra
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lb-img-wrap')) closeLightbox();
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showImage(current - 1);
    if (e.key === 'ArrowRight') showImage(current + 1);
  });

  // Cursor pointer en imágenes amplíables
  const style = document.createElement('style');
  style.textContent = `
    .galeria-item img, .proximo-afiche img, .modal-img-full, .lightbox-img {
      cursor: zoom-in;
    }
  `;
  document.head.appendChild(style);

})();

/* ============================================
   GALERÍA GUALMATÁN — 133 fotos con paginación
   ============================================ */
/* ============================================
   GALERÍA GUALMATÁN — fotos de GUALMATAN + GUAL 2
   ============================================ */
const FOTOS_GUALMATAN = [
  // --- Carpeta GUALMATAN (79 fotos) ---
  'GUALMATAN/1784895132769.jpg','GUALMATAN/1784895132786.jpg','GUALMATAN/1784895132802.jpg',
  'GUALMATAN/1784895132818.jpg','GUALMATAN/1784895132835.jpg','GUALMATAN/1784895132851.jpg',
  'GUALMATAN/1784895132867.jpg','GUALMATAN/1784895132884.jpg','GUALMATAN/1784895132901.jpg',
  'GUALMATAN/1784895132918.jpg','GUALMATAN/1784895132935.jpg','GUALMATAN/1784895132952.jpg',
  'GUALMATAN/1784895132971.jpg','GUALMATAN/1784895132996.jpg','GUALMATAN/1784895133022.jpg',
  'GUALMATAN/1784895133042.jpg','GUALMATAN/1784895133060.jpg','GUALMATAN/1784895133079.jpg',
  'GUALMATAN/1784895133098.jpg','GUALMATAN/1784895133119.jpg','GUALMATAN/1784895133137.jpg',
  'GUALMATAN/1784895133154.jpg','GUALMATAN/1784895133171.jpg','GUALMATAN/1784895133188.jpg',
  'GUALMATAN/1784895133206.jpg','GUALMATAN/1784895133224.jpg','GUALMATAN/1784895133241.jpg',
  'GUALMATAN/1784895133258.jpg','GUALMATAN/1784895133275.jpg','GUALMATAN/1784895133293.jpg',
  'GUALMATAN/1784895133310.jpg','GUALMATAN/1784895133326.jpg','GUALMATAN/1784895133343.jpg',
  'GUALMATAN/1784895133360.jpg','GUALMATAN/1784895133378.jpg','GUALMATAN/1784895133395.jpg',
  'GUALMATAN/1784895133412.jpg','GUALMATAN/1784895133429.jpg','GUALMATAN/1784895133446.jpg',
  'GUALMATAN/1784895133463.jpg','GUALMATAN/1784895133480.jpg','GUALMATAN/1784895133497.jpg',
  'GUALMATAN/1784895133514.jpg','GUALMATAN/1784895133531.jpg','GUALMATAN/1784895133548.jpg',
  'GUALMATAN/1784895133565.jpg','GUALMATAN/1784895133582.jpg','GUALMATAN/1784895133599.jpg',
  'GUALMATAN/1784895133618.jpg','GUALMATAN/1784895133636.jpg','GUALMATAN/1784895133653.jpg',
  'GUALMATAN/1784895133671.jpg','GUALMATAN/1784895133688.jpg','GUALMATAN/1784895133706.jpg',
  'GUALMATAN/1784895133723.jpg','GUALMATAN/1784895133739.jpg','GUALMATAN/1784895133756.jpg',
  'GUALMATAN/1784895133774.jpg','GUALMATAN/1784895133793.jpg','GUALMATAN/1784895133810.jpg',
  'GUALMATAN/1784895133828.jpg','GUALMATAN/1784895133846.jpg','GUALMATAN/1784895133864.jpg',
  'GUALMATAN/1784895133881.jpg','GUALMATAN/1784895133902.jpg','GUALMATAN/1784895133920.jpg',
  'GUALMATAN/1784895133937.jpg','GUALMATAN/1784895133956.jpg','GUALMATAN/1784895133972.jpg',
  'GUALMATAN/1784895133989.jpg','GUALMATAN/1784895134005.jpg','GUALMATAN/1784895134021.jpg',
  'GUALMATAN/1784895134038.jpg','GUALMATAN/1784895134054.jpg','GUALMATAN/1784895134072.jpg',
  'GUALMATAN/1784895134089.jpg','GUALMATAN/1784895134106.jpg','GUALMATAN/1784895134123.jpg',
  'GUALMATAN/1784895134139.jpg','GUALMATAN/1784895134156.jpg',
  // --- Carpeta GUAL 2 (55 fotos) ---
  'GUAL 2/1784895134173.jpg','GUAL 2/1784895134191.jpg','GUAL 2/1784895134208.jpg',
  'GUAL 2/1784895134225.jpg','GUAL 2/1784895134243.jpg','GUAL 2/1784895134260.jpg',
  'GUAL 2/1784895134277.jpg','GUAL 2/1784895134294.jpg','GUAL 2/1784895134310.jpg',
  'GUAL 2/1784895134327.jpg','GUAL 2/1784895134343.jpg','GUAL 2/1784895134360.jpg',
  'GUAL 2/1784895134377.jpg','GUAL 2/1784895134393.jpg','GUAL 2/1784895134410.jpg',
  'GUAL 2/1784895134427.jpg','GUAL 2/1784895134443.jpg','GUAL 2/1784895134460.jpg',
  'GUAL 2/1784895134477.jpg','GUAL 2/1784895134494.jpg','GUAL 2/1784895134510.jpg',
  'GUAL 2/1784895134527.jpg','GUAL 2/1784895134543.jpg','GUAL 2/1784895134560.jpg',
  'GUAL 2/1784895134577.jpg','GUAL 2/1784895134593.jpg','GUAL 2/1784895134610.jpg',
  'GUAL 2/1784895134626.jpg','GUAL 2/1784895134643.jpg','GUAL 2/1784895134660.jpg',
  'GUAL 2/1784895134676.jpg','GUAL 2/1784895134693.jpg','GUAL 2/1784895134709.jpg',
  'GUAL 2/1784895134726.jpg','GUAL 2/1784895134742.jpg','GUAL 2/1784895134759.jpg',
  'GUAL 2/1784895134775.jpg','GUAL 2/1784895134792.jpg','GUAL 2/1784895134809.jpg',
  'GUAL 2/1784895134825.jpg','GUAL 2/1784895134842.jpg','GUAL 2/1784895134858.jpg',
  'GUAL 2/1784895134875.jpg','GUAL 2/1784895134891.jpg','GUAL 2/1784895134908.jpg',
  'GUAL 2/1784895134924.jpg','GUAL 2/1784895134942.jpg','GUAL 2/1784895134959.jpg',
  'GUAL 2/1784895134975.jpg','GUAL 2/1784895134992.jpg','GUAL 2/1784895135008.jpg',
  'GUAL 2/1784895135025.jpg','GUAL 2/1784895135041.jpg','GUAL 2/1784895135058.jpg'
];

const POR_PAGINA = 20;
let paginaGual = 0;

function renderGaleriaGualmatan() {
  const wrap = document.getElementById('galeria-gual-wrap');
  if (!wrap) return;

  const total  = FOTOS_GUALMATAN.length;
  const inicio = paginaGual * POR_PAGINA;
  const fin    = Math.min(inicio + POR_PAGINA, total);
  const fotos  = FOTOS_GUALMATAN.slice(inicio, fin);
  const totalPags = Math.ceil(total / POR_PAGINA);

  // Construir grid de miniaturas
  const items = fotos.map((src, i) => `
    <div class="gual-thumb" data-idx="${inicio + i}">
      <img src="${src}" alt="Foto Gualmatán ${inicio + i + 1}" loading="lazy" />
      <div class="gual-thumb-overlay">🔍</div>
    </div>
  `).join('');

  // Paginación
  const pags = Array.from({length: totalPags}, (_, p) => `
    <button class="gual-pag-btn ${p === paginaGual ? 'active' : ''}" data-pag="${p}">${p + 1}</button>
  `).join('');

  wrap.innerHTML = `
    <div class="gual-info">📷 ${total} fotografías · Página ${paginaGual + 1} de ${totalPags} · GUALMATAN + GUAL 2</div>
    <div class="gual-grid">${items}</div>
    <div class="gual-paginacion">${pags}</div>
  `;

  // Scroll al top del modal al cambiar página
  const box = document.getElementById('modalBox');
  if (box) box.scrollTop = 0;

  // Clic en miniatura → lightbox con todas las fotos de la galería
  wrap.querySelectorAll('.gual-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.idx);
      // Crear objetos img temporales para el lightbox
      const imgs = FOTOS_GUALMATAN.map(s => ({ src: s, alt: 'Foto Gualmatán' }));
      openLightboxDirect(FOTOS_GUALMATAN[idx], 'Foto Gualmatán', imgs, idx);
    });
  });

  // Paginación
  wrap.querySelectorAll('.gual-pag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      paginaGual = parseInt(btn.dataset.pag);
      renderGaleriaGualmatan();
    });
  });
}

// Función auxiliar para abrir el lightbox con un array de objetos {src, alt}
function openLightboxDirect(src, alt, imgs, idx) {
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lb        = document.getElementById('lightbox');
  if (!lb || !lbImg) return;

  // Guardar la galería en el lightbox para navegación
  lb._gallery = imgs;
  lb._current = idx;

  lbImg.src = src;
  lbImg.alt = alt;
  lbCaption.textContent = `Gualmatán · Foto ${idx + 1} de ${imgs.length}`;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Sobrescribir navegación del lightbox para esta galería
  const prev = lb.querySelector('.lb-prev');
  const next = lb.querySelector('.lb-next');
  prev.style.display = imgs.length > 1 ? 'flex' : 'none';
  next.style.display = imgs.length > 1 ? 'flex' : 'none';

  // Reemplazar handlers
  prev.onclick = () => navLightboxDirect(-1);
  next.onclick = () => navLightboxDirect(1);
}

function navLightboxDirect(dir) {
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-caption');
  if (!lb || !lb._gallery) return;

  lb._current = (lb._current + dir + lb._gallery.length) % lb._gallery.length;
  const item = lb._gallery[lb._current];
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCap.textContent = `Gualmatán · Foto ${lb._current + 1} de ${lb._gallery.length}`;
    lbImg.style.opacity = '1';
  }, 120);
}
