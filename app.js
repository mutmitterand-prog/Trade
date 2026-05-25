const STORAGE_KEY = "fkm_trades_v22";

let equityChart;

/* STORAGE */
function getTrades() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveTrades(trades) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

/* CHECKLIST */
function checkChecklist() {
    const checks = document.querySelectorAll(".t-check");
    let score = 0;
    checks.forEach(c => c.checked && score++);
    return score;
}

function updateChecklistUI() {
    const score = checkChecklist();
    const el = document.getElementById("check-status");
    el.innerText = `${score}/4`;
    el.style.color = score >= 3 ? "#00FF00" : "#FF0000";
}

/* SESSION */
function checkSession() {
    const s = document.getElementById("session-select").value;
    const h = new Date().getHours();

    if (s === "all") return true;
    if (s === "morning") return h >= 8 && h <= 12;
    if (s === "evening") return h >= 15 && h <= 20;

    return false;
}

/* ATR */
function checkATR() {
    const atr = parseFloat(document.getElementById("atr-input").value);
    const el = document.getElementById("atr-status");

    if (!atr || isNaN(atr)) {
        el.innerText = "ATR ?";
        el.style.color = "orange";
        return false;
    }

    if (atr >= 1) {
        el.innerText = "OK";
        el.style.color = "lime";
        return true;
    }

    el.innerText = "FAIBLE";
    el.style.color = "red";
    return false;
}

/* ADD TRADE */
function addTrade() {

    if (checkChecklist() < 3) return alert("Checklist insuffisante");
    if (!checkSession()) return alert("Hors session");
    if (!checkATR()) return alert("ATR faible");

    const pnl = parseFloat(document.getElementById("j-pnl").value);
    if (isNaN(pnl)) return;

    const trades = getTrades();

    trades.push({
        id: Date.now(),
        timestamp: Date.now(),
        market: j-market.value,
        result: j-result.value,
        pnl: j-result.value === "Perte" ? -Math.abs(pnl) : Math.abs(pnl),
        note: document.getElementById("j-note").value
    });

    saveTrades(trades);
    render();
}

/* DELETE */
function deleteTrade(id) {
    saveTrades(getTrades().filter(t => t.id !== id));
    render();
}

/* RENDER */
function render() {
    const trades = getTrades();

    renderTable(trades);
    renderStats(trades);
    renderChart(trades);

    updateChecklistUI();
    updateAI(trades);
}

/* TABLE */
function renderTable(trades) {

    const body = document.getElementById("journal-body");
    body.innerHTML = "";

    trades.slice().reverse().forEach(t => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${new Date(t.timestamp).toLocaleString()}</td>
            <td>${t.market}</td>
            <td>${t.result}</td>
            <td>${t.pnl.toFixed(2)}</td>
            <td>${t.note}</td>
            <td><button onclick="deleteTrade(${t.id})">X</button></td>
        `;

        body.appendChild(tr);
    });
}

/* STATS */
function renderStats(trades) {

    let total = 0, wins = 0;

    trades.forEach(t => {
        total += t.pnl;
        if (t.pnl > 0) wins++;
    });

    const winrate = trades.length ? (wins / trades.length) * 100 : 0;

    document.getElementById("pnl-day").innerText = total.toFixed(2);
    document.getElementById("winrate").innerText = winrate.toFixed(1);
    document.getElementById("total-trades").innerText = trades.length;
}

/* AI */
function updateAI(trades) {

    if (trades.length < 3) return;

    let total = 0, wins = 0;

    trades.forEach(t => {
        total += t.pnl;
        if (t.pnl > 0) wins++;
    });

    const winrate = (wins / trades.length) * 100;

    document.getElementById("ai-box").innerHTML = `
        <h2>AI</h2>
        <p>Winrate: ${winrate.toFixed(1)}%</p>
        <p>Trades: ${trades.length}</p>
    `;
}

/* INIT */
document.getElementById("add-trade-btn").addEventListener("click", addTrade);
document.getElementById("market-filter").addEventListener("change", render);

render();
