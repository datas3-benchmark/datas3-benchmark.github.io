const SHEET_ID = "1gcVuPauUBilom_pjxOlzuY6BOZi0jZ77I1mpsG-cd-U";  // 🔹 Replace with your actual Google Sheets ID
let leaderboardData = [];
let currentSort = { column: null, ascending: true };

async function fetchLeaderboard(sheetName) {
    const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

    try {
        const response = await fetch(API_URL);
        const text = await response.text();
        const json = JSON.parse(text.substring(47, text.length - 2));  // Cleanup API response
        
        // Extract headers dynamically
        const headers = json.table.cols.map(col => col.label);
        generateHeaders(headers);

        // Process data dynamically
        leaderboardData = json.table.rows.map(row => {
            let rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row.c[index] ? row.c[index].v : "-";
            });
            return rowData;
        });

        updateLeaderboard(headers);

        // Update button styles
        document.getElementById("nuscenes-btn").classList.toggle("active", sheetName === "NuScenes");
        document.getElementById("iwildcam-btn").classList.toggle("active", sheetName === "iWildCam");
        document.getElementById("autoarborist-btn").classList.toggle("active", sheetName === "AutoArborist");

    } catch (error) {
        console.error("Error fetching Google Sheets data:", error);
    }
}

function generateHeaders(headers) {
    let headerRow1 = `<tr><th rowspan="2">${headers[0]}</th>`; // Baseline Method column
    let headerRow2 = "<tr>";

    for (let i = 1; i < headers.length; i += 2) {
        let deploymentNum = Math.ceil(i / 2);
        let deploymentClass = `deployment-${deploymentNum}`;
        
        headerRow1 += `<th colspan="2" class="${deploymentClass}">Deployment ${deploymentNum}</th>`;
        headerRow2 += `<th class="${deploymentClass}" onclick="sortLeaderboard('${headers[i]}')">${headers[i]} 🔽</th>`;
        headerRow2 += `<th class="${deploymentClass}" onclick="sortLeaderboard('${headers[i+1]}')">${headers[i+1]} 🔽</th>`;
    }

    headerRow1 += "</tr>";
    headerRow2 += "</tr>";

    document.getElementById("leaderboard-header").innerHTML = headerRow1 + headerRow2;
}

function updateLeaderboard(headers) {
    let tableBody = document.getElementById("leaderboard-body");
    tableBody.innerHTML = "";

    leaderboardData.forEach(entry => {
        let rowHTML = `<tr><td>${entry[headers[0]]}</td>`; // Baseline Method

        for (let i = 1; i < headers.length; i++) {
            rowHTML += `<td>${entry[headers[i]]}</td>`;
        }

        rowHTML += "</tr>";
        tableBody.innerHTML += rowHTML;
    });
}

function sortLeaderboard(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort = { column, ascending: true };
    }

    leaderboardData.sort((a, b) => {
        let valA = isNaN(a[column]) ? a[column] : parseFloat(a[column]);
        let valB = isNaN(b[column]) ? b[column] : parseFloat(b[column]);
        return currentSort.ascending ? valA - valB : valB - valA;
    });

    updateLeaderboard(Object.keys(leaderboardData[0]));
}

// Load NuScenes by default
fetchLeaderboard("AutoArborist");
