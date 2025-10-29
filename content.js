["https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
 chrome.runtime.getURL("hubspot.css")].forEach(href => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
});

function addHubspotNavbar(){
  const appRoot = document.getElementById("app") || document.querySelector("#app");

  if (appRoot && !document.getElementById("hubspot-navbar")) {
        const navbar = document.createElement("div");
        navbar.id = "hubspot-navbar";
        navbar.innerHTML = `
            <div class="nav-inner">
                <span id="checkOpenchat"><i class="fa-brands fa-hubspot fa-lg"></i></span>
            </div>
        `;
        document.body.appendChild(navbar);

        document.getElementById("checkOpenchat").addEventListener("click", function() {
            const maindiv = document.getElementById("main");
            createHubspotSidebar(maindiv);   
            const sidebar = document.getElementById("hubspot-sidebar");
            // width setting
            const sidebarWidth = sidebar.offsetWidth || 350;
            maindiv.style.width = `calc(100% - ${sidebarWidth}px)`;

            const sideContent = sidebar.querySelector(".sideContent");
            const sideFooter  = sidebar.querySelector(".sideFooter");            
      
            if(!maindiv){
                sideContent.classList.add("top-message");
                sideContent.textContent = "NO Chat Selected";                
                sideFooter.classList.add("bottom-message");
                sideFooter.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #FFF; font-size:12px;"></i> Select a chat to view HubSpot Profile`;
            } else{
                sidebar.style.display = "flex";
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
                        console.log(contacts);
                        const normalizedContent = content.replace(/\s+/g, "");
                        const matchedContact = contacts.find(contact => 
                            contact.properties.phone?.replace(/\s+/g, "") === normalizedContent
                        );
                        const contactId = matchedContact?.id || null;

                        if(matchedContact){
                            sideContent.appendChild(renderHubspotContact(matchedContact));
                            sideContent.appendChild(renderMessagelinking());

                            document.getElementsByClassName("meesagelink")[0].addEventListener("click", () => {
                                console.log("clicked");
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

                                const chatArea = document.getElementById("main");
                                const saveBtn = document.getElementById("sync-button");
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
                                    sideContent.appendChild(createForm({ messages: selectedMessages, type: "detailed", btnId: "sync-snippet-btn", btnText: "Sync" }));

                                    document.getElementById("sync-snippet-btn").addEventListener("click", () => {
                                        chrome.runtime.sendMessage({ 
                                            action: "saveWhatsAppMessagesToHubspot", 
                                            data: { messages: selectedMessages, contactId } 
                                        }, response => {
                                            if (response?.success) {
                                                console.log("Messages saved in HubSpot", response.data);
                                                const contactData = response.data.contact || response.data[0];
                                                if (contactData) {
                                                    sideContent.innerHTML = "";
                                                    sideContent.appendChild(renderHubspotContact(contactData));
                                                    sideContent.appendChild(renderMessagelinking());
                                                }
                                            } else {
                                                console.error("Failed to save messages:", response?.error);
                                            }
                                        });
                                    });
                                };
                            });
                        } else {
                            const subtitle = document.createElement("span");
                            subtitle.className = "sidebar-subtitle";
                            subtitle.textContent = "Link or create HubSpot contact";
                            sideContent.appendChild(subtitle);

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
                            sideContent.appendChild(horizontalDiv);

                            document.getElementById("linkBtn").addEventListener("click", () => {
                                chrome.runtime.sendMessage({ action: "fetchContacts" }, ({ success, contacts }) => {
                                    if (!success) return;
                                    sideContent.appendChild(showDropdownInSidebar(contacts, content));
                                    const header = maindiv.querySelector("header");

                                    const phoneNumber = header?.querySelector("span[data-testid='user-phone']");
                                    const Name = phoneNumber ? phoneNumber.innerText : "Unknown"; 

                                    const linkBtn = sideContent.querySelector("#linkSelectedBtn");
                                    linkBtn.addEventListener("click", () => {
                                        const checkedContacts = Array.from(sideContent.querySelectorAll("input[type=checkbox]:checked"))
                                                                    .map(cb => cb.value);
                                        if (!checkedContacts.length) return console.warn("No HubSpot contacts selected");

                                        const dataToSync = {
                                            whatsappContact: { phoneNumber },
                                            hubspotContactIds: checkedContacts
                                        };

                                        chrome.runtime.sendMessage({ action: "updateHubspotPhone", data: dataToSync }, ({ success, data }) => {
                                            if (!success || !data?.length) return;
                                            const updatedContact = data[0].updatedContact;
                                            const contactData = updatedContact.properties ? updatedContact : { properties: updatedContact };
                                            sideContent.innerHTML = "";
                                            sideContent.appendChild(renderHubspotContact(contactData));
                                            sideContent.appendChild(renderMessagelinking());
                                        });
                                    });
                                });
                            });

                            document.getElementById("createBtn").addEventListener("click", () => {
                                sideContent.innerHTML = "";
                                const form = createHubspotContactForm(content);
                                sideContent.appendChild(form);

                                form.querySelector("#create-contact-btn").addEventListener("click", async (e) => {
                                    e.preventDefault();
                                    const form = e.target.closest("form");
                                    const formData = Object.fromEntries(
                                        Array.from(form.querySelectorAll("input")).map(input => [input.id, input.value])
                                    );

                                    chrome.runtime.sendMessage({ action: "createHubSpotContact", data: formData }, (response) => {
                                        if (!response.success) return;
                                        form.remove();
                                        sideContent.appendChild(renderHubspotContact(response.data));
                                        sideContent.appendChild(renderMessagelinking());
                                        console.log("Contact created successfully");
                                    });
                                });
                            });                           
                        }
                    }

                });
            }
        });
  }
}

