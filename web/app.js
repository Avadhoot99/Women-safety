// ==========================================
// WOMEN GUARD — App Logic
// ==========================================

let contacts = [];
let profile = { name: '', age: '', bloodGroup: '' };

// SOS hold-to-send
let sosHoldTimer = null;
let sosCountdownInterval = null;
let sosHoldDuration = 3000; // ms
let sosHoldStart = null;

const CIRCUMFERENCE = 2 * Math.PI * 54; // matches SVG r=54

// ==========================================
// INIT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateGreeting();
  renderContacts();
  renderHomeContactStrip();
  updateProfileCard();
});

// ==========================================
// STORAGE
// ==========================================
function loadFromStorage() {
  try {
    const p = localStorage.getItem('wg_profile');
    if (p) profile = JSON.parse(p);
    const c = localStorage.getItem('wg_contacts');
    if (c) contacts = JSON.parse(c);

    document.getElementById('inputName').value = profile.name || '';
    document.getElementById('inputAge').value = profile.age || '';
    document.getElementById('selectBlood').value = profile.bloodGroup || '';
  } catch (e) {
    console.error('Storage load error', e);
  }
}

function saveToStorage() {
  localStorage.setItem('wg_profile', JSON.stringify(profile));
  localStorage.setItem('wg_contacts', JSON.stringify(contacts));
}

// ==========================================
// NAVIGATION
// ==========================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = document.getElementById(id);
  if (t) {
    t.classList.add('active');
    t.scrollTop = 0;
  }
  const navMap = {
    'screen-home': 'nav-home',
    'screen-profile': 'nav-profile',
    'screen-emergency': 'nav-emergency'
  };
  if (navMap[id]) setNav(navMap[id]);
}

function setNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

// ==========================================
// GREETING & PROFILE CARD
// ==========================================
function updateGreeting() {
  const name = profile.name || 'User';
  const el = document.getElementById('greetingName');
  if (el) el.textContent = name;

  const init = document.getElementById('avatarInitial');
  if (init) init.textContent = name.charAt(0).toUpperCase();
}

function updateProfileCard() {
  const nameEl = document.getElementById('profileCardName');
  const metaEl = document.getElementById('profileCardMeta');
  const avatarEl = document.getElementById('profileAvatarLarge');

  if (nameEl) nameEl.textContent = profile.name || 'Your Name';
  if (metaEl) {
    const parts = [];
    if (profile.age) parts.push(`Age ${profile.age}`);
    if (profile.bloodGroup) parts.push(profile.bloodGroup);
    metaEl.textContent = parts.length ? parts.join(' • ') : 'Set up your profile';
  }
  if (avatarEl) {
    avatarEl.textContent = (profile.name || 'U').charAt(0).toUpperCase();
  }
}

// ==========================================
// PROFILE
// ==========================================
function saveProfile() {
  const name = document.getElementById('inputName').value.trim();
  const age = document.getElementById('inputAge').value.trim();
  const bloodGroup = document.getElementById('selectBlood').value;

  if (!name) { showToast('Please enter your full name.'); return; }
  if (!age || isNaN(age) || +age < 1 || +age > 100) {
    showToast('Please enter a valid age (1–100).');
    return;
  }
  if (!bloodGroup) { showToast('Please select your blood group.'); return; }

  profile = { name, age, bloodGroup };
  saveToStorage();
  updateGreeting();
  updateProfileCard();
  showToast('Profile saved!');
}

// ==========================================
// CONTACTS
// ==========================================
function openAddContact() {
  document.getElementById('contactName').value = '';
  document.getElementById('contactNumber').value = '';
  document.getElementById('contactModal').style.display = 'flex';
  setTimeout(() => document.getElementById('contactName').focus(), 100);
}

function closeModal() {
  document.getElementById('contactModal').style.display = 'none';
}

function saveContact() {
  const name = document.getElementById('contactName').value.trim();
  const number = document.getElementById('contactNumber').value.trim();

  if (!name || !number) { showToast('Please fill in both fields.'); return; }
  if (!/^\+?[\d\s\-()]{7,20}$/.test(number)) {
    showToast('Please enter a valid phone number.');
    return;
  }

  const exists = contacts.some(c => c.number.replace(/\s/g,'') === number.replace(/\s/g,''));
  if (exists) { showToast('This number is already in your contacts.'); return; }

  contacts.push({ name, number });
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  saveToStorage();
  renderContacts();
  renderHomeContactStrip();
  closeModal();
  showToast(`${name} added to emergency contacts`);
}

