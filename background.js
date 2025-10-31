chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.action) {
                case 'syncMessage':
                    return sendResponse({ success: false, error: 'Contact syncing is temporarily disabled.' });

                case 'testConnection':
                    return await handleTestConnection(sendResponse);

                case 'fetchContacts':
                    return await handleFetchContacts(request.data, sendResponse);

                case 'updateHubspotPhone':
                    return await handleUpdateHubspotPhone(request.data, sendResponse);

                case 'createHubSpotContact':
                    return await handleCreateHubSpotContact(request.data, sendResponse);

                case 'saveWhatsAppMessagesToHubspot':
                    return await handleSaveWhatsAppMessages(request.data, sendResponse);

                case 'fetchDropdownOptions':
                    return await handleFetchDropdownOptions(sendResponse);

                case 'unlinkAndFetch':
                    return await handleUnlinkAndFetch(request.contactId, request.contactPhone, sendResponse);
                
                case 'fetchallContacts':
                    return await handlefetchallContacts(sendResponse);
                    
                default:
                    return sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    })();
    return true;
});

async function handlefetchallContacts(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        const properties = ["firstname", "lastname", "phone"];
        const propsQuery = properties.join(",");
        let allContacts = [];
        let after;
        let hasMore = true;

        while (hasMore) {
            const res = await fetch(
                `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=${propsQuery}${after ? `&after=${after}` : ""}`,
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);

            const data = await res.json();
            allContacts = allContacts.concat(data.results.map(c => ({
                id: c.id,
                firstname: c.properties?.firstname || "",
                lastname: c.properties?.lastname || "",
                phone: c.properties?.phone || ""
            })));
            after = data.paging?.next?.after;
            hasMore = !!after;
        }

        sendResponse({ success: true, contacts: allContacts });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleUnlinkAndFetch(contactId, contactPhone, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const historyRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?propertiesWithHistory=phone`,
            { headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" } }
        );
        if (!historyRes.ok) throw new Error(`Failed to fetch phone history: ${historyRes.status}`);
        const historyData = await historyRes.json();
        const phoneHistory = historyData.propertiesWithHistory?.phone || [];
        const secondPhoneValue = phoneHistory[1]?.value;

        if (secondPhoneValue) {
            const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ properties: { phone: secondPhoneValue } })
            });
            if (!updateRes.ok) throw new Error(`Phone update failed: ${updateRes.status}`);
            console.log(`Updated contact ${contactId} phone → ${secondPhoneValue}`);
        }

        const searchBody = {
            filterGroups: [{
                filters: [{
                    propertyName: "phone",
                    operator: "EQ",
                    value: contactPhone
                }]
            }],
            properties: ["firstname", "lastname", "email", "phone", "company", "jobtitle", "lifecyclestage", "hs_lead_status", "hubspot_owner_id"],
            limit: 1
        };

        const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(searchBody)
        });
        if (!searchRes.ok) throw new Error(`Failed to fetch contact by phone: ${searchRes.status}`);
        const searchData = await searchRes.json();
        const contact = searchData.results?.[0];
        if (!contact) throw new Error("No contact found for this phone number");

        contact.properties.lastname = contact.properties.lastname || "";

        const ownerId = contact.properties.hubspot_owner_id;
        if (ownerId) {
            try {
                const ownerRes = await fetch(`https://api.hubapi.com/owners/v2/owners/${ownerId}`, {
                    headers: { "Authorization": `Bearer ${apiKey}` }
                });
                if (ownerRes.ok) {
                    const owner = await ownerRes.json();
                    contact.ownerName = `${owner.firstName || ""} ${owner.lastName || ""}`.trim() || "~";
                } else contact.ownerName = "~";
            } catch {
                contact.ownerName = "~";
            }
        } else contact.ownerName = "~";

        sendResponse({ success: true, phoneHistory, contact });

    } catch (err) {
        console.error("handleUnlinkAndFetch error:", err.message);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchDropdownOptions(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key / Access Token not configured");

        const ownersRes = await fetch("https://api.hubapi.com/crm/v3/owners", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!ownersRes.ok) {
            const errorData = await ownersRes.json();
            throw new Error(`Failed to fetch owners: ${errorData.message || ownersRes.status}`);
        }

        const ownersDataRaw = await ownersRes.json();
        const ownersData = Array.isArray(ownersDataRaw.results) ? ownersDataRaw.results : [];

        const contactOwners = ownersData.map(o => ({
            value: o.id,
            label: `${o.firstName || ""} ${o.lastName || ""}`.trim()
        }));

        const lifecycleStages = [
            { value: "subscriber", label: "Subscriber" },
            { value: "lead", label: "Lead" },
            { value: "marketingqualifiedlead", label: "Marketing Qualified Lead" },
            { value: "salesqualifiedlead", label: "Sales Qualified Lead" },
            { value: "opportunity", label: "Opportunity" },
            { value: "customer", label: "Customer" },
            { value: "evangelist", label: "Evangelist" },
            { value: "other", label: "Other" }
        ];
        const leadStatuses = [
            { value: "NEW", label: "New" },
            { value: "OPEN", label: "Open" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "OPEN_DEAL", label: "Open Deal" },
            { value: "UNQUALIFIED", label: "Unqualified" },
            { value: "ATTEMPTED_TO_CONTACT", label: "Attempted to Contact" },
            { value: "CONNECTED", label: "Connected" },
            { value: "BAD_TIMING", label: "Bad Timing" }
        ];

        console.log("Contact Owners ready for dropdown:", contactOwners);

        sendResponse({ success: true, contactOwners, lifecycleStages, leadStatuses });
    } catch (err) {
        console.error("Error in handleFetchDropdownOptions:", err);
        sendResponse({ success: false, error: err.message });
    }
}

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

        const contactRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`,
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!contactRes.ok) throw new Error("Failed to fetch contact details");
        const contactData = await contactRes.json();

        if (contactData.properties.hubspot_owner_id) {
            const ownerRes = await fetch(
                `https://api.hubapi.com/crm/v3/owners/${contactData.properties.hubspot_owner_id}`,
                {
                    headers: { "Authorization": `Bearer ${apiKey}` }
                }
            );
            if (ownerRes.ok) {
                const ownerData = await ownerRes.json();
                contactData.ownerName = ownerData.firstName + " " + ownerData.lastName;
            } else {
                contactData.ownerName = null;
            }
        } else {
            contactData.ownerName = null;
        }

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

async function handleFetchContacts(data, sendResponse) {
  try {
    const cleanPhone = data;
    const { hubspotApiKey: apiKey } = await getConfig();
    if (!apiKey) throw new Error("API key not configured");

    const props = [
      "firstname", "lastname", "email", "phone", "company",
      "jobtitle", "lifecyclestage", "hs_lead_status", "hubspot_owner_id"
    ];

    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            filterGroups: [{
            filters: [{
                propertyName: "phone",
                operator: "CONTAINS_TOKEN",
                value: cleanPhone
            }]
            }],
            properties: props,
            limit: 1
        })
    });

    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const contact = (await res.json()).results?.[0];
    if (!contact) return sendResponse({ success: true, contacts: [] });

    const ownersRes = await fetch("https://api.hubapi.com/crm/v3/owners", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const owners = await ownersRes.json();

    const ownerMap = Object.fromEntries(
      (owners.results || []).map(o => [
        o.id,
        o.firstName ? `${o.firstName} ${o.lastName || ""}`.trim() : o.email || "Unknown Owner"
      ])
    );

    contact.properties.ownerName = ownerMap[contact.properties?.hubspot_owner_id] || "Unassigned";

    sendResponse({ success: true, contacts: [contact] });

  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleUpdateHubspotPhone(data, sendResponse) {
    try {
        const { whatsappContact, hubspotContactIds } = data;
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        const results = await Promise.all(
            hubspotContactIds.map(async (hubId) => {
               
                await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubId}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ properties: { phone: whatsappContact.phone } }),
                });
                const contactRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${hubId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`,
                    {
                        headers: { "Authorization": `Bearer ${apiKey}` },
                    }
                );

                if (!contactRes.ok) throw new Error("Failed to fetch contact details");
                const contactData = await contactRes.json();

                const ownerId = contactData.properties.hubspot_owner_id;
                if (ownerId) {
                    try {
                        const ownerRes = await fetch(
                            `https://api.hubapi.com/crm/v3/owners/${ownerId}`,
                            { headers: { "Authorization": `Bearer ${apiKey}` } }
                        );
                        if (ownerRes.ok) {
                            const ownerData = await ownerRes.json();
                            contactData.ownerName = `${ownerData.firstName || ""} ${ownerData.lastName || ""}`.trim() || "~";
                        } else {
                            contactData.ownerName = "~";
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch owner for ${ownerId}:`, err.message);
                        contactData.ownerName = "~";
                    }
                } else {
                    contactData.ownerName = "~";
                }

                if (!contactData.properties.lastname) contactData.properties.lastname = "";

                return { hubspotId: hubId, updatedContact: contactData };
            })
        );

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

        const contactResult = await res.json();

        if (!contactResult.id) {
            return sendResponse({ success: false, error: contactResult });
        }

        let ownerName = null;
        const ownerId = contactResult.properties?.hubspot_owner_id;

        if (ownerId) {
            const ownerRes = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });

            const ownerData = await ownerRes.json();
            ownerName = ownerData?.firstName
                ? `${ownerData.firstName} ${ownerData.lastName || ""}`.trim()
                : ownerData?.email || null;
        }
        sendResponse({
            success: true,
            data: {
                ...contactResult,
                ownerName: ownerName || "Unknown Owner"
            }
        });

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