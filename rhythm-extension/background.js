// Rhythm Background Service Worker
// Handles custom user-added domains using dynamic rules

const CUSTOM_RULE_ID_START = 5000;

chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with defaults
  chrome.storage.local.get(['customDomains', 'pornEnabled', 'gamblingEnabled'], (result) => {
    if (result.customDomains === undefined) {
      chrome.storage.local.set({ customDomains: [], pornEnabled: true, gamblingEnabled: true });
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_CUSTOM_DOMAINS') {
    updateCustomDomainRules(message.domains).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'TOGGLE_CATEGORY') {
    toggleCategory(message.category, message.enabled).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function updateCustomDomainRules(domains) {
  // Remove old custom rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldIds = existingRules.map(r => r.id);
  
  // Build new rules
  const newRules = domains.map((domain, i) => ({
    id: CUSTOM_RULE_ID_START + i,
    priority: 2,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: `/blocked.html?type=custom&site=${encodeURIComponent(domain)}`
      }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame']
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldIds,
    addRules: newRules
  });
}

async function toggleCategory(category, enabled) {
  const rulesetId = category === 'porn' ? 'porn_rules' : 'gambling_rules';
  
  if (enabled) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [rulesetId]
    });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [rulesetId]
    });
  }
}
