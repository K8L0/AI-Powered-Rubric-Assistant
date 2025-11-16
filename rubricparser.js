const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

function fileExtMatches(file, ext) {
    return file && file.name && file.name.toLowerCase().endsWith(ext);
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    
    if (lines.length === 0) return result;
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        result.push(row);
    }
    
    return { headers, rows: result };
}

function displayTable(csvData) {
    const { headers, rows } = csvData;
    
    // Clear existing table
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Create header row with extension column
    const headerRow = document.createElement('tr');

    // Add extension column header (transparent)
    const extHeader = document.createElement('th');
    extHeader.style.border = 'none';
    extHeader.style.background = 'transparent';
    extHeader.textContent = ''; // empty
    headerRow.appendChild(extHeader);

    // Add core headers
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);
    
    // Create data rows with extension column
    rows.forEach(row => {
        const tr = document.createElement('tr');

        // Extension column cell (transparent)
        const extCell = document.createElement('td');
        extCell.style.border = 'none';
        extCell.style.background = 'transparent';
        extCell.textContent = ''; // empty
        tr.appendChild(extCell);

        // Core data cells
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    // --- Extension rows at the bottom ---
    // Row for checkboxes
    const checkboxRow = document.createElement('tr');
    const labelACell = document.createElement('td');
    labelACell.textContent = 'I want to manually grade this.';
    labelACell.style.border = 'none';
    labelACell.style.background = 'transparent';
    checkboxRow.appendChild(labelACell);

    headers.forEach((header, idx) => {
        const cbCell = document.createElement('td');
        cbCell.style.border = 'none';
        cbCell.style.background = 'transparent';
        cbCell.style.textAlign = 'center';   // centers horizontally
        cbCell.style.verticalAlign = 'middle'; // centers vertically

        // Add checkbox for every header column
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        cbCell.appendChild(checkbox);

        checkboxRow.appendChild(cbCell);
    });
    tableBody.appendChild(checkboxRow);

    // Row for text inputs
    const commentRow = document.createElement('tr');
    const labelBCell = document.createElement('td');
    labelBCell.textContent = 'Comment for UnsureTA:';
    labelBCell.style.border = 'none';
    labelBCell.style.background = 'transparent';
    commentRow.appendChild(labelBCell);

    headers.forEach((header, idx) => {
        const inputCell = document.createElement('td');
        inputCell.style.border = 'none';
        inputCell.style.background = 'transparent';

        // Add text input for every header column
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Comment';
        inputCell.appendChild(input);

        commentRow.appendChild(inputCell);
    });
    tableBody.appendChild(commentRow);

    // Show table container
    tableContainer.classList.add('show');
}


function populateExtensionRows(headers) {
    const extContainer = document.getElementById('extensionContainer');
    const extRowCheckboxes = document.getElementById('extensionRowCheckboxes');
    const extRowComments = document.getElementById('extensionRowComments');

    if (!extContainer || !extRowCheckboxes || !extRowComments) return;

    // Remove any existing generated cells (keep the first cell which is the label)
    while (extRowCheckboxes.cells.length > 1) extRowCheckboxes.deleteCell(1);
    while (extRowComments.cells.length > 1) extRowComments.deleteCell(1);

    // For each CSV header, add a checkbox cell and a comment input cell
    headers.forEach((header, idx) => {
        if (idx === 0) {
            // First column: insert static labels instead of checkbox and comment

            // Checkbox row gets "LabelA"
            const cbCell = extRowCheckboxes.insertCell(-1);
            cbCell.style.padding = '0.5rem';
            cbCell.style.textAlign = 'center';
            cbCell.textContent = 'I want to manually grade this column.';

            // Comment row gets "LabelB"
            const commentCell = extRowComments.insertCell(-1);
            commentCell.style.padding = '0.5rem';
            commentCell.textContent = 'Comments for UnsureTA:';
        } else {
            // Checkbox cell
            const cbCell = extRowCheckboxes.insertCell(-1);
            cbCell.style.padding = '0.5rem';
            cbCell.style.textAlign = 'center';
            const cbDiv = document.createElement('div');
            cbDiv.className = 'extension-checkbox';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'manual-checkbox';
            checkbox.dataset.colIndex = idx;
            cbDiv.appendChild(checkbox);
            cbCell.appendChild(cbDiv);

            // Comment cell
            const commentCell = extRowComments.insertCell(-1);
            commentCell.style.padding = '0.5rem';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'extension-comment';
            input.placeholder = 'Comment';
            input.dataset.colIndex = idx;
            commentCell.appendChild(input);
        }
    });

    // Unhide the extension container
    extContainer.style.display = 'block';

    // Also ensure grade button is visible
    const gradeBtn = document.getElementById('gradeBtn');
    if (gradeBtn) gradeBtn.style.display = 'inline-block';
}

function writeRubricToGlobal(csvData) {
    const { headers, rows } = csvData;

    // Build formatted rubric columns
    const formattedColumns = headers.map(header => {
        const values = rows.map(row => row[header]).filter(v => v !== undefined && v !== '');
        if (values.length > 0) {
            const first = values[0];
            const rest = values.slice(1).join('; ');
            return rest ? `${header}: ${first}: ${rest}` : `${header}: ${first}:`;
        }
        return `${header}:`;
    });

    // Write rubric string to global
    window.TAbot.rubric = formattedColumns.join('\n');

    // Write just the header row (categories) to global
    window.TAbot.categories = headers;

    // Return rubric string for convenience
    return window.TAbot.rubric;
}


form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = zipInput.files[0];
    const csv = csvInput.files[0];

    if (!zip || !csv) {
        alert('Please choose both a .zip and a .csv file.');
        return;
    }
    if (!fileExtMatches(zip, '.zip')) {
        alert('Selected ZIP file is not a .zip file.');
        return;
    }
    if (!fileExtMatches(csv, '.csv')) {
        alert('Selected CSV file is not a .csv file.');
        return;
    }

    // Read and parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csvData = parseCSV(event.target.result);
            displayTable(csvData);
            writeRubricToGlobal(csvData);

            // Unhide the Grade button
            const gradeBtn = document.getElementById("gradeBtn");
            gradeBtn.style.display = "inline-block";
        } catch (error) {
            alert('Error parsing CSV file: ' + error.message);
            console.error(error);
        }
    };
    reader.onerror = () => {
        alert('Error reading CSV file.');
    };
    reader.readAsText(csv);
});

resetBtn.addEventListener('click', () => {
    form.reset();
    tableContainer.classList.remove('show');
    const ext = document.getElementById('extensionContainer');
    if (ext) ext.style.display = 'none';
    const gradeBtn = document.getElementById('gradeBtn');
    if (gradeBtn) gradeBtn.style.display = 'none';
});

gradeBtn.addEventListener('click', () => {
    console.log("Grading assignments...");
    gradeAssignments();
});
