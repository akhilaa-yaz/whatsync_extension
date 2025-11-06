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
                case 'saveNoteToHubspot':
                    return await handleSaveNoteToHubspot(request.data, sendResponse);
                case 'fetchNotesFromHubspot':
                    return await handleFetchNotesFromHubspot(request.contactId, sendResponse);
                case 'fetchHubspotPipelines':
                    return await handleFetchHubspotPipelines(sendResponse);
                case 'fetchDealStages':
                    return await handleFetchDealStages(request.pipelineId, sendResponse);
                case 'fetchDealOwners':
                    return await handleFetchDealOwners(sendResponse);
                case 'fetchDealTypes':
                    return await handleFetchDealTypes(sendResponse);
                case "fetchHubspotContacts":
                    return await handleFetchHubspotContacts(sendResponse);
                case "fetchHubspotCompanies":
                    return await handleFetchHubspotCompanies(sendResponse);
                case "createHubspotDeal":
                    return await handleCreateHubspotDeal(request.data, sendResponse);
                case "fetchDealsByContact":
                    return await handleFetchDealsByContact(request.contactId, sendResponse);
                case "fetchTicketStatuses":
                    return await handleFetchTicketStatuses(sendResponse);
                case "fetchTicketSources":
                    return await handleFetchTicketSources(sendResponse);
                default:
                    return sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    })();
    return true;
});

// -------------------- Helper Functions --------------------

async function getConfig() {
    return new Promise(resolve => chrome.storage.sync.get(['hubspotApiKey'], resolve));
}

