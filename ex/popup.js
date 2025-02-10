// مدیریت ارسال فرم تنظیمات
document.getElementById('config-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const dbName = document.getElementById('db-name').value.trim();
    const collectionName = document.getElementById('collection-name').value.trim();
    const url = document.getElementById('url').value.trim();
    const fileName = document.getElementById('file-name').value.trim();

    const configData = {
        db_name: dbName,
        collection_name: collectionName,
        url: url,
        file_name: fileName
    };

    try {
        addLog("Submitting configuration form...");
        const response = await fetch("http://127.0.0.1:8000/get_config/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(configData)
        });

        if (!response.ok) {
            const error = await response.json();
            addLog(`Error saving configuration: ${error.detail[0]?.msg || "Unknown error"}`);
            alert(`Error: ${error.detail[0]?.msg || "Unknown error"}`);
            return;
        }

        const result = await response.json();
        addLog("Configuration saved successfully.");
        alert(result.message);
    } catch (error) {
        console.error("Error saving configuration:", error);
        addLog("Failed to save configuration. Please try again.");
        alert("Failed to save configuration. Please try again.");
    }
});

// مدیریت آپلود فایل JSON و مقداردهی خودکار مسیر دایرکتوری
document.getElementById('json-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        alert("Please select a JSON file.");
        return;
    }

    addLog("Uploading JSON file...");

    // مقداردهی مسیر دایرکتوری
    const directoryInput = document.getElementById('crawl-directory');
    directoryInput.value = file.webkitRelativePath
        ? file.webkitRelativePath.split('/')[0] // دایرکتوری نسبی
        : file.name; // در صورت نبود مسیر، نام فایل

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:8000/upload_config/", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            if (result.detail) {
                throw new Error(result.detail);
            }
            addLog("Configuration uploaded successfully!");
            alert("Configuration uploaded successfully!");
        })
        .catch(error => {
            console.error("Error uploading JSON:", error);
            addLog(`Failed to upload JSON file. Error: ${error.message}`);
            alert(`Failed to upload JSON file. Error: ${error.message}`);
        });
});

document.getElementById('run-crawler').addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) {
            alert("No file selected. Please select a JSON file.");
            return;
        }

        addLog("Starting crawl process...");

        const formData = new FormData();
        formData.append("config_file", file); // مطابق با پارامتر API
        formData.append("output_directory", "output_folder"); // نام دایرکتوری خروجی
        formData.append("depth", "2"); // عمق خزیدن

        try {
            const response = await fetch("http://127.0.0.1:8000/run-crawler/", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                addLog(`Crawler error: ${error.message || "Unknown error occurred."}`);
                throw new Error(error.message || "Unknown error occurred.");
            }

            const result = await response.json();
            addLog(`Crawl process completed successfully! Output: ${result.output}`);
            alert(`Crawl process completed successfully! Output: ${result.output}`);
        } catch (error) {
            console.error("Error:", error);
            addLog(`Error running crawler: ${error.message}`);
            alert(`Error: ${error.message}`);
        }
    });

    input.click();
});

// مدیریت ارسال فرم جدید برای جمع‌آوری داده‌ها
document.getElementById('action-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const actionType = document.getElementById('action-type').value;
    const selector = document.getElementById('selector').value.trim();
    const value = document.getElementById('value').value.trim();
    const expectedErrorSelector = document.getElementById('expected-error-selector').value.trim();
    const invalidValues = document.getElementById('invalid-values').value.trim().split(',');
    const maxLength = document.getElementById('max-length').value.trim();
    const containsDigits = document.getElementById('contains-digits').checked;
    const allowedCharacters = document.getElementById('allowed-characters').value.trim();

    if (!actionType || !selector || !value || !expectedErrorSelector || !maxLength || !invalidValues || !allowedCharacters) {
        alert("All fields must be filled out.");
        return;
    }

    if (/[آ-ی]/.test(selector) || /[آ-ی]/.test(value) || /[آ-ی]/.test(expectedErrorSelector)) {
        alert("Persian characters are not allowed.");
        return;
    }

    const rules = {};
    if (maxLength) {
        rules["max_length"] = parseInt(maxLength, 10);
    }
    if (containsDigits) {
        rules["contains_digits"] = containsDigits;
    }
    if (allowedCharacters) {
        rules["allowed_characters"] = allowedCharacters;
    }

    const actionData = {
        action: actionType,
        selector: selector,
        value: value,
        invalid_values: invalidValues,
        expected_error_selector: expectedErrorSelector,
        rules: rules
    };

    actions.push(actionData);
    alert("Action has been saved successfully!");
    updateActionList();
});

document.getElementById('delete-action').addEventListener('click', function () {
    const selectedIndex = actionList.selectedIndex;
    if (selectedIndex === -1) {
        alert("Please select an action to delete.");
        return;
    }
    actions.splice(selectedIndex, 1);
    updateActionList();
    alert("The selected action has been deleted.");
});

document.getElementById('export-json').addEventListener('click', function () {
    const url = document.getElementById('url').value.trim();
    if (!url) {
        alert("URL cannot be empty.");
        return;
    }

    const data = {
        url: url,
        actions: actions
    };

    const fileName = prompt("Enter the file name to save:", "config.json");
    if (!fileName) {
        alert("File name cannot be empty.");
        return;
    }

    const fileContent = JSON.stringify(data, null, 4);
    const blob = new Blob([fileContent], { type: "application/json" });
    const urlBlob = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(`Data exported to ${fileName}`);
});

function updateActionList() {
    const actionLogs = document.getElementById('action-logs');
    actionLogs.innerHTML = '';
    actions.forEach((action, index) => {
        const logMessage = document.createElement('div');
        logMessage.textContent = `Action ${index + 1}: ${JSON.stringify(action)}`;
        actionLogs.appendChild(logMessage);
    });
}

// افزودن پیام به لاگ‌ها
function addLog(message) {
    const logsContainer = document.getElementById('logs');
    const logMessage = document.createElement('div');
    logMessage.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logsContainer.appendChild(logMessage);
    logsContainer.scrollTop = logsContainer.scrollHeight; // اسکرول به انتهای لاگ
}

const actions = [];
const actionList = document.getElementById('action-logs');