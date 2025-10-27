document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const autoSyncCheckbox = document.getElementById('autoSync');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const status = document.getElementById('status');

  // Load saved settings
  const config = await chrome.storage.sync.get(['hubspotApiKey', 'autoSync']);
  if (config.hubspotApiKey) {
    apiKeyInput.value = config.hubspotApiKey;
  }
  autoSyncCheckbox.checked = config.autoSync || false;

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const autoSync = autoSyncCheckbox.checked;

    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    await chrome.storage.sync.set({ hubspotApiKey: apiKey, autoSync });
    showStatus('Settings saved successfully!', 'success');
  });

  // Test connection
  testBtn.addEventListener('click', async () => {
    showStatus('Testing connection...', 'success');
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
      
      if (response.success) {
        showStatus('✓ Connected to HubSpot successfully!', 'success');
      } else {
        showStatus('✗ Connection failed: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('✗ Connection failed: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    
    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  }
});