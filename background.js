chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.action) {
                case 'syncMessage':
                    console.warn("Contact syncing is currently disabled.");
                    sendResponse({ success: false, error: 'Contact syncing is temporarily disabled.' });
                    break;

                case 'testConnection':
                    await handleTestConnection(sendResponse);
                    break;

                case 'fetchContacts':
                    await handleFetchContacts(sendResponse);
                    break;

                case 'updateHubspotPhone':
                    await handleUpdateHubspotPhone(request.data, sendResponse);
                    break;

                case 'createHubSpotContact':
                    try {
                        const { hubspotApiKey: apiKey } = await getConfig();
                        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${apiKey}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ properties: request.data })
                        });
                        const result = await res.json();
                        sendResponse({ success: true, data: result });
                    } catch (err) {
                        sendResponse({ success: false, error: err.message });
                    }
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    })();

    return true;
});

async function handleTestConnection(sendResponse) {
    try {
        const result = await testHubSpotConnection();
        sendResponse({ success: true, data: result });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchContacts(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        let allContacts = [];
        let hasMore = true;
        let after;

        while (hasMore) {
            const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id${after ? `&after=${after}` : ''}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);
            const data = await res.json();
            allContacts = allContacts.concat(data.results);
            after = data.paging?.next?.after;
            hasMore = !!after;
        }

        sendResponse({ success: true, contacts: allContacts });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleUpdateHubspotPhone(data, sendResponse) {
    try {
        const { whatsappContact, hubspotContactIds } = data;
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        const results = await Promise.all(hubspotContactIds.map(async hubId => {
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ properties: { phone: whatsappContact.phoneNumber } })
            });

            const contactDetails = await getContactDetails(hubId, apiKey);
            return { hubspotId: hubId, updatedContact: contactDetails };
        }));

        sendResponse({ success: true, data: results });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function getContactDetails(contactId, apiKey) {
    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`;
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) throw new Error(`Failed to fetch contact ${contactId}`);
    const data = await res.json();
    return data.properties;
}

async function testHubSpotConnection() {
    const { hubspotApiKey: apiKey } = await getConfig();
    if (!apiKey) throw new Error('API key not configured');

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error('Invalid API key or connection failed');
    return { status: 'connected' };
}

async function syncToHubSpot() {
    console.warn("syncToHubSpot() is disabled.");
    return { disabled: true };
}

async function findOrCreateContact() {
    console.warn("findOrCreateContact() is disabled.");
    return { disabled: true };
}

async function createEngagement() {
    console.warn("createEngagement() is disabled.");
    return { disabled: true };
}

// ------------------- Utility -------------------
async function getConfig() {
    return new Promise(resolve => chrome.storage.sync.get(['hubspotApiKey', 'autoSync'], resolve));
}
