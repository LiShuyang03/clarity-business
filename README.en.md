# Clarity Business

Clarity Business is a lightweight sales dashboard for small businesses. Upload a CSV or Excel sales ledger to explore revenue, orders, monthly trends, and product and customer rankings in your browser.

> The app uses fixed statistical rules. It does not call a large language model or any AI service. “Insights” are rule-based prompts, not AI findings, audit conclusions, or business advice.

## Quick start

Download or clone the project and open `index.html`. You can also serve the folder with any static file server. There is no build step, package manager, or backend service.

The dashboard opens with fictional sample sales data. Use **Upload sales data** to choose a `.csv`, `.xlsx`, or `.xls` file, review the detected column mapping, and select **Generate analysis**. Data stays in browser memory; the app does not send uploaded files or results to a server or save them in browser storage. Imported data is cleared when you close or refresh the page.

The language switch in the top bar offers **简体中文** and **English**. English browser settings select English on first open; other settings select Simplified Chinese. The choice is kept in memory for the current page only. Only these complete translations are selectable. Spanish, Russian, French, German, and Japanese are planned but remain unavailable until their translations are complete.

## Supported data

- CSV, XLSX, XLS, and XLSM files. Only worksheet data is read; macros are not run.
- The first row must contain column names. Only the first worksheet is analyzed.
- Date and revenue columns are required. Order ID, product, customer, quantity, cost, and profit are optional.
- Common Chinese and English column names are detected automatically. Review or change the mapping after upload. Mapping options show a friendly bilingual field label alongside the original header; analysis continues to read from the original column position.
- Filter by all data, the latest 3 / 6 / 12 months, or a custom start and end date. The selection updates metrics, charts, rankings, prompts, and both exports. Quick month ranges end on the latest date in the dataset.
- Common date formats and numbers with currency signs or thousands separators are supported.
- Files are limited to 25 MB and 200,000 rows. Rows with invalid dates or revenue are skipped and counted in the dashboard.

Use `sample-sales.csv` to try the import flow. It contains fictional records.

## Metric definitions

- **Revenue:** Sum of valid row amounts. Negative rows are included and flagged as possible refunds or reversals.
- **Orders:** Count of distinct order IDs; rows without an order ID are counted individually. One order may contain multiple product rows.
- **Average order value:** Total revenue divided by the order count.
- **Profit:** Uses the profit column when available; otherwise, calculates row revenue minus row cost. Cost should be the total cost for that row, not unit cost. Profit and margin are shown only when every valid row has a profit value.
- **Product and customer rankings:** Sum revenue by name; blank names are omitted.
- **Monthly trend:** Groups rows by calendar month and compares the latest two months with records. It does not adjust for the number of days in a month.
- **High-value prompt:** Lists positive revenue above the third quartile plus 1.5 times the interquartile range. This rule can be unstable with small datasets.

Prompts are for review only. An unusual value is not necessarily an error, and a rule that is not triggered does not mean there are no issues. Results depend on source data, column mapping, refunds, and accounting conventions.

## Privacy and third-party component

CSV files are read and analyzed by local JavaScript. When you select an Excel file, the app loads SheetJS Community Edition 0.20.3 from its official CDN and parses the file in your browser. Excel contents are not sent to the CDN, but the first Excel import needs an internet connection to download the parser. If the connection is unavailable, save the spreadsheet as CSV and upload that file.

The app has no accounts, analytics backend, telemetry, or persistent storage. Follow your organization’s policies for sensitive data and use a trusted device and browser.

## Downloads

- **Download analysis report:** Creates a standalone HTML report with key metrics, monthly totals, product and customer rankings, and rule-based prompts. Open it in a browser or print it to PDF.
- **Export summary CSV:** Exports key metrics, monthly revenue and profit, and the top ten products and customers. Column headings follow the selected language. Uploaded names are kept as supplied; sample names are localized.

## Localization

Translation strings are collected in `locales.js`. To add a language, provide a complete catalog for the page, status and error messages, report and CSV text, column-detection aliases, sample names, and date-format labels. Then add the locale code to `APP_LOCALES` in `app.js` to make it selectable. The selectable-language list is separate from the catalogs so an incomplete translation cannot be released accidentally. Translate and review every visible surface and export before enabling a locale.

## Publish with GitHub Pages

1. In GitHub, choose **+ → New repository** and create a repository (for example, `clarity-business`). Choose whether it is public or private.
2. Upload all project files, including `locales.js`, `README.en.md`, and `sample-sales.csv`. Keep `index.html` at the repository root, then commit the files.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, select **Deploy from a branch**, choose the `main` branch and `/(root)` folder, then select **Save**.
5. Wait for Pages to finish deploying. GitHub will show the site URL in the Pages settings; it usually follows `https://your-name.github.io/repository-name/`.

For later updates, upload the changed files through **Add file → Upload files** and commit them, or commit and push from an existing Git checkout:

```sh
git add .
git commit -m "Update Clarity Business"
git push origin main
```

The first deployment and later updates can take a few minutes. GitHub Pages sites are publicly reachable even when the repository is private. Do not commit customer data, credentials, or private sales files. See [GitHub’s publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Files

```text
clarity-business/
├── index.html
├── app.js
├── locales.js
├── styles.css
├── sample-sales.csv
├── README.md
├── README.en.md
├── LICENSE
├── SOURCE-ATTRIBUTION.md
└── THIRD-PARTY-NOTICES.md
```

## Compatibility and known limits

- Designed for recent versions of Chrome, Edge, Firefox, and Safari, with modern JavaScript, `Intl`, `File`, `Blob`, and download-link support.
- Excel parsing loads only when an Excel file is selected. CSV import and the sample dashboard do not need that script.
- Only the first Excel worksheet is read. Formula definitions, charts, pivot tables, hidden metadata, and Excel formula recalculation are not supported.
- This is a local, single-page dashboard. It does not include accounts, collaboration, cloud saves, tax calculations, or inventory management.
- Complex multi-row headers, merged cells, multiple currencies, and custom accounting rules may need to be prepared in spreadsheet software before upload.

## License

The project code and sample data are under the MIT License. SheetJS Community Edition is separately licensed under Apache License 2.0; see `THIRD-PARTY-NOTICES.md`.
