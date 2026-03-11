<div align="center">
  <h3>✨ QuickBooks CSV Importer: Secure Client-Side Tool ✨</h3>
  <p>Import your bank CSV transactions into QuickBooks effortlessly by converting them to QBO format directly in your browser. <br>100% Private. 0 Servers. Source Available.</p>

  [![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

## 🚀 The Problem & Our Solution
Bookkeepers, freelancers, and small business owners often struggle with banks that only export `.csv` files. Most accounting software (like QuickBooks and Xero) tightly restricts bank feed imports, making raw CSV imports difficult and requiring the Strict QBO / OFX format. 

Most converters on the market either:
1. Charge an absurd monthly fee (e.g. $40/mo) 
2. Require you to upload sensitive client financial data to random cloud servers.

**CSV2QBO** was built over a weekend to solve this. **It runs entirely in your browser.** You can literally disable your Wi-Fi before clicking "Generate" and your `.qbo` file will still download instantly. Your financial data *never* leaves your machine.

## 🛡️ Trust & Security Architecture

Unlike claiming to be "100% Private" without proof, we built a verifiable **Zero-Trust Client-Side** architecture. Financial data requires extreme caution:

1. **Zero External Dependencies:** No CDNs. No Google Analytics. `PapaParse.js` is bundled locally.
2. **Strict Content Security Policy (CSP):** The app's HTTP headers physically block the browser from making *any* external network requests (`connect-src 'none'`).
3. **Safe DOM Injection:** We use secure `textContent` parsing instead of vulnerable `innerHTML` to prevent DOM XSS vulnerabilities from malicious CSV headers. 
4. **Processed strictly in your browser's local memory.** Data never touches a backend.

## 🛠 Features

- **Blazing Fast Parsing:** Powered by `PapaParse` to handle any CSV inconsistencies.
- **Smart Auto-Mapping:** Automatically detects common column headers from major banks like Chase, Bank of America, and Amex.
- **Visual Mapping UI:** If your CSV uses custom columns (like `MyMoney` or `Fecha`), our drag-and-drop UI lets you manually map your columns to QuickBooks' strict `[Date, Amount, Payee, Description]` requirements.
- **Beautiful & Intuitive:** A clean, B2B glassmorphism interface.
- **$0 Infrastructure:** Host it anywhere as static files.

## ⚡ How to run it locally
Since there are no servers, dependencies, or build-steps required:
1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/csv2qbo.git
   ```
2. Double-click `index.html` to open it in your browser.
3. Start converting!

## 🌍 Ready for Deployment
Ready for personal, internal, and evaluation deployment on any static hosting.

Commercial hosting, client delivery, and paid service usage require a separate commercial license from the author.
```bash
npm i -g vercel
vercel --prod
```

## 🤝 Contributing
Feel free to open an issue or submit a pull request!
Specifically, we'd love contributions for:
- Auto-mapping regex improvements for international banks.
- Support for complex debit/credit separate columns.
- Dark mode toggle.

> **Note on Pull Requests:** By contributing, you agree that your contributions may be used and relicensed by the project maintainer. A Contributor License Agreement (CLA) may be required for substantial contributions.

---
*Built pragmatically for the indie maker and accounting community.*

## Commercial Licensing

If you want to use this project in a commercial setting, for client work, or as part of a paid product or service, contact the author for a commercial license.

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

You may use, copy, modify, and share this software for noncommercial purposes, subject to the license terms.

Commercial use, client work, paid services, hosted offerings, and redistribution as part of a commercial product or service require a separate commercial license from the author.
