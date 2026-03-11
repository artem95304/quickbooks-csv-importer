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

    function parseCSV(file) {
        hideError();
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0 && results.data.length === 0) {
                    showError('Failed to parse CSV. Make sure it has a header row.');
                    return;
                }
                
                parsedData = results.data;
                headers = results.meta.fields || Object.keys(parsedData[0]);
                
                if (parsedData.length === 0) {
                    showError('The CSV file appears to be empty.');
                    return;
                }

                rowCountSpan.textContent = parsedData.length;
                populateDropdowns();
                showMappingSection();
            },
            error: function(err) {
                showError('Error reading file: ' + err.message);
            }
        });
    }

    function populateDropdowns() {
        const selects = ['map-date', 'map-amount', 'map-payee', 'map-memo'];
        
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

        autoMap('map-date', ['date', 'posting date', 'transaction date']);
        autoMap('map-amount', ['amount', 'value', 'billing amount']);
        autoMap('map-payee', ['payee', 'name', 'merchant', 'description']);
        autoMap('map-memo', ['memo', 'notes', 'reference']);
    }

    function autoMap(selectId, keywords) {
        const select = document.getElementById(selectId);
        // Better match: exact match first, then partial match
        let match = headers.find(h => keywords.includes(h.toLowerCase().trim()));
        if (!match) {
             match = headers.find(h => keywords.some(kw => h.toLowerCase().includes(kw)));
        }
        
        if (match) {
            select.value = match;
        }
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
        const payeeCol = document.getElementById('map-payee').value;
        const memoCol = document.getElementById('map-memo').value;

        if (!dateCol || !amountCol) {
            showError('Date and Amount columns are required.');
            return;
        }

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
            const rawAmount = row[amountCol];

            if (!rawDate || !rawAmount) continue;

            const qboDate = stripDateToQBO(rawDate);
            if (!qboDate) {
                showError(`Invalid date format in row ${i + 1}: ${rawDate}`);
                return;
            }

            if (qboDate < minDateStr) minDateStr = qboDate;
            if (qboDate > maxDateStr) maxDateStr = qboDate;

            // Strip anything that is not a digit, dot, or minus sign
            let amount = String(rawAmount).replace(/[^\d.-]/g, '');
            let amtFloat = parseFloat(amount);
            if (isNaN(amtFloat)) amtFloat = 0.0;
            
            const trnType = amtFloat >= 0 ? 'CREDIT' : 'DEBIT';
            const payee = payeeCol ? (row[payeeCol] || '').substring(0, 32) : '';
            const memo = memoCol ? (row[memoCol] || '').substring(0, 255) : '';
            const fitId = `${qboDate}${Math.abs(amtFloat * 100)}${i}`; 

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
        const d = new Date(dateStr);
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
});
