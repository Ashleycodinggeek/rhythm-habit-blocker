// Rhythm Popup Script

let customDomains = [];

// Load saved state
chrome.storage.local.get(['customDomains', 'pornEnabled', 'gamblingEnabled'], (result) => {
  customDomains = result.customDomains || [];
  const pornEnabled = result.pornEnabled !== false;
  const gamblingEnabled = result.gamblingEnabled !== false;

  document.getElementById('togglePorn').checked = pornEnabled;
  document.getElementById('toggleGambling').checked = gamblingEnabled;

  renderTags();
  updateStatus();
});

// Toggle handlers
document.getElementById('togglePorn').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ pornEnabled: enabled });
  chrome.runtime.sendMessage({ type: 'TOGGLE_CATEGORY', category: 'porn', enabled });
  updateStatus();
});

document.getElementById('toggleGambling').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ gamblingEnabled: enabled });
  chrome.runtime.sendMessage({ type: 'TOGGLE_CATEGORY', category: 'gambling', enabled });
  updateStatus();
});

// Add domain
document.getElementById('addBtn').addEventListener('click', addDomain);
document.getElementById('domainInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDomain();
});

function addDomain() {
  const input = document.getElementById('domainInput');
  let val = input.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');

  if (!val || customDomains.includes(val)) {
    input.value = '';
    return;
  }

  customDomains.push(val);
  saveDomains();
  renderTags();
  input.value = '';
  input.focus();
}

function removeDomain(domain) {
  customDomains = customDomains.filter(d => d !== domain);
  saveDomains();
  renderTags();
}

function saveDomains() {
  chrome.storage.local.set({ customDomains });
  chrome.runtime.sendMessage({ type: 'UPDATE_CUSTOM_DOMAINS', domains: customDomains });
}

function renderTags() {
  const container = document.getElementById('domainTags');
  const emptyMsg = document.getElementById('emptyMsg');

  if (customDomains.length === 0) {
    container.innerHTML = '<span class="empty-state" id="emptyMsg">No custom sites added yet</span>';
    return;
  }

  container.innerHTML = customDomains.map(d => `
    <div class="domain-tag">
      ${escapeHtml(d)}
      <button onclick="removeDomain('${escapeHtml(d)}')" title="Remove">×</button>
    </div>
  `).join('');

  updateFooterStats();
}

function updateStatus() {
  const pornOn = document.getElementById('togglePorn').checked;
  const gamblingOn = document.getElementById('toggleGambling').checked;
  const pill = document.getElementById('statusPill');

  if (!pornOn && !gamblingOn && customDomains.length === 0) {
    pill.textContent = 'Paused';
    pill.classList.add('off');
  } else {
    pill.textContent = 'Active';
    pill.classList.remove('off');
  }

  updateFooterStats();
}

function updateFooterStats() {
  const pornOn = document.getElementById('togglePorn').checked;
  const gamblingOn = document.getElementById('toggleGambling').checked;
  let count = 0;
  if (pornOn) count += 130;
  if (gamblingOn) count += 40;
  count += customDomains.length;

  const stats = document.getElementById('footerStats');
  stats.textContent = count > 0
    ? `Blocking ${count}+ sites`
    : 'No sites currently blocked';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
