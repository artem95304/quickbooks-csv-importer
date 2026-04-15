document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const mappingSection = document.getElementById('mapping-section');
    const rowCountSpan = document.getElementById('row-count');
    const errorContainer = document.getElementById('error-container');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');

    let parsedData = [];
    let headers = [];
    let currentFileName = '';

    registerOfflineSupport();

    // Drag and Drop implementation
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            showError('Please upload a valid CSV file.');
            return;
        }
        currentFileName = file.name.replace('.csv', '');
        parseCSV(file);
    }

    async function parseCSV(file) {
        hideError();
        try {
            const rawText = await file.text();
            const results = Papa.parse(stripUtf8Bom(rawText), {
                header: false,
                skipEmptyLines: 'greedy'
            });

            if (results.errors.length > 0 && results.data.length === 0) {
                showError('Failed to parse CSV. Make sure it has a header row.');
                return;
            }

            const prepared = buildRecordsFromRows(results.data);
            parsedData = prepared.rows;
            headers = prepared.headers;

            if (headers.length === 0 || parsedData.length === 0) {
                showError('The CSV file appears to be empty.');
                return;
            }

            rowCountSpan.textContent = parsedData.length;
            populateDropdowns();
            showMappingSection();
        } catch (err) {
            showError('Error reading file: ' + err.message);
        }
    }

    function populateDropdowns() {
        const selects = ['map-date', 'map-amount', 'map-debit', 'map-credit', 'map-payee', 'map-memo'];
        const usedHeaders = new Set();
        
        selects.forEach(id => {
            const selectContainer = document.getElementById(id);
            selectContainer.innerHTML = ''; // safely clear
            
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Select Column --";
            selectContainer.appendChild(defaultOption);
            
            headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                selectContainer.appendChild(option);
            });
        });

        autoMap('map-date', {
            exact: ['date', 'transaction date', 'posting date', 'posted date', 'created'],
            partial: ['date', 'created']
        }, usedHeaders);
        autoMap('map-amount', {
            exact: ['net', 'amount', 'billing amount', 'transaction amount', 'value', 'gross'],
            partial: ['net', 'amount', 'value', 'gross']
        }, usedHeaders);
        autoMap('map-debit', {
            exact: ['debit', 'debits', 'withdrawal', 'money out', 'outflow'],
            partial: ['debit', 'withdrawal', 'money out', 'outflow']
        }, usedHeaders);
        autoMap('map-credit', {
            exact: ['credit', 'credits', 'deposit', 'money in', 'inflow'],
            partial: ['credit', 'deposit', 'money in', 'inflow']
        }, usedHeaders);
        autoMap('map-payee', {
            exact: ['payee', 'name', 'merchant name', 'merchant', 'vendor', 'counterparty', 'customer name'],
            partial: ['payee', 'name', 'vendor', 'counterparty', 'customer name']
        }, usedHeaders);
        autoMap('map-memo', {
            exact: ['description', 'memo', 'notes', 'reference', 'reference number', 'details', 'invoice number', 'transaction id', 'source id', 'type'],
            partial: ['description', 'memo', 'notes', 'reference', 'details', 'invoice', 'transaction id']
        }, usedHeaders);
    }

    function autoMap(selectId, config, usedHeaders) {
        const select = document.getElementById(selectId);

        let match = findMatchingHeader(config.exact, usedHeaders, (header, keyword) => header === keyword);
        if (!match) {
            match = findMatchingHeader(config.partial, usedHeaders, (header, keyword) => header.includes(keyword));
        }

        if (match) {
            select.value = match;
            usedHeaders.add(match);
        }
    }

    function findMatchingHeader(keywords, usedHeaders, matches) {
        for (const keyword of keywords) {
            const match = headers.find(header => {
                if (usedHeaders.has(header)) return false;
                return matches(normalizeHeader(header), keyword);
            });

            if (match) {
                return match;
            }
        }

        return '';
    }

    function normalizeHeader(header) {
        return String(header ?? '').toLowerCase()
            .replace(/[._/-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function showMappingSection() {
        dropZone.classList.add('hidden');
        mappingSection.classList.remove('hidden');
    }

    function resetApp() {
        parsedData = [];
        headers = [];
        currentFileName = '';
        fileInput.value = '';
        hideError();
        dropZone.classList.remove('hidden');
        mappingSection.classList.add('hidden');
    }

    resetBtn.addEventListener('click', resetApp);

    function showError(msg) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove('hidden');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
        errorContainer.textContent = '';
    }

    convertBtn.addEventListener('click', generateQBO);

    function generateQBO() {
        hideError();
        const dateCol = document.getElementById('map-date').value;
        const amountCol = document.getElementById('map-amount').value;
        const debitCol = document.getElementById('map-debit').value;
        const creditCol = document.getElementById('map-credit').value;
        const payeeCol = document.getElementById('map-payee').value;
        const memoCol = document.getElementById('map-memo').value;

        if (!dateCol || (!amountCol && !debitCol && !creditCol)) {
            showError('Date and either Amount or Debit/Credit columns are required.');
            return;
        }

        const amountContext = detectAmountContext({ dateCol, amountCol, debitCol, creditCol, payeeCol, memoCol });

        const bankId = document.getElementById('bank-id').value || '123456789';
        const accountId = document.getElementById('account-id').value || '987654321';
        const currency = document.getElementById('currency').value || 'USD';
        
        const now = buildQBODate(new Date());
        
        let minDateStr = '99999999000000';
        let maxDateStr = '00000000000000';

        let transactionsSGML = '';

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const rawDate = row[dateCol];
            const hasAnyAmountValue = hasTransactionAmountValue(row, { amountCol, debitCol, creditCol });

            if (!rawDate || !hasAnyAmountValue) continue;

            const qboDate = stripDateToQBO(rawDate);
            if (!qboDate) {
                showError(`Invalid date format in row ${i + 1}: ${rawDate}`);
                return;
            }

            if (qboDate < minDateStr) minDateStr = qboDate;
            if (qboDate > maxDateStr) maxDateStr = qboDate;

            const amtFloat = resolveTransactionAmount(row, { amountCol, debitCol, creditCol }, amountContext);
            if (amtFloat === null) {
                showError(`Invalid amount format in row ${i + 1}.`);
                return;
            }
            
            const trnType = amtFloat >= 0 ? 'CREDIT' : 'DEBIT';
            const payee = payeeCol ? (row[payeeCol] || '').substring(0, 32) : '';
            const memo = memoCol ? (row[memoCol] || '').substring(0, 255) : '';
            const fitId = `${qboDate}${Math.round(Math.abs(amtFloat * 100))}${i}`; 

            transactionsSGML += `
<STMTTRN>
<TRNTYPE>${trnType}
<DTPOSTED>${qboDate}
<TRNAMT>${amtFloat.toFixed(2)}
<FITID>${fitId}
${payee ? `<NAME>${escapeSGML(payee)}\n` : ''}${memo ? `<MEMO>${escapeSGML(memo)}\n` : ''}</STMTTRN>`;
        }

        if(minDateStr === '99999999000000') {
             minDateStr = now;
             maxDateStr = now;
        }

        const qboContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${now}
<LANGUAGE>ENG
<FI>
<ORG>CSV2QBO
<FID>1001
</FI>
<INTU.BID>3000
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>${currency}
<BANKACCTFROM>
<BANKID>${bankId}
<ACCTID>${accountId}
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${minDateStr}
<DTEND>${maxDateStr}${transactionsSGML}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>0.00
<DTASOF>${maxDateStr}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

        downloadFile(`${currentFileName || 'statement'}.qbo`, qboContent);
    }

    function buildQBODate(dateObj) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const ss = String(dateObj.getSeconds()).padStart(2, '0');
        return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
    }

    function stripDateToQBO(dateStr) {
        const d = new Date(normalizeDateInput(dateStr));
        if (isNaN(d.getTime())) return null;
        return buildQBODate(d);
    }

    function escapeSGML(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
    }

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/vnd.intu.qbo' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function registerOfflineSupport() {
        if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
            return;
        }

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.warn('Offline caching could not be enabled.', err);
            });
        });
    }

    function stripUtf8Bom(text) {
        return text.replace(/^\uFEFF/, '');
    }

    function buildRecordsFromRows(rows) {
        const nonEmptyRows = rows.filter(row =>
            Array.isArray(row) && row.some(cell => String(cell ?? '').trim() !== '')
        );

        if (nonEmptyRows.length === 0) {
            return { headers: [], rows: [] };
        }

        const headerRowIndex = findHeaderRowIndex(nonEmptyRows);
        const rawHeaders = nonEmptyRows[headerRowIndex] || [];
        const resolvedHeaders = rawHeaders.map((header, index) => {
            const trimmedHeader = String(header ?? '').trim();
            return trimmedHeader || `Column ${index + 1}`;
        });

        const records = nonEmptyRows.slice(headerRowIndex + 1)
            .map(row => buildRowObject(resolvedHeaders, row))
            .filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));

        return { headers: resolvedHeaders, rows: records };
    }

    function buildRowObject(headersRow, valuesRow) {
        const rowObject = {};

        headersRow.forEach((header, index) => {
            rowObject[header] = valuesRow[index] ?? '';
        });

        return rowObject;
    }

    function findHeaderRowIndex(rows) {
        const maxRowsToCheck = Math.min(rows.length, 12);

        for (let i = 0; i < maxRowsToCheck; i++) {
            if (looksLikeHeaderRow(rows[i])) {
                return i;
            }
        }

        return 0;
    }

    function looksLikeHeaderRow(row) {
        const normalizedCells = row
            .map(cell => normalizeHeader(cell))
            .filter(Boolean);

        if (normalizedCells.length < 3) {
            return false;
        }

        const hasDateHeader = normalizedCells.some(cell =>
            ['date', 'transaction date', 'posting date', 'posted date', 'trans date'].some(keyword =>
                cell === keyword || cell.includes(keyword)
            )
        );
        const hasAmountHeader = normalizedCells.some(cell =>
            ['net', 'amount', 'billing amount', 'transaction amount', 'value', 'gross'].some(keyword =>
                cell === keyword || cell.includes(keyword)
            )
        );
        const hasDebitHeader = normalizedCells.some(cell =>
            ['debit', 'debits', 'withdrawal', 'money out', 'outflow'].some(keyword =>
                cell === keyword || cell.includes(keyword)
            )
        );
        const hasCreditHeader = normalizedCells.some(cell =>
            ['credit', 'credits', 'deposit', 'money in', 'inflow'].some(keyword =>
                cell === keyword || cell.includes(keyword)
            )
        );
        const hasDescriptorHeader = normalizedCells.some(cell =>
            [
                'description',
                'payee',
                'merchant',
                'merchant name',
                'name',
                'memo',
                'reference',
                'transaction id',
                'invoice number',
                'details',
                'balance',
                'running bal'
            ].some(keyword => cell === keyword || cell.includes(keyword))
        );

        return hasDateHeader && (hasAmountHeader || (hasDebitHeader && hasCreditHeader)) && hasDescriptorHeader;
    }

    function detectAmountContext(selectedColumns) {
        const excludedHeaders = new Set(Object.values(selectedColumns).filter(Boolean));

        return {
            directionCol: findFirstMatchingHeader({
                exact: ['debit credit indicator', 'credit debit indicator', 'dr cr'],
                partial: ['debit credit indicator', 'credit debit indicator', 'dr cr']
            }, excludedHeaders)
        };
    }

    function findFirstMatchingHeader(config, excludedHeaders) {
        let match = findMatchingHeader(config.exact || [], excludedHeaders, (header, keyword) => header === keyword);
        if (!match) {
            match = findMatchingHeader(config.partial || [], excludedHeaders, (header, keyword) => header.includes(keyword));
        }

        return match;
    }

    function resolveTransactionAmount(row, amountColumns, amountContext) {
        if (amountColumns.amountCol) {
            const parsedAmount = parseNumericAmount(row[amountColumns.amountCol]);
            if (parsedAmount === null) {
                return null;
            }

            if (!amountContext.directionCol) {
                return parsedAmount;
            }

            return applyDirectionIndicator(parsedAmount, row[amountContext.directionCol]);
        }

        return resolveSplitAmount(row, amountColumns);
    }

    function resolveSplitAmount(row, amountColumns) {
        const debitValue = amountColumns.debitCol ? parseNumericAmount(row[amountColumns.debitCol]) : null;
        const creditValue = amountColumns.creditCol ? parseNumericAmount(row[amountColumns.creditCol]) : null;

        const rawDebit = amountColumns.debitCol ? String(row[amountColumns.debitCol] ?? '').trim() : '';
        const rawCredit = amountColumns.creditCol ? String(row[amountColumns.creditCol] ?? '').trim() : '';

        if (rawDebit && debitValue === null) {
            return null;
        }

        if (rawCredit && creditValue === null) {
            return null;
        }

        const normalizedDebit = debitValue === null ? 0 : Math.abs(debitValue);
        const normalizedCredit = creditValue === null ? 0 : Math.abs(creditValue);

        return normalizedCredit - normalizedDebit;
    }

    function hasTransactionAmountValue(row, amountColumns) {
        return [amountColumns.amountCol, amountColumns.debitCol, amountColumns.creditCol]
            .filter(Boolean)
            .some(column => String(row[column] ?? '').trim() !== '');
    }

    function parseNumericAmount(rawValue) {
        const stringValue = String(rawValue ?? '').trim();
        if (!stringValue) {
            return null;
        }

        const hasParentheses = stringValue.startsWith('(') && stringValue.endsWith(')');
        const normalizedAmount = stringValue.replace(/[^\d.-]/g, '');
        if (!normalizedAmount) {
            return null;
        }

        const parsedAmount = parseFloat(normalizedAmount);
        if (Number.isNaN(parsedAmount)) {
            return null;
        }

        if (hasParentheses && parsedAmount > 0) {
            return parsedAmount * -1;
        }

        return parsedAmount;
    }

    function applyDirectionIndicator(amount, rawIndicator) {
        const indicator = normalizeHeader(rawIndicator);
        if (!indicator) {
            return amount;
        }

        if (indicator === 'debit' || indicator === 'dr' || indicator.includes('charge')) {
            return -Math.abs(amount);
        }

        if (indicator === 'credit' || indicator === 'cr' || indicator.includes('refund')) {
            return Math.abs(amount);
        }

        return amount;
    }

    function normalizeDateInput(rawDate) {
        const value = String(rawDate ?? '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${value}T00:00:00`;
        }

        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
            return value.replace(' ', 'T');
        }

        return value;
    }
});
