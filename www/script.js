const API = "http://192.168.100.187:3000";
console.log("POWERTRACKER API:", API);

function show(id) {
    document.querySelectorAll(".page-section").forEach(function(page) {
        page.classList.add("hidden");
    });

    const page = document.getElementById(id);

    if (page) {
        page.classList.remove("hidden");
    }
}

function goHome() {
    show("homePage");
    loadHomeStatus();
}

function showSchedule() {
    show("schedulePage");
}

function showOutages() {
    show("outagesPage");
    loadOutages();
}

function reportOutage() {
    show("reportPage");
}

function showHistory() {
    show("historyPage");
    loadHistory();
}

async function showAlerts() {
    show("alertsPage");

    const box = document.getElementById("alertsList");

    try {
        const response = await fetch(API + "/api/outages");
        const data = await response.json();

        const outages = data.filter(function(o) {
            return o.status === "Power Outage";
        });

        if (outages.length === 0) {
            box.innerHTML = `
                <div class="alert-card">
                    <strong>⚡ PowerTracker GH</strong>
                    <p>No active outage alerts.</p>
                </div>
            `;
            return;
        }

        box.innerHTML = outages.map(function(o) {
            return `
                <div class="alert-card">
                    <strong>⚡ Power Outage</strong>
                    <p>${o.location} has a reported power outage.</p>
                    <small>Start: ${o.start_time || "N/A"}</small>
                    <small>Restoration: ${o.restoration_time || "N/A"}</small>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Alerts error:", error);

        box.innerHTML = `
            <div class="alert-card">
                <strong>⚠️ Unable to load alerts</strong>
                <p>Please make sure the server is running.</p>
            </div>
        `;
    }
}

function showSettings() {
    show("settingsPage");

    const location =
        localStorage.getItem("location") || "Accra";

    document.getElementById("settingsLocation").textContent =
        location;
}

function changeLocation() {
    const area = prompt("Enter your town or area:");

    if (area) {
        localStorage.setItem("location", area);

        document.getElementById("userLocation").textContent =
            "📍 " + area;

        loadHomeStatus();
    }
}

async function loadHomeStatus() {
    try {
        const response = await fetch(API + "/api/outages");
        const data = await response.json();

        const location =
            localStorage.getItem("location") || "Accra";

        const area = data.find(function(o) {
            return o.location.trim().toLowerCase() ===
                   location.trim().toLowerCase();
        });

        if (!area) {
            return;
        }

        document.getElementById("status").textContent =
            area.status;

        if (area.status === "Power Outage") {
            document.getElementById("statusMessage").textContent =
                "A power outage has been reported in your area.";
        } else {
            document.getElementById("statusMessage").textContent =
                "No active outage has been reported in your area.";
        }

        document.getElementById("lastUpdated").textContent =
            "Just now";

    } catch (error) {
        console.error("Status error:", error);
    }
}

async function loadOutages() {
    const box = document.getElementById("outages");

    if (!box) {
        return;
    }

    try {
        const response = await fetch(API + "/api/outages");
        const data = await response.json();

        box.innerHTML = data.map(function(o) {
            return `
                <div class="outage-card">
                    <h3>${o.location}</h3>
                    <p>Status: ${o.status}</p>
                    <p>Start: ${o.start_time || "N/A"}</p>
                    <p>Restoration: ${o.restoration_time || "N/A"}</p>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Outages error:", error);

        box.innerHTML = `
            <div class="empty-card">
                <strong>Unable to load outages</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function submitReport() {
    const location =
        document.getElementById("reportLocation").value.trim();

    const type =
        document.getElementById("outageType").value;

    const message =
        document.getElementById("reportMessage");

    if (!location || !type) {
        message.textContent =
            "Please enter location and outage type.";
        return;
    }

    try {
        const response = await fetch(API + "/api/outages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                location: location,
                status: type,
                start_time: null,
                restoration_time: null
            })
        });

        const data = await response.json();

        message.textContent =
            data.message || data.error;

        if (response.ok) {
            document.getElementById("reportLocation").value = "";
            document.getElementById("outageType").value = "";
            document.getElementById("reportDescription").value = "";

            loadOutages();
            loadHomeStatus();
        }

    } catch (error) {
        console.error("Report error:", error);

        message.textContent =
            "Unable to submit report.";
    }
}

async function loadHistory() {
    const box = document.getElementById("historyList");

    if (!box) {
        return;
    }

    try {
        const response = await fetch(API + "/api/outages");
        const data = await response.json();

        box.innerHTML = data.map(function(o) {
            return `
                <div class="history-card">
                    <div class="history-header">
                        <strong>${o.status}</strong>
                        <span>${o.location}</span>
                    </div>

                    <p>Reported outage at ${o.location}.</p>

                    <small>
                        Start: ${o.start_time || "N/A"}
                    </small>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("History error:", error);

        box.innerHTML = `
            <div class="empty-card">
                <strong>Unable to load history</strong>
                <p>Please make sure the server is running.</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", function() {

    const location =
        localStorage.getItem("location");

    if (location) {
        document.getElementById("userLocation").textContent =
            "📍 " + location;
    }

    loadHomeStatus();
    loadOutages();
    loadHistory();
});
