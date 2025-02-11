let isRecording = false;
let actions = [];

const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const saveButton = document.getElementById("save");
const editButton = document.getElementById("edit");
const runTestsButton = document.getElementById("runTests");
const statusDiv = document.getElementById("status");
const actionsDiv = document.getElementById("actions");
const editActionsDiv = document.getElementById("editActions");
const editTextarea = document.getElementById("editTextarea");
const saveEditButton = document.getElementById("saveEdit");
const cancelEditButton = document.getElementById("cancelEdit");
const invalidValuesModal = document.getElementById("invalidValuesModal");
const invalidValuesInput = document.getElementById("invalidValuesInput");
const invalidValuesSaveButton = document.getElementById("invalidValuesSave");
const invalidValuesSuggestions = document.getElementById("invalidValuesSuggestions");
const rulesModal = document.getElementById("rulesModal");
const maxLengthInput = document.getElementById("maxLengthInput");
const containsDigitsInput = document.getElementById("containsDigitsInput");
const allowedCharactersInput = document.getElementById("allowedCharactersInput");
const rulesSaveButton = document.getElementById("rulesSave");
const fileInput = document.createElement("input");

fileInput.type = "file";
fileInput.accept = "application/json";

// شروع ضبط اقدامات
startButton.addEventListener("click", () => {
  isRecording = true;
  statusDiv.textContent = "Status: Recording...";
  startButton.disabled = true;
  stopButton.disabled = false;
  saveButton.disabled = true;
  actions = []; // پاک کردن اقدامات قبلی
  displayActions(); // پاک کردن نمایش
});

// توقف ضبط اقدامات
stopButton.addEventListener("click", () => {
  isRecording = false;
  statusDiv.textContent = "Status: Not Recording";
  startButton.disabled = false;
  stopButton.disabled = true;
  saveButton.disabled = actions.length === 0; // فعال کردن دکمه ذخیره اگر اقدامات وجود داشته باشد
});

