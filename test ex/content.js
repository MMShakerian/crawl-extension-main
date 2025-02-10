// افزودن رویداد برای ورودی‌ها
document.addEventListener("input", (event) => {
  const action = {
    actionType: "input",
    selector: getUniqueSelector(event.target),
    label: getLabel(event.target),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    value: event.target.value,
    invalid_values: [], // مقداردهی اولیه با یک آرایه خالی
    error_message: null // مقداردهی اولیه با null
  };
  chrome.runtime.sendMessage({ type: "recordAction", action });
});

// افزودن رویداد برای کلیک‌ها
document.addEventListener("click", (event) => {
  const target = event.target;
  const action = {
    actionType: target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "textarea" ? "input" : "click",
    selector: getUniqueSelector(target),
    label: getLabel(target),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    value: target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "textarea" ? target.value : null,
    error_message: null // مقداردهی اولیه با null
  };
  chrome.runtime.sendMessage({ type: "recordAction", action });
});

// تابع برای دریافت selector یکتا
function getUniqueSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.name) return `[name="${element.name}"]`;
  
  let path = [];
  while (element.parentElement) {
    let tag = element.tagName.toLowerCase();
    let siblings = Array.from(element.parentElement.children).filter(e => e.tagName.toLowerCase() === tag);
    if (siblings.length > 1) {
      let index = siblings.indexOf(element) + 1;
      tag += `:nth-of-type(${index})`;
    }
    path.unshift(tag);
    element = element.parentElement;
  }
  return path.join(" > ");
}

// تابع برای دریافت label
function getLabel(element) {
  const label = element.closest('label');
  if (label) return label.textContent.trim();
  const id = element.id;
  if (id) {
    const labelElement = document.querySelector(`label[for="${id}"]`);
    if (labelElement) return labelElement.textContent.trim();
  }
  return null;
}

// مشاهده تغییرات برای پیام‌های خطا
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // بررسی الگوهای رایج پیام‌های خطا
          if (node.classList.contains('error') || node.classList.contains('error-message') || node.getAttribute('role') === 'alert' || node.getAttribute('aria-live') === 'assertive') {
            const errorMessage = node.textContent.trim();
            const inputElement = node.previousElementSibling || node.closest('input, textarea, select');
            if (inputElement) {
              const action = {
                actionType: "error",
                selector: getUniqueSelector(inputElement),
                timestamp: new Date().toISOString(),
                url: window.location.href,
                error_message: errorMessage
              };
              chrome.runtime.sendMessage({ type: "recordAction", action });
            }
          }
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });