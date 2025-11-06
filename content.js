function addHubspotNavbar(){
    const appRoot = document.getElementById("app") || document.querySelector("#app");
    if (appRoot && !document.getElementById("hubspot-navbar")) {
        const navbar = document.createElement("div");
        navbar.id = "hubspot-navbar";
        navbar.innerHTML = `
            <div class="nav-wrapper">
                <ul class="toolbar">
                    <li class="inbox toolbar-item active">
                        <span class="icon">
                        <span class="icon">&#128229;</span>
                        </span>
                        <span class="text">Inbox</span>
                    </li>
                    <li class="starred toolbar-item">
                        <span class="icon">&#11088;</span>
                        <span class="text">Starred</span>
                    </li>
                    <li class="unread toolbar-item">
                        <span class="icon">&#128064;</span>
                        <span class="text">Unread</span>
                    </li>
                    
                    <li class="closed toolbar-item">
                        <span class="icon">&#128230;</span>
                        <span class="text">Closed</span>
                    </li>
                    
                    <li class="snoozed toolbar-item">
                        <span class="icon">&#128337;</span>
                        <span class="text">Snoozed</span>
                    </li>
                    
                    <li class="followUp toolbar-item">
                        <span class="icon">&#128203;</span>
                        <span class="text">Follow Up</span>
                    </li>
                    <div class="divider"></div>        
                    <li class="addItem toolbar-item add-btn">
                        <span><i class="fa-solid fa-plus" style="color: #ffffff;"></i></span>
                    </li>
                </ul>
                <div class="nav-inner">
                <ul class="toolbar">
                <li class="toolbar-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="2">
                        <line x1="4" y1="6" x2="20" y2="6"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="18" x2="20" y2="18"></line>
                        <circle cx="8" cy="6" r="2"></circle>
                        <circle cx="16" cy="12" r="2"></circle>
                        <circle cx="12" cy="18" r="2"></circle>
                    </svg>
                </li>
                <li class="toolbar-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </li>
                <li class="toolbar-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <polyline points="12 11 10 15 14 15 12 19"></polyline>
                    </svg>
                </li>
                </ul>
                    <span id="checkOpenchat"><i class="fa-brands fa-hubspot fa-lg"></i></span>
                </div>
            </div>
        `;
        document.body.appendChild(navbar);

        document.getElementById("checkOpenchat").addEventListener("click", function() {
            if (!document.getElementById("hubspot-sidebar")) {
                const sidebar = document.createElement("div");
                sidebar.id = "hubspot-sidebar";
                sidebar.innerHTML = `
                    <div class="sideHeader">
                        <div class="closerow">
                            <span class="sidebar-title">HubSpot Integration</span>
                            <div class="header-wrapp">
                                <span style="cursor:pointer">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="2">
                                        <circle cx="12" cy="5" r="1" fill="#b3b3b3"></circle>
                                        <circle cx="12" cy="12" r="1" fill="#b3b3b3"></circle>
                                        <circle cx="12" cy="19" r="1" fill="#b3b3b3"></circle>
                                    </svg>
                                </span>
                                <span style="cursor:pointer" class="closeIcon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="sideContent"></div>
                    <div class="sideFooter"></div>
                `;
                document.body.appendChild(sidebar);
            }
            else {
                document.getElementById("hubspot-sidebar").style.display = "flex";
            }

            const maindiv = document.getElementById("main");
            const sidebar = document.getElementById("hubspot-sidebar");
            const sideContent = sidebar.querySelector(".sideContent");
            const sideFooter  = sidebar.querySelector(".sideFooter");

            if(maindiv == null){
                sideContent.classList.add("top-message");
                sideContent.textContent = "NO Chat Selected";                
                sideFooter.classList.add("bottom-message");
                sideFooter.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #FFF; font-size:12px;"></i> Select a chat to view HubSpot Profile`;
            } else {
                sideContent.textContent = "";
                sideFooter.innerHTML = "";
                widthSetting();

                const header = maindiv.querySelector("header");
                if (header && header.children.length >= 2) {
                    const secondChild = header.children[1];
                    const span = secondChild.querySelector('span[dir="auto"]');
                    if (span) {
                        content = span.innerHTML;
                    }
                }
                fetchContacts(content, sideContent, maindiv);
            }
            
        });
    }    
}

function fetchContacts(normalizedPhone, sideContent, chatArea) {
    const content = normalizedPhone.replace(/\s+/g, "-");
    chrome.runtime.sendMessage({ action: "fetchContacts", data: content }, (res) => {
        const contacts = res?.contacts || [];
        if (!res?.success) return console.error(res?.error);       

        if (!contacts.length) {
            renderLinkOrCreateUI(sideContent, content, chatArea);
        } else {
            const c = contacts[0];
            const contactData = {
                id: c.id,
                properties: {
                    firstname: c.properties?.firstname || "",
                    lastname: c.properties?.lastname || "",
                    company: c.properties?.company || null,
                    jobtitle: c.properties?.jobtitle || null,
                    hs_lead_status: c.properties?.hs_lead_status || "-",
                    lifecyclestage: c.properties?.lifecyclestage || "-",
                    phone: c.properties?.phone || null,
                    ownerName: c.properties?.ownerName || "-"
                },
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                archived: c.archived,
                url: c.url
            };
            renderHubspotContact(contactData, sideContent, chatArea);
        }        
    });
}

function renderLinkOrCreateUI(sideContent, content, chatArea) {
    sideContent.innerHTML = `
        <span class="sidebar-subtitle">Link or create HubSpot contact</span>
        <div id="btnwrap-sidebar">
            <div class="left-div">${content}</div>
            <div class="right-div">
                <button id="linkBtn"><i class="fa-solid fa-link"></i> Link</button>
                <button id="createBtn"><i class="fa-solid fa-address-book"></i> Create</button>
            </div>
        </div>
    `;

    const linkBtn = document.getElementById("linkBtn");
    const createBtn = document.getElementById("createBtn");

    if (linkBtn) {
        linkBtn.addEventListener("click", () => {
            fetchfullContact(sideContent, content, chatArea);
        });
    }

    if (createBtn) {
        createBtn.addEventListener("click", () => {
            createHubspotContactForm(sideContent, content, chatArea);
        });
    }
}

