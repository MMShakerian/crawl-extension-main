import json

def convert_input(new_input):
    # استخراج URL از اولین اکشن
    url = new_input[0]["url"]

    # ساخت لیست اکشن‌ها
    actions = []
    for item in new_input:
        action = {
            "action": item["actionType"],  # تغییر "actionType" به "action"
            "selector": item["selector"],
        }
        # اضافه کردن فیلدهای اختیاری در صورت وجود
        if "value" in item:
            action["value"] = item["value"]
        if "invalid_values" in item:
            action["invalid_values"] = item["invalid_values"]
        if "rules" in item:
            action["rules"] = item["rules"]
        actions.append(action)

    # ساخت دیکشنری نهایی
    final_input = {
        "url": url,
        "actions": actions
    }

    return final_input

# خوندن ورودی جدید از فایل
with open("new_input.json", "r", encoding="utf-8") as f:
    new_input = json.load(f)

# تبدیل ورودی
converted = convert_input(new_input)

# نمایش خروجی
print(json.dumps(converted, indent=4, ensure_ascii=False))

with open("converted_input.json", "w", encoding="utf-8") as f:
    json.dump(converted, f, indent=4, ensure_ascii=False)