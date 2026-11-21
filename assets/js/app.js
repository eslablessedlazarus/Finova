window.FinanceApp = (() => {
  let data;

  function formatCurrency(amount) {
    const settings = FinanceStorage.load().settings;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: settings.currency,
        maximumFractionDigits: settings.currency === "JPY" ? 0 : 2
      }).format(Number(amount) || 0);
    } catch (error) {
      return `${settings.currency} ${(Number(amount) || 0).toFixed(2)}`;
    }
  }

  function formatCompact(amount) {
    const settings = FinanceStorage.load().settings;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: settings.currency,
        notation: "compact",
        maximumFractionDigits: 1
      }).format(amount);
    } catch (error) {
      return String(amount);
    }
  }

  function notify(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function navigate(page) {
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === page));
    document.querySelectorAll(".page").forEach(section => section.classList.toggle("active", section.id === `${page}-page`));
    const titles = { dashboard: "Dashboard", transactions: "Transactions", budgets: "Budgets", analytics: "Analytics", settings: "Settings" };
    document.getElementById("pageTitle").textContent = titles[page];
    document.getElementById("sidebar").classList.remove("open");
    if (page === "transactions") FinanceTransactions.renderTable();
    if (page === "budgets") FinanceBudgets.render();
    if (page === "analytics") setTimeout(() => FinanceAnalytics.render(), 20);
    if (page === "dashboard") setTimeout(() => FinanceDashboard.render(), 20);
  }

  function refresh() {
    data = FinanceStorage.load();
    FinanceDashboard.render();
    FinanceTransactions.renderTable();
    FinanceTransactions.renderRecent();
    FinanceBudgets.render();
    FinanceBudgets.renderOverview();
    FinanceAnalytics.render();
  }

  function downloadBackup() {
    FinanceStorage.exportData(FinanceStorage.load());
    notify("JSON backup exported");
  }

  function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validated = FinanceStorage.validateImport(parsed);
        FinanceStorage.save(validated);
        notify("Backup imported successfully");
        loadSettings();
        refresh();
      } catch (error) {
        notify(error.message || "Could not import the backup", true);
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => notify("Could not read the backup file", true);
    reader.readAsText(file);
  }

  function loadSettings() {
    data = FinanceStorage.load();
    document.getElementById("currencyInput").value = data.settings.currency;
    document.getElementById("openingBalanceInput").value = data.settings.openingBalance;
  }

  function saveSettings(event) {
    event.preventDefault();
    const openingBalance = Number(document.getElementById("openingBalanceInput").value);
    if (!Number.isFinite(openingBalance) || openingBalance < 0) return notify("Opening balance must be zero or greater", true);
    data = FinanceStorage.load();
    data.settings.currency = document.getElementById("currencyInput").value;
    data.settings.openingBalance = openingBalance;
    FinanceStorage.save(data);
    refresh();
    notify("Preferences saved");
  }

  function resetData() {
    if (!confirm("Reset all transactions, budgets, and settings? This cannot be undone.")) return;
    localStorage.removeItem("finova_personal_finance_v1");
    loadSettings();
    refresh();
    navigate("dashboard");
    notify("Application data reset");
  }

  function init() {
    data = FinanceStorage.load();
    document.getElementById("currentDate").textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    });
    document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
    document.querySelectorAll("[data-navigate]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.navigate)));
    document.getElementById("addTransactionButton").addEventListener("click", () => FinanceTransactions.openModal());
    document.getElementById("menuButton").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
    document.getElementById("settingsForm").addEventListener("submit", saveSettings);
    document.getElementById("exportButton").addEventListener("click", downloadBackup);
    document.getElementById("exportQuickButton").addEventListener("click", downloadBackup);
    document.getElementById("importInput").addEventListener("change", importBackup);
    document.getElementById("resetButton").addEventListener("click", resetData);

    FinanceTransactions.init();
    FinanceDashboard.init();
    FinanceBudgets.init();
    FinanceAnalytics.init();
    loadSettings();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", init);
  return { formatCurrency, formatCompact, notify, navigate, refresh };
})();
