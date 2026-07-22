// ===== MyShowTime — Application Frontend (Français) =====
// Auteur : Sekou Amara Bamba

const page = document.body.dataset.page;
const state = {
  token: localStorage.getItem('mst_token'),
  user: JSON.parse(localStorage.getItem('mst_user') || 'null'),
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const API_BASE_URL = (window.MY_SHOW_TIME_API_BASE_URL || '').replace(/\/$/, '');

function toast(message) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 3000);
}

function openModal(html) {
  const m = $('#modal');
  if (m) {
    // Évite la double imbrication si le HTML contient déjà une classe de type modal
    if (html.includes('modal-card') || html.includes('modal-large')) {
      m.innerHTML = html;
    } else {
      m.innerHTML = `<div class="modal-card">${html}</div>`;
    }
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function confirmAction(message, callback) {
  openModal(`
    <div class="confirm-dialog">
      <h3>Confirmation</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="ghost" data-close-modal>Annuler</button>
        <button id="modalConfirmBtn" class="primary">Confirmer</button>
      </div>
    </div>
  `);
  $('#modalConfirmBtn').onclick = async () => {
    try {
      await callback();
    } finally {
      closeModal();
    }
  };
}

function closeModal() {
  $('#modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Échec de la requête' }));
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message);
  }
  return response.json();
}

function setAuth(payload) {
  state.token = payload.accessToken;
  state.user = payload.user;
  localStorage.setItem('mst_token', state.token);
  localStorage.setItem('mst_user', JSON.stringify(state.user));
  syncSession();
}

function logout() {
  localStorage.removeItem('mst_token');
  localStorage.removeItem('mst_user');
  state.token = null;
  state.user = null;
  window.location.href = '/';
}

function syncSession() {
  const isAuth = Boolean(state.user);
  document.body.classList.toggle('authenticated', isAuth);
  document.body.classList.toggle('admin', state.user?.role === 'admin');

  const nameDisplay = $('#userNameDisplay');
  if (nameDisplay && state.user) {
    nameDisplay.textContent = state.user.name.split(' ')[0];
  }

  const favCounterNode = $('#favCounter');
  if (isAuth && favCounterNode) {
    const count = (state.user.favoriteEvents || []).length;
    favCounterNode.textContent = count;
    favCounterNode.classList.toggle('hidden', count === 0);
  }
}

function requireAuth() {
  if (!state.user) window.location.href = '/login.html';
}

