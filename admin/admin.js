// Secure SHA-256 hashing helper using Web Crypto API with a pure JS fallback for non-secure contexts (HTTP)
async function sha256(message) {
  try {
    if (typeof window !== 'undefined' && window.crypto && crypto.subtle && crypto.subtle.digest) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("Web Crypto API failed, using pure JS fallback:", e);
  }
  return sha256Fallback(message);
}

// Fallback pure JS SHA-256 implementation for non-secure contexts (HTTP)
function sha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash = [], k = [];

  const isPrime = (n) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  const primeCounterArray = [];
  while (primeCounterArray[lengthProperty] < 64) {
    if (isPrime(candidate)) {
      primeCounterArray.push(candidate);
    }
    candidate++;
  }

  for (i = 0; i < 64; i++) {
    hash[i] = (mathPow(primeCounterArray[i], 1 / 2) * maxWord) | 0;
    k[i] = (mathPow(primeCounterArray[i], 1 / 3) * maxWord) | 0;
  }
  
  hash = hash.slice(0, 8);

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII only
    words[i >> 2] |= j << (24 - (i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);
  
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0));
      const temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    let word = hash[i];
    if (word < 0) word += maxWord;
    result += word.toString(16).padStart(8, '0');
  }
  return result;
}

// Cookie Management Helpers with fallback for file:// protocol or blocked cookies
function setCookie(name, value, days) {
  try {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    const secureFlag = location.protocol === 'https:' ? "; Secure" : "";
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict" + secureFlag;
  } catch (e) {
    // Fallback
  }
  // Always set in sessionStorage/localStorage as fallback
  try {
    sessionStorage.setItem(name, value || "");
  } catch (e) {}
}

function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  } catch (e) {
    // Fallback
  }
  try {
    return sessionStorage.getItem(name);
  } catch (e) {
    return null;
  }
}

function eraseCookie(name) {
  try {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
  } catch (e) {}
  try {
    sessionStorage.removeItem(name);
  } catch (e) {}
}

// Byte-level XOR encryption/decryption for Unicode safety (handles emojis, Indian languages, special spaces)
function encryptData(text, key) {
  try {
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    const keyBytes = encoder.encode(key);
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    let binary = '';
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
}

function decryptData(ciphertext, key) {
  const oldHash = '240751c045b73656d0f5e1ef937e0e7a2cf9c34a2e584f22c1592dae4c76b9e2';
  const newHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  function tryDecrypt(cipherText, decKey) {
    // 1. Try new byte-level decryption first
    try {
      const binary = atob(cipherText);
      const len = binary.length;
      const encryptedBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        encryptedBytes[i] = binary.charCodeAt(i);
      }
      const keyBytes = new TextEncoder().encode(decKey);
      const decryptedBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      const decoder = new TextDecoder();
      const result = decoder.decode(decryptedBytes);
      JSON.parse(result); // verify it's valid JSON
      return result;
    } catch (e) {
      // 2. Fallback to old character-level decryption for pre-existing records
      try {
        const xorCipher = (text, k) => {
          let res = '';
          for (let i = 0; i < text.length; i++) {
            res += String.fromCharCode(text.charCodeAt(i) ^ k.charCodeAt(i % k.length));
          }
          return res;
        };
        const result = decodeURIComponent(escape(xorCipher(atob(cipherText), decKey)));
        JSON.parse(result); // verify it's valid JSON
        return result;
      } catch (oldErr) {
        return null;
      }
    }
  }

  // Try decrypting with the provided key first
  let result = tryDecrypt(ciphertext, key);
  if (result) return result;

  // If decryption failed, try the alternative key if the provided key is one of the admin hashes
  if (key === oldHash) {
    result = tryDecrypt(ciphertext, newHash);
  } else if (key === newHash) {
    result = tryDecrypt(ciphertext, oldHash);
  }
  return result;
}


// Session Idle Timeout Manager (15 minutes)
let idleTimer;
const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (getCookie('enfanceAdminCookie') === 'active') {
    idleTimer = setTimeout(autoLogout, TIMEOUT_DURATION);
  }
}

function autoLogout() {
  alert('Session expired due to inactivity. Logging out for security.');
  logout();
}

function initIdleTracker() {
  window.onload = resetIdleTimer;
  window.onmousemove = resetIdleTimer;
  window.onmousedown = resetIdleTimer;
  window.onclick = resetIdleTimer;
  window.onscroll = resetIdleTimer;
  window.onkeypress = resetIdleTimer;
}

