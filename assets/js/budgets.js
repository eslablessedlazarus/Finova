window.FinanceBudgets = (() => {
  function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getBudget(month) {
    const data = FinanceStorage.load();
    return data.budgets[month] || { overall: 0, categories: {} };
  }

  function spentForCategory(month, category) {
    return FinanceStorage.load().transactions
      .filter(item => item.type === "expense" && item.date.startsWith(month) && item.category === category)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }

  function totalSpent(month) {
    return FinanceStorage.load().transactions
      .filter(item => item.type === "expense" && item.date.startsWith(month))
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }

  function progressFill(percent) {
    return percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";
  }

  function renderCategoryFields(month) {
    const container = document.getElementById("categoryBudgetFields");
    const budget = getBudget(month);
    container.innerHTML = FinanceStorage.expenseCategories.map(category => `
      <label class="category-budget-row">${category}
        <input type="number" min="0" step="0.01" data-category="${category}" value="${budget.categories[category] || ""}" placeholder="0.00">
      </label>
    `).join("");
  }

  function renderBudgetList() {
    const month = document.getElementById("budgetMonth").value || currentMonth();
    const budget = getBudget(month);
    const list = document.getElementById("budgetList");
    const entries = [];
    if (Number(budget.overall) > 0) entries.push({ name: "Overall spending", limit: Number(budget.overall), spent: totalSpent(month) });
    FinanceStorage.expenseCategories.forEach(category => {
      const limit = Number(budget.categories[category] || 0);
      if (limit > 0) entries.push({ name: category, limit, spent: spentForCategory(month, category) });
    });
    if (!entries.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">◫</div><h3>No budgets set</h3><p>Create a monthly budget to track spending.</p></div>`;
      return;
    }
    list.innerHTML = entries.map(entry => {
      const percent = entry.limit > 0 ? (entry.spent / entry.limit) * 100 : 0;
      const remaining = entry.limit - entry.spent;
      return `<div class="budget-card">
        <div class="budget-card-header"><strong>${entry.name}</strong><span>${FinanceApp.formatCurrency(entry.spent)} of ${FinanceApp.formatCurrency(entry.limit)}</span></div>
        <div class="progress-track"><div class="progress-fill ${progressFill(percent)}" style="width:${Math.min(percent, 100)}%"></div></div>
        <div class="progress-item-header" style="margin-top:8px"><span>${Math.round(percent)}% used</span><span>${remaining >= 0 ? FinanceApp.formatCurrency(remaining) + " remaining" : FinanceApp.formatCurrency(Math.abs(remaining)) + " over"}</span></div>
      </div>`;
    }).join("");
  }

  function renderOverview() {
    const month = document.getElementById("dashboardMonth").value || currentMonth();
    const budget = getBudget(month);
    const container = document.getElementById("budgetOverview");
    const entries = [];
    if (Number(budget.overall) > 0) entries.push({ name: "Overall", limit: Number(budget.overall), spent: totalSpent(month) });
    FinanceStorage.expenseCategories.forEach(category => {
      const limit = Number(budget.categories[category] || 0);
      if (limit > 0) entries.push({ name: category, limit, spent: spentForCategory(month, category) });
    });
    if (!entries.length) {
      container.innerHTML = `<div class="empty-state"><p>No budgets set for this month.</p></div>`;
      return;
    }
    container.innerHTML = entries.slice(0, 4).map(entry => {
      const percent = (entry.spent / entry.limit) * 100;
      return `<div class="progress-item"><div class="progress-item-header"><span>${entry.name}</span><span>${Math.round(percent)}%</span></div><div class="progress-track"><div class="progress-fill ${progressFill(percent)}" style="width:${Math.min(percent, 100)}%"></div></div></div>`;
    }).join("");
  }

  function render() {
    const monthInput = document.getElementById("budgetMonth");
    if (!monthInput.value) monthInput.value = currentMonth();
    renderCategoryFields(monthInput.value);
    document.getElementById("overallBudget").value = getBudget(monthInput.value).overall || "";
    renderBudgetList();
  }

  function save(event) {
    event.preventDefault();
    const month = document.getElementById("budgetMonth").value;
    if (!month) return FinanceApp.notify("Select a budget month", true);
    const overall = Number(document.getElementById("overallBudget").value) || 0;
    if (overall < 0) return FinanceApp.notify("Budget amount cannot be negative", true);
    const categories = {};
    document.querySelectorAll("[data-category]").forEach(input => {
      const value = Number(input.value) || 0;
      if (value < 0) return;
      if (value > 0) categories[input.dataset.category] = value;
    });
    const data = FinanceStorage.load();
    data.budgets[month] = { overall, categories };
    FinanceStorage.save(data);
    renderBudgetList();
    renderOverview();
    FinanceApp.notify("Budgets saved");
  }

  function init() {
    document.getElementById("budgetMonth").addEventListener("change", render);
    document.getElementById("budgetForm").addEventListener("submit", save);
  }

  return { init, render, renderOverview, getBudget, totalSpent };
})();