async function handleFetchTicketStatuses(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        const res = await fetch("https://api.hubapi.com/crm/v3/properties/tickets/status", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch ticket statuses: ${res.status}`);
        const data = await res.json();
        const options = (data.options || []).map(o => ({ id: o.value, label: o.label }));
        sendResponse({ success: true, options });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchTicketSources(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        const res = await fetch("https://api.hubapi.com/crm/v3/properties/tickets/source", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch ticket sources: ${res.status}`);
        const data = await res.json();
        const options = (data.options || []).map(o => ({ id: o.value, label: o.label }));
        sendResponse({ success: true, options });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchDealsByContact(contactId, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");
        if (!contactId) throw new Error("Contact ID not provided");

        // HubSpot CRM API: search deals associated with contact
        const res = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/search`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filterGroups: [{
                        filters: [{
                            propertyName: "associations.contact",
                            operator: "EQ",
                            value: contactId
                        }]
                    }],
                    properties: ["dealname", "amount", "dealstage", "pipeline", "closedate", "dealtype"],
                    limit: 50
                })
            }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch deals: ${res.status} - ${text}`);
        }

        const data = await res.json();
        const deals = (data.results || []).map(d => ({
            id: d.id,
            ...d.properties
        }));

        sendResponse({ success: true, deals });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleCreateHubspotDeal(data, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const closedateMs = new Date(data.closeDate).getTime();

        // Step 1: Create the deal
        const dealPayload = {
            properties: {
                dealname: data.dealName,
                pipeline: data.pipelineId,
                dealstage: data.stageId,
                amount: data.amount,
                closedate: closedateMs,
                hubspot_owner_id: data.ownerId,
                dealtype: data.dealType
                // priority: data.priority // uncomment if valid in your portal
            }
        };

        const dealRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${apiKey}` 
            },
            body: JSON.stringify(dealPayload)
        });

        if (!dealRes.ok) {
            const text = await dealRes.text();
            throw new Error(`Failed to create deal: ${dealRes.status} - ${text}`);
        }

        const dealResult = await dealRes.json();
        const dealId = dealResult.id;

        // Step 2: Associate deal with the primary contact (Selcontact)
        if (data.Selcontact) {
            const primaryAssocRes = await fetch(
                `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${data.Selcontact}/deal_to_contact`,
                { method: "PUT", headers: { "Authorization": `Bearer ${apiKey}` } }
            );
            if (!primaryAssocRes.ok) {
                const text = await primaryAssocRes.text();
                console.warn(`Deal created, but failed to associate with primary contact: ${text}`);
            }
        }

        // Step 3: Optionally associate with another contact
        if (data.contactId) {
            await fetch(
                `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${data.contactId}/deal_to_contact`,
                { method: "PUT", headers: { "Authorization": `Bearer ${apiKey}` } }
            );
        }

        // Step 4: Optionally associate with company
        if (data.companyId) {
            await fetch(
                `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/companies/${data.companyId}/deal_to_company`,
                { method: "PUT", headers: { "Authorization": `Bearer ${apiKey}` } }
            );
        }

        sendResponse({ success: true, data: dealResult });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchHubspotCompanies(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch(
            "https://api.hubapi.com/crm/v3/objects/companies?properties=name,domain,industry&limit=100",
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch companies: ${res.status} - ${text}`);
        }

        const data = await res.json();
        const companies = (data.results || []).map(c => ({
            id: c.id,
            name:
                c.properties.name ||
                c.properties.domain ||
                "Unnamed Company"
        }));

        sendResponse({ success: true, companies });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchHubspotContacts(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch(
            "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email&limit=100",
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch contacts: ${res.status} - ${text}`);
        }

        const data = await res.json();
        const contacts = (data.results || []).map(c => ({
            id: c.id,
            name:
                (c.properties.firstname || "") +
                " " +
                (c.properties.lastname || "") +
                (c.properties.email ? ` (${c.properties.email})` : "")
        }));

        sendResponse({ success: true, contacts });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchDealTypes(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch("https://api.hubapi.com/crm/v3/properties/deals/dealtype", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.ok) throw new Error("Failed to fetch deal types");

        const data = await res.json();
        const dealTypes = (data.options || []).map(opt => ({
            id: opt.value,
            name: opt.label
        }));

        sendResponse({ success: true, dealTypes });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchDealOwners(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch("https://api.hubapi.com/crm/v3/owners", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.ok) throw new Error("Failed to fetch deal owners");

        const data = await res.json();
        const owners = (data.results || []).map(o => ({
            id: o.id,
            name: `${o.firstName || ""} ${o.lastName || ""}`.trim() || o.email
        }));

        sendResponse({ success: true, owners });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchDealStages(pipelineId, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");
        if (!pipelineId) throw new Error("Pipeline ID not provided");

        const res = await fetch(`https://api.hubapi.com/crm/v3/pipelines/deals/${pipelineId}`, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.ok) {
            const text = await res.text();
            if (res.status === 403) throw new Error("Access forbidden: check your Private App token and scopes");
            throw new Error(`Failed to fetch deal stages: ${res.status} - ${text}`);
        }

        const data = await res.json();
        const stages = (data.stages || []).map(stage => ({
            id: stage.id,
            label: stage.label,
            probability: stage.probability
        }));

        sendResponse({ success: true, stages });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchHubspotPipelines(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch("https://api.hubapi.com/crm/v3/pipelines/deals", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Pipeline fetch failed:", res.status, text);
            throw new Error(`Failed to fetch pipelines: ${res.status}`);
        }

        const data = await res.json();
        const pipelines = (data.results || []).map(p => ({
            id: p.id,
            name: p.label
        }));

        sendResponse({ success: true, pipelines });
    } catch (err) {
        console.error(err);
        sendResponse({ success: false, error: err.message });
    }
}



async function handleFetchNotesFromHubspot(contactId, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch(
            `https://api.hubapi.com/engagements/v1/engagements/associated/contact/${contactId}/paged`,
            { headers: { "Authorization": `Bearer ${apiKey}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch notes");

        const data = await res.json();
        const notes = (data.results || [])
            .filter(e => e.engagement?.type === "NOTE")
            .map(e => ({
                note: e.metadata?.body || "",
                timestamp: e.engagement?.timestamp || ""
            }));

        sendResponse({ success: true, data: notes });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleSaveNoteToHubspot({ contactId, note, timestamp }, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("No HubSpot API key found");
        if (!contactId) throw new Error("No HubSpot contact ID provided");

        const payload = {
            engagement: {
                active: true,
                type: "NOTE",
                timestamp: new Date(timestamp).getTime()
            },
            associations: { contactIds: [contactId] },
            metadata: { body: note }
        };

        const res = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Failed to save note: ${res.status}`);
        const result = await res.json();
        sendResponse({ success: true, data: result });

    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function fetchOwnerName(ownerId, apiKey) {
    if (!ownerId) return "Unassigned";
    try {
        const res = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (!res.ok) return "Unassigned";
        const data = await res.json();
        return data.firstName ? `${data.firstName} ${data.lastName || ""}`.trim() : data.email || "Unassigned";
    } catch {
        return "Unassigned";
    }
}

async function attachOwnerName(contact, apiKey) {
    if (!contact?.properties) return contact;
    contact.ownerName = await fetchOwnerName(contact.properties.hubspot_owner_id, apiKey);
    return contact;
}

async function fetchContactByPhone(phone, properties = ["firstname", "lastname", "phone"], apiKey) {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: "phone", operator: "EQ", value: phone }] }],
            properties,
            limit: 1
        })
    });
    if (!res.ok) throw new Error(`Failed to fetch contact by phone: ${res.status}`);
    const data = await res.json();
    return data.results?.[0] || null;
}