function removeContact(index) {
  const c = contacts[index];
  contacts.splice(index, 1);
  saveToStorage();
  renderContacts();
  renderHomeContactStrip();
  showToast(`${c?.name || 'Contact'} removed`);
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function renderContacts() {
  const list = document.getElementById('contactList');
  if (!list) return;

  if (contacts.length === 0) {
    list.innerHTML = `
      <li class="contact-empty">
        <span>📋</span>
        No emergency contacts yet.<br>Tap "Add" to add your first contact.
      </li>`;
    return;
  }

  list.innerHTML = contacts.map((c, i) => `
    <li class="contact-item" onclick="removeContact(${i})">
      <div class="contact-avatar">${escapeHtml(getInitial(c.name))}</div>
      <div class="contact-details">
        <div class="contact-name">${escapeHtml(c.name)}</div>
        <div class="contact-number">${escapeHtml(c.number)}</div>
      </div>
      <div class="contact-remove" title="Remove">✕</div>
    </li>
  `).join('');
}

function renderHomeContactStrip() {
  const strip = document.getElementById('homeContactStrip');
  if (!strip) return;

  if (contacts.length === 0) {
    strip.innerHTML = `<span class="contact-strip-empty">No contacts added yet — go to Profile to add some.</span>`;
    return;
  }

  strip.innerHTML = contacts.slice(0, 4).map(c => `
    <div class="contact-chip">
      <div class="chip-avatar">${escapeHtml(getInitial(c.name))}</div>
      <span class="chip-name">${escapeHtml(c.name)}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// SOS — Hold-to-Send with Countdown
// ==========================================
function startSOS(e) {
  if (e) e.preventDefault();
  if (sosHoldTimer) return;

  const btn = document.getElementById('sosBtn');
  const overlay = document.getElementById('sosCountdown');
  const circle = document.getElementById('countdownCircle');
  const numEl = document.getElementById('countdownNum');

  btn.classList.add('pressing');
  overlay.style.display = 'flex';

  // Init SVG ring
  circle.style.strokeDasharray = CIRCUMFERENCE;
  circle.style.strokeDashoffset = 0;

  sosHoldStart = Date.now();
  let secsLeft = 3;
  numEl.textContent = secsLeft;

  sosCountdownInterval = setInterval(() => {
    const elapsed = Date.now() - sosHoldStart;
    const progress = Math.min(elapsed / sosHoldDuration, 1);
    circle.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    const newSecs = Math.max(0, Math.ceil((sosHoldDuration - elapsed) / 1000));
    if (newSecs !== secsLeft) {
      secsLeft = newSecs;
      numEl.textContent = secsLeft || '!';
    }
  }, 50);

  sosHoldTimer = setTimeout(() => {
    clearInterval(sosCountdownInterval);
    sosCountdownInterval = null;
    sosHoldTimer = null;
    btn.classList.remove('pressing');
    overlay.style.display = 'none';
    triggerSOS();
  }, sosHoldDuration);
}

function cancelSOS() {
  if (sosHoldTimer) {
    clearTimeout(sosHoldTimer);
    sosHoldTimer = null;
  }
  if (sosCountdownInterval) {
    clearInterval(sosCountdownInterval);
    sosCountdownInterval = null;
  }
  const btn = document.getElementById('sosBtn');
  const overlay = document.getElementById('sosCountdown');
  btn.classList.remove('pressing');
  overlay.style.display = 'none';
}

function handleSOSTap() {
  if (contacts.length === 0) {
    showToast('Add emergency contacts first!');
    showScreen('screen-profile');
    setNav('nav-profile');
  }
}

function triggerSOS() {
  if (contacts.length === 0) {
    showToast('No emergency contacts. Please add contacts first.');
    return;
  }

  const sendAlert = (locationStr) => {
    const msg = buildMessage("🚨 HELP! I'm in danger.", locationStr);
    console.log('SOS Message:', msg);
    showSOSOverlay();
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        sendAlert(link);
      },
      () => sendAlert('(location unavailable)')
    );
  } else {
    sendAlert('');
  }
}

function buildMessage(base, link) {
  const n = profile.name || 'Unknown';
  const a = profile.age || '?';
  const b = profile.bloodGroup || '?';
  return `${base} — ${n}, Age ${a}, Blood: ${b}. ${link}`;
}

function showSOSOverlay() {
  const overlay = document.getElementById('sosOverlay');
  const msgEl = document.getElementById('sosSentMsg');

  const names = contacts.map(c => c.name).join(', ');
  msgEl.textContent = `Alert sent to: ${names}`;

  overlay.style.display = 'flex';
}

function dismissSOSOverlay() {
  document.getElementById('sosOverlay').style.display = 'none';
  showToast('Stay safe. Help is on the way.');
}

// ==========================================
// I'M SAFE
// ==========================================
function sendImSafe() {
  if (contacts.length === 0) {
    showToast('Please add emergency contacts first.');
    return;
  }
  const msg = buildMessage("✅ I'm safe now.", '');
  console.log('Safe Message:', msg);
  const names = contacts.map(c => c.name).join(', ');
  showToast(`"I'm Safe" sent to ${names}`);
}

// ==========================================
// CALLS
// ==========================================
function callEmergency() {
  showToast('Dialling 112 — Emergency');
  setTimeout(() => { window.location.href = 'tel:112'; }, 400);
}

function callHome() {
  if (contacts.length === 0) {
    showToast('No contacts found. Add a contact first.');
    return;
  }
  const first = contacts[0];
  showToast(`Calling ${first.name}…`);
  setTimeout(() => { window.location.href = 'tel:' + first.number; }, 400);
}

function dialNumber(num) {
  showToast(`Calling ${num}…`);
  setTimeout(() => { window.location.href = 'tel:' + num; }, 400);
}

// ==========================================
// TOAST
// ==========================================
let toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// KEYBOARD: close modal on Escape
// ==========================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    cancelSOS();
  }
});