// ذخیره اقدامات به صورت فایل JSON
saveButton.addEventListener("click", () => {
  if (actions.length > 0) {
    const blob = new Blob([JSON.stringify(actions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_actions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});

// نمایش بخش ویرایش اقدامات
editButton.addEventListener("click", () => {
  editActionsDiv.style.display = "block";
  editTextarea.value = JSON.stringify(actions, null, 2);
});

// ذخیره تغییرات ویرایش شده
saveEditButton.addEventListener("click", () => {
  try {
    const editedActions = JSON.parse(editTextarea.value);
    actions = editedActions;
    displayActions();
    editActionsDiv.style.display = "none";
  } catch (error) {
    alert("Invalid JSON format. Please check your input.");
  }
});

// لغو ویرایش
cancelEditButton.addEventListener("click", () => {
  editActionsDiv.style.display = "none";
});

// نمایش اقدامات
function displayActions() {
  actionsDiv.innerHTML = actions.map((action, index) => `
    <div class="action-card mb-3" data-index="${index}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge bg-${getActionColor(action.actionType)}">
          ${action.actionType.toUpperCase()}
        </span>
        <small class="text-muted">${new Date(action.timestamp).toLocaleString()}</small>
      </div>
      <div class="text-break">
        <strong>Selector:</strong> <code contenteditable="false" class="editable">${action.selector}</code><br>
        ${action.label ? `<strong>Label:</strong> <span contenteditable="false" class="editable">${action.label}</span><br>` : ''}
        ${action.value ? `<strong>Value:</strong> <span contenteditable="false" class="editable">${action.value}</span><br>` : ''}
        ${action.invalid_values ? `<strong>Invalid Values:</strong> <span contenteditable="false" class="editable">${action.invalid_values.join(", ")}</span><br>` : ''}
        ${action.rules ? `
          <strong>Rules:</strong><br>
          <ul>
            ${action.rules.max_length ? `<li>Max Length: <span contenteditable="false" class="editable">${action.rules.max_length}</span></li>` : ''}
            ${action.rules.contains_digits ? `<li>Contains Digits: <span contenteditable="false" class="editable">${action.rules.contains_digits}</span></li>` : ''}
            ${action.rules.allowed_characters ? `<li>Allowed Characters: <span contenteditable="false" class="editable">${action.rules.allowed_characters}</span></li>` : ''}
          </ul>
        ` : ''}
        ${action.error_message ? `<strong class="text-danger">Error:</strong> ${action.error_message}` : ''}
      </div>
      <div class="d-flex justify-content-end mt-2">
        <button class="btn btn-sm btn-warning edit-btn"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-success save-btn d-none"><i class="fas fa-check"></i></button>
      </div>
    </div>
  `).join("");

  if (actions.length === 0) {
    actionsDiv.innerHTML = '<div class="text-center text-muted py-4">No actions recorded yet</div>';
  }

  // اضافه کردن رویداد کلیک به دکمه‌های ویرایش و ذخیره
  document.querySelectorAll(".edit-btn").forEach((btn, index) => {
    btn.addEventListener("click", function () {
      let card = btn.closest(".action-card");
      card.querySelectorAll(".editable").forEach(el => el.contentEditable = "true");
      card.querySelector(".save-btn").classList.remove("d-none");
      btn.classList.add("d-none");
    });
  });

  document.querySelectorAll(".save-btn").forEach((btn, index) => {
    btn.addEventListener("click", function () {
      let card = btn.closest(".action-card");
      let newSelector = card.querySelector("code").textContent.trim();
      let newLabel = card.querySelector("span:nth-of-type(1)")?.textContent.trim();
      let newValue = card.querySelector("span:nth-of-type(2)")?.textContent.trim();
      let newInvalidValues = card.querySelector("span:nth-of-type(3)")?.textContent.trim();
      let newMaxLength = card.querySelector("span:nth-of-type(4)")?.textContent.trim();
      let newContainsDigits = card.querySelector("span:nth-of-type(5)")?.textContent.trim();
      let newAllowedCharacters = card.querySelector("span:nth-of-type(6)")?.textContent.trim();

      // بروزرسانی آرایه actions
      actions[index].selector = newSelector;
      if (newLabel) actions[index].label = newLabel;
      if (newValue) actions[index].value = newValue;
      if (newInvalidValues) actions[index].invalid_values = newInvalidValues.split(",").map(value => value.trim());
      if (newMaxLength) actions[index].rules.max_length = parseInt(newMaxLength, 10);
      if (newContainsDigits) actions[index].rules.contains_digits = newContainsDigits === "true";
      if (newAllowedCharacters) actions[index].rules.allowed_characters = newAllowedCharacters;

      // غیرفعال کردن ویرایش
      card.querySelectorAll(".editable").forEach(el => el.contentEditable = "false");
      card.querySelector(".edit-btn").classList.remove("d-none");
      btn.classList.add("d-none");
    });
  });
}

// دریافت رنگ اقدام بر اساس نوع اقدام
function getActionColor(actionType) {
  const colors = {
    click: 'primary',
    input: 'success',
    error: 'danger'
  };
  return colors[actionType] || 'secondary';
}

// تابع برای ارسال اقدامات به سرور
async function sendActionToServer(action) {
  try {
    const response = await fetch('http://localhost:3000/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action)
    });
    if (!response.ok) {
      throw new Error('Failed to send action to server');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// گوش دادن به پیام‌ها از اسکریپت محتوا
chrome.runtime.onMessage.addListener((message) => {
  if (isRecording && message.type === "recordAction") {
    const lastAction = actions[actions.length - 1];
    if (lastAction && lastAction.actionType === "input" && lastAction.selector === message.action.selector) {
      lastAction.value = message.action.value;
      lastAction.timestamp = message.action.timestamp;
    } else {
      actions.push(message.action);
      if (message.action.actionType === "input") {
        invalidValuesModal.style.display = "block";
        invalidValuesSuggestions.innerHTML = suggestions.map(suggestion => `<button type="button" class="suggestion">${suggestion}</button>`).join("");
        document.querySelectorAll(".suggestion").forEach(button => {
          button.addEventListener("click", () => {
            invalidValuesInput.value += (invalidValuesInput.value ? ", " : "") + button.textContent;
          });
        });
        invalidValuesSaveButton.onclick = () => {
          const invalidValues = invalidValuesInput.value;
          if (invalidValues) {
            message.action.invalid_values = invalidValues.split(",").map(value => value.trim());
          }
          invalidValuesModal.style.display = "none";
          invalidValuesInput.value = "";
          rulesModal.style.display = "block"; // باز کردن rulesModal بعد از بستن invalidValuesModal
        };
        rulesSaveButton.onclick = () => {
          const rules = {
            max_length: parseInt(maxLengthInput.value, 10),
            contains_digits: containsDigitsInput.checked,
            allowed_characters: allowedCharactersInput.value
          };
          message.action.rules = rules;
          rulesModal.style.display = "none";
          maxLengthInput.value = "";
          containsDigitsInput.checked = false;
          allowedCharactersInput.value = "";
          displayActions(); // به‌روزرسانی نمایش اقدامات
        };
      }
    }
    displayActions();
    sendActionToServer(message.action);
  }
});

// اجرای تست‌ها
runTestsButton.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target.result;
        const response = await fetch('http://localhost:3000/run-tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileContent })
        });
        if (!response.ok) {
          throw new Error('Failed to run tests');
        }
        const result = await response.text();
        alert(result);
      } catch (error) {
        alert("Error running tests. Please check your file.");
      }
    };
    reader.readAsText(file);
  }
});