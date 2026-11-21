window.FinanceDashboard = (() => {
  let overviewChart;

  function monthValue(month) {
    return month.slice(0, 7);
  }

  function initMonthOptions() {
    const select = document.getElementById("dashboardMonth");
    const data = FinanceStorage.load();
    const months = new Set(data.transactions.map(transaction => transaction.date.slice(0, 7)));
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    const sorted = [...months].sort().reverse();
    select.innerHTML = sorted.map(month => {
      const date = new Date(`${month}-01T12:00:00`);
      return `<option value="${month}">${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</option>`;
    }).join("");
  }

  function totals() {
    const data = FinanceStorage.load();
    const income = data.transactions.filter(item => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = data.transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, expenses, savings: income - expenses, balance: data.settings.openingBalance + income - expenses };
  }

  function render() {
    initMonthOptions();
    const data = FinanceStorage.load();
    const total = totals();
    const savingsRate = total.income > 0 ? (total.savings / total.income) * 100 : 0;
    const expenseRate = total.income > 0 ? (total.expenses / total.income) * 100 : 0;
    document.getElementById("balanceValue").textContent = FinanceApp.formatCurrency(total.balance);
    document.getElementById("incomeValue").textContent = FinanceApp.formatCurrency(total.income);
    document.getElementById("expenseValue").textContent = FinanceApp.formatCurrency(total.expenses);
    document.getElementById("savingsValue").textContent = FinanceApp.formatCurrency(total.savings);
    document.getElementById("incomeNote").textContent = `${savingsRate.toFixed(1)}% savings rate`;
    document.getElementById("expenseNote").textContent = `${expenseRate.toFixed(1)}% of income`;
    document.getElementById("savingsNote").textContent = `${savingsRate.toFixed(1)}% savings rate`;
    renderMonthOverview();
  }

  function renderMonthOverview() {
    const select = document.getElementById("dashboardMonth");
    if (!select.value) return;
    const data = FinanceStorage.load();
    const month = monthValue(select.value);
    const transactions = data.transactions.filter(item => item.date.startsWith(month));
    const income = transactions.filter(item => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    document.getElementById("monthIncome").textContent = FinanceApp.formatCurrency(income);
    document.getElementById("monthExpense").textContent = FinanceApp.formatCurrency(expenses);

    if (!window.Chart) return;
    const context = document.getElementById("overviewChart");
    if (overviewChart) overviewChart.destroy();
    overviewChart = new Chart(context, {
      type: "bar",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [{ data: [income, expenses], backgroundColor: ["#42a578", "#dd806f"], borderRadius: 8, barThickness: 34 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => FinanceApp.formatCurrency(context.raw) } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: "#edf0ed" }, ticks: { callback: value => FinanceApp.formatCompact(value) } } }
      }
    });
  }

  function init() {
    document.getElementById("dashboardMonth").addEventListener("change", renderMonthOverview);
  }

  return { init, render, totals };
})();