//link-dropdown function 
function fetchfullContact(sideContent, phone, chatArea) {
    sideContent.insertAdjacentHTML("beforeend", `
        <div class="hubspot-dropdown">
            <div class="hubspot-dropdown-search-wrapper">
                <input class="hubspot-search-input" placeholder="Search contacts..." />
            </div>
            <div class="hubspot-contacts-wrapper"></div>
            <div class="hubspot-dropdown-footer">
                <button id="linkSelectedBtn">LINK</button>
            </div>
        </div>
    `);

    const contactsWrapper = sideContent.querySelector(".hubspot-contacts-wrapper");
    const loader = createLoader(contactsWrapper);

    chrome.runtime.sendMessage({ action: "fetchallContacts" }, (response) => {
        loader.remove();
        if (!response.success) {
            contactsWrapper.innerHTML = `<div class="hubspot-error">Error fetching contacts: ${response.error}</div>`;
            return console.error("Error fetching contacts:", response.error);
        }

        contactsWrapper.innerHTML = response.contacts.map(c => {
            const name = (c.firstname || c.lastname) ? `${c.firstname || ""} ${c.lastname || ""}`.trim() : "Unknown Contact";
            return `<label class="hubspot-contact-item">
                        <input type="checkbox" value="${c.id}" />
                        <span>${name}</span>
                    </label>`;
        }).join("");

        sideContent.querySelector(".hubspot-search-input")
            .addEventListener("input", e => {
            const filter = e.target.value.toLowerCase();
            contactsWrapper.querySelectorAll(".hubspot-contact-item")
                .forEach(item => item.style.display = item.textContent.toLowerCase().includes(filter) ? "flex" : "none");
        });

        document.getElementById("linkSelectedBtn").addEventListener("click", () => {
            const checkedContacts = Array.from(sideContent.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
            const footer = sideContent.querySelector(".hubspot-dropdown-footer");
            if (!checkedContacts.length) {
                const originalHTML = footer.innerHTML;
                footer.innerHTML = `<span class="hubspot-warning">No HubSpot contacts selected</span>`;

                setTimeout(() => {
                    footer.innerHTML = originalHTML;
                }, 2000);

                return console.warn("No HubSpot contacts selected");
            } else {
                linkSelcontact(sideContent, phone, checkedContacts, chatArea);
            }            
        });
    });
}

//create a new contact
async function createHubspotContactForm(sideContent, content, chatArea) {
    const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "fetchDropdownOptions" }, resolve);
    });

    if (!response || !response.success) {
        console.error("Failed to fetch dropdown options", response?.error);
        sideContent.innerHTML = `<div class="error">Failed to load form</div>`;
        return;
    }
    const { contactOwners, lifecycleStages, leadStatuses } = response;

    const fields = [
        { label: "Phone Number", id: "phone", value: content.replace(/\s+/g, ""), required: true, disabled: true },
        { label: "First Name", id: "firstname", required: true },
        { label: "Last Name", id: "lastname" },
        { label: "Email", id: "email" },
        { label: "Company Name", id: "company" },
        { label: "Job Title", id: "jobtitle" },
        { label: "Contact Owner", id: "hubspot_owner_id", type: "select", options: contactOwners },
        { label: "Lifecycle Stage", id: "lifecyclestage", type: "select", options: lifecycleStages },
        { label: "Lead Status", id: "hs_lead_status", type: "select", options: leadStatuses }
    ];

    const formHTML = fields.map(f => {
        if (f.type === "select") {
            const optionsHTML = f.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
            return `
                <div class="form-row">
                    <label class="form-label" for="${f.id}">${f.label}${f.required ? " *" : ""}</label>
                    <select id="${f.id}" class="form-input" ${f.required ? "required" : ""}>
                        ${optionsHTML}
                    </select>
                </div>
            `;
        } else {
            return `
                <div class="form-row">
                    <label class="form-label" for="${f.id}">${f.label}${f.required ? " *" : ""}</label>
                    <input type="text" id="${f.id}" class="form-input" placeholder="${f.label}" value="${f.value || ""}" ${f.required ? "required" : ""} ${f.disabled ? "disabled" : ""}>
                </div>
            `;
        }
    }).join("");

    const btnRowHTML = `<div class="form-row"><button id="create-contact-btn" type="button" class="form-create-btn">Create</button></div>`;

    sideContent.innerHTML = `<form class="create-contact-form">${formHTML}${btnRowHTML}</form>`;

    document.getElementById("create-contact-btn").addEventListener("click", () => {
        const form = sideContent.querySelector("form");
        saveNewContact(form, sideContent, chatArea);
    });

}

// updating the linking contact
function linkSelcontact(sideContent, phone, checkedContacts, chatArea){
    const normalizedPhone = phone.replace(/\s+/g, "-");
    const dataToSync = {
        whatsappContact: { phone: normalizedPhone },
        hubspotContactIds: checkedContacts
    };
    chrome.runtime.sendMessage({ action: "updateHubspotPhone", data: dataToSync }, ({success, data }) => {
        if (!success || !data?.length) return;
        const updatedContact = data[0].updatedContact;
        const contactData = updatedContact.properties ? updatedContact : { properties: updatedContact };
        renderHubspotContact(contactData, sideContent, chatArea);
    });
}

//Create new Contact
function saveNewContact(form, sideContent, chatArea) {
    const formData = Object.fromEntries(
        Array.from(form.querySelectorAll("input, select")).map(input => [input.id, input.value])
    );
    const buttonDiv = document.getElementById("create-contact-btn");
    const originalText = buttonDiv.textContent;
    buttonDiv.innerHTML = "";
    const loader = createLoader(buttonDiv);
    loader.style.padding = "0";
    chrome.runtime.sendMessage({ action: "createHubSpotContact", data: formData }, (response) => {
        if (response.success){
            loader.remove();
            form.remove();
            renderHubspotContact(response.data, sideContent, chatArea);
        } else{
            buttonDiv.textContent = response.error?.message || "Error";
            setTimeout(() => {
                buttonDiv.textContent = originalText;
            }, 3000);
        } return;
    });
}


