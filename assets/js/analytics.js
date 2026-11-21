window.FinanceAnalytics = (() => {
  const chartInstances = {};

  function destroy(name) {
    if (chartInstances[name]) chartInstances[name].destroy();
  }

  function baseOptions(extra = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true } },
        tooltip: { callbacks: { label: context => `${context.label ? context.label + ": " : ""}${FinanceApp.formatCurrency(context.raw)}` } }
      },
      ...extra
    };
  }

  function render() {
    if (!window.Chart) return;
    const data = FinanceStorage.load();
    const income = data.transactions.filter(item => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = data.transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);

    destroy("incomeExpense");
    chartInstances.incomeExpense = new Chart(document.getElementById("incomeExpenseChart"), {
      type: "doughnut",
      data: { labels: ["Income", "Expenses"], datasets: [{ data: [income, expenses], backgroundColor: ["#42a578", "#dd806f"], borderWidth: 0, cutout: "68%" }] },
      options: baseOptions()
    });

    const categoryTotals = {};
    data.transactions.filter(item => item.type === "expense").forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
    });
    const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    destroy("category");
    chartInstances.category = new Chart(document.getElementById("categoryChart"), {
      type: "doughnut",
      data: {
        labels: categoryEntries.map(entry => entry[0]),
        datasets: [{ data: categoryEntries.map(entry => entry[1]), backgroundColor: ["#173f35", "#42a578", "#7189ae", "#dd806f", "#c7923e", "#91aaa1", "#9e7e9d", "#aab7ad"], borderWidth: 0, cutout: "68%" }]
      },
      options: baseOptions()
    });

    const monthMap = {};
    data.transactions.forEach(item => {
      const key = item.date.slice(0, 7);
      monthMap[key] ||= { income: 0, expense: 0 };
      monthMap[key][item.type === "income" ? "income" : "expense"] += Number(item.amount);
    });
    const today = new Date();
    const months = [];
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: date.toLocaleDateString(undefined, { month: "short" }) });
    }
    destroy("trend");
    chartInstances.trend = new Chart(document.getElementById("trendChart"), {
      type: "line",
      data: {
        labels: months.map(month => month.label),
        datasets: [
          { label: "Income", data: months.map(month => monthMap[month.key]?.income || 0), borderColor: "#42a578", backgroundColor: "rgba(66,165,120,.08)", fill: true, tension: .35 },
          { label: "Expenses", data: months.map(month => monthMap[month.key]?.expense || 0), borderColor: "#dd806f", backgroundColor: "rgba(221,128,111,.08)", fill: true, tension: .35 }
        ]
      },
      options: baseOptions({ scales: { y: { beginAtZero: true, grid: { color: "#edf0ed" }, ticks: { callback: value => FinanceApp.formatCompact(value) } }, x: { grid: { display: false } } } })
    });

    const savings = income - expenses;
    destroy("savings");
    chartInstances.savings = new Chart(document.getElementById("savingsChart"), {
      type: "bar",
      data: { labels: ["Income", "Expenses", "Savings"], datasets: [{ data: [income, expenses, Math.max(savings, 0)], backgroundColor: ["#42a578", "#dd806f", "#7189ae"], borderRadius: 8, barThickness: 34 }] },
      options: baseOptions({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => FinanceApp.formatCurrency(context.raw) } } }, scales: { y: { beginAtZero: true, grid: { color: "#edf0ed" } }, x: { grid: { display: false } } } })
    });
  }

  function init() {}
  return { init, render };
})();