// Authenticated Login Function (Async SHA-256 Hashing verification)
async function login() {
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;

  const userHash = await sha256(user.trim());
  const passHash = await sha256(pass.trim());

  // Hashed credentials for 'admin' and 'admin123'
  // Supports both the correct hash and the original wrong hash in the codebase
  if (userHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' && 
      (passHash === '240751c045b73656d0f5e1ef937e0e7a2cf9c34a2e584f22c1592dae4c76b9e2' || 
       passHash === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')) {
    
    // Store decryption key in sessionStorage (tab-bound, in-memory)
    sessionStorage.setItem('enfanceSessionToken', passHash);
    // Set active session cookie (1 day)
    setCookie('enfanceAdminCookie', 'active', 1);
    
    bootAdmin();
    initIdleTracker();
  } else {
    alert('Invalid credentials!');
  }
}

function logout() {
  eraseCookie('enfanceAdminCookie');
  sessionStorage.removeItem('enfanceSessionToken');
  location.reload();
}

function bootAdmin() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('panel').style.display = 'block';
  loadContent();
  renderProgramAdmin();
  renderEnquiries();
}

// Side tab navigation switches
function showTab(tabId, buttonEl) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.style.display = 'none';
  });
  document.getElementById(tabId).style.display = 'block';
  
  document.querySelectorAll('.sidebar button').forEach(btn => {
    btn.classList.remove('active');
  });
  buttonEl.classList.add('active');
  
  if (tabId === 'enquiries') {
    renderEnquiries();
  }
}

// Load metadata values back to editing forms
function loadContent() {
  const data = getData();
  
  const fields = ['school', 'phone', 'email', 'address', 'admission'];
  fields.forEach(fieldKey => {
    const el = document.getElementById(fieldKey);
    if (el) el.value = data[fieldKey] || '';
  });

  const titleEl = document.getElementById('heroTitleAdmin');
  const textEl = document.getElementById('heroTextAdmin');
  
  if (titleEl) titleEl.value = data.heroTitle || '';
  if (textEl) textEl.value = data.heroText || '';

  const pgCountEl = document.getElementById('pgCount');
  if (pgCountEl) pgCountEl.textContent = data.programs.length;
}

// Save text fields back to database
function saveContent() {
  const data = getData();
  
  const fields = ['school', 'phone', 'email', 'address', 'admission'];
  fields.forEach(fieldKey => {
    const el = document.getElementById(fieldKey);
    if (el) data[fieldKey] = el.value;
  });

  const titleEl = document.getElementById('heroTitleAdmin');
  const textEl = document.getElementById('heroTextAdmin');

  if (titleEl) data.heroTitle = titleEl.value;
  if (textEl) data.heroText = textEl.value;

  setData(data);
  alert('Content saved successfully! Reload the website tabs to view live changes.');
  loadContent();
}

// Render existing program cards within editor
function renderProgramAdmin() {
  const container = document.getElementById('programRows');
  if (!container) return;

  const data = getData();
  container.innerHTML = data.programs.map((prog, index) => `
    <div class="admin-card" style="box-shadow: none; border: 2px solid #e2e8f0; margin-bottom: 15px;">
      <h3 style="margin-bottom: 12px; font-size: 18px; color: var(--primary);">Program Card #${index + 1}</h3>
      
      <label>Program Title</label>
      <input placeholder="e.g. Play Group" value="${prog[0]}">
      
      <label>Target Age Group</label>
      <input placeholder="e.g. Age 2+ Years" value="${prog[1]}">
      
      <label>Syllabus Description Tagline</label>
      <textarea rows="3" placeholder="Description of program activities...">${prog[2]}</textarea>
      
      <label>Image Asset Path</label>
      <input placeholder="Image Path" value="${prog[3]}">
      
      <button class="btn alt outline" style="padding: 8px 16px; font-size: 14px;" onclick="this.parentElement.remove()">Remove Program</button>
    </div>
  `).join('');
}