function requireAdmin() {
  requireAuth();
  if (state.user && state.user.role !== 'admin') window.location.href = '/';
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function translateStatus(status) {
  const dict = {
    'pending': 'EN ATTENTE',
    'validated': 'VALIDÉ',
    'cancelled': 'ANNULÉ',
    'cancel_pending': 'ANNULATION DEMANDÉE'
  };
  return dict[status?.toLowerCase()] || status?.toUpperCase() || 'INCONNU';
}

function translateCategory(cat) {
  const dict = { 'booking': 'Réservation', 'favorite': 'Favoris', 'review': 'Avis', 'system': 'Système' };
  return dict[cat] || 'Général';
}

function getCategoryColor(cat) {
  const dict = { 'booking': '#6366f1', 'favorite': '#ec4899', 'review': '#f59e0b', 'system': '#8b5cf6' };
  return dict[cat] || '#94a3b8';
}

function getCategoryIcon(cat) {
  const icons = {
    'booking': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    'favorite': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    'review': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>',
    'system': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  return icons[cat] || icons['system'];
}

// ---- Carte Concert ----
function concertCard(concert, index) {
  if (!concert || typeof concert !== 'object') return '';
  const isFav = state.user?.favoriteEvents?.some(fav => {
    const favId = fav?._id ? fav._id.toString() : (fav?.toString() || '');
    return favId === concert._id.toString();
  });

  // Logique pour l'image : imageUrl > Thumbnail Vidéo > Fallback
  let imageSrc = concert.imageUrl;
  const isLocalVideo = concert.videoUrl && concert.videoUrl.startsWith('/uploads/');

  if (!imageSrc && concert.videoUrl) {
    if (isLocalVideo) {
      // Pour les vidéos locales sans image, on pourrait utiliser un poster ou laisser vide
      imageSrc = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80';
    } else {
      const ytMatch = concert.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) imageSrc = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    }
  }
  if (!imageSrc) imageSrc = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80';

  return `
    <article class="concert-card" style="animation-delay:${index * 0.08}s">
      <div class="concert-image-container">
        ${isLocalVideo && !concert.imageUrl ? `
          <video src="${escapeHtml(concert.videoUrl)}" muted loop playsinline preload="metadata" onmouseover="this.play()" onmouseout="this.pause()" style="width:100%;height:100%;object-fit:cover;background:#000;"></video>
        ` : `
          <img src="${escapeHtml(imageSrc)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80';" alt="${escapeHtml(concert.groupName)}" loading="lazy">
        `}
        <div class="price-tag">${concert.price.toLocaleString('fr-FR')} FCFA</div>
        ${state.user ? `
          <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${concert._id}" title="${isFav ? 'Retirer' : 'Ajouter'}">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
          </button>
        ` : ''}
      </div>
      <div class="concert-body">
        <span class="genre-tag">${escapeHtml(concert.genre)}</span>
        <h3>${escapeHtml(concert.groupName)}</h3>
        <p class="muted small">${escapeHtml(concert.venue)} — ${formatDate(concert.date)}</p>
        
        ${state.user ? `
          <div class="concert-actions-group">
            <button data-book="${concert._id}" data-title="${escapeHtml(concert.groupName)}" class="primary btn-full">Réserver</button>
            <button data-rate-concert="${concert._id}" data-concert-title="${escapeHtml(concert.groupName)}" class="ghost btn-full">Laisser un avis</button>
          </div>
        ` : `<a class="button btn-full mt-10" href="/login.html">Se connecter pour réserver</a>`}
      </div>
    </article>
  `;
}

// ---- Chargement concerts ----
async function loadConcerts(params = '') {
  const grid = $('#concertGrid');
  grid.innerHTML = '<div class="skeleton" style="height:200px"></div>'.repeat(3);
  try {
    const concerts = await api(`/concerts${params}`);
    grid.innerHTML = (concerts || []).map((c, i) => concertCard(c, i)).join('') || '<p class="muted">Aucun concert trouvé.</p>';
  } catch (e) {
    grid.innerHTML = '<p class="muted">Impossible de charger les concerts.</p>';
  }
}

function openBookingModal(concertId, title) {
  const modal = $('#modal');
  modal.innerHTML = `
    <form class="modal-card" id="bookingForm">
      <h2>Réserver des billets</h2>
      <p class="muted mb-10">${escapeHtml(title)}</p>
      
      <div id="bookingError" class="hidden mb-10" style="color: #ef4444; font-size: 0.85rem; background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);"></div>

      <input type="hidden" name="concertId" value="${concertId}" />
      <div class="form-group">
        <label>Nombre de billets</label>
        <input name="quantity" type="number" min="1" value="1" placeholder="Quantité" required />
      </div>

      <div class="modal-actions">
        <button type="button" class="ghost" data-close-modal>Annuler</button>
        <button type="submit" class="primary">Confirmer la réservation</button>
      </div>
    </form>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function handleRateBooking(concertId, title) {
  openModal(`
    <form id="rateForm" class="modal-card">
      <div class="modal-header">
        <p class="eyebrow">Votre Avis</p>
        <h2>Évaluer "${escapeHtml(title)}"</h2>
        <p class="muted">Partagez votre expérience avec la communauté.</p>
      </div>
      
      <input type="hidden" name="concertId" value="${concertId}" />
      
      <div class="star-rating">
        <input type="radio" id="star5" name="rating" value="5" required /><label for="star5">★</label>
        <input type="radio" id="star4" name="rating" value="4" /><label for="star4">★</label>
        <input type="radio" id="star3" name="rating" value="3" /><label for="star3">★</label>
        <input type="radio" id="star2" name="rating" value="2" /><label for="star2">★</label>
        <input type="radio" id="star1" name="rating" value="1" /><label for="star1">★</label>
      </div>

      <div class="form-group">
        <label>Votre commentaire</label>
        <textarea name="comment" placeholder="Qu'avez-vous pensé de l'événement ?" required></textarea>
      </div>

      <div class="modal-actions">
        <button type="button" class="ghost" data-close-modal>Plus tard</button>
        <button type="submit" class="primary">Publier mon avis</button>
      </div>
    </form>
  `);

  $('#rateForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Publication...';

    try {
      const formData = new FormData(e.target);
      const payload = {
        rating: Number(formData.get('rating')),
        comment: formData.get('comment')
      };
      const concertId = formData.get('concertId');
      
      await api(`/concerts/${concertId}/reviews`, { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      
      closeModal();
      toast('Merci ! Votre avis a été publié avec succès.');
      if (page === 'favorites') await initFavoritesPage();
      if (page === 'home') await initConcertsPage();
    } catch (err) { 
      toast(err.message); 
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publier mon avis';
    }
  };
}

  // Mobile Menu Toggle
  const menuToggle = $('#menuToggle');
  const navLinks = $('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.onclick = () => navLinks.classList.toggle('open');
    // Close menu when clicking links
    navLinks.onclick = (e) => {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    };
  }

  // ---- Page Management ----
async function initConcertsPage() {
  await loadConcerts();
  $('#filters')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const params = new URLSearchParams(Object.entries(data).filter(([, v]) => v));
    await loadConcerts(params.toString() ? `?${params}` : '');
  });
  $('#resetFilters')?.addEventListener('click', async () => {
    $('#filters').reset();
    await loadConcerts();
  });
}

// ---- Page Connexion ----
async function initLoginPage() {
  if (state.user) window.location.href = '/';

  $('#loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      setAuth(await api('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }));
      window.location.href = state.user.role === 'admin' ? '/admin.html' : '/';
    } catch (error) {
      toast(error.message);
    }
  });

  if (new URLSearchParams(window.location.search).get('registered')) {
    toast('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
  }
}

// ---- Page Inscription ----
async function initRegisterPage() {
  if (state.user) window.location.href = '/';

  $('#registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      window.location.href = '/login.html?registered=1';
    } catch (error) {
      toast(error.message);
    }
  });
}

// ---- Page Réservations ----
async function initBookingsPage() {
  requireAuth();
  const list = $('#bookingList');
  if (!list) return;
  list.innerHTML = '<div class="skeleton" style="height:100px"></div>'.repeat(2);
  try {
    const bookings = await api('/bookings/me');
    list.innerHTML =
      bookings
        .map(
          (b) => `
        <article class="booking-card">
          <div class="booking-info">
            <p class="eyebrow">Ticket #${escapeHtml(b.bookingCode.split('-').pop())}</p>
            <p class="price-summary"><strong>${b.quantity}</strong> billet(s) — Total : <strong>${b.totalPrice} FCFA</strong></p>
            <p class="muted small">${formatDate(b.concert?.date)} — ${formatTime(b.concert?.date)}</p>
            <div class="status-badge ${b.status?.toLowerCase() || 'pending'}">${translateStatus(b.status || 'pending')}</div>
                
                ${b.status?.toLowerCase() !== 'validated' && b.status?.toLowerCase() !== 'cancelled' ? `
                  <p class="muted small italic mt-10" style="font-size: 0.8rem; opacity: 0.8;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Billet en cours de validation par l'administrateur...
                  </p>
                ` : ''}

                <div class="booking-actions">
                  ${b.status?.toLowerCase() === 'validated' ? `
                    <button class="primary small" onclick="downloadTicket('${b._id}')">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      Télécharger
                    </button>
                    <button class="ghost small" data-rate-concert="${b.concert?._id}" data-concert-title="${escapeHtml(b.concert?.groupName || 'Concert')}">Évaluer</button>
                  ` : ''}
                  
                  ${(b.status?.toLowerCase() === 'pending' || b.status?.toLowerCase() === 'validated') ? `<button class="btn-cancel danger ghost small" data-id="${b._id}">Annuler la réservation</button>` : ''}
                  ${(b.status?.toLowerCase() === 'cancelled' || b.status?.toLowerCase() === 'cancel_pending') ? `<button class="btn-delete-me danger small" data-id="${b._id}">Supprimer l'historique</button>` : ''}
                </div>
          </div>
          <div class="qr-container">
            <img src="${b.qrCodeDataUrl}" alt="QR Code">
            <span class="qr-label">${escapeHtml(b.bookingCode)}</span>
          </div>
        </article>
      `,
        )
        .join('') || '<p class="muted">Aucune réservation pour le moment.</p>';

    list.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.onclick = () => {
        confirmAction("Voulez-vous vraiment annuler cette réservation ?", async () => {
          try {
            await api(`/bookings/${btn.dataset.id}/cancel`, { method: 'POST' });
            toast('Demande d\'annulation envoyée.');
            initBookingsPage();
          } catch (e) {
            toast(e.message);
          }
        });
      };
    });

    list.querySelectorAll('.btn-delete-me').forEach(btn => {
      btn.onclick = () => {
        confirmAction("Voulez-vous supprimer définitivement ce billet annulé ? L'admin en sera notifié.", async () => {
          try {
            await api(`/bookings/${btn.dataset.id}/delete-me`, { method: 'POST' });
            toast('Billet supprimé.');
            initBookingsPage();
          } catch (e) {
            toast(e.message);
          }
        });
      };
    });
  } catch (e) {
    list.innerHTML = `<p class="muted">Erreur : ${e.message}</p>`;
  }
}

async function downloadTicket(bookingId) {
  try {
    const booking = await api(`/bookings/${bookingId}/download`);
    const downloadDate = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    const ticketWindow = window.open('', '_blank');
    ticketWindow.document.write(`
      <html>
        <head>
          <title>Billet - ${booking.bookingCode}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e1b4b; line-height: 1.6; }
            .ticket { max-width: 600px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .content { padding: 30px; }
            .concert-title { font-size: 22px; font-weight: 700; color: #4338ca; margin-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
            .info-item label { display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px; }
            .info-item span { font-weight: 600; font-size: 15px; }
            .qr-section { text-align: center; padding: 20px; background: #f8fafc; }
            .qr-section img { width: 150px; height: 150px; border: 4px solid white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .footer { padding: 20px; font-size: 12px; color: #94a3b8; text-align: center; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
              .ticket { box-shadow: none; border: 1px solid #eee; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>BILLET MYSHOWTIME</h1>
            </div>
            <div class="content">
              <div class="concert-title">${escapeHtml(booking.concert.title)}</div>
              <div class="info-item" style="margin-bottom:15px">
                <label>Artiste</label>
                <span style="font-size:18px">${escapeHtml(booking.concert.groupName)}</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <label>Détenteur du billet</label>
                  <span>${escapeHtml(booking.user.name)}</span>
                </div>
                <div class="info-item">
                  <label>Code de réservation</label>
                  <span>${escapeHtml(booking.bookingCode)}</span>
                </div>
                <div class="info-item">
                  <label>Lieu</label>
                  <span>${escapeHtml(booking.concert.venue)}, ${escapeHtml(booking.concert.city)}</span>
                </div>
                <div class="info-item">
                  <label>Date & Heure</label>
                  <span>${new Date(booking.concert.date).toLocaleString('fr-FR')}</span>
                </div>
                <div class="info-item">
                  <label>Places</label>
                  <span>${booking.quantity}</span>
                </div>
                <div class="info-item">
                  <label>Prix Total</label>
                  <span>${booking.totalPrice.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div class="qr-section">
                <img src="${booking.qrCodeDataUrl}" alt="QR Code">
                <p style="margin-top:10px; font-weight:700; color:#4338ca;">${escapeHtml(booking.bookingCode)}</p>
              </div>
            </div>
            <div class="footer">
              Téléchargé le : ${downloadDate}<br>
              Ce billet doit être présenté à l'entrée de l'événement.
            </div>
          </div>
          <div class="no-print" style="text-align:center; margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 25px; background:#6366f1; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Imprimer / Enregistrer en PDF</button>
          </div>
        </body>
      </html>
    `);
    ticketWindow.document.close();
  } catch (err) {
    toast(err.message);
  }
}

// ---- Page Profil ----
async function initProfilePage() {
  requireAuth();
  try {
    const user = await api('/users/me');
    const welcome = $('#userWelcome');
    if (welcome) welcome.textContent = `Bonjour, ${user.name}`;
    
    if ($('#profileForm')) {
      $('#profileForm').name.value = user.name;
      $('#profileForm').email.value = user.email;
    }
  } catch (e) {
    toast(e.message);
  }

  $('#profileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(event.target));
      state.user = await api('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
      localStorage.setItem('mst_user', JSON.stringify(state.user));
      syncSession();
      toast('Vos informations ont été mises à jour.');
    } catch (error) {
      toast('Erreur : ' + error.message);
    }
  });

  $('#securityForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const { password } = Object.fromEntries(new FormData(event.target));
      if (!password) return toast('Veuillez entrer un nouveau mot de passe.');
      await api('/users/me', { method: 'PATCH', body: JSON.stringify({ password }) });
      event.target.reset();
      toast('Votre mot de passe a été modifié avec succès.');
    } catch (error) {
      toast('Erreur : ' + error.message);
    }
  });

  // Charger les notifications ici
  await initNotificationsPage();
}

// ---- Page Notifications ----
async function initNotificationsPage() {
  requireAuth();
  try {
    const notifications = await api('/notifications/me');
    const notifContainer = $('#notifications');
    if (notifContainer) {
      const renderNotifications = (list, showAll = false) => {
        const clearBtn = $('#clearAllNotifications');
        if (clearBtn) {
          if (list.length > 0) clearBtn.classList.remove('hidden');
          else clearBtn.classList.add('hidden');
        }

        const displayed = showAll ? list : list.slice(0, 2);
        
        notifContainer.innerHTML = displayed
          .map((n) => {
            const cat = n.category || 'system';
            return `
              <div class="notification-item ${n.read ? '' : 'unread'}" style="animation: slideIn 0.3s ease-out forwards">
                <div class="notif-category-icon" style="background:${getCategoryColor(cat)}15; color:${getCategoryColor(cat)}">
                  ${getCategoryIcon(cat)}
                </div>
                <div class="notif-content">
                  <div class="notif-header">
                    <span class="cat-label" style="color:${getCategoryColor(cat)}">${translateCategory(cat)}</span>
                    <span class="notif-time">${formatDate(n.createdAt)}</span>
                  </div>
                  <p class="notif-title"><strong>${escapeHtml(n.title)}</strong></p>
                  <p class="notif-msg muted">${escapeHtml(n.message)}</p>
                </div>
                <button class="delete-notif-btn logout-icon-btn" data-id="${n._id || n.id}" title="Supprimer">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            `;
          })
          .join('') || `
            <div class="empty-notifs">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.2; margin-bottom:10px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <p class="muted">Aucune notification pour le moment.</p>
            </div>
          `;

        if (!showAll && list.length > 2) {
          notifContainer.insertAdjacentHTML('beforeend', `
            <button id="showAllNotifs" class="ghost small btn-full mt-10">Voir les ${list.length - 2} autres notifications</button>
          `);
          $('#showAllNotifs').onclick = () => renderNotifications(list, true);
        } else if (showAll && list.length > 2) {
          notifContainer.insertAdjacentHTML('beforeend', `
            <button id="hideNotifs" class="ghost small btn-full mt-10">Réduire la liste</button>
          `);
          $('#hideNotifs').onclick = () => renderNotifications(list, false);
        }
      };
      
      renderNotifications(notifications);
      
      // Marquer comme lu après un court délai si il y a des non-lus
      if (notifications.some(n => !n.read)) {
        setTimeout(async () => {
          await api('/notifications/me/read', { method: 'PATCH' });
        }, 2000);
      }
    }
  } catch (e) {
    toast(e.message);
  }
}

// ---- Page Favoris ----
async function initFavoritesPage() {
  requireAuth();
  const eventsGrid = $('#favoriteEvents');
  if (!eventsGrid) return;
  
  eventsGrid.innerHTML = '<p class="muted">Chargement de vos favoris...</p>';
  
  try {
    const user = await api('/users/me');
    state.user = user;
    syncSession();
    
    eventsGrid.innerHTML = user.favoriteEvents?.map((c, i) => concertCard(c, i)).join('') || '<p class="muted">Aucun événement favori.</p>';
    
    try {
      const reviews = await api('/concerts/reviews/me');
      const reviewsList = $('#userReviewsList');
      
      if (reviewsList) {
        if (reviews.length > 0) {
          reviewsList.innerHTML = reviews
            .map(r => `
              <article class="review-card">
                <div class="review-header">
                  <div class="review-concert-title">${escapeHtml(r.concert?.title || 'Concert')}</div>
                  <div class="review-rating">
                    ${'★'.repeat(r.rating).split('').map(() => '<span class="star">★</span>').join('')}
                    ${'☆'.repeat(5 - r.rating).split('').map(() => '<span class="star empty">★</span>').join('')}
                  </div>
                </div>
                <p class="review-comment">"${escapeHtml(r.comment)}"</p>
                ${r.adminReply ? `
                  <div class="admin-reply-box">
                    <strong>Réponse de MyShowTime :</strong>
                    <p>${escapeHtml(r.adminReply)}</p>
                  </div>
                ` : ''}
                <time class="review-date">Publié le ${formatDate(r.createdAt)}</time>
              </article>
            `).join('');
        } else {
          reviewsList.innerHTML = `
            <div class="text-center p-40">
              <div class="muted mb-10">Vous n'avez pas encore laissé d'avis.</div>
              <p class="small hint">Évaluez vos concerts passés depuis l'onglet "Mes Billets".</p>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error("Erreur chargement avis:", e);
    }
  } catch (err) {
    eventsGrid.innerHTML = `<p class="danger-text">Erreur : ${err.message}</p>`;
  }
}

// ---- Page Admin ----
function renderAdminNotifs() {
  const container = $('#adminNotificationsList');
  const loadMoreBtn = $('#loadMoreAdminNotifs');
  if (!container || !state.adminNotifs) return;

  const filtered = state.currentFilter === 'all' 
    ? state.adminNotifs 
    : state.adminNotifs.filter(n => (n.category || 'system') === state.currentFilter);
  
  const visible = filtered.slice(0, state.adminLimit || 6);

  container.innerHTML = visible
    .map(n => `
      <div class="table-row">
        <div class="notif-cell">
          <span class="cat-badge" style="background:${getCategoryColor(n.category)}15; color:${getCategoryColor(n.category)}">
            ${translateCategory(n.category)}
          </span>
          <div class="notif-text-wrap">
            <strong>${escapeHtml(n.title)}</strong><br>
            <span class="muted">${escapeHtml(n.message)}</span>
          </div>
        </div>
        <div class="table-actions-column">
          <span class="muted small text-right">${formatDate(n.createdAt)}<br>${formatTime(n.createdAt)}</span>
          <button class="btn-delete-notif ml-15" onclick="deleteAdminNotification('${n._id}')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('') || '<p class="muted p-20">Aucune notification pour cette catégorie.</p>';

  if (filtered.length > (state.adminLimit || 6)) {
    loadMoreBtn?.classList.remove('hidden');
  } else {
    loadMoreBtn?.classList.add('hidden');
  }
}

async function loadAdmin() {
  const [users, concerts, stats, bookings, allReviews] = await Promise.all([
    api('/users'), 
    api('/concerts'), 
    api('/stats/bookings'),
    api('/bookings'),
    api('/concerts/reviews/all')
  ]);
  state.concerts = concerts;

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const todayConcerts = concerts.filter(c => new Date(c.date).toDateString() === now.toDateString()).length;
  const thisWeekConcerts = concerts.filter(c => {
    const d = new Date(c.date);
    return d >= now && (d.getTime() - now.getTime()) <= oneWeek;
  }).length;
  const thisMonthConcerts = concerts.filter(c => {
    const d = new Date(c.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgRating = concerts.reduce((acc, c) => acc + (c.avgRating || 0), 0) / (concerts.length || 1);

  $('#stats').innerHTML = `
    <article class="stat">
      <div class="stat-icon" style="background:rgba(124,58,237,.1);color:#c084fc">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="stat-data"><strong>${users.length}</strong><span>Utilisateurs</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(236,72,153,.1);color:#f472b6">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4z"/></svg>
      </div>
      <div class="stat-data"><strong>${concerts.length}</strong><span>Événements</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(251,191,36,.1);color:#fbbf24">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <div class="stat-data"><strong>${avgRating.toFixed(1)}</strong><span>Note Moyenne</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(34,197,94,.1);color:#4ade80">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="stat-data"><strong>${todayConcerts}</strong><span>Aujourd'hui</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(251,191,36,.1);color:#fbbf24">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      </div>
      <div class="stat-data"><strong>${stats.summary.tickets}</strong><span>Billets Vendus</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(14,165,233,.1);color:#38bdf8">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="stat-data"><strong>${stats.summary.revenue.toLocaleString()}</strong><span>CA Total (FCFA)</span></div>
    </article>
  `;

  $('#availabilityStats').innerHTML = `
    <article class="stat">
      <div class="stat-icon" style="background:rgba(124,58,237,.1);color:#c084fc">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="stat-data"><strong>${thisWeekConcerts}</strong><span>Cette Semaine</span></div>
    </article>
    <article class="stat">
      <div class="stat-icon" style="background:rgba(236,72,153,.1);color:#f472b6">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      </div>
      <div class="stat-data"><strong>${thisMonthConcerts}</strong><span>Ce Mois</span></div>
    </article>
  `;

  $('#bookingsTable').innerHTML = bookings
    .map(b => `
      <div class="table-row">
        <span><strong>${escapeHtml(b.user?.name || 'Inconnu')}</strong><br><span class="muted">${escapeHtml(b.concert?.title)} — ${b.quantity} places</span></span>
        <span class="status-badge ${b.status || 'pending'}">${translateStatus(b.status || 'pending')}</span>
        <div class="table-actions">
          ${b.status === 'pending' ? `<button data-validate-booking="${b._id}" class="ghost">Valider</button>` : ''}
          ${b.status === 'cancel_pending' ? `<button data-validate-booking="${b._id}" class="primary small">Confirmer Annulation</button>` : ''}
          <button data-delete-booking="${b._id}" class="danger small">Supprimer</button>
        </div>
      </div>
    `).join('') || '<p class="muted p-20">Aucune réservation.</p>';

  $('#evaluationsList').innerHTML = allReviews
    .map(r => `
      <div class="table-row column-layout">
        <div class="review-main-info">
          <span><strong>${escapeHtml(r.user?.name || 'Anonyme')}</strong> sur <strong>${escapeHtml(r.concert?.title)}</strong></span>
          <span class="price" style="font-size: 1rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          <p class="review-comment">"${escapeHtml(r.comment)}"</p>
          ${r.adminReply ? `
            <div class="admin-reply-box">
              <strong>Votre réponse :</strong>
              <p>${escapeHtml(r.adminReply)}</p>
              <span class="muted small">${formatDate(r.adminReplyAt)}</span>
            </div>
          ` : ''}
        </div>
        <div class="table-actions">
          <button onclick="openReplyModal('${r._id}', '${escapeHtml(r.user?.name || 'Anonyme')}')" class="ghost small">Répondre</button>
          <button data-delete-review="${r._id}" class="danger small">Supprimer</button>
        </div>
      </div>
    `).join('') || '<p class="muted p-20">Aucun avis pour le moment.</p>';

  $('#salesList').innerHTML = bookings
    .filter(b => b.status === 'validated')
    .map(b => `
      <div class="table-row">
        <span><strong>${escapeHtml(b.user?.name || 'Inconnu')}</strong><br><span class="muted">${escapeHtml(b.concert?.title)}</span></span>
        <span>${b.quantity} billets</span>
        <span class="price">${(b.quantity * (b.concert?.price || 0)).toLocaleString()} FCFA</span>
        <div class="table-actions">
          <button data-delete-booking="${b._id}" class="danger small">Supprimer</button>
        </div>
      </div>
    `).join('') || '<p class="muted p-20">Aucune vente validée.</p>';

  try {
    state.adminNotifs = await api('/notifications');
    renderAdminNotifs();
  } catch(e) {
    console.error("Erreur notifications admin:", e);
    $('#adminNotificationsList').innerHTML = '<p class="muted p-20">Impossible de charger les notifications.</p>';
  }

  $('#usersTable').innerHTML = users
    .map(u => `
      <div class="table-row">
        <span>${escapeHtml(u.name)}<br><span class="muted">${escapeHtml(u.email)} — ${u.role === 'admin' ? 'Admin' : 'Utilisateur'}</span></span>
        <div class="table-actions">
          ${u._id !== state.user._id ? `
            <button data-promote="${u._id}" data-role="${u.role}" class="ghost">${u.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}</button>
            <button data-delete-user="${u._id}" class="danger small">Supprimer</button>
          ` : '<span class="badge small">Vous (Actif)</span>'}
        </div>
      </div>
    `).join('');

  $('#adminConcerts').innerHTML = concerts
    .map(c => `
      <div class="table-row">
        <div class="admin-preview-box">
          ${c.imageUrl ? `<img src="${c.imageUrl}" alt="Preview">` : (c.videoUrl ? `<video src="${c.videoUrl}" muted playsinline preload="metadata"></video>` : '<div class="no-media"></div>')}
        </div>
        <span class="flex-1">${escapeHtml(c.title)}<br><span class="muted">${escapeHtml(c.groupName)} — ${formatDate(c.date)}</span></span>
        <div class="table-actions">
          <button data-edit-concert="${c._id}" class="ghost small">Modifier</button>
          <button data-delete-concert="${c._id}" class="danger small">Supprimer</button>
        </div>
      </div>
    `).join('') || '<p class="muted p-20">Aucun concert trouvé.</p>';
}

function openReplyModal(reviewId, userName) {
  openModal(`
    <form id="replyReviewForm" class="form-stack p-20">
      <h3 class="mb-15">Répondre à ${escapeHtml(userName)}</h3>
      <div class="form-group">
        <label>Votre message de réponse</label>
        <textarea name="reply" placeholder="Ex: Merci pour votre retour ! Nous sommes ravis que vous ayez apprécié le spectacle." required style="min-height:120px"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="ghost" data-close-modal>Annuler</button>
        <button type="submit" class="primary">Envoyer la réponse</button>
      </div>
    </form>
  `);

  $('#replyReviewForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    try {
      const reply = new FormData(e.target).get('reply');
      await api(`/concerts/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ reply })
      });
      closeModal();
      toast('Réponse envoyée ! L\'utilisateur recevra une notification.');
      await loadAdmin();
    } catch (err) {
      toast(err.message);
    } finally {
      btn.disabled = false;
    }
  };
}

