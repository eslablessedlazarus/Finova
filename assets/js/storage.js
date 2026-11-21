window.FinanceStorage = (() => {
  const STORAGE_KEY = "finova_personal_finance_v1";
  const expenseCategories = ["Food", "Transportation", "Education", "Health", "Bills", "Entertainment", "Shopping", "Other"];
  const incomeCategories = ["Salary", "Business", "Freelance", "Allowance", "Gift", "Other"];

  const defaults = {
    transactions: [],
    budgets: {},
    settings: { currency: "NGN", openingBalance: 0 }
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaults);
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.transactions) || typeof data.settings !== "object" || typeof data.budgets !== "object") {
        throw new Error("Invalid saved data structure");
      }
      return {
        transactions: data.transactions,
        budgets: data.budgets || {},
        settings: {
          currency: data.settings.currency || "NGN",
          openingBalance: Number(data.settings.openingBalance) || 0
        }
      };
    } catch (error) {
      console.error("Could not load saved finance data:", error);
      return structuredClone(defaults);
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function exportData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finova-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function validateImport(data) {
    if (!data || typeof data !== "object") throw new Error("The backup is not a valid JSON object.");
    if (!Array.isArray(data.transactions)) throw new Error("The backup does not contain a valid transaction list.");
    if (data.settings && typeof data.settings !== "object") throw new Error("The backup has invalid settings.");
    for (const transaction of data.transactions) {
      if (!transaction || typeof transaction.description !== "string" || !Number.isFinite(Number(transaction.amount)) ||
          !["income", "expense"].includes(transaction.type) || typeof transaction.category !== "string" || typeof transaction.date !== "string") {
        throw new Error("The backup contains an invalid transaction.");
      }
    }
    return {
      transactions: data.transactions.map(transaction => ({
        id: String(transaction.id || createId()),
        description: transaction.description.trim(),
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date
      })),
      budgets: data.budgets && typeof data.budgets === "object" ? data.budgets : {},
      settings: {
        currency: data.settings?.currency || "NGN",
        openingBalance: Number(data.settings?.openingBalance) || 0
      }
    };
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  return { load, save, exportData, validateImport, createId, expenseCategories, incomeCategories };
})();
