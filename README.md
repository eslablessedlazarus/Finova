# Finova Personal Finance Tracker

A responsive, frontend-only personal finance tracker built with HTML, CSS, vanilla JavaScript, localStorage, and Chart.js.

## Features

- Dashboard with balance, income, expenses, savings, monthly overview, recent activity, and budgets
- Add, edit, delete, search, filter, and sort transactions
- Overall and category monthly budgets with progress warnings
- Income, expense, category, trend, and savings charts
- Currency selection and opening balance settings
- JSON backup export and import
- Full application reset

## Run locally

Open `index.html` directly in a modern browser. Chart.js is loaded from a CDN, so an internet connection is needed to display charts. The application itself does not require a backend or build step.

For a browser with stricter local-file restrictions, serve the folder with any static server:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a GitHub repository and upload all project files.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the repository's main branch and the `/ (root)` folder.
5. Save. GitHub Pages will publish `index.html` and the relative asset paths.

## Data storage

Transactions, budgets, currency, and opening balance are stored in the browser's localStorage under `finova_personal_finance_v1`. Records are not transmitted to a server and do not synchronize across devices or browsers. Use JSON export for backups.
