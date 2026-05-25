const STORAGE_KEY = 'fkm_trades_v22';

let equityChart;

/* =========================
   STORAGE
========================= */

function getTrades() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
    );
}

function saveTrades(trades) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trades)
    );
}

/* =========================
   CONTROLES TRADING
========================= */

function checkSession() {

    const session = document.getElementById('session-select')?.value;
    const hour = new Date().getHours();

    if (!session || session === 'all') return true;

    if (session === 'morning' && hour >= 9 && hour <= 12) return true;

    if (session === 'evening' && hour >= 15 && hour <= 18) return true;

    return false;
}

function checkATR() {

    const atr = parseFloat(
        document.getElementById('atr-input')?.value
    );

    const status = document.getElementById('atr-status');

    if (!atr || isNaN(atr)) {
        status.innerText = '⚠ ATR non défini';
        status.style.color = '#FFA500';
        return false;
    }

    if (atr >= 1) {
        status.innerText = '✅ Volatilité OK';
        status.style.color = '#00FF00';
        return true;
    }

    status.innerText = '⛔ Volatilité faible';
    status.style.color = '#FF0000';
    return false;
}

function updateStatus() {

    const status = document.getElementById('trading-status');

    const sessionOk = checkSession();
    const atrOk = checkATR();

    if (sessionOk && atrOk) {
        status.innerText = '✅ TRADING AUTORISÉ';
        status.style.color = '#00FF00';
    } else {
        status.innerText = '⛔ TRADING BLOQUÉ';
        status.style.color = '#FF0000';
    }
}

/* =========================
   TRADES
========================= */

function addTrade() {

    if (!checkSession()) {
        alert('⛔ Hors session de trading');
        return;
    }

    if (!checkATR()) {
        alert('⛔ Volatilité trop faible (ATR)');
        return;
    }

    const pnl = parseFloat(
        document.getElementById('j-pnl').value
    );

    if (isNaN(pnl)) return;

    const trades = getTrades();

    const result =
        document.getElementById('j-result').value;

    const trade = {
        id: Date.now(),
        timestamp: Date.now(),
        market: document.getElementById('j-market').value,
        result,
        pnl: result === 'Perte' ? -Math.abs(pnl) : Math.abs(pnl),
        note: document.getElementById('j-note').value
    };

    trades.push(trade);

    saveTrades(trades);

    render();
}

/* =========================
   DELETE
========================= */

function deleteTrade(id) {

    const trades = getTrades()
        .filter(t => t.id !== id);

    saveTrades(trades);

    render();
}

/* =========================
   RENDER MAIN
========================= */

function render() {

    const trades = getTrades();

    renderTable(trades);
    renderStats(trades);
    renderChart(trades);

    updateStatus();
}

/* =========================
   TABLE
========================= */

function renderTable(trades) {

    const filter =
        document.getElementById('market-filter').value;

    const body =
        document.getElementById('journal-body');

    body.innerHTML = '';

    let filtered = trades;

    if (filter !== 'all') {
        filtered = trades.filter(
            t => t.market === filter
        );
    }

    filtered
        .slice()
        .reverse()
        .forEach(t => {

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${new Date(t.timestamp).toLocaleString('fr-FR')}</td>
                <td>${t.market}</td>
                <td class="${t.pnl >= 0 ? 'val-gain' : 'val-perte'}">${t.result}</td>
                <td class="${t.pnl >= 0 ? 'val-gain' : 'val-perte'}">${t.pnl.toFixed(2)} $</td>
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
    let losses = 0;
    let peak = 100;
    let balance = 100;
    let drawdown = 0;

    trades.forEach(t => {

        total += t.pnl;
        balance += t.pnl;

        if (t.pnl > 0) wins++;
        if (t.pnl < 0) losses++;

        if (balance > peak) peak = balance;

        const dd = peak - balance;

        if (dd > drawdown) drawdown = dd;
    });

    const winrate =
        trades.length > 0
            ? ((wins / trades.length) * 100).toFixed(1)
            : 0;

    document.getElementById('pnl-day').innerText = total.toFixed(2) + ' $';
    document.getElementById('pnl-week').innerText = total.toFixed(2) + ' $';
    document.getElementById('pnl-month').innerText = total.toFixed(2) + ' $';
    document.getElementById('pnl-year').innerText = total.toFixed(2) + ' $';

    document.getElementById('pnl-total-perc').innerText =
        ((total / 100) * 100).toFixed(1) + '%';

    document.getElementById('winrate').innerText = winrate + '%';
    document.getElementById('total-trades').innerText = trades.length;
    document.getElementById('drawdown').innerText = drawdown.toFixed(2) + ' $';
}

/* =========================
   CHART
========================= */

function renderChart(trades) {

    const ctx = document.getElementById('equityChart');

    let capital = 100;

    const labels = [];
    const data = [];

    trades.forEach((t, i) => {

        capital += t.pnl;

        labels.push(i + 1);
        data.push(capital);
    });

    if (equityChart) equityChart.destroy();

    equityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Capital',
                data
            }]
        }
    });
}

/* =========================
   EXPORT / IMPORT
========================= */

function exportTrades() {

    const trades = localStorage.getItem(STORAGE_KEY);

    const blob = new Blob([trades], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = 'backup_trades.json';
    a.click();
}

function importTrades() {

    const file = document.getElementById('import-file').files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {

        localStorage.setItem(STORAGE_KEY, e.target.result);
        render();
    };

    reader.readAsText(file);
}

function clearTrades() {

    if (confirm('Effacer historique ?')) {

        localStorage.removeItem(STORAGE_KEY);
        render();
    }
}

/* =========================
   EVENTS
========================= */

document.getElementById('add-trade-btn')
    .addEventListener('click', addTrade);

document.getElementById('market-filter')
    .addEventListener('change', render);

/* =========================
   INIT
========================= */

render();