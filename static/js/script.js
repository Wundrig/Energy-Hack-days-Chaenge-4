document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const submitBtn = document.getElementById('submit-btn');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files[0]) {
            showError('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        displayImagePreview(fileInput.files[0]);

        submitBtn.disabled = true;
        loadingDiv.style.display = 'block';
        resultDiv.innerHTML = '';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                displayResult(data.result, data.image);
            } else {
                showError(data.error || 'An error occurred while processing the image.');
            }
        } catch (error) {
            showError('An error occurred while uploading the image.');
        } finally {
            submitBtn.disabled = false;
            loadingDiv.style.display = 'none';
        }
    });

    function displayResult(result, imageData) {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${imageData}`;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        
        resultDiv.innerHTML = `
            <h2>Uploaded Image:</h2>
        `;
        resultDiv.appendChild(img);
        
        resultDiv.innerHTML += `
            <h2>Analysis Result:</h2>
            <p>
                <strong>Brand:</strong> 
                <span id="brand-display">${result.brand}</span>
                <button id="edit-brand-btn" class="edit-btn">✎</button>
                <input type="text" id="brand-input" value="${result.brand}" style="display: none;">
                <button id="save-brand-btn" class="save-btn" style="display: none;">💾</button>
            </p>
            <p>
                <strong>Estimated Production Year:</strong> 
                <span id="year-display">${result.year}</span>
                <button id="edit-year-btn" class="edit-btn">✎</button>
                <input type="text" id="year-input" value="${result.year}" style="display: none;">
                <button id="save-year-btn" class="save-btn" style="display: none;">💾</button>
            </p>
            <p>
                <strong>Free-standing:</strong> 
                <span id="freestanding-display">${result.freestanding ? 'Yes' : 'No'}</span>
                <button id="edit-freestanding-btn" class="edit-btn">✎</button>
                <select id="freestanding-input" style="display: none;">
                    <option value="true" ${result.freestanding ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!result.freestanding ? 'selected' : ''}>No</option>
                </select>
                <button id="save-freestanding-btn" class="save-btn" style="display: none;">💾</button>
            </p>
            <p>
                <strong>Fridge in Picture:</strong> ${result.hasFridge ? 'Yes' : 'No'}
            </p>
            <p>
                <strong>Total Volume:</strong> 
                <span id="volume-display">${result.totalVolume}</span>
                <button id="edit-volume-btn" class="edit-btn">✎</button>
                <input type="text" id="volume-input" value="${result.totalVolume}" style="display: none;">
                <button id="save-volume-btn" class="save-btn" style="display: none;">💾</button>
            </p>
        `;

        setupEditFunctionality('brand');
        setupEditFunctionality('year');
        setupEditFunctionality('freestanding');
        setupEditFunctionality('volume');
        setupBrandAutocomplete();
    }

    function setupEditFunctionality(field) {
        const displayEl = document.getElementById(`${field}-display`);
        const inputEl = document.getElementById(`${field}-input`);
        const editBtn = document.getElementById(`edit-${field}-btn`);
        const saveBtn = document.getElementById(`save-${field}-btn`);

        editBtn.addEventListener('click', () => {
            displayEl.style.display = 'none';
            inputEl.style.display = 'inline-block';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        });

        saveBtn.addEventListener('click', () => {
            const newValue = inputEl.value;
            if (field === 'freestanding') {
                displayEl.textContent = inputEl.options[inputEl.selectedIndex].text;
            } else {
                displayEl.textContent = newValue;
            }
            displayEl.style.display = 'inline-block';
            inputEl.style.display = 'none';
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            
            // Here you can add logic to send the updated value to the server
            // For example: updateField(field, newValue);
        });
    }

    function setupBrandAutocomplete() {
        fetch('/brands')
            .then(response => response.json())
            .then(brands => {
                $("#brand-input").autocomplete({
                    source: brands,
                    minLength: 2
                });
            });
    }

    function showError(message) {
        resultDiv.innerHTML = `<p class="error">${message}</p>`;
    }

    function displayImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            const previewDiv = document.getElementById('image-preview');
            previewDiv.innerHTML = '';
            previewDiv.appendChild(img);
        }
        reader.readAsDataURL(file);
    }

    function updateField(field, newValue) {
        fetch('/update_field', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ field: field, value: newValue }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`${field} updated successfully!`);
            } else {
                alert(`Failed to update ${field}. Please try again.`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`An error occurred while updating ${field}.`);
        });
    }
});
