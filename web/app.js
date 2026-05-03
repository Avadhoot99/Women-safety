// ==================== STATE ====================
let contacts = [];
let profile = { name: '', age: '', bloodGroup: '' };

// ==================== INIT ====================
window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateGreeting();
  renderContacts();
});

function loadFromStorage() {
  try {
    const stored = localStorage.getItem('womensafety_profile');
    if (stored) profile = JSON.parse(stored);

    const storedContacts = localStorage.getItem('womensafety_contacts');
    if (storedContacts) contacts = JSON.parse(storedContacts);

    // Populate profile form
    document.getElementById('inputName').value = profile.name || '';
    document.getElementById('inputAge').value = profile.age || '';
    document.getElementById('selectBlood').value = profile.bloodGroup || '';
  } catch (e) {
    console.error('Failed to load from storage', e);
  }
}

function saveToStorage() {
  localStorage.setItem('womensafety_profile', JSON.stringify(profile));
  localStorage.setItem('womensafety_contacts', JSON.stringify(contacts));
}

// ==================== NAVIGATION ====================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
}

// ==================== GREETING ====================
function updateGreeting() {
  const el = document.getElementById('greetingName');
  if (el) el.textContent = profile.name || 'User';
}

// ==================== PROFILE ====================
function saveProfile() {
  const name = document.getElementById('inputName').value.trim();
  const age = document.getElementById('inputAge').value.trim();
  const bloodGroup = document.getElementById('selectBlood').value;

  if (!name) { showToast('Please enter your name.'); return; }
  if (!age || isNaN(age) || age < 1 || age > 100) {
    showToast('Please enter a valid age between 1 and 100.');
    return;
  }
  if (!bloodGroup) { showToast('Please select a blood group.'); return; }

  profile = { name, age, bloodGroup };
  saveToStorage();
  updateGreeting();
  showToast('Profile saved successfully!');
}

// ==================== CONTACTS ====================
function addContact() {
  document.getElementById('contactName').value = '';
  document.getElementById('contactNumber').value = '';
  document.getElementById('contactModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('contactModal').style.display = 'none';
}

function saveContact() {
  const name = document.getElementById('contactName').value.trim();
  const number = document.getElementById('contactNumber').value.trim();

  if (!name || !number) { showToast('Please enter both name and number.'); return; }
  if (!/^\+?[\d\s\-()]{7,15}$/.test(number)) {
    showToast('Please enter a valid phone number.');
    return;
  }

  const exists = contacts.some(c => c.number === number);
  if (exists) { showToast('Contact already exists.'); return; }

  contacts.push({ name, number });
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  saveToStorage();
  renderContacts();
  closeModal();
  showToast('Contact added: ' + name);
}

function removeContact(index) {
  const removed = contacts.splice(index, 1);
  saveToStorage();
  renderContacts();
  showToast('Contact removed: ' + (removed[0]?.name || ''));
}

function renderContacts() {
  const list = document.getElementById('contactList');
  if (!list) return;

  if (contacts.length === 0) {
    list.innerHTML = '<li style="color:#666;font-size:13px;padding:8px 0;">No emergency contacts added yet.</li>';
    return;
  }

  list.innerHTML = contacts.map((c, i) => `
    <li class="contact-item" onclick="removeContact(${i})">
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(c.name)}</div>
        <div class="contact-number">${escapeHtml(c.number)}</div>
      </div>
      <span class="contact-remove" title="Tap to remove">&times;</span>
    </li>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ==================== SOS ====================
function handleSOS() {
  if (contacts.length === 0) {
    showToast('No contacts added. Please add emergency contacts first.');
    return;
  }

  const btn = document.getElementById('sosBtn');
  btn.classList.add('sos-active');
  setTimeout(() => btn.classList.remove('sos-active'), 1600);

  // Simulate getting location and sending SOS
  if (navigator.geolocation) {
    showToast('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        const msg = buildMessage('Help! I\'m in danger.', link);
        contacts.forEach(c => showToast(`SOS sent to ${c.name}`));
        console.log('SOS Message:', msg);
      },
      () => {
        const msg = buildMessage('Help! I\'m in danger.', '(location unavailable)');
        contacts.forEach(c => showToast(`SOS sent to ${c.name}`));
        console.log('SOS Message (no location):', msg);
      }
    );
  } else {
    const msg = buildMessage('Help! I\'m in danger.', '');
    contacts.forEach(c => showToast(`SOS sent to ${c.name}`));
    console.log('SOS Message:', msg);
  }
}

function buildMessage(base, link) {
  return `${base} - Name: ${profile.name || 'Unknown'}, Age: ${profile.age || 'Unknown'}, Blood Group: ${profile.bloodGroup || 'Unknown'}. ${link}`;
}

// ==================== I'M SAFE ====================
function sendImSafe() {
  if (contacts.length === 0) {
    showToast('No contacts added. Please add emergency contacts first.');
    return;
  }
  const msg = buildMessage("I'm safe", '');
  contacts.forEach(c => showToast(`"I'm Safe" sent to ${c.name}`));
  console.log('Safe Message:', msg);
}

// ==================== CALL EMERGENCY ====================
function callEmergency() {
  showToast('Calling Emergency: 112');
  window.location.href = 'tel:112';
}

function callHome() {
  if (contacts.length === 0) {
    showToast('No contacts available. Please add at least one contact.');
    return;
  }
  const first = contacts[0];
  showToast(`Calling ${first.name}: ${first.number}`);
  window.location.href = 'tel:' + first.number;
}

function dialNumber(num) {
  showToast(`Calling ${num}...`);
  window.location.href = 'tel:' + num;
}

// ==================== TOAST ====================
let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
