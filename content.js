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

// Close Icon
document.body.addEventListener('click', e => {
    const clickedIcon = e.target.closest('.closeIcon');
    if (!clickedIcon) return;

    const sidebar = document.getElementById('hubspot-sidebar');
    if (!sidebar) return;

    sidebar.style.display = 'none';
    widthSetting();

   
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
    }
});

//star before the contact number/name
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
    });
}

//inbox count
function logChatListDiv() {
    const targetDiv = document.querySelector('div[role="grid"][aria-label="Chat list"]');
    console.log(targetDiv);
    const chatCells = targetDiv.querySelectorAll('div[role="gridcell"]');
    chatCells.forEach(cell => {
        const unreadSpan = cell.querySelector('span[aria-label$="unread message"]');
        if (unreadSpan) {
            console.log("Unread chat found:", cell);
        }
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
    const cssFiles = [
        chrome.runtime.getURL("fonts/css/all.min.css"),
        chrome.runtime.getURL("hubspot.css"),
        chrome.runtime.getURL("Image/myImage.css")
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