function createHubspotContactForm(content) {
    const form = document.createElement("form");
    form.className = "create-contact-form";

    const fields = [
        { label: "Phone Number", id: "phone", value: content.replace(/\s+/g, ""), required: true, disabled: true },
        { label: "First Name", id: "firstname", required: true },
        { label: "Last Name", id: "lastname" },
        { label: "Email", id: "email" },
        { label: "Company Name", id: "company" },
        { label: "Job Title", id: "jobtitle" },
        { label: "Contact Owner", id: "hubspot_owner_id" },
        { label: "Lifecycle Stage", id: "lifecyclestage" },
        { label: "Lead Status", id: "hs_lead_status" }
    ];

    fields.forEach(f => {
        const row = document.createElement("div");
        row.className = "form-row";

        row.innerHTML = `
            <label class="form-label" for="${f.id}">${f.label}${f.required ? " *" : ""}</label>
            <input type="text" id="${f.id}" class="form-input" placeholder="${f.label}" value="${f.value || ""}" ${f.required ? "required" : ""} ${f.disabled ? "disabled" : ""}>
        `;
        form.appendChild(row);
    });

    const btnRow = document.createElement("div");
    btnRow.innerHTML = `<button id="create-contact-btn" type="button" class="form-create-btn">Create</button>`;
    form.appendChild(btnRow);
    return form;
}

function createHubspotSidebar(maindiv) {
    const originalWidth = maindiv.offsetWidth;
    if(!document.getElementById("hubspot-sidebar")){     
        const sidebar = document.createElement("div");
        sidebar.id = "hubspot-sidebar";
        document.body.appendChild(sidebar);
        const sideHeader = document.createElement("div");
        sideHeader.className = "sideHeader";

        const closerow = document.createElement("div");
        closerow.className = "closerow";
        closerow.innerHTML = `
        <span class="sidebar-title">HubSpot Integration</span>
        <i class="fa-solid fa-xmark" style="cursor:pointer;"></i>
        `;
        sideHeader.appendChild(closerow);

        const sideContent = document.createElement("div");
        sideContent.className = "sideContent";

        const sideFooter = document.createElement("div");
        sideFooter.className = "sideFooter";

        sidebar.appendChild(sideHeader);
        sidebar.appendChild(sideContent);
        sidebar.appendChild(sideFooter);

        closerow.querySelector("i").addEventListener("click", () => {
            sidebar.style.display = "none";
            sidebar.innerHTML = "";
            maindiv.style.width = originalWidth + "px";
        });
        return sidebar;
    } else{
        const sidebar = document.getElementById("hubspot-sidebar");
        return sidebar;
    }
}