async function initAdminPage() {
  requireAdmin();
  state.adminLimit = 6;
  state.currentFilter = 'all';

  // Setup listeners once
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      state.adminLimit = 6;
      renderAdminNotifs();
    });
  });

  $('#loadMoreAdminNotifs')?.addEventListener('click', () => {
    state.adminLimit += 6;
    renderAdminNotifs();
  });

  window.deleteAdminNotification = (id) => {
    confirmAction('Voulez-vous vraiment supprimer cette notification système ?', async () => {
      try {
        await api(`/notifications/${id}`, { method: 'DELETE' });
        state.adminNotifs = (state.adminNotifs || []).filter(n => n._id !== id);
        renderAdminNotifs();
        toast('Notification supprimée.');
      } catch(e) { 
        toast(e.message); 
      }
    });
  };

  await loadAdmin();

  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(targetId)?.classList.add('active');
    };
  });

  $('#addConcertBtn')?.addEventListener('click', () => {
    openModal($('#concertFormTpl').innerHTML);
  });
}

// On gère les soumissions de formulaires admin (délégation globale car dans modale)
document.addEventListener('submit', async (event) => {
  const form = event.target;
  
  if (form.id === 'concertForm') {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Création en cours...';

    try {
      const formData = new FormData(form);
      
      // Conversion manuelle car FormData ne gère que les chaînes/blobs
      const rawDate = formData.get('date');
      if (rawDate) {
        try {
          formData.set('date', new Date(rawDate).toISOString());
        } catch(e) { console.error("Date invalide"); }
      }
      
      const rawPrice = formData.get('price');
      if (rawPrice !== null) {
        formData.set('price', Number(String(rawPrice).replace(/[^\d]/g, '')) || 0);
      }
      
      const rawCap = formData.get('capacity');
      if (rawCap !== null) {
        formData.set('capacity', Number(rawCap) || 0);
      }
      
      await api('/concerts', {
        method: 'POST',
        body: formData,
      });

      closeModal();
      await loadAdmin();
      toast('Le concert a été créé avec succès !');
    } catch (error) {
      toast('Erreur : ' + error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Lancer l'Événement";
    }
  }

  if (form.id === 'userForm') {
    event.preventDefault();
    try {
      await api('/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      closeModal();
      await loadAdmin();
      toast('L\'utilisateur a été créé avec succès.');
    } catch (error) {
      toast('Erreur lors de la création de l\'utilisateur : ' + error.message);
    }
  }
});

// ---- Événements globaux ----
document.addEventListener('click', async (event) => {
  const target = event.target;
  try {
    const rateBtn = target.closest('[data-rate-concert]');
    if (rateBtn) return handleRateBooking(rateBtn.dataset.rateConcert, rateBtn.dataset.concertTitle);

    const logoutBtn = target.closest('#logoutBtn');
    if (logoutBtn) return logout();

    const bookBtn = target.closest('[data-book]');
    if (bookBtn) return openBookingModal(bookBtn.dataset.book, bookBtn.dataset.title);

    const favBtn = target.closest('[data-fav]');
    if (favBtn) {
      const eventId = favBtn.dataset.fav;
      state.user = await api(`/users/me/favorites/events/${eventId}`, { method: 'POST' });
      localStorage.setItem('mst_user', JSON.stringify(state.user));
      favBtn.classList.toggle('active');
      const svg = favBtn.querySelector('svg');
      if (favBtn.classList.contains('active')) {
        svg.setAttribute('fill', 'currentColor');
      } else {
        svg.setAttribute('fill', 'none');
      }
      syncSession();
      if (page === 'favorites') await initFavoritesPage();
      toast(favBtn.classList.contains('active') ? 'Événement ajouté à vos favoris.' : 'Événement retiré de vos favoris.');
      return;
    }

    const closeBtn = target.closest('[data-close-modal]');
    if (closeBtn) return closeModal();

    const deleteUserBtn = target.closest('[data-delete-user]');
    if (deleteUserBtn) {
      if (deleteUserBtn.dataset.deleteUser === state.user._id) {
        return toast('Vous ne pouvez pas supprimer votre propre compte.');
      }
      confirmAction('Êtes-vous sûr de vouloir supprimer cet utilisateur ?', async () => {
        await api(`/users/${deleteUserBtn.dataset.deleteUser}`, { method: 'DELETE' });
        await loadAdmin();
        toast('L\'utilisateur a été supprimé.');
      });
      return;
    }

    const promoteBtn = target.closest('[data-promote]');
    if (promoteBtn) {
      const currentRole = promoteBtn.dataset.role;
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const confirmMsg = newRole === 'admin' 
        ? 'Voulez-vous promouvoir cet utilisateur au rang d\'administrateur ?' 
        : 'Voulez-vous retirer les droits d\'administrateur à cet utilisateur ?';
      
      confirmAction(confirmMsg, async () => {
        await api(`/users/${promoteBtn.dataset.promote}`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
        await loadAdmin();
        toast('Le rôle de l\'utilisateur a été mis à jour.');
      });
      return;
    }

    if (target.closest('[data-delete-booking]')) {
      const btn = target.closest('[data-delete-booking]');
      confirmAction('Voulez-vous vraiment supprimer cette réservation ? Cette action est irréversible.', async () => {
        await api(`/bookings/${btn.dataset.deleteBooking}/delete`, { method: 'POST' });
        toast('Réservation supprimée.');
        await loadAdmin();
      });
      return;
    }
    if (target.closest('[data-validate-booking]')) {
      const btn = target.closest('[data-validate-booking]');
      const isCancel = btn.textContent.toLowerCase().includes('annulation');
      const msg = isCancel 
        ? 'Voulez-vous confirmer l\'annulation de cette réservation ?' 
        : 'Voulez-vous valider cette réservation et confirmer le billet ?';
        
      confirmAction(msg, async () => {
        await api(`/bookings/${btn.dataset.validateBooking}/validate`, { method: 'PATCH' });
        toast(isCancel ? 'Annulation confirmée.' : 'Réservation validée !');
        await loadAdmin();
      });
      return;
    }

    const deleteConcertBtn = target.closest('[data-delete-concert]');
    if (deleteConcertBtn) {
      confirmAction('Êtes-vous sûr de vouloir supprimer ce concert ?', async () => {
        await api(`/concerts/${deleteConcertBtn.dataset.deleteConcert}`, { method: 'DELETE' });
        await loadAdmin();
        toast('Le concert a été supprimé.');
      });
      return;
    }

    const deleteReviewBtn = target.closest('[data-delete-review]');
    if (deleteReviewBtn) {
      confirmAction('Supprimer cet avis client ?', async () => {
        await api(`/concerts/reviews/${deleteReviewBtn.dataset.deleteReview}`, { method: 'DELETE' });
        await loadAdmin();
        toast('L\'avis a été supprimé.');
      });
      return;
    }

    const editConcertBtn = target.closest('[data-edit-concert]');
    if (editConcertBtn) {
      const concertId = editConcertBtn.dataset.editConcert;
      const concert = state.concerts?.find(c => c._id === concertId);
      if (!concert) return toast("Concert introuvable.");

      // On formate la date pour l'input datetime-local
      const dateVal = concert.date ? new Date(concert.date).toISOString().slice(0, 16) : '';

      openModal(`
        <form id="editConcertForm" class="modal-form modal-large">
          <div class="modal-header">
            <p class="eyebrow">Administration MyShowTime</p>
            <h2>Modifier l'Événement</h2>
            <p class="muted">Mettez à jour les informations du concert "${escapeHtml(concert.title)}".</p>
          </div>
          
          <div class="form-sections">
            <div class="form-section">
              <div class="section-icon-header">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <p class="eyebrow">Détails de l'Artiste</p>
              </div>
              <div class="form-grid">
                <input name="title" value="${escapeHtml(concert.title)}" placeholder="Nom de la Tournée / Titre" required />
                <input name="groupName" value="${escapeHtml(concert.groupName)}" placeholder="Artiste ou Groupe" required />
                <input name="genre" value="${escapeHtml(concert.genre)}" placeholder="Genre (ex: Rock, Jazz, Afro...)" required />
                <input name="date" type="datetime-local" value="${dateVal}" required />
              </div>
            </div>

            <div class="form-section">
              <div class="section-icon-header">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <p class="eyebrow">Lieu & Billetterie</p>
              </div>
              <div class="form-grid">
                <input name="venue" value="${escapeHtml(concert.venue)}" placeholder="Nom de la salle" required />
                <input name="city" value="${escapeHtml(concert.city)}" placeholder="Ville" required />
                <input name="price" type="number" min="0" value="${concert.price}" placeholder="Prix du billet (FCFA)" required />
                <input name="capacity" type="number" min="1" value="${concert.capacity || 100}" placeholder="Nombre de places" required />
              </div>
            </div>

            <div class="form-section full-width highlight-section">
              <div class="section-icon-header">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <p class="eyebrow">Visuels & Description</p>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Affiche (Image)</label>
                  <input name="image" type="file" accept="image/*" />
                </div>
                <div class="form-group">
                  <label>Teaser (Vidéo)</label>
                  <input name="video" type="file" accept="video/*" />
                </div>
              </div>
              <textarea name="description" placeholder="Description..." rows="6" class="full-width mt-10">${escapeHtml(concert.description)}</textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost" data-close-modal>Annuler</button>
            <button type="submit" class="primary">Enregistrer les modifications</button>
          </div>
        </form>
      `);

      $('#editConcertForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Mise à jour...';
        try {
          const formData = new FormData(e.target);
          
          const rawDate = formData.get('date');
          if (rawDate) {
            try {
              formData.set('date', new Date(rawDate).toISOString());
            } catch(e) { console.error("Date invalide"); }
          }
          
          const rawPrice = formData.get('price');
          if (rawPrice !== null) {
            formData.set('price', Number(String(rawPrice).replace(/[^\d]/g, '')) || 0);
          }
          
          const rawCap = formData.get('capacity');
          if (rawCap !== null) {
            formData.set('capacity', Number(rawCap) || 0);
          }

          await api(`/concerts/${concertId}`, { 
            method: 'PATCH', 
            body: formData 
          });
          closeModal();
          await loadAdmin();
          toast('Le concert a été mis à jour avec succès.');
        } catch (err) {
          toast(err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "Enregistrer les modifications";
        }
      };
      return;
    }

    const deleteNotifBtn = target.closest('.delete-notif-btn');
    if (deleteNotifBtn) {
      try {
        await api(`/notifications/me/${deleteNotifBtn.dataset.id}`, { method: 'DELETE' });
        await initProfilePage();
        toast('Notification supprimée.');
      } catch (e) {
        toast(e.message);
      }
      return;
    }

    const passwordToggle = target.closest('.password-toggle');
    if (passwordToggle) {
      const input = passwordToggle.parentElement.querySelector('input');
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      passwordToggle.classList.toggle('active');
      const svg = passwordToggle.querySelector('svg');
      if (type === 'text') {
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
      } else {
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
      return;
    }

    const clearAllBtn = target.closest('#clearAllNotifications');
    if (clearAllBtn) {
      confirmAction('Voulez-vous vraiment supprimer toutes vos notifications ?', async () => {
        try {
          await api('/notifications/me', { method: 'DELETE' });
          await initProfilePage();
          toast('Toutes les notifications ont été supprimées.');
        } catch (err) {
          toast(err.message);
        }
      });
      return;
    }
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'bookingForm') return;
  event.preventDefault();
  
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const errorDiv = $('#bookingError');
  
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
  }

  btn.disabled = true;
  btn.textContent = 'Réservation...';

  try {
    const data = Object.fromEntries(new FormData(form));
    await api('/bookings', {
      method: 'POST',
      body: JSON.stringify({ concertId: data.concertId, quantity: Number(data.quantity) }),
    });
    $('#modal').classList.remove('open');
    toast('Réservation confirmée ! Redirection vers vos billets...');
    setTimeout(() => {
      window.location.href = '/bookings.html';
    }, 1500);
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
    } else {
      toast(error.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmer la réservation';
  }
});

// ---- Démarrage ----
async function boot() {
  if (state.token) {
    try {
      state.user = await api('/users/me');
      localStorage.setItem('mst_user', JSON.stringify(state.user));
    } catch (e) {
      logout();
    }
  }
  syncSession();
  if (page === 'concerts') await initConcertsPage();
  if (page === 'login') await initLoginPage();
  if (page === 'register') await initRegisterPage();
  if (page === 'bookings') await initBookingsPage();
  if (page === 'profile') await initProfilePage();
  if (page === 'favorites') await initFavoritesPage();
  if (page === 'admin') await initAdminPage();
}

boot().catch((error) => toast(error.message));
