// Create or update HubSpot contact
async function createOrUpdateContact(apiKey, contactName) {
  const url = `https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/${encodeURIComponent(contactName)}@example.com/?hapikey=${apiKey}`;
  const body = {
    properties: [
      { property: "email", value: `${contactName.replace(/\s+/g,'').toLowerCase()}@example.com` },
      { property: "firstname", value: contactName }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data.vid; // contact ID
}

// Log message as engagement/note
async function logMessage(apiKey, contactId, messageText, timestamp) {
  const url = `https://api.hubapi.com/engagements/v1/engagements?hapikey=${apiKey}`;
  const body = {
    engagement: {
      active: true,
      type: "NOTE",
      timestamp: new Date(timestamp).getTime()
    },
    associations: {
      contactIds: [contactId]
    },
    metadata: {
      body: messageText
    }
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