// Append new blank program template to list
function addProgram() {
  const container = document.getElementById('programRows');
  if (!container) return;

  container.insertAdjacentHTML('beforeend', `
    <div class="admin-card" style="box-shadow: none; border: 2px solid #e2e8f0; margin-bottom: 15px;">
      <h3 style="margin-bottom: 12px; font-size: 18px; color: var(--primary);">New Program Card</h3>
      
      <label>Program Title</label>
      <input placeholder="e.g. Activity Class">
      
      <label>Target Age Group</label>
      <input placeholder="e.g. Age 4+ Years">
      
      <label>Syllabus Description Tagline</label>
      <textarea rows="3" placeholder="Description of program activities..."></textarea>
      
      <label>Image Asset Path</label>
      <input placeholder="Image Path" value="assets/images/classes01.png?v=2">
      
      <button class="btn alt outline" style="padding: 8px 16px; font-size: 14px;" onclick="this.parentElement.remove()">Remove Program</button>
    </div>
  `);
}

// Collate card fields and save
function savePrograms() {
  const cards = document.querySelectorAll('#programRows .admin-card');
  const updatedPrograms = Array.from(cards).map(card => {
    const inputs = card.querySelectorAll('input');
    const desc = card.querySelector('textarea').value;
    return [
      inputs[0].value.trim(),
      inputs[1].value.trim(),
      desc.trim(),
      inputs[2].value.trim()
    ];
  }).filter(prog => prog[0] !== ''); // ignore cards missing titles

  const data = getData();
  data.programs = updatedPrograms;
  setData(data);

  alert('Syllabus programs updated successfully!');
  loadContent();
  renderProgramAdmin();
}

// Render submission records in inbox table (with automatic local encryption/decryption)
function renderEnquiries() {
  const container = document.getElementById('enquiryRows');
  if (!container) return;

  let rawEnquiries;
  try {
    rawEnquiries = JSON.parse(localStorage.getItem('enfanceEnquiries') || '[]');
    if (!Array.isArray(rawEnquiries)) rawEnquiries = [];
  } catch (e) {
    rawEnquiries = [];
  }
  const sessionToken = sessionStorage.getItem('enfanceSessionToken');

  if (!sessionToken) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--primary); padding: 25px; font-weight: 700;">
          ⚠️ Session key missing. Please log in again to decrypt records.
        </td>
      </tr>
    `;
    return;
  }

  let hasChanges = false;
  const enquiries = rawEnquiries.map(item => {
    // If the item is a string, it is encrypted ciphertext
    if (typeof item === 'string') {
      const decryptedStr = decryptData(item, sessionToken);
      if (decryptedStr) {
        return JSON.parse(decryptedStr);
      } else {
        return { date: 'N/A', name: 'Corrupt/Unreadable Record', phone: 'N/A', course: 'N/A', msg: 'Could not decrypt.' };
      }
    } else {
      // If the item is a plain object, it is a new submission: encrypt and save it back
      const encryptedStr = encryptData(JSON.stringify(item), sessionToken);
      item._encrypted = encryptedStr;
      hasChanges = true;
      return item;
    }
  });

  // Save changes if new enquiries have been encrypted
  if (hasChanges) {
    const encryptedEnquiries = rawEnquiries.map(item => {
      if (typeof item === 'string') return item;
      return item._encrypted;
    });
    localStorage.setItem('enfanceEnquiries', JSON.stringify(encryptedEnquiries));
  }
  
  const countEl = document.getElementById('eqCount');
  if (countEl) countEl.textContent = enquiries.length;

  if (enquiries.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--muted); padding: 25px;">No enquiries received yet.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = enquiries.map(enq => `
    <tr>
      <td style="font-weight: 700; font-size: 14px; white-space: nowrap;">${enq.date}</td>
      <td style="font-weight: 600;">${enq.name}</td>
      <td style="font-family: monospace; font-size: 15px;">${enq.phone}</td>
      <td><span class="tag" style="margin: 0; padding: 4px 10px; font-size: 12px;">${enq.course}</span></td>
      <td style="color: var(--muted); font-size: 14px; max-width: 300px; word-wrap: break-word;">${enq.msg || 'N/A'}</td>
    </tr>
  `).join('');
}

// Reset enquiries record list
function clearEnquiries() {
  if (confirm('Are you absolutely sure you want to flush all student enquiries from the database? This action cannot be undone.')) {
    localStorage.removeItem('enfanceEnquiries');
    renderEnquiries();
  }
}

// Load dash view if session is validated
if (getCookie('enfanceAdminCookie') === 'active' && sessionStorage.getItem('enfanceSessionToken')) {
  bootAdmin();
  initIdleTracker();
} else {
  // Clear any incomplete session state on load
  eraseCookie('enfanceAdminCookie');
  sessionStorage.removeItem('enfanceSessionToken');
}
