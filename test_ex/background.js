// باز کردن صفحه اصلی اکستنشن زمانی که روی آیکون اکستنشن کلیک می‌شود
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("main.html") });
});