function showDropdownInSidebar(response, phoneNumber) {
    const container = document.createElement("div");
    container.className = "hubspot-dropdown";
    const searchInput = document.createElement("input");
    searchInput.className = "hubspot-search-input";
    searchInput.placeholder = "Search contacts...";
    const searchWrapper = document.createElement("div");
    searchWrapper.className = "hubspot-dropdown-search-wrapper";
    searchWrapper.appendChild(searchInput);
    container.appendChild(searchWrapper);

    const wrapper = document.createElement("div");
    wrapper.className = "hubspot-contacts-wrapper";

    const createItem = contact => {
        const item = document.createElement("label");
        item.className = "hubspot-contact-item";
        const name = contact.properties.firstname || contact.properties.lastname
            ? `${contact.properties.firstname || ""} ${contact.properties.lastname || ""}`.trim()
            : contact.properties.email || "Unknown Contact";
        item.innerHTML = `<input type="checkbox" value="${contact.id}" /><span>${name}</span>`;
        return item;
    };

    response.forEach(contact => wrapper.appendChild(createItem(contact)));
    container.appendChild(wrapper);

    searchInput.addEventListener("input", e => {
        const filter = e.target.value.toLowerCase();
        container.querySelectorAll(".hubspot-contact-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(filter) ? "flex" : "none";
        });
    });

    const footer = document.createElement("div");
    footer.className = "hubspot-dropdown-footer";
    footer.innerHTML = `<button id="linkSelectedBtn">LINK</button>`;
    container.appendChild(footer);

    return container;
}

function renderHubspotContact(contact) {
    const props = contact.properties;
    const dropdown = document.createElement("div");
    dropdown.id = "contactsDropdown";

    const createRow = (leftLabel, leftValue, rightLabel, rightValue) => {
        const row = document.createElement("div");
        row.className = "hubspot-row";
        row.innerHTML = `
            <div class="col-left">
                <div class="label">${leftLabel || ""}</div>
                <div class="value">${leftValue || "~"}</div>
            </div>
            ${rightLabel ? `<div class="col-right">
                <div class="label">${rightLabel}</div>
                <div class="value">${rightValue || "~"}</div>
            </div>` : ""}
        `;
        return row;
    };
    const nameRow = createRow("", `${props.firstname || ""} ${props.lastname || ""} <i class="fa-brands fa-hubspot fa-lg" style="color:#eb6a00"></i>`);
    const editCol = document.createElement("div");
    editCol.className = "col-right justify-content-end";
    editCol.innerHTML = `Edit <i class="fa-solid fa-pen" style="color:#f56505;font-size:12px;padding-left:5px"></i>`;
    nameRow.appendChild(editCol);
    dropdown.appendChild(nameRow);

    dropdown.appendChild(createRow("Company Name", props.company, "Job Title", props.jobtitle));
    dropdown.appendChild(createRow("Contact Owner", props.hubspot_owner_id, "Lifecycle Stage", props.lifecyclestage));
    dropdown.appendChild(createRow("Lead Status", props.hs_lead_status));

    const unlinkRow = createRow("", "");
    unlinkRow.classList.add("unlink-contact-row");
    unlinkRow.querySelector(".col-right")?.remove();
    const unlinkCol = document.createElement("div");
    unlinkCol.className = "col-right justify-content-end";
    unlinkCol.innerHTML = `<span class="value unlink-text">Unlink Contact</span>`;
    unlinkRow.appendChild(unlinkCol);
    dropdown.appendChild(unlinkRow);
    return dropdown;
}

function renderMessagelinking() {
    const el = document.createElement("div");
    el.className = "meesagelink";
    el.innerHTML = `
        <div class="title">WhatsApp Messages</div>
        <button class="log-button"><i class="fa-solid fa-plus" style="color:#fff;"></i><span>Log</span></button>
    `;
    return el;
}

function createForm({ messages = [], type = "snippet", startEndIds = ["start-snippet", "end-snippet"], btnId = "save-snippet-btn", btnText = "Save" } = {}) {
    if (!messages?.length) return null;

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

    return form;
}

const observernew = new MutationObserver(() => {
  if (document.getElementById("app")) {
    addHubspotNavbar();
    observernew.disconnect();
  }
});

observernew.observe(document, { childList: true, subtree: true });