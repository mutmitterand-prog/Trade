const STORAGE_KEY = "fkm_trades_v22";

let equityChart;

/* =========================
   STORAGE
========================= */

function getTrades() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveTrades(trades) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

/* =========================
   CONTROLES TRADING
========================= */

function checkSession() {

    const session = document.getElementById("session-select")?.value;
    const hour = new Date().getHours();

    if (!session || session === "all") return true;

    if (session === "morning" && hour >= 9 && hour <= 12) return true;

    if (session === "evening" && hour >= 15 && hour <= 18) return true;

    return false;
}

function checkATR() {

    const atr = parseFloat(document.getElementById("atr-input")?.value);
    const status = document.getElementById("atr-status");

    if (!atr || isNaN(atr)) {

        status.innerText = "ATR non défini";
        status.style.color = "#FFA500";

        return false;
    }

    if (atr >= 1) {

        status.innerText = "Volatilité OK";
        status.style.color = "#00FF00";

        return true;
    }

    status.innerText = "Volatilité faible";
    status.style.color = "#FF0000";

    return false;
}

function updateStatus() {

    const status = document.getElementById("trading-status");

    const ok = checkSession() && checkATR();

    status.innerText = ok ? "TRADING OK" : "TRADING BLOQUÉ";
    status.style.color = ok ? "#00FF00" : "#FF0000";
}

/* =========================
   ADD TRADE
========================= */

function addTrade() {

    if (!checkSession()) {
        alert("Hors session trading");
        return;
    }

    if (!checkATR()) {
        alert("ATR trop faible");
        return;
    }

    const pnlInput = document.getElementById("j-pnl").value;

    if (!pnlInput) return;

    const pnl = parseFloat(pnlInput);

    const trades = getTrades();

    const trade = {

        id: Date.now(),
        timestamp: Date.now(),

        market: document.getElementById("j-market").value,
        result: document.getElementById("j-result").value,

        pnl: document.getElementById("j-result").value === "Perte"
            ? -Math.abs(pnl)
            : Math.abs(pnl),

        note: document.getElementById("j-note").value
    };

    trades.push(trade);

    saveTrades(trades);

    render();
}

/* =========================
   DELETE
========================= */

function deleteTrade(id) {

    const trades = getTrades().filter(t => t.id !== id);

    saveTrades(trades);

    render();
}

/* =========================
   RENDER
========================= */

function render() {

    const trades = getTrades();

    renderTable(trades);
    renderStats(trades);
    renderChart(trades);
    analyzeAI(trades);
    updateStatus();
}

/* =========================
   TABLE
========================= */

function renderTable(trades) {

    const body = document.getElementById("journal-body");

    body.innerHTML = "";

    trades.slice().reverse().forEach(t => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${new Date(t.timestamp).toLocaleString()}</td>
            <td>${t.market}</td>
            <td>${t.result}</td>
            <td class="${t.pnl >= 0 ? "val-gain" : "val-perte"}">${t.pnl.toFixed(2)} $</td>
            <td>${t.note}</td>
            <td><button onclick="deleteTrade(${t.id})">X</button></td>
        `;

        body.appendChild(tr);
    });
}

/* =========================
   STATS
========================= */

function renderStats(trades) {

    let total = 0;
    let wins = 0;

    let balance = 100;
    let peak = 100;
    let drawdown = 0;

    trades.forEach(t => {

        total += t.pnl;
        balance += t.pnl;

        if (t.pnl > 0) wins++;

        if (balance > peak) peak = balance;

        let dd = peak - balance;

        if (dd > drawdown) drawdown = dd;
    });

    const winrate = trades.length
        ? (wins / trades.length) * 100
        : 0;

    document.getElementById("pnl-day").innerText = total.toFixed(2);
    document.getElementById("pnl-week").innerText = total.toFixed(2);
    document.getElementById("pnl-month").innerText = total.toFixed(2);
    document.getElementById("pnl-year").innerText = total.toFixed(2);

    document.getElementById("winrate").innerText = winrate.toFixed(1) + "%";
    document.getElementById("total-trades").innerText = trades.length;
    document.getElementById("drawdown").innerText = drawdown.toFixed(2);
}

/* =========================
   CHART
========================= */

function renderChart(trades) {

    const ctx = document.getElementById("equityChart");

    let cap = 100;

    const data = [];

    trades.forEach(t => {
        cap += t.pnl;
        data.push(cap);
    });

    if (equityChart) equityChart.destroy();

    equityChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: "Equity",
                data
            }]
        }
    });
}

/* =========================
   AI ANALYSIS
========================= */

function analyzeAI(trades) {

    if (trades.length < 3) return;

    let total = 0;
    let wins = 0;

    let marketStats = {};
    let noteStats = {};

    trades.forEach(t => {

        total += t.pnl;

        if (t.pnl > 0) wins++;

        marketStats[t.market] = (marketStats[t.market] || 0) + t.pnl;
        noteStats[t.note] = (noteStats[t.note] || 0) + t.pnl;
    });

    const winrate = (wins / trades.length) * 100;

    let bestMarket = "";
    let bestSetup = "";

    let bestM = -999999;
    let bestS = -999999;

    for (let
