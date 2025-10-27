console.log("WhatsApp–HubSpot navbar injector active");

["https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css", chrome.runtime.getURL("hubspot.css")].forEach(href => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
});

const NAVBAR_HEIGHT = 50;

function addHubspotNavbar() {
  const appRoot = document.getElementById("app") || document.querySelector("#app");

  if (appRoot && !document.getElementById("hubspot-navbar")) {
    const navbar = document.createElement("div");
    navbar.id = "hubspot-navbar";
    navbar.style.position = "fixed";
    navbar.style.top = "0";
    navbar.style.left = "0";
    navbar.style.width = "100vw";
    navbar.style.overflow = "hidden";
    navbar.style.height = `${NAVBAR_HEIGHT}px`;
    navbar.style.backgroundColor = "rgb(40, 40, 40)";
    navbar.style.display = "flex";
    navbar.style.alignItems = "center";
    navbar.style.justifyContent = "space-between";
    navbar.style.padding = "0 20px";
    navbar.style.zIndex = "9999";
    navbar.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

    navbar.innerHTML = `
    <div style="
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 3rem;
    ">
        <span style="font-size: 22px; color: #eb6a00; cursor: pointer;" id="checkOpenchat"><i class="fa-brands fa-hubspot fa-lg" style="color: #eb6a00;"></i></span>
    </div>
    `;       

    document.body.appendChild(navbar);
    
    const app = document.getElementById("app");
    if (!app) return;
    const observer = new MutationObserver(() => {
        if (app.style.top !== `${NAVBAR_HEIGHT}px`) {
        app.style.position = "absolute";
        app.style.top = `${NAVBAR_HEIGHT}px`;
        app.style.isolation = "isolate";
        }
    });

  observer.observe(app, { attributes: true, childList: true, subtree: true });

    const sidebar = document.createElement("div");
    sidebar.id = "hubspot-sidebar";
    Object.assign(sidebar.style, {
    position: "fixed",
    top: `${NAVBAR_HEIGHT}px`,
    right: "0",
    width: "350px",
    height: "90vh",
    backgroundColor: "rgb(40 40 40)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "25px",
    boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
    zIndex: "9999",
    color: "#fff",
    display: "none"
    });
    document.body.appendChild(sidebar);


    const Openchat = document.getElementById("checkOpenchat");

    let content = "";

    Openchat.addEventListener("click", function() {
        sidebar.style.display = "flex";
        sidebar.innerHTML = "";
        const maindiv = document.getElementById("main");        
        if(!maindiv){
            const topMessage = document.createElement("div");
            topMessage.innerText = "NO Chat Selected";
            topMessage.style.fontWeight = "bold";
            topMessage.style.fontSize = "16px";
            topMessage.style.textAlign = "center";

            const bottomMessage = document.createElement("div");
            bottomMessage.innerHTML = `<span><i class="fa-solid fa-circle-info" style="margin-right:5px;"></i></span> Select a chat to view HubSpot Profile`;
            bottomMessage.style.fontSize = "14px";
            bottomMessage.style.textAlign = "center";
            bottomMessage.style.marginTop = "auto";

            sidebar.appendChild(topMessage);
            sidebar.appendChild(bottomMessage);
            document.body.appendChild(sidebar);

        } else {

            sidebar.style.justifyContent = "flex-start"; 
            
            const title = document.createElement("div");
            title.className = "sidebar-title";
            title.innerText = "HubSpot Integration";
            sidebar.appendChild(title);

            const hr = document.createElement("hr");
            hr.className = "sidebar-hr";
            sidebar.appendChild(hr);

            const header = maindiv.querySelector("header");
            if (header && header.children.length >= 2) {
                const secondChild = header.children[1];
                const span = secondChild.querySelector('span[dir="auto"]');
                if (span) {
                content = span.innerHTML;
                }
            }

            chrome.runtime.sendMessage({ action: "fetchContacts" }, (response) => {
                if (response.success) {
                    const contacts = response.contacts;
                    const normalizedContent = content.replace(/\s+/g, "");

                    const matchedContact = contacts.find(contact => 
                        contact.properties.phone?.replace(/\s+/g, "") === normalizedContent
                    );   
                    if (matchedContact) {
                        const props = matchedContact.properties;
                        const sidebarr = document.getElementById("hubspot-sidebar");
                        const dropdown = document.createElement("div");
                        dropdown.id = "contactsDropdown";

                        function createHubSpotRow(leftLabel, leftValue, rightLabel, rightValue) {
                            const row = document.createElement("div");
                            row.className = "hubspot-row";

                            const colLeft = document.createElement("div");
                            colLeft.className = "col-left";
                            colLeft.innerHTML = `<div class="label">${leftLabel}</div><div class="value">${leftValue || "~"}</div>`;
                            row.appendChild(colLeft);
                            if (rightLabel) {
                                const colRight = document.createElement("div");
                                colRight.className = "col-right";
                                colRight.innerHTML = `<div class="label">${rightLabel}</div><div class="value">${rightValue || "~"}</div>`;
                                row.appendChild(colRight);
                            }
                            return row;
                        }
                        const nameRow = document.createElement("div");
                        nameRow.className = "hubspot-row";
                        const colLeftName = document.createElement("div");
                        colLeftName.className = "col-left";
                        colLeftName.innerHTML = `${(props.firstname || "")} ${(props.lastname || "")}`.trim() + ` <i class="fa-brands fa-hubspot fa-lg" style="color: #eb6a00;"></i>`;

                        const colRightName = document.createElement("div");
                        colRightName.className = "col-right justify-content-end";
                        colRightName.innerHTML = `Edit <i class="fa-solid fa-pen" style="color: #f56505; font-size:12px; padding-left: 5px"></i>`;

                        nameRow.appendChild(colLeftName);
                        nameRow.appendChild(colRightName);
                        dropdown.appendChild(nameRow);
                        dropdown.appendChild(createHubSpotRow("Company Name", props.company, "Job Title", props.jobtitle));
                        dropdown.appendChild(createHubSpotRow("Contact Owner", props.hubspot_owner_id, "Lifecycle Stage", props.lifecyclestage));
                        dropdown.appendChild(createHubSpotRow("Lead Status", props.hs_lead_status));

                        const unlinkRow = document.createElement("div");
                        unlinkRow.className = "hubspot-row unlink-contact-row";

                        const leftCol = document.createElement("div");
                        leftCol.className = "col-left";
                        leftCol.innerHTML = ""; 

                        const rightCol = document.createElement("div");
                        rightCol.className = "col-right justify-content-end";
                        rightCol.innerHTML = `<span class="value unlink-text">Unlink Contact</span>`;

                        unlinkRow.appendChild(leftCol);
                        unlinkRow.appendChild(rightCol);
                        dropdown.appendChild(unlinkRow);
                        sidebarr.appendChild(dropdown);
                    } else {      
                        const subtitle = document.createElement("div");
                        subtitle.className = "sidebar-subtitle";
                        subtitle.innerText = "Link or create HubSpot contact";
                        sidebar.appendChild(subtitle);

                        const horizontalDiv = document.createElement("div");
                        horizontalDiv.id = "btnwrap-sidebar";

                        const leftDiv = document.createElement("div");
                        leftDiv.className = "left-div";
                        leftDiv.innerText = content;

                        const rightDiv = document.createElement("div");
                        rightDiv.className = "right-div";
                        [
                            { html: '<i class="fa-solid fa-link"></i> Link', id: 'linkBtn' },
                            { html: '<i class="fa-solid fa-address-book"></i> Create', id: 'createBtn' }
                        ].forEach(item => {
                            const btn = document.createElement("button");
                            btn.id = item.id;
                            btn.innerHTML = item.html;
                            rightDiv.appendChild(btn);
                        });

                        horizontalDiv.appendChild(leftDiv);
                        horizontalDiv.appendChild(rightDiv);
                        sidebar.appendChild(horizontalDiv);

                        document.getElementById("linkBtn").addEventListener("click", () => {
                            chrome.runtime.sendMessage({ action: "fetchContacts" }, (response) => {
                                if (response.success) {
                                showDropdownInSidebar(response.contacts);
                                } else {
                                console.error("Error fetching contacts:", response.error);
                                }
                            });
                        });

                        function showDropdownInSidebar(contacts) {
                            const sidebarbtnwrap = document.getElementById("btnwrap-sidebar");
                            if (!sidebarbtnwrap) {
                                console.error("horizontalDiv not found!");
                                return;
                            }

                            const oldDropdown = document.getElementById("contactsDropdown");
                            if (oldDropdown) oldDropdown.remove();

                            const dropdown = document.createElement("div");
                            dropdown.id = "contactsDropdown";

                            const searchWrapper = document.createElement("div");
                            searchWrapper.className = "hubspot-dropdown-search-wrapper";
                            searchWrapper.innerHTML = `
                            <input type="text" class="hubspot-search-input" placeholder="Search contacts..." />
                            `;
                            dropdown.prepend(searchWrapper);

                            contacts.forEach((contact) => {
                                const item = document.createElement("label");
                                item.className = "hubspot-contact-item"; // for CSS
                                item.innerHTML = `
                                <input type="checkbox" value="${contact.id}" />
                                <span>${contact.properties.firstname || contact.properties.lastname 
                                    ? `${contact.properties.firstname || ""} ${contact.properties.lastname || ""}`.trim() 
                                    : contact.properties.email || "Unknown Contact"}</span>
                                `;
                                dropdown.appendChild(item);
                            });

                            const footer = document.createElement("div");
                            footer.className = "hubspot-dropdown-footer";
                            footer.innerHTML = `<button id="linkSelectedBtn">LINK</button>`;
                            dropdown.appendChild(footer);

                            sidebarbtnwrap.insertAdjacentElement("afterend", dropdown);

                            const searchInput = dropdown.querySelector("input");
                            searchInput.addEventListener("input", (e) => {
                                const filter = e.target.value.toLowerCase();
                                const items = dropdown.querySelectorAll(".hubspot-contact-item");
                                items.forEach(item => {
                                    const text = item.textContent.toLowerCase();
                                    item.style.display = text.includes(filter) ? "flex" : "none";
                                });
                            });

                            document.getElementById("linkSelectedBtn").addEventListener("click", () => {
                                const checkedContacts = Array.from(dropdown.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
                                if (!checkedContacts.length) return console.warn("No HubSpot contacts selected");
                                const header = maindiv.querySelector("header");
                                const nameSpan = header?.children[1]?.querySelector("span[dir='auto']");
                                const contactName = nameSpan ? nameSpan.innerText : "Unknown";

                                const phoneNumber = header?.querySelector("span[data-testid='user-phone']");
                                const Name = phoneNumber ? phoneNumber.innerText : "Unknown"; 

                                const dataToSync = {
                                    whatsappContact: {
                                        name: Name,
                                        phoneNumber: phoneNumber
                                    },
                                    hubspotContactIds: checkedContacts
                                };

                                chrome.runtime.sendMessage({ action: "updateHubspotPhone", data: dataToSync }, (response) => {
                                    if (!response) return console.error("No response from background script");
                                    if (response.success){
                                        console.log("HubSpot contacts updated!", response.data);
                                        const dropdown = document.getElementById("contactsDropdown");
                                        if (!dropdown) return;
                                        dropdown.innerHTML = "";
                                        const updatedContact = response.data[0].updatedContact;
                                        
                                        function createHubSpotRow(leftLabel, leftValue, rightLabel, rightValue) {
                                            const row = document.createElement("div");
                                            row.className = "hubspot-row";

                                            const colLeft = document.createElement("div");
                                            colLeft.className = "col-left";
                                            colLeft.innerHTML = `<div class="label">${leftLabel}</div><div class="value">${leftValue || "~"}</div>`;
                                            row.appendChild(colLeft);
                                            if (rightLabel) {
                                                const colRight = document.createElement("div");
                                                colRight.className = "col-right";
                                                colRight.innerHTML = `<div class="label">${rightLabel}</div><div class="value">${rightValue || "~"}</div>`;
                                                row.appendChild(colRight);
                                            }
                                            return row;
                                        }
                                        const nameRow = document.createElement("div");
                                        nameRow.className = "hubspot-row";
                                        const colLeftName = document.createElement("div");
                                        colLeftName.className = "col-left";
                                        colLeftName.innerHTML = `${(updatedContact.firstname || "")} ${(updatedContact.lastname || "")}`.trim() + ` <i class="fa-brands fa-hubspot fa-lg" style="color: #eb6a00;"></i>`;

                                        const colRightName = document.createElement("div");
                                        colRightName.className = "col-right justify-content-end";
                                        colRightName.innerHTML = `Edit <i class="fa-solid fa-pen" style="color: #f56505; font-size:12px; padding-left: 5px"></i>`;

                                        nameRow.appendChild(colLeftName);
                                        nameRow.appendChild(colRightName);
                                        dropdown.appendChild(nameRow);
                                        dropdown.appendChild(createHubSpotRow("Company Name", updatedContact.company, "Job Title", updatedContact.jobtitle));
                                        dropdown.appendChild(createHubSpotRow("Contact Owner", updatedContact.hubspot_owner_id, "Lifecycle Stage", updatedContact.lifecyclestage));
                                        dropdown.appendChild(createHubSpotRow("Lead Status", updatedContact.hs_lead_status));

                                        const unlinkRow = document.createElement("div");
                                        unlinkRow.className = "hubspot-row unlink-contact-row";

                                        const leftCol = document.createElement("div");
                                        leftCol.className = "col-left";
                                        leftCol.innerHTML = ""; 

                                        const rightCol = document.createElement("div");
                                        rightCol.className = "col-right justify-content-end";
                                        rightCol.innerHTML = `<span class="value unlink-text">Unlink Contact</span>`;

                                        unlinkRow.appendChild(leftCol);
                                        unlinkRow.appendChild(rightCol);

                                        document.getElementById("contactsDropdown").appendChild(unlinkRow);

                                    } else{ console.error("Failed to update HubSpot contacts:", response.error)};
                                });

                            });

                        }

                        document.getElementById("createBtn").addEventListener("click", () => {
                            const sidebar = document.getElementById("hubspot-sidebar");
                            sidebar.innerHTML = "";
                            const title = document.createElement("div");
                            title.className = "sidebar-title";
                            title.innerText = "Create Contact";
                            sidebar.appendChild(title);

                            const hr = document.createElement("hr");
                            hr.className = "sidebar-hr";
                            sidebar.appendChild(hr);

                            const form = document.createElement("form");
                            form.className = "create-contact-form";

                            function createInputRow(label, id, value = "", required = false) {
                                const row = document.createElement("div");
                                row.className = "form-row";

                                const labelEl = document.createElement("label");
                                labelEl.setAttribute("for", id);
                                labelEl.className = "form-label";
                                labelEl.textContent = label + (required ? " *" : "");

                                const input = document.createElement("input");
                                input.type = "text";
                                input.id = id;
                                input.value = value;
                                input.placeholder = label;
                                input.className = "form-input";
                                if (required) input.required = true;

                                row.appendChild(labelEl);
                                row.appendChild(input);
                                return row;
                            }

                            const phoneField = createInputRow("Phone Number", "phone", content.replace(/\s+/g, ""), true);
                            phoneField.querySelector("input").disabled = true;
                            form.appendChild(phoneField);
                            form.appendChild(createInputRow("First Name", "firstname", "", true));
                            form.appendChild(createInputRow("Last Name", "lastname"));
                            form.appendChild(createInputRow("Email", "email"));
                            form.appendChild(createInputRow("Company Name", "company"));
                            form.appendChild(createInputRow("Job Title", "jobtitle"));
                            form.appendChild(createInputRow("Contact Owner", "hubspot_owner_id"));
                            form.appendChild(createInputRow("Lifecycle Stage", "lifecyclestage"));
                            form.appendChild(createInputRow("Lead Status", "hs_lead_status"));

                            const btnRow = document.createElement("div");
                            btnRow.className = "form-btn-row";

                            const createBtn = document.createElement("button");
                            createBtn.className = "form-create-btn";
                            createBtn.textContent = "Create";

                            btnRow.appendChild(createBtn);
                            form.appendChild(btnRow);
                            sidebar.appendChild(form);

                            document.querySelector(".form-create-btn").addEventListener("click", async (e) => {
                                e.preventDefault();
                                const form = e.target.closest("form");
                                const formData = {};
                                form.querySelectorAll("input").forEach(input => {
                                    formData[input.id] = input.value;
                                });
                                chrome.runtime.sendMessage(
                                    { action: "createHubSpotContact", data: formData },
                                    (response) => {
                                        if (!response) {
                                            console.error("No response from background script");
                                            return;
                                        }
                                        if (response.success) {
                                            form.reset();
                                            const existingForm = document.querySelector(".create-contact-form");
                                            if (existingForm) existingForm.remove();

                                            const sidebar = document.getElementById("hubspot-sidebar");
                                            if (!sidebar) return;

                                            const contactsDropdown = document.createElement("div");
                                            contactsDropdown.id = "contactsDropdown";
                                            sidebar.appendChild(contactsDropdown);
                                            console.log("response.success", response.success)

                                            const updatedContact = response.data; // <-- use this

                                            function createHubSpotRow(leftLabel, leftValue, rightLabel, rightValue) {
                                                const row = document.createElement("div");
                                                row.className = "hubspot-row";

                                                const colLeft = document.createElement("div");
                                                colLeft.className = "col-left";
                                                colLeft.innerHTML = `<div class="label">${leftLabel}</div><div class="value">${leftValue || "~"}</div>`;
                                                row.appendChild(colLeft);

                                                if (rightLabel) {
                                                    const colRight = document.createElement("div");
                                                    colRight.className = "col-right";
                                                    colRight.innerHTML = `<div class="label">${rightLabel}</div><div class="value">${rightValue || "~"}</div>`;
                                                    row.appendChild(colRight);
                                                }
                                                return row;
                                            }

                                            const nameRow = document.createElement("div");
                                            nameRow.className = "hubspot-row";

                                            const colLeftName = document.createElement("div");
                                            colLeftName.className = "col-left";
                                            colLeftName.innerHTML = `${(updatedContact.properties.firstname || "")} ${(updatedContact.properties.lastname || "")}`.trim() +
                                                                    ` <i class="fa-brands fa-hubspot fa-lg" style="color: #eb6a00;"></i>`;

                                            const colRightName = document.createElement("div");
                                            colRightName.className = "col-right justify-content-end";
                                            colRightName.innerHTML = `Edit <i class="fa-solid fa-pen" style="color: #f56505; font-size:12px; padding-left: 5px"></i>`;

                                            nameRow.appendChild(colLeftName);
                                            nameRow.appendChild(colRightName);
                                            contactsDropdown.appendChild(nameRow);

                                            contactsDropdown.appendChild(createHubSpotRow("Company Name", updatedContact.properties.company, "Job Title", updatedContact.properties.jobtitle));
                                            contactsDropdown.appendChild(createHubSpotRow("Contact Owner", updatedContact.properties.hubspot_owner_id, "Lifecycle Stage", updatedContact.properties.lifecyclestage));
                                            contactsDropdown.appendChild(createHubSpotRow("Lead Status", updatedContact.properties.hs_lead_status));

                                            const unlinkRow = document.createElement("div");
                                            unlinkRow.className = "hubspot-row unlink-contact-row";

                                            const leftCol = document.createElement("div");
                                            leftCol.className = "col-left";
                                            leftCol.innerHTML = "";

                                            const rightCol = document.createElement("div");
                                            rightCol.className = "col-right justify-content-end";
                                            rightCol.innerHTML = `<span class="value unlink-text">Unlink Contact</span>`;

                                            unlinkRow.appendChild(leftCol);
                                            unlinkRow.appendChild(rightCol);

                                            contactsDropdown.appendChild(unlinkRow);
                                            
                                        } else {
                                            console.error("Failed to create HubSpot contact:", response.error);
                                        }
                                    }
                                );
                            });
                        });
                    }  
                } else {
                console.error("Error fetching contacts:", response.error);
                }
            });    
        }
    });
  }
}

const observernew = new MutationObserver(() => {
  if (document.getElementById("app")) {
    addHubspotNavbar();
    observernew.disconnect();
  }
});

observernew.observe(document, { childList: true, subtree: true });

let lastProcessedMessages = new Set();

// Observer to detect new messages
const observer = new MutationObserver(async (mutations) => {
  const config = await chrome.storage.sync.get(['autoSync']);
  
  if (!config.autoSync) return;

  // Detect new messages in the current chat
  const messages = document.querySelectorAll('[data-id^="false_"]');
  
  messages.forEach(async (msgElement) => {
    const messageId = msgElement.getAttribute('data-id');
    
    if (lastProcessedMessages.has(messageId)) return;
    lastProcessedMessages.add(messageId);

    const messageData = extractMessageData(msgElement);
    
    if (messageData && messageData.message) {
      try {
        await chrome.runtime.sendMessage({
          action: 'syncMessage',
          data: messageData
        });
        console.log('Message synced to HubSpot:', messageData);
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  });
});

function extractMessageData(messageElement) {
  try {
    // Extract contact name/number from header
    const headerElement = document.querySelector('[data-tab="6"] span[dir="auto"]');
    console.log('headerElement', headerElement);
    const contactName = headerElement?.textContent.trim();
    
    // Extract phone number (this is simplified - actual implementation may vary)
    const phoneNumber = contactName; // In production, extract actual phone number
    
    // Extract message text
    const messageText = messageElement.querySelector('.selectable-text')?.textContent || '';
    
    // Extract timestamp
    const timeElement = messageElement.querySelector('[data-testid="msg-meta"]');
    const timestamp = new Date().toISOString();
    
    // Determine if incoming or outgoing
    const isOutgoing = messageElement.classList.contains('message-out');
    
    return {
      phoneNumber: phoneNumber,
      sender: isOutgoing ? 'You' : contactName,
      message: messageText,
      timestamp: timestamp,
      direction: isOutgoing ? 'outgoing' : 'incoming'
    };
  } catch (error) {
    console.error('Error extracting message data:', error);
    return null;
  }
}

// Start observing
function startObserving() {
  const chatContainer = document.querySelector('#main');
  
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
    console.log('WhatsApp HubSpot Sync: Started monitoring messages');
  } else {
    setTimeout(startObserving, 1000);
  }
}

startObserving();

// Add sync button to WhatsApp interface
function addSyncButton() {
  const header = document.querySelector('[data-testid="conversation-info-header"]');
  
  if (header && !document.getElementById('hubspot-sync-btn')) {
    const syncBtn = document.createElement('button');
    syncBtn.id = 'hubspot-sync-btn';
    syncBtn.textContent = '📊 Sync to HubSpot';
    syncBtn.style.cssText = `
      margin-left: 10px;
      padding: 5px 10px;
      background: #ff7a59;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    `;
    
    syncBtn.addEventListener('click', async () => {
      const messages = document.querySelectorAll('[data-id^="false_"]');
      let syncCount = 0;
      
      for (const msg of messages) {
        const data = extractMessageData(msg);
        if (data) {
          try {
            await chrome.runtime.sendMessage({ action: 'syncMessage', data });
            syncCount++;
          } catch (error) {
            console.error('Sync failed:', error);
          }
        }
      }
      
      alert(`Synced ${syncCount} messages to HubSpot!`);
    });
    
    header.appendChild(syncBtn);
  }
}

setInterval(addSyncButton, 2000);
