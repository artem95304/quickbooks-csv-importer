<div align="center">
  <h3>✨ CSV2QBO: Secure Client-Side Converter ✨</h3>
  <p>Convert your bank CSV statements to QBO formatting directly in your browser. <br>100% Private. 0 Servers. Open Source.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

## 🚀 The Problem & Our Solution
Bookkeepers, freelancers, and small business owners often struggle with banks that only export `.csv` files. Most accounting software (like QuickBooks and Xero) requires the Strict QBO / OFX format. 

Most converters on the market either:
1. Charge an absurd monthly fee (e.g. $40/mo) 
2. Require you to upload sensitive client financial data to random cloud servers.

**CSV2QBO** was built over a weekend to solve this. **It runs entirely in your browser.** You can literally disable your Wi-Fi before clicking "Generate" and your `.qbo` file will still download instantly. Your financial data *never* leaves your machine.

## 🛠 Features

- **Blazing Fast Parsing:** Powered by `PapaParse` to handle any CSV inconsistencies.
- **Smart Auto-Mapping:** Automatically detects common column headers from major banks like Chase, Bank of America, and Amex.
- **Visual Mapping UI:** If your CSV uses custom columns (like `MyMoney` or `Fecha`), our drag-and-drop UI lets you manually map your columns to QuickBooks' strict `[Date, Amount, Payee, Description]` requirements.
- **Beautiful & Intuitive:** A clean, B2B glassmorphism interface.
- **100% Client-Side:** `$0` infrastructure. Host it anywhere.

## ⚡ How to run it locally
Since there are no servers, dependencies, or build-steps required:
1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/csv2qbo.git
   ```
2. Double-click `index.html` to open it in your browser.
3. Start converting!

## 🌍 Quick Deployment
Want to host it for your clients? It's ready for any static hosting.
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

---
*Built pragmatically for the indie maker and accounting community.*
