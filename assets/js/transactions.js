window.FinanceTransactions = (() => {
  let selectedType = "expense";

  function formatCurrency(amount) {
    return FinanceApp.formatCurrency(amount);
  }

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = String(value);
    return element.innerHTML;
  }

  function populateCategoryOptions(type, selectedCategory = "") {
    const select = document.getElementById("transactionCategory");
    const categories = type === "income" ? FinanceStorage.incomeCategories : FinanceStorage.expenseCategories;
    select.innerHTML = `<option value="">Select category</option>` + categories.map(category =>
      `<option value="${category}" ${category === selectedCategory ? "selected" : ""}>${category}</option>`
    ).join("");
  }

  function openModal(transaction = null) {
    const modal = document.getElementById("transactionModal");
    document.getElementById("transactionModalTitle").textContent = transaction ? "Edit transaction" : "Add transaction";
    document.getElementById("transactionId").value = transaction?.id || "";
    document.getElementById("transactionDescription").value = transaction?.description || "";
    document.getElementById("transactionAmount").value = transaction?.amount || "";
    document.getElementById("transactionDate").value = transaction?.date || new Date().toISOString().slice(0, 10);
    document.getElementById("transactionError").textContent = "";
    selectedType = transaction?.type || "expense";
    setType(selectedType);
    populateCategoryOptions(selectedType, transaction?.category || "");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => document.getElementById("transactionDescription").focus(), 50);
  }

  function closeModal() {
    const modal = document.getElementById("transactionModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function setType(type) {
    selectedType = type;
    document.querySelectorAll(".type-option").forEach(button => {
      button.classList.toggle("active", button.dataset.type === type);
    });
    populateCategoryOptions(type);
  }

  function saveTransaction(event) {
    event.preventDefault();
    const id = document.getElementById("transactionId").value;
    const description = document.getElementById("transactionDescription").value.trim();
    const amount = Number(document.getElementById("transactionAmount").value);
    const category = document.getElementById("transactionCategory").value;
    const date = document.getElementById("transactionDate").value;
    const error = document.getElementById("transactionError");

    if (!description) return void (error.textContent = "Enter a description.");
    if (!Number.isFinite(amount) || amount <= 0) return void (error.textContent = "Enter a positive amount.");
    if (!category) return void (error.textContent = "Select a category.");
    if (!date) return void (error.textContent = "Select a date.");

    const data = FinanceStorage.load();
    const transaction = { id: id || FinanceStorage.createId(), description, amount, type: selectedType, category, date };
    if (id) {
      const index = data.transactions.findIndex(item => item.id === id);
      if (index >= 0) data.transactions[index] = transaction;
    } else {
      data.transactions.push(transaction);
    }
    data.transactions.sort((a, b) => b.date.localeCompare(a.date));
    FinanceStorage.save(data);
    closeModal();
    FinanceApp.notify(id ? "Transaction updated" : "Transaction added");
    FinanceApp.refresh();
  }

  function deleteTransaction(id) {
    if (!confirm("Delete this transaction?")) return;
    const data = FinanceStorage.load();
    data.transactions = data.transactions.filter(transaction => transaction.id !== id);
    FinanceStorage.save(data);
    FinanceApp.notify("Transaction deleted");
    FinanceApp.refresh();
  }

  function renderTable() {
    const data = FinanceStorage.load();
    const search = document.getElementById("searchTransactions").value.trim().toLowerCase();
    const type = document.getElementById("filterType").value;
    const category = document.getElementById("filterCategory").value;
    const month = document.getElementById("filterMonth").value;

    const filtered = data.transactions
      .filter(transaction => !search || transaction.description.toLowerCase().includes(search))
      .filter(transaction => type === "all" || transaction.type === type)
      .filter(transaction => category === "all" || transaction.category === category)
      .filter(transaction => !month || transaction.date.startsWith(month))
      .sort((a, b) => b.date.localeCompare(a.date));

    const body = document.getElementById("transactionTableBody");
    body.innerHTML = filtered.map(transaction => `
      <tr>
        <td><strong>${escapeHtml(transaction.description)}</strong></td>
        <td>${escapeHtml(transaction.category)}</td>
        <td><span class="type-pill ${transaction.type}">${transaction.type === "income" ? "Income" : "Expense"}</span></td>
        <td>${escapeHtml(formatDate(transaction.date))}</td>
        <td class="align-right"><strong>${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}</strong></td>
        <td><div class="row-actions">
          <button type="button" data-edit="${transaction.id}" aria-label="Edit ${escapeHtml(transaction.description)}">✎</button>
          <button type="button" data-delete="${transaction.id}" aria-label="Delete ${escapeHtml(transaction.description)}">⌫</button>
        </div></td>
      </tr>
    `).join("");
    document.getElementById("transactionEmpty").classList.toggle("hidden", filtered.length > 0);
  }

  function formatDate(date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }

  function populateFilterCategories() {
    const select = document.getElementById("filterCategory");
    const categories = [...new Set([...FinanceStorage.expenseCategories, ...FinanceStorage.incomeCategories])];
    select.innerHTML = `<option value="all">All categories</option>` + categories.map(category => `<option value="${category}">${category}</option>`).join("");
  }

  function renderRecent() {
    const data = FinanceStorage.load();
    const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const container = document.getElementById("recentTransactions");
    if (!recent.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">↕</div><h3>No transactions yet</h3><p>Add your first transaction to begin.</p></div>`;
      return;
    }
    container.innerHTML = recent.map(transaction => `
      <div class="transaction-row">
        <div class="transaction-badge ${transaction.type}">${transaction.type === "income" ? "↗" : "↘"}</div>
        <div class="transaction-info"><strong>${escapeHtml(transaction.description)}</strong><span>${escapeHtml(transaction.category)}</span></div>
        <div class="transaction-date">${escapeHtml(formatDate(transaction.date))}</div>
        <div class="transaction-amount ${transaction.type}">${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}</div>
      </div>
    `).join("");
  }

  function init() {
    populateFilterCategories();
    document.getElementById("transactionForm").addEventListener("submit", saveTransaction);
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("cancelModal").addEventListener("click", closeModal);
    document.getElementById("transactionModal").addEventListener("click", event => {
      if (event.target.id === "transactionModal") closeModal();
    });
    document.querySelectorAll(".type-option").forEach(button => button.addEventListener("click", () => setType(button.dataset.type)));
    ["searchTransactions", "filterType", "filterCategory", "filterMonth"].forEach(id =>
      document.getElementById(id).addEventListener(id === "searchTransactions" ? "input" : "change", renderTable)
    );
    document.getElementById("transactionTableBody").addEventListener("click", event => {
      const edit = event.target.closest("[data-edit]");
      const remove = event.target.closest("[data-delete]");
      if (edit) {
        const transaction = FinanceStorage.load().transactions.find(item => item.id === edit.dataset.edit);
        if (transaction) openModal(transaction);
      }
      if (remove) deleteTransaction(remove.dataset.delete);
    });
  }

  return { init, openModal, renderTable, renderRecent, formatDate };
})();