// Linked contact showing
function renderHubspotContact(contact, sideContent = '', chatArea) {
    const props = contact.properties;
    const contactId = contact.id;
    const contactnumber = props.phone;
    const ownerName = props.ownerName || contact.ownerName || "-";
    const name = `${props.firstname || ""} ${props.lastname || ""}`.trim();

    sideContent.innerHTML = `
        <div id="contactsDropdown">
            <div class="hubspot-row">
                <div class="col-left">
                    <div class="label"></div>
                    <div class="value">${name} <i class="fa-brands fa-hubspot fa-lg" style="color:#eb6a00"></i></div>
                </div>
                <div class="col-right justify-content-end label">
                    <span style="padding-right: 3px"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5 1.5c.3-.3.3-.8 0-1.1-.3-.3-.8-.3-1.1 0l-1 1 1.1 1.1 1-1zM7.8 2.2L1.5 8.5V10h1.5l6.3-6.3-1.5-1.5z" fill="currentColor"/>
                    </svg></span> Edit
                </div>
            </div>

            <div class="hubspot-row">
                <div class="col-left">
                    <div class="label">Company Name</div>
                    <div class="value">${props.company || "-"}</div>
                </div>
                <div class="col-right">
                    <div class="label">Job Title</div>
                    <div class="value">${props.jobtitle || "-"}</div>
                </div>
            </div>

            <div class="hubspot-row">
                <div class="col-left">
                    <div class="label">Contact Owner</div>
                    <div class="value">${ownerName}</div>
                </div>
                <div class="col-right">
                    <div class="label">Lifecycle Stage</div>
                    <div class="value">${props.lifecyclestage || "-"}</div>
                </div>
            </div>

            <div class="hubspot-row">
                <div class="col-left">
                    <div class="label">Lead Status</div>
                    <div class="value">${props.hs_lead_status || "-"}</div>
                </div>
            </div>

            <div class="hubspot-row unlink-contact-row">
                <div class="col-right justify-content-end">
                    <span class="value unlink-text" id="unlink-cont">Unlink Contact</span>
                </div>
            </div>
        </div>
    `;

    const sections = [
        { title: "WhatsApp Messages", className: "whatsapp-link" },
        { title: "Notes", className: "notes-link" },
        { title: "Deals", className: "deals-link" },
        { title: "Tickets", className: "tickets-link" }
    ];

    sections.forEach(({ title, className }) => {
        const svgIcon = ["Notes", "Deals", "Tickets"].includes(title) ? `
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 9l3-3-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>` : "";

        const html = `
            <div class="section-block ${className}">
                <div class="section-row">
                    <div class="section-title"> ${svgIcon} ${title}</div>
                    <button class="log-button">
                    <i class="fa-solid fa-plus" style="color:#fff;"></i>
                    <span>Log</span>
                    </button>
                </div>
            </div>
        `;

        sideContent.insertAdjacentHTML("beforeend", html);

        const newElement = sideContent.querySelector(`.section-block.${className}:last-child`);
        if (className === "whatsapp-link") {
            newElement.addEventListener("click", () => {
                sideContent.innerHTML = `
                    <div class="modal">
                        <div class="modal-header"><div class="modal-title">Attach WhatsApp messages</div></div>
                        <div class="content" id="select-message" style="cursor:pointer">
                            <div class="select-button d-flex gap-2">
                                <span class="select-icon"><i class="fa-solid fa-list" style="color:#fff;"></i></span>
                                <span class="select-text">Select messages</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="sync-button" class="save-button" disabled>Sync</button>
                        </div>
                    </div>
                `;

                const saveBtn = sideContent.querySelector("#sync-button");
                const messages = [...chatArea.querySelectorAll(".message-in, .message-out")];
                let range = [null, null];

                const enableBtn = () => Object.assign(saveBtn, { disabled: false, style: "background:#4CAF50;cursor:pointer" });

                chatArea.onclick = e => {
                    const msg = e.target.closest(".message-in, .message-out");
                    if (!msg) return;

                    const i = messages.indexOf(msg);
                    range = range[0] === null ? [i, i] : [Math.min(range[0], i), Math.max(range[0], i)];

                    messages.forEach(m => m.style.backgroundColor = "");
                    messages.slice(range[0], range[1] + 1).forEach(m => m.style.backgroundColor = "#2c3e5f");
                    enableBtn();
                };

                saveBtn.onclick = () => {
                    if (range.includes(null)) return console.log("Messages not fully selected");
                    const selectedMessages = messages.slice(range[0], range[1] + 1).map(m => {
                        const msgHTML = m.querySelector(".selectable-text.copyable-text span")?.innerHTML || "";
                        const preText = m.querySelector(".copyable-text")?.getAttribute("data-pre-plain-text") || "";
                        const [timestampRaw, senderRaw] = preText.split('] ');
                        const timestamp = timestampRaw ? timestampRaw.replace('[','').trim() : "";
                        const sender = senderRaw ? senderRaw.replace(':','').trim() : "";
                        return { sender, msgHTML, timestamp };
                    });

                    sideContent.innerHTML = "";
                    createForm({contactId, chatArea, sideContent, messages: selectedMessages, type: "detailed", btnId: "sync-snippet-btn", btnText: "Sync"});
                }
            });
        } 
        else if (className === "notes-link" && newElement) { //fetch notes
            const sectionTitle = newElement.querySelector('.section-title');
            if (sectionTitle) {
                if (className === "notes-link" && newElement) {
                    sectionTitle.addEventListener('click', () => {
                        const { notesContainer, loader } = getOrCreateNotesContainer(newElement);
                        chrome.runtime.sendMessage({ action: "fetchNotesFromHubspot", contactId }, (response) => {
                            if (loader) loader.remove();
                            if (response?.success) {
                                const notes = response.data;
                                if (!notes.length) {
                                    notesContainer.innerHTML = '<div class="no-notes">No notes found.</div>';
                                    return;
                                }
                                const notesHtml = notes.map(n => {
                                    const { timeStr, dateStr } = formatTimestamp(n.timestamp);
                                    return `
                                        <div class="note-item">
                                            <div class="note-text">${n.note}</div>
                                            <div class="note-time">
                                                <div class="time-row">${timeStr}</div>
                                                <div class="date-row">${dateStr}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('');

                                notesContainer.innerHTML = `<div class="notes-display">${notesHtml}</div>`;
                            } else {
                                console.error("Failed to fetch notes:", response?.error);
                                notesContainer.innerHTML = '<div class="error">Error loading notes</div>';
                            }
                        });
                    });
                }
            }
            const logButton = newElement.querySelector('.log-button');
            if (logButton) {
                logButton.addEventListener('click', () => {
                    sideContent.innerHTML = `
                        <div class="modal">
                            <div class="modal-header">
                                <div class="modal-title">Write your note</div>
                            </div>
                            <div class="content">
                                <textarea id="note-textarea" placeholder="Type your note here..."></textarea>
                            </div>
                            <div class="modal-footer">
                                <button id="save-note-button" class="save-button" disabled>Save</button>
                            </div>
                        </div>
                    `;

                    const saveButton = document.getElementById('save-note-button');
                    const textarea = document.getElementById('note-textarea');

                    textarea.addEventListener('input', () => {
                        saveButton.disabled = textarea.value.trim() === '';
                    });

                    saveButton.addEventListener('click', () => {
                        const note = textarea.value.trim();
                        const timestamp = new Date().toISOString();
                        const originalText = saveButton.textContent;
                        saveButton.innerHTML = "";
                        const loader = createLoader(saveButton);
                        loader.style.padding = "0";
                        chrome.runtime.sendMessage(
                            { action: "saveNoteToHubspot", data: { contactId, note, timestamp } },
                            (response) => {
                                if (response?.success) {
                                    loader.remove();
                                    console.log("Note saved successfully:", response.data);
                                } else {
                                    console.error("Failed to save note:", response?.error);
                                    setTimeout(() => {
                                        saveButton.textContent = originalText;
                                    }, 3000);
                                }
                            }
                        );
                    });
                });
            }
        } else if (className === "deals-link"){
            const sectionTitle = newElement.querySelector('.section-title');
            if (sectionTitle) {
                if (className === "deals-link" && newElement) {
                    sectionTitle.addEventListener('click', () => {
                        const { notesContainer, loader } = getOrCreateNotesContainer(newElement);
                        chrome.runtime.sendMessage({ action: "fetchDealsByContact", contactId }, (response) => {
                            if (loader) loader.remove(); 

                            if (response.success) {
                                notesContainer.innerHTML = "";

                                response.deals.forEach(deal => {
                                    const dealDiv = document.createElement("div");
                                    dealDiv.className = "deal-item";

                                    let closeDateStr = "";
                                    if (deal.closedate) {
                                        const dateObj = new Date(Number(deal.closedate));
                                        const options = { year: 'numeric', month: 'short', day: 'numeric' };
                                        closeDateStr = dateObj.toLocaleDateString(undefined, options);
                                    }

                                    dealDiv.innerHTML = `
                                        <span class="deal-name">${deal.dealname || "Unnamed Deal"}</span>
                                        <p class="deal-amount">Amount: ${deal.amount || "-"}</p>
                                        <p class="deal-date">Close Date: ${closeDateStr || "-"}</p>
                                    `;
                                    notesContainer.appendChild(dealDiv);
                                });
                            } else {
                                console.error("Failed to fetch deals:", response.error);
                                notesContainer.innerHTML = "<p style='color:red;'>Failed to load deals.</p>";
                            }
                        });
                    });
                }
            }
            const logButton = newElement.querySelector('.log-button');
            logButton.addEventListener('click', () => {
                createDealForm(sideContent, contactId);
            });
        } else {
            const logButton = newElement.querySelector('.log-button');
            logButton.addEventListener('click', () => {
                createTicketForm(sideContent, contactId);
            });
        }       
    });

    document.getElementById("unlink-cont").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "unlinkAndFetch", contactId, contactnumber }, (response) => {
            const resContacts = response?.contacts || [];
            if(!resContacts.length);{
                renderLinkOrCreateUI(sideContent, contactnumber, chatArea);
            }
        });
    });
}

function createTicketForm(container, Selcontact) {
    container.innerHTML = "";
    container.innerHTML = `
        <div class="ticket-form">
            <div class="form-field form-row">
                <label for="ticket-name" class="form-label">Ticket Name</label>
                <input type="text" class="form-input" id="ticket-name" />
            </div>
            <div class="form-row">
                <label for="ticket-pipeline" class="form-label">Pipeline</label>
                <select id="ticket-pipeline" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="ticket-status" class="form-label">Ticket Status</label>
                <select id="ticket-status" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="ticket-description" class="form-label">Description</label>
                <textarea id="ticket-description" class="form-input"></textarea>
            </div>
            <div class="form-row">
                <label for="ticket-source" class="form-label">Source</label>
                <select id="ticket-source" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="ticket-owner" class="form-label">Ticket Owner</label>
                <select id="ticket-owner" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="ticket-priority" class="form-label">Priority</label>
                <select id="ticket-priority" class="form-input">
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                </select>
            </div>
            <div class="form-row">
                <label for="ticket-create-date" class="form-label">Create Date</label>
                <input type="date" class="form-input" id="ticket-create-date" />
            </div>
            <div class="form-footer">
                <button id="create-ticket-btn" class="save-button">Create</button>
            </div>
        </div>
    `;

    const createDateInput = container.querySelector("#ticket-create-date");
    const today = new Date();
    createDateInput.value = today.toISOString().split("T")[0];

    const pipelineSelect = container.querySelector("#ticket-pipeline");
    const statusSelect = container.querySelector("#ticket-status");
    const sourceSelect = container.querySelector("#ticket-source");
    const ownerSelect = container.querySelector("#ticket-owner");

    function populateDropdown(selectEl, action, mapFn, extraData = {}) {
        selectEl.innerHTML = "<option>Loading...</option>";
        chrome.runtime.sendMessage({ action, ...extraData }, (response) => {
            if (response.success) {
                const items = Object.values(response).find(Array.isArray);
                if (!items || !items.length) {
                    selectEl.innerHTML = "<option>No data found</option>";
                    return;
                }
                selectEl.innerHTML = "";
                items.forEach(item => {
                    const { value, label } = mapFn(item);
                    const opt = document.createElement("option");
                    opt.value = value;
                    opt.textContent = label;
                    selectEl.appendChild(opt);
                });
            } else {
                console.error(`Failed to fetch ${action}:`, response.error);
                selectEl.innerHTML = "<option>Error loading data</option>";
            }
        });
    }

    populateDropdown(pipelineSelect, "fetchHubspotPipelines", p => ({ value: p.id, label: p.name }));
    populateDropdown(statusSelect, "fetchTicketStatuses", s => ({ value: s.id, label: s.label }));
    populateDropdown(sourceSelect, "fetchTicketSources", s => ({ value: s.id, label: s.label }));
    populateDropdown(ownerSelect, "fetchDealOwners", o => ({ value: o.id, label: o.name }));

    const createBtn = container.querySelector("#create-ticket-btn");
    createBtn.addEventListener("click", () => {
        const ticketData = {
            ticketName: container.querySelector("#ticket-name").value.trim(),
            pipelineId: pipelineSelect.value,
            statusId: statusSelect.value,
            description: container.querySelector("#ticket-description").value.trim(),
            sourceId: sourceSelect.value,
            ownerId: ownerSelect.value,
            priority: container.querySelector("#ticket-priority").value,
            createDate: createDateInput.value,
            Selcontact
        };

        chrome.runtime.sendMessage({ action: "createHubspotTicket", data: ticketData }, (response) => {
            if (response.success) {
                const msg = document.createElement("div");
                msg.textContent = "Ticket created successfully!";
                msg.style.color = "green";
                msg.style.marginTop = "10px";
                container.querySelector(".form-footer").appendChild(msg);
                setTimeout(() => msg.remove(), 3000);
            } else {
                console.error("Failed to create ticket:", response.error);
                alert("Failed to create ticket. Check console for details.");
            }
        });
    });
}

function getOrCreateNotesContainer(targetElement) {
    let notesContainer = targetElement.querySelector('.notes-container');
    if (notesContainer) {
        notesContainer.style.display = notesContainer.style.display === 'none' ? 'block' : 'none';
        return { notesContainer, loader: null };
    }
    notesContainer = document.createElement('div');
    notesContainer.className = 'notes-container';
    targetElement.insertAdjacentElement('afterend', notesContainer);
    const loader = createLoader(notesContainer, "Loading ...");

    return { notesContainer, loader };
}

function formatTimestamp(timestamp) {
    const dateObj = new Date(timestamp);
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 to 12
    const timeStr = `${hours}:${minutes} ${ampm}`;
    const dateStr = dateObj.toLocaleDateString();
    return { timeStr, dateStr };
}

function createDealForm(container, Selcontact) {
    container.innerHTML = "";
    container.innerHTML = `
        <div class="deal-form">
            <div class="form-field form-row">
                <label for="deal-name" class="form-label">Deal Name</label>
                <input type="text" class="form-input" id="deal-name" />
            </div>
            <div class="form-row">
                <label for="pipeline" class="form-label">Pipeline</label>
                <select id="pipeline" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="deal-stage" class="form-label">Deal Stage</label>
                <select id="deal-stage" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="amount" class="form-label">Amount</label>
                <input type="number" class="form-input" id="amount" />
            </div>
            <div class="form-row">
                <label for="close-date" class="form-label">Close Date</label>
                <input type="date" class="form-input" id="close-date" />
            </div>
            <div class="form-row">
                <label for="deal-owner" class="form-label">Deal Owner</label>
                <select id="deal-owner" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="deal-type" class="form-label">Deal Type</label>
                <select id="deal-type" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>
            <div class="form-row">
                <label for="priority" class="form-label">Priority</label>
                <select id="priority" class="form-input">
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                </select>
            </div>

            <div class="form-row">
                <label for="contact" class="form-label">Contact</label>
                <select id="contact" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>

            <div class="form-row">
                <label for="company" class="form-label">Company</label>
                <select id="company" class="form-input">
                    <option>Loading...</option>
                </select>
            </div>

            <div class="form-footer">
                <button id="create-deal-btn" class="save-button">Create</button>
            </div>
        </div>
    `;

    function populateDropdown(selectEl, messageAction, mapFn, extraData = {}) {
        selectEl.innerHTML = "<option>Loading...</option>";

        chrome.runtime.sendMessage({ action: messageAction, ...extraData }, (response) => {
            if (response.success) {
                const items = Object.values(response).find(Array.isArray);
                if (!items || !items.length) {
                    selectEl.innerHTML = "<option>No data found</option>";
                    return;
                }

                selectEl.innerHTML = "";
                items.forEach(item => {
                    const { value, label } = mapFn(item);
                    const opt = document.createElement("option");
                    opt.value = value;
                    opt.textContent = label;
                    selectEl.appendChild(opt);
                });
            } else {
                console.error(`Failed to fetch ${messageAction}:`, response.error);
                selectEl.innerHTML = `<option>Error loading data</option>`;
            }
        });
    }

    // Elements
    const pipelineSelect = container.querySelector("#pipeline");
    const stageSelect = container.querySelector("#deal-stage");
    const ownerSelect = container.querySelector("#deal-owner");
    const dealTypeSelect = container.querySelector("#deal-type");
    const contactSelect = container.querySelector("#contact");
    const companySelect = container.querySelector("#company");

    // Pipelines + auto-load stages
    populateDropdown(pipelineSelect, "fetchHubspotPipelines", p => ({ value: p.id, label: p.name }));

    // When pipeline changes → load its deal stages
    pipelineSelect.addEventListener("change", () => {
        const selectedPipelineId = pipelineSelect.value;
        loadDealStages(selectedPipelineId);
    });

    function loadDealStages(pipelineId) {
        populateDropdown(stageSelect, "fetchDealStages", s => ({ value: s.id, label: s.label }), { pipelineId });
    }

    // Once pipelines are loaded, load stages for the first one automatically
    chrome.runtime.sendMessage({ action: "fetchHubspotPipelines" }, (response) => {
        if (response.success && response.pipelines.length) {
            const firstPipelineId = response.pipelines[0].id;
            loadDealStages(firstPipelineId);
        }
    });

    // Owners
    populateDropdown(ownerSelect, "fetchDealOwners", o => ({ value: o.id, label: o.name }));
    // Deal Types
    populateDropdown(dealTypeSelect, "fetchDealTypes", dt => ({ value: dt.id, label: dt.name }));
    //Contacts
    populateDropdown(contactSelect, "fetchHubspotContacts", c => ({ value: c.id, label: c.name }));
    // Companies
    populateDropdown(companySelect, "fetchHubspotCompanies", c => ({ value: c.id, label: c.name }));

    const closeDateInput = container.querySelector("#close-date");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    closeDateInput.value = formattedDate;

    const createDealBtn = container.querySelector("#create-deal-btn");
    createDealBtn.addEventListener("click", async () => {
        const pipelineId = container.querySelector("#pipeline").value;
        const stageId = container.querySelector("#deal-stage").value;
        const dealName = container.querySelector("#deal-name").value.trim();
        const amount = container.querySelector("#amount").value.trim();
        const closeDate = container.querySelector("#close-date").value;
        const ownerId = container.querySelector("#deal-owner").value;
        const dealType = container.querySelector("#deal-type").value;
        const priority = container.querySelector("#priority").value;
        const contactId = container.querySelector("#contact")?.value;
        const companyId = container.querySelector("#company")?.value;

        // Simple validation
        let hasError = false;
        if (!dealName) { showError(container.querySelector("#deal-name")); hasError = true; }
        if (!pipelineId) { showError(container.querySelector("#pipeline")); hasError = true; }
        if (!stageId) { showError(container.querySelector("#deal-stage")); hasError = true; }
        if (!amount) { showError(container.querySelector("#amount")); hasError = true; }
        if (!closeDate) { showError(container.querySelector("#close-date")); hasError = true; }

        if (hasError) return;

        // Prepare deal payload
        const dealData = {
            dealName,
            pipelineId,
            stageId,
            amount,
            closeDate, // string yyyy-mm-dd
            ownerId,
            dealType,
            priority,
            contactId,
            companyId,
            Selcontact 
        };

        createDealBtn.disabled = true;
        createDealBtn.textContent = "Creating...";

        chrome.runtime.sendMessage({ action: "createHubspotDeal", data: dealData }, (response) => {
            createDealBtn.disabled = false;
            createDealBtn.textContent = "Create";

            if (response.success) {
                const msg = document.createElement("div");
                msg.textContent = "Deal created successfully!";
                msg.style.color = "green";
                msg.style.marginTop = "10px";
                container.querySelector(".form-footer").appendChild(msg);
                container.querySelectorAll("input, select").forEach(el => {
                    if (el.tagName === "SELECT") {
                        el.selectedIndex = 0;
                    } else {
                        el.value = "";
                    }
                });
                setTimeout(() => msg.remove(), 3000);
            } else {
                console.error("Failed to create deal:", response.error);
                alert("Failed to create deal. Check console for details.");
            }
        });
    });
}

function createForm({contactId, chatArea, sideContent, messages = [], type = "snippet", startEndIds = ["start-snippet", "end-snippet"], btnId = "save-snippet-btn", btnText = "Save" } = {}) {
    if (!messages?.length || !sideContent) return;

    const form = document.createElement("div");
    form.className = type === "snippet" ? "conversation-snippet-form" : "conversation-form";

    if (type === "snippet") {
        const inputRow = (label, value, id) => {
            const row = document.createElement("div");
            row.className = "form-row";
            row.innerHTML = `
                <label for="${id}" class="form-label">${label}</label>
                <input type="text" id="${id}" class="form-input" value="${value}">
            `;
            return row;
        };

        form.append(
            inputRow("Start of conversation snippet", messages[0], startEndIds[0]),
            inputRow("End of conversation snippet", messages.at(-1), startEndIds[1])
        );
    } else {
        messages.forEach(m => {
            const row = document.createElement("div");
            row.className = "form-row";
            row.innerHTML = `
                <label class="form-label">From: ${m.sender}</label>
                <input type="text" class="form-input" value="${m.msgHTML}" />
            `;
            form.appendChild(row);
        });
    }

    const btnWrapper = document.createElement("div");
    btnWrapper.className = "d-flex justify-content-end";
    btnWrapper.innerHTML = `<button class="save-button" id="${btnId}">${btnText}</button>`;
    form.appendChild(btnWrapper);

    sideContent.appendChild(form);

    const syncBtn = sideContent.querySelector("#sync-snippet-btn");
    syncBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "saveWhatsAppMessagesToHubspot", data: { messages, contactId }}, response => {
            if (response?.success) {
                const contactData = response.data.contact || response.data[0];
                if (contactData) {
                    renderHubspotContact(contactData, sideContent, chatArea);
                }
            }
        })
    });
}

// create a loader
function createLoader(container, message = "Loading...") {
    const loader = document.createElement("div");
    loader.className = "hubspot-loader";
    loader.innerHTML = `
        <span class="loader-spinner"></span>
        <span>${message}</span>
    `;
    container.appendChild(loader);
    return loader;
}

//chat section width setting
function widthSetting() {
    const maindiv = document.getElementById("main");
    const sidebar = document.getElementById("hubspot-sidebar");

    if (!maindiv) return;

    if (sidebar && sidebar.style.display !== "none") {
        const sidebarWidth = sidebar.offsetWidth || 350;
        maindiv.style.width = `calc(100% - ${sidebarWidth}px)`;
    } else {
        maindiv.style.width = "100%";
    }
}

function resetChatTransforms() {
    const chatList = document.querySelector('div[role="grid"]');
    if (!chatList) return;

    let rows = Array.from(chatList.querySelectorAll('div[role="row"]'));

    let currentY = 0;
    for (let row of rows) {
        if (row.style.display === "none") continue;
        row.style.transition = "transform 0.2s";
        row.style.transform = `translateY(${currentY}px)`;
        currentY += row.offsetHeight;
    }
}

// Close Icon
document.body.addEventListener('mousedown', e => {

    if (e.target.closest('.closeIcon')) {
        e.stopPropagation();
        const sidebar = document.getElementById('hubspot-sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
            widthSetting();
        }
        return;
    }
    
    const actionTarget = e.target.closest('.closeChat, .snoozeChat, .archiveChat, .customPrefix');
    if (!actionTarget) return;

    const chatRow = actionTarget.closest('div[role="row"]');
    if (!chatRow) return;

    e.preventDefault();
    e.stopPropagation();

    if (actionTarget.classList.contains('closeChat')) {
        chatRow.dataset.closed = "true";
        chatRow.style.display = "none";
        resetChatTransforms(chatRow);
    } else if (actionTarget.classList.contains('snoozeChat')) {
        chatRow.dataset.snoozed = "true";
        chatRow.style.display = "none";
        resetChatTransforms(chatRow);
    } else if (actionTarget.classList.contains('archiveChat')) {
        chatRow.setAttribute('role', 'listitem');
        chatRow.style.display = "none";
        resetChatTransforms(chatRow);
    } else if (actionTarget.classList.contains('customPrefix')) {
        const polygon = actionTarget.querySelector('polygon');
        if (chatRow.dataset.starred === "true") {
            chatRow.removeAttribute('data-starred');
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', 'none');
        } else {
            chatRow.dataset.starred = "true";
            polygon.setAttribute('fill', 'gold');
            polygon.setAttribute('stroke', 'gold');
            chatRow.style.display = "none";
            resetChatTransforms(chatRow);            
        }
    }
});

//Tooltips for icons
const actionTitles = {
    closeChat: { title: 'Close Chat', keys: ['Ctrl', 'C'], showNextTab: false },
    snoozeChat: { title: 'Snooze', keys: [], showNextTab: false },
    archiveChat: { title: 'Archive', keys: ['⌘', 'Ctrl', 'Shift', 'E'], showNextTab: false }
};

const toolbarTitles = {
    inbox: { title: 'Inbox (37 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    starred: { title: 'Starred (0 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    unread: { title: 'Unopened chats (5 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    closed: { title: 'Chats you have closed (12 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    snoozed: { title: 'Snoozed (2 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    followUp: { title: 'Follow Up (3 chats)', keys: ['⌘', 'Ctrl', '→'], showNextTab: true },
    addItem: { title: 'New custom tab', keys: [], showNextTab: false }
};

let activeTooltip = null;

document.addEventListener('mouseover', e => {
    const li = e.target.closest('li.inbox, li.starred, li.unread, li.closed, li.snoozed, li.followUp, li.addItem');
    const action = e.target.closest('.closeChat, .snoozeChat, .archiveChat');
    if (!li && !action) return;

    activeTooltip?.remove();

    const { title, keys, showNextTab } = li
        ? toolbarTitles[Object.keys(toolbarTitles).find(k => li.classList.contains(k))]
        : actionTitles[Object.keys(actionTitles).find(k => action.classList.contains(k))];

    const tooltip = document.createElement('div');
    tooltip.className = 'hubspot-tooltip';
    if (action) tooltip.classList.add('action-tooltip');
    if (action && action.classList.contains('closeChat')) {
        tooltip.classList.add('close-tooltip');
    }
    tooltip.innerHTML = `<div>${title}</div>`;

    if (showNextTab || keys.length) {
        const keysRow = document.createElement('div');
        keysRow.className = 'short-key';
        if (showNextTab) keysRow.appendChild(Object.assign(document.createElement('div'), { textContent: 'Next tab' }));
        keys.forEach(k => keysRow.appendChild(Object.assign(document.createElement('span'), { className: 'icon-tab', textContent: k })));
        tooltip.appendChild(keysRow);
    }

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    const target = li || action;
    const { bottom, left } = target.getBoundingClientRect();
    tooltip.classList.add('show');
    Object.assign(tooltip.style, { top: `${bottom + window.scrollY + 6}px`, left: `${left + window.scrollX}px` });

    target.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        setTimeout(() => { tooltip.remove(); activeTooltip = null; }, 200);
    }, { once: true });
});

//3 icons on the right side of each chats
document.addEventListener('mouseover', e => {
    const cell = e.target.closest('div[role="gridcell"].x1n2onr6');
    if (!cell) return;

    const ts = cell.querySelector('div._ak8i');
    if (!ts || ts.dataset.orig) return;

    ts.dataset.orig = ts.innerHTML;
    ts.style.transition = 'opacity 0.2s';
    ts.style.opacity = 0;

    setTimeout(() => {
        ts.innerHTML = `
        <div class="chatRight-actions" style="display:flex; justify-content: center;">
            <span class="closeChat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
            <span class="snoozeChat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </span>
            <span class="archiveChat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
            </span>
        </div>
        `;
    }, 200);

    setTimeout(() => ts.style.opacity = 1, 200);

    cell.addEventListener('mouseleave', () => {
        ts.style.opacity = 0;
        setTimeout(() => {
            ts.innerHTML = ts.dataset.orig;
            ts.style.opacity = 1;
            delete ts.dataset.orig;
        }, 200);
    }, { once: true });
});

//tab switching by keys
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        const items = [...document.querySelectorAll('.toolbar-item')];
        let i = items.findIndex(li => li.classList.contains('active'));
        if (i === -1) i = 0;
        do { i = (i + 1) % items.length } while (items[i].classList.contains('divider'));
        items.forEach(li => li.classList.remove('active'));
        items[i].classList.add('active');
        filterChatsByTab(i);
    }
});

//inbox count
async function logChatListDiv() {
    // const pane = document.querySelector("#pane-side");
    // if (!pane) return 0;

    // let lastScrollTop = -1;
    // let scrollAttempts = 0;

    // while (pane.scrollTop !== lastScrollTop && scrollAttempts < 50) {
    //     lastScrollTop = pane.scrollTop;
    //     pane.scrollTop = pane.scrollHeight; // scroll to bottom
    //     await new Promise(resolve => setTimeout(resolve, 500)); // wait for chats to load
    //     scrollAttempts++;
    // }

    // // Now all chats should be rendered
    // const allChats = pane.querySelectorAll('div[role="row"]');
    // console.log("Total chats:", allChats.length);
    // return allChats.length;

}


// Grab all tabs
function observeTabs() {
    const navWrapper = document.querySelector('.nav-wrapper > ul.toolbar');
    if (!navWrapper) return;

    const tabs = navWrapper.querySelectorAll('li');
    tabs.forEach((tab, idx) => {
        if (!tab.dataset.listenerAttached) {
            tab.dataset.listenerAttached = "true";
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filterChatsByTab(idx);
            });
        }
    });
}

let unreadObserverInitialized = false;

function filterChatsByTab(idx) {
    const chatList = document.querySelector('div[role="grid"]');
    if (!chatList) return;

    const chats = chatList.querySelectorAll('div[role="row"]');
    chats.forEach(chat => chat.style.display = "none");

    switch(idx) {
        case 0: // Inbox
            chats.forEach(c => {
                if (c.dataset.closed !== "true" && c.dataset.snoozed !== "true" && c.dataset.starred !== "true")
                    c.style.display = "block";
            });
            break;
        case 1: // Starred
            chats.forEach(c => { if (c.dataset.starred === "true") c.style.display = "block"; });
            break;
        case 2: // Unread
            if (!unreadObserverInitialized) {
                observeUnreadChats();
                unreadObserverInitialized = true;
            }
            break;
        case 3: // Closed
            chats.forEach(c => { if (c.dataset.closed === "true") c.style.display = "block"; });
            break;
        case 4: // Snoozed
            chats.forEach(c => { if (c.dataset.snoozed === "true") c.style.display = "block"; });
            break;
    }

    arrangeVisibleChats();
}

function arrangeVisibleChats() {
    const chatList = document.querySelector('div[role="grid"]');
    if (!chatList) return;

    let offset = 0;
    const rows = Array.from(chatList.querySelectorAll('div[role="row"]'));
    rows.forEach(row => {
        if (row.style.display !== "none") {
            row.style.transition = 'transform 0.2s';
            row.style.transform = `translateY(${offset}px)`;
            offset += row.offsetHeight;
        } else {
            row.style.transform = 'translateY(0px)';
        }
    });
}

function reorderUnreadChats(chatList) {
    if (!chatList) return;
    const unreadChats = Array.from(chatList.querySelectorAll('div[role="row"]')).filter(chat => {
        const span = chat.querySelector('span[aria-label]');
        return span && span.getAttribute('aria-label').toLowerCase().includes('unread');
    });
    unreadChats.forEach(chat => chatList.appendChild(chat));
}

function observeUnreadChats() {
    const chatList = document.querySelector('div[role="grid"]');
    if (!chatList) return;

    const processChat = (chat) => {
        const unreadSpan = chat.querySelector('span[aria-label]');
        const isUnread = unreadSpan && unreadSpan.getAttribute('aria-label').toLowerCase().includes('unread');
        chat.style.display = isUnread ? "contents" : "none";
    };

    chatList.querySelectorAll('div[role="row"]').forEach(processChat);
    reorderUnreadChats(chatList);

    const observer = new MutationObserver((mutations) => {
        let shouldReorder = false;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.matches('div[role="row"]')) {
                    processChat(node);
                    shouldReorder = true;
                }
            });
        });
        if (shouldReorder) reorderUnreadChats(chatList);
    });

    observer.observe(chatList, { childList: true, subtree: true });
}

function addPrefix() {
    document.querySelectorAll('div[role="gridcell"] span[title][dir="auto"]').forEach(span => {
        if (span.previousSibling?.classList?.contains('customPrefix')) return;

        const p = document.createElement('span');
        p.className = 'customPrefix';
        p.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        `;
        span.parentNode.insertBefore(p, span);

        const chatRow = span.closest('div[role="row"]');
        if (!chatRow || chatRow.dataset.starredListenerAttached) return;
        chatRow.dataset.starredListenerAttached = "true";
    });
}

const observer = new MutationObserver(addPrefix);

const wait = setInterval(() => { 
    const container = document.querySelector('div[role="grid"]');
    if (container) {
        clearInterval(wait);
        addPrefix();
        observer.observe(container, { childList: true, subtree: true });
    }
}, 500);

const observerNew = new MutationObserver(() => {
    const chatContainer = document.querySelector('div[role="grid"]');
    if (!chatContainer) return;
    addHubspotNavbar();
    logChatListDiv();
    observeTabs();
    const cssFiles = [
        chrome.runtime.getURL("fonts/css/all.min.css"),
        chrome.runtime.getURL("hubspot.css")
    ];

    cssFiles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        }
    });

    observerNew.disconnect();
});

observerNew.observe(document, { childList: true, subtree: true });