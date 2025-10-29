chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.action) {
                case 'syncMessage':
                    return sendResponse({ success: false, error: 'Contact syncing is temporarily disabled.' });

                case 'testConnection':
                    return await handleTestConnection(sendResponse);

                case 'fetchContacts':
                    return await handleFetchContacts(sendResponse);

                case 'updateHubspotPhone':
                    return await handleUpdateHubspotPhone(request.data, sendResponse);

                case 'createHubSpotContact':
                    return await handleCreateHubSpotContact(request.data, sendResponse);

                case 'saveWhatsAppMessagesToHubspot':
                    return await handleSaveWhatsAppMessages(request.data, sendResponse);

                default:
                    return sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    })();
    return true;
});

async function handleSaveWhatsAppMessages(data, sendResponse) {
    try {
        const { messages, contactId } = data;

        if (!contactId) throw new Error("No HubSpot contact ID provided");
        if (!Array.isArray(messages) || !messages.length) throw new Error("No messages provided");

        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("No HubSpot API key found");

        const results = [];

        for (const msg of messages) {
            const payload = {
                engagement: {
                    active: true,
                    type: "NOTE",
                    timestamp: new Date(msg.timestamp).getTime() || Date.now()
                },
                associations: {
                    contactIds: [contactId]
                },
                metadata: {
                    body: msg.msgHTML 
                }
            };

            const response = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            results.push(result);

            if (!response.ok) throw new Error(`Failed to save message from ${msg.sender}`);
        }

        const contactRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        if (!contactRes.ok) throw new Error("Failed to fetch contact details");

        const contactData = await contactRes.json();

        sendResponse({ success: true, data: { contact: contactData, engagements: results } });

    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function getHubspotContactId(sender) {
    const { hubspotApiKey: apiKey } = await getConfig();
    if (!apiKey) throw new Error("No HubSpot API key found");
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: "phone", operator: "EQ", value: sender }] }],
            properties: ["firstname", "lastname", "phone"],
            limit: 1
        })
    });

    const data = await response.json();
    return data.results?.[0]?.id || null;
}

async function handleTestConnection(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error('API key not configured');

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (!response.ok) throw new Error('Invalid API key or connection failed');
        sendResponse({ success: true, data: { status: 'connected' } });
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
            const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone${after ? `&after=${after}` : ''}`;
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

async function handleCreateHubSpotContact(data, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ properties: data })
        });
        const result = await res.json();
        sendResponse({ success: true, data: result });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function getContactDetails(contactId, apiKey) {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone`, {
        headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch contact ${contactId}`);
    const data = await res.json();
    return data.properties;
}

async function getConfig() {
    return new Promise(resolve => chrome.storage.sync.get(['hubspotApiKey'], resolve));
}