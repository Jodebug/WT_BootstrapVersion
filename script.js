// Web Technologies: simple JavaScript examples.
// Tutorials: https://www.w3schools.com/js/js_api_fetch.asp
// https://www.w3schools.com/js/js_htmldom_nodes.asp
"use strict";

document.addEventListener("DOMContentLoaded", function () {
    setupTabs();
    setupTheme();
    setupSearch();
    setupForm();
    setupTable();
    setupExamples();
    setupDialog();
});

// Bootstrap.
// https://getbootstrap.com/docs/5.3/components/navs-tabs/
function setupTabs() {
    const tabs = document.querySelectorAll("[data-bs-toggle=pill]");
    if (!tabs.length) return;
    function followHash() {
        const target = window.location.hash || "#history";
        tabs.forEach(function (tab) {
            if (tab.dataset.bsTarget === target) bootstrap.Tab.getOrCreateInstance(tab).show();
        });
    }
    tabs.forEach(function (tab) {
        tab.addEventListener("shown.bs.tab", function () {
            // replaceState keeps tab clicks from adding many browser history entries.
            history.replaceState(null, "", tab.dataset.bsTarget);
        });
    });
    followHash();
    window.addEventListener("hashchange", followHash);
}

function setupTheme() {
    const button = document.getElementById("theme-button");
    if (!button) return;
    button.addEventListener("click", function () {
        const isDark = document.documentElement.dataset.bsTheme !== "dark";
        document.documentElement.dataset.bsTheme = isDark ? "dark" : "light";
        button.textContent = isDark ? "Light mode" : "Dark mode";
        button.setAttribute("aria-pressed", String(isDark));
    });
}

function showStatus(element, message, type) {
    if (!element) return;
    element.className = "status-banner visible alert alert-" + type;
    element.textContent = message;
}

// Each results area keeps a counter ignroing older replies from previous searches.
async function loadSummary(query, status, results) {
    const requestNumber = Number(results.dataset.request || 0) + 1;
    results.dataset.request = requestNumber;
    results.replaceChildren();
    results.setAttribute("aria-busy", "true");
    showStatus(status, "Searching Wikipedia…", "info");
    const aliases = { "mosaic": "Mosaic_(web_browser)", "ncsa mosaic": "Mosaic_(web_browser)", "mozilla firefox": "Firefox", "css": "CSS", "cascading style sheets": "CSS" };
    const name = query.replace(/_/g, " ").trim();
    const title = aliases[name.toLowerCase()] || name.replace(/ /g, "_");
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 10000);
    try {
        const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title), { signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "Topic not found. Try a featured topic or the full article name." : "Wikipedia is unavailable. Please try again later.");
        const data = await response.json();
        if (!data.title || data.type === "disambiguation") throw new Error("Please enter a more specific article name.");
        if (Number(results.dataset.request) !== requestNumber) return;
        const card = document.createElement("article");
        card.className = "card";
        const body = document.createElement("div");
        body.className = "card-body";
        const heading = document.createElement("h3");
        heading.textContent = data.title;
        const text = document.createElement("p");
        text.textContent = data.extract || "No summary is available.";
        body.append(heading, text);
        const url = safeUrl(data.content_urls && data.content_urls.desktop.page);
        if (url) {
            const link = document.createElement("a");
            link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
            link.textContent = "Read on Wikipedia (new tab)";
            body.append(link);
        }
        const button = document.createElement("button");
        button.type = "button"; button.className = "btn btn-outline-secondary d-block mt-3 open-details-btn";
        button.textContent = "View details";
        button.dataset.title = data.title; button.dataset.extract = text.textContent;
        body.append(button); card.append(body); results.append(card);
        showStatus(status, "Live Wikipedia result: " + data.title + ".", "success");
    } catch (error) {
        if (Number(results.dataset.request) !== requestNumber) return;
        showStatus(status, error.name === "AbortError" ? "The search timed out. Please try again." : error.message, "danger");
    } finally {
        clearTimeout(timeout);
        if (Number(results.dataset.request) === requestNumber) results.setAttribute("aria-busy", "false");
    }
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol === "https:" && url.hostname === "en.wikipedia.org") return url.href;
    } catch (error) { /* A missing or invalid link is not displayed. */ }
    return null;
}

function setupSearch() {
    const form = document.getElementById("api-search-form");
    if (!form) return;
    const input = document.getElementById("tech-search-input");
    const select = document.getElementById("preset-select");
    const status = document.getElementById("api-status");
    const results = document.getElementById("api-results-container");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (input.value.trim().length < 2) {
            showStatus(status, "Enter at least two characters.", "danger");
            input.setAttribute("aria-invalid", "true"); input.focus(); return;
        }
        input.removeAttribute("aria-invalid");
        loadSummary(input.value.trim(), status, results);
    });
    select.addEventListener("change", function () {
        if (!select.value) return;
        input.removeAttribute("aria-invalid");
        input.value = select.value.replace(/_/g, " ");
        loadSummary(select.value, status, results);
    });
}

// Rules for required/type/min/max validation for form.
// https://www.w3schools.com/js/js_validation.asp
function setupForm() {
    const form = document.getElementById("nostalgia-form");
    if (!form) return;
    const rating = document.getElementById("nostalgia-rating");
    const output = document.getElementById("rating-output");
    const memory = document.getElementById("memory-text");
    const count = document.getElementById("char-count");
    const feedback = document.getElementById("form-feedback");
    const status = document.getElementById("browser-lookup-status");
    const results = document.getElementById("browser-historical-card");
    rating.addEventListener("input", function () { output.textContent = rating.value + " / 10"; });
    memory.addEventListener("input", function () { count.textContent = memory.value.length + " / 500 characters"; });
    document.getElementById("memory-prompt-btn").addEventListener("click", function () {
        document.getElementById("memory-hint").textContent = "What was the first website you remember visiting?"; memory.focus();
    });
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); showStatus(feedback, "Complete the required fields marked with *.", "danger"); return; }
        showStatus(feedback, "Thank you, " + document.getElementById("fname").value.trim() + ". Your score is " + rating.value + "/10. Nothing from the form has been saved or sent.", "success");
        results.dataset.request = Number(results.dataset.request || 0) + 1;
        results.replaceChildren(); status.className = "status-banner";
        const browser = document.getElementById("browser-select").value;
        if (browser && browser !== "other") loadSummary(browser, status, results);
    });
    form.addEventListener("reset", function () {
        results.dataset.request = Number(results.dataset.request || 0) + 1;
        results.replaceChildren(); results.setAttribute("aria-busy", "false");
        feedback.className = status.className = "status-banner";
        output.textContent = rating.defaultValue + " / 10"; count.textContent = "0 / 500 characters";
        document.getElementById("memory-hint").textContent = "";
    });
}

function setupTable() {
    const input = document.getElementById("browser-filter");
    if (!input) return;
    const rows = document.querySelectorAll("table tbody tr");
    function filter() {
        let count = 0;
        rows.forEach(function (row) {
            row.hidden = !row.textContent.toLowerCase().includes(input.value.toLowerCase().trim());
            if (!row.hidden) count++;
        });
        document.getElementById("filter-status").textContent = count + " of " + rows.length + " browsers shown.";
    }
    input.addEventListener("input", filter); filter();
}

function setupExamples() {
    const output = document.getElementById("demo-output");
    if (!output) return;
    function bind(id, action) { document.getElementById(id).addEventListener("click", action); }
    bind("text-demo", function () { showStatus(output, "JavaScript changed this text using textContent.", "info"); });
    bind("html-demo", function () { output.className = "alert alert-info"; output.innerHTML = "<strong>This text is bold.</strong> The HTML comes from the script, not user input."; });
    bind("calculate-demo", function () { showStatus(output, "It is " + (new Date().getFullYear() - 1989) + " years since the Web was proposed in 1989.", "info"); });
    bind("alert-demo", function () { window.alert("Hello! This is a JavaScript alert."); });
    bind("console-demo", function () { console.log("Hello from Web Technologies!"); showStatus(output, "Open developer tools and select Console to see the message.", "info"); });
    bind("print-demo", function () { window.print(); });
}

function setupDialog() {
    const dialog = document.getElementById("details-modal");
    let opener;
    document.addEventListener("click", function (event) {
        const button = event.target.closest(".open-details-btn");
        if (!button) return;
        opener = button;
        document.getElementById("modal-title").textContent = button.dataset.title;
        document.getElementById("modal-body").textContent = button.dataset.extract;
        dialog.showModal();
    });
    document.getElementById("modal-close-btn").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () { if (opener) opener.focus(); });
}