// -------------------- Action Handlers --------------------

async function handleTestConnection(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error('API key not configured');

        const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Invalid API key or connection failed');

        sendResponse({ success: true, data: { status: 'connected' } });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

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

async function handleFetchDropdownOptions(sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key / Access Token not configured");

        const res = await fetch("https://api.hubapi.com/crm/v3/owners", {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error("Failed to fetch owners");

        const data = await res.json();
        const contactOwners = (data.results || []).map(o => ({
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

        sendResponse({ success: true, contactOwners, lifecycleStages, leadStatuses });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleUnlinkAndFetch(contactId, contactPhone, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("HubSpot API key not configured");

        const res = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?propertiesWithHistory=phone`,
            { headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" } }
        );
        if (!res.ok) throw new Error(`Failed to fetch phone history: ${res.status}`);
        const data = await res.json();
        const phoneHistory = data.propertiesWithHistory?.phone || [];

        if (phoneHistory[1]?.value) {
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ properties: { phone: phoneHistory[1].value } })
            });
        }

        const contact = await fetchContactByPhone(contactPhone, ["firstname","lastname","email","phone","company","jobtitle","lifecyclestage","hs_lead_status","hubspot_owner_id"], apiKey);
        if (!contact) throw new Error("No contact found for this phone number");
        if (!contact.properties.lastname) contact.properties.lastname = "";

        await attachOwnerName(contact, apiKey);

        sendResponse({ success: true, phoneHistory, contact });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleFetchContacts(phone, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        const props = ["firstname","lastname","email","phone","company","jobtitle","lifecyclestage","hs_lead_status","hubspot_owner_id"];
        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                filterGroups: [{ filters: [{ propertyName: "phone", operator: "CONTAINS_TOKEN", value: phone }] }],
                properties: props,
                limit: 1
            })
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const contact = (await res.json()).results?.[0];
        if (!contact) return sendResponse({ success: true, contacts: [] });

        await attachOwnerName(contact, apiKey);
        sendResponse({ success: true, contacts: [contact] });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleUpdateHubspotPhone({ whatsappContact, hubspotContactIds }, sendResponse) {
    try {
        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("API key not configured");

        const results = await Promise.all(hubspotContactIds.map(async hubId => {
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ properties: { phone: whatsappContact.phone } })
            });

            const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`, {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            if (!res.ok) throw new Error("Failed to fetch contact details");

            const contactData = await res.json();
            if (!contactData.properties.lastname) contactData.properties.lastname = "";
            await attachOwnerName(contactData, apiKey);

            return { hubspotId: hubId, updatedContact: contactData };
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
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ properties: data })
        });
        const contactResult = await res.json();
        if (!contactResult.id) return sendResponse({ success: false, error: contactResult });

        await attachOwnerName(contactResult, apiKey);
        sendResponse({ success: true, data: contactResult });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleSaveWhatsAppMessages({ messages, contactId }, sendResponse) {
    try {
        if (!contactId) throw new Error("No HubSpot contact ID provided");
        if (!messages || !messages.length) throw new Error("No messages provided");

        const { hubspotApiKey: apiKey } = await getConfig();
        if (!apiKey) throw new Error("No HubSpot API key found");

        const results = [];
        for (const msg of messages) {
            const payload = {
                engagement: { active: true, type: "NOTE", timestamp: new Date(msg.timestamp).getTime() || Date.now() },
                associations: { contactIds: [contactId] },
                metadata: { body: msg.msgHTML }
            };
            const res = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Failed to save message from ${msg.sender}`);
            results.push(await res.json());
        }

        const contactRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,hs_lead_status,hubspot_owner_id`, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (!contactRes.ok) throw new Error("Failed to fetch contact details");
        const contactData = await contactRes.json();

        await attachOwnerName(contactData, apiKey);

        sendResponse({ success: true, data: { contact: contactData, engagements: results } });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}