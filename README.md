<div align="center">
  <h3>✨ QuickBooks CSV Importer ✨</h3>
  <p>Convert bank CSV files to QuickBooks-compatible QBO directly in the browser.<br>Processed locally. No backend uploads. Source Available.</p>

  [![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

## 🚀 The Problem & Our Solution
Bookkeepers, freelancers, and small business owners often struggle with banks that only export `.csv` files. Most accounting software (like QuickBooks and Xero) tightly restricts bank feed imports, requiring the strict QBO / OFX format. 

Most converters on the market either:
1. Charge recurring subscription fees for a relatively simple workflow.
2. Require uploading sensitive financial data to third-party servers.

**CSV2QBO** was built over a weekend to solve this. **It runs entirely in your browser.** You can literally disable your Wi-Fi before clicking "Generate" and your `.qbo` file will still download instantly. Your financial data *never* leaves your machine.

## 🛡️ Privacy & Security Model

This tool is designed to minimize data exposure:

1. **Processed locally in the browser.** Files are parsed and converted entirely in your browser's memory. Data never touches a backend.
2. **No backend uploads.** There is no server-side component. Zero network requests are made with your data.
3. **No analytics or tracking.** No Google Analytics, no telemetry, no cookies.
4. **Bundled parser.** `PapaParse.js` is served locally — no CDN calls, no external script loading.
5. **Restrictive CSP.** A strict Content Security Policy blocks the browser from making any external network connections (`connect-src 'none'`).
6. **Safe DOM rendering.** User-controlled CSV headers are rendered via secure `textContent` — not `innerHTML` — to prevent DOM XSS.

## 🛠 Features

- **Blazing Fast Parsing:** Powered by `PapaParse` to handle any CSV inconsistencies.
- **Smart Auto-Mapping:** Automatically detects common column headers from major banks like Chase, Bank of America, and Amex.
- **Visual Mapping UI:** If your CSV uses custom columns, a clean UI lets you manually map your columns to QuickBooks' strict `[Date, Amount, Payee, Description]` requirements.
- **Beautiful & Intuitive:** A clean, B2B-grade interface built for trust and utility.
- **$0 Infrastructure:** Host it anywhere as static files.

## ⚡ How to run it locally (For Users & Devs)
Since there are no servers, dependencies, or build-steps required:
1. Clone the repo:
   ```bash
   git clone https://github.com/artem95304/quickbooks-csv-importer.git
   ```
2. Open the `src` folder and double-click `index.html` to open it in your browser.
3. Start converting!

## 🌍 Quick Deployment (For Devs & Evaluation)
This section is for developers or IT administrators who want to deploy the tool internally for their organization. 

Ready for personal, internal, and evaluation deployment on any static hosting.
Commercial hosting, client delivery, and paid service usage require a separate commercial license from the author.
```bash
cd src
npm i -g vercel
vercel --prod
```

## ⚠️ Limitations & Notes

- This tool converts and formats data; users should review generated files before importing into QuickBooks.
- Not affiliated with Intuit or QuickBooks.
- CSV formats vary by bank; manual column mapping may still be required for non-standard exports.

## 🤝 Contributing
Feel free to open an issue or submit a pull request!
Specifically, we'd love contributions for:
- Auto-mapping regex improvements for international banks.
- Support for complex debit/credit separate columns.
- Dark mode toggle.

> **Note on Pull Requests:** By contributing, you agree that your contributions may be used and relicensed by the project maintainer. A Contributor License Agreement (CLA) may be required for substantial contributions.

## 👤 About the Author

Built by **Artem Raichuk**, Machine Learning Engineer.
I build practical tools at the intersection of product, automation, and privacy-first UX.

- [LinkedIn](https://www.linkedin.com/in/artem-raichuk/)
- [GitHub](https://github.com/artem95304)

---

## Commercial Licensing

If you want to use this project in a commercial setting, for client work, or as part of a paid product or service, contact the author for a commercial license.

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

You may use, copy, modify, and share this software for noncommercial purposes, subject to the license terms.

Commercial use, client work, paid services, hosted offerings, and redistribution as part of a commercial product or service require a separate commercial license from the author.
