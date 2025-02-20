import os
import subprocess
import json
from fastapi import FastAPI, HTTPException,UploadFile,Form
from pydantic import BaseModel, Field, validator, ValidationError
from typing import Dict
from fastapi.responses import JSONResponse
import shutil
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# مسیر فایل تنظیمات
CONFIG_FILE = "db_config.json"

# class ConfigModel(BaseModel):
#     db_name: str = Field(..., pattern=r"^[^\u0600-\u06FF]+$", description="فارسی نزن")
#     collection_name: str = Field(..., pattern=r"^[^\u0600-\u06FF]+$", description="فارسی داره انگلیسی بزن")
#     url: str = Field(..., pattern=r"^(https?://)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(/.*)?$", description="Valid URL like www.example.com")
#     file_name: str = Field(..., pattern=r"^[a-zA-Z0-9_\-]+$")


    # @validator("db_name", pre=True, always=True)
    # def validate_db_name(cls, v, values, **kwargs):
    #     if not v or not v.isascii():
    #         raise ValueError("فارسی نزن")
    #     return v
    # # اعتبارسنجی و پیام سفارشی برای collection_name
    # @validator("collection_name", pre=True, always=True)
    # def validate_collection_name(cls, v, values, **kwargs):
    #     if not v or not v.isascii():
    #         raise ValueError("فارسی داره انگلیسی بزن")
    #     return v
    
    # @validator("file_name", pre=True, always=True)
    # def validate_collection_name(cls, v, values, **kwargs):
    #     if not v or not v.isascii():
    #         raise ValueError("فارسی داره انگلیسی بزن")
    #     return v
    


def save_config_to_file(config_data, file_name):
    """ذخیره تنظیمات در فایل JSON."""
    try:
        with open(file_name, "w") as file:
            json.dump(config_data, file, indent=4)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving configuration: {e}")

@app.post("/get_config/")
async def save_config(config: ConfigModel):
    """ذخیره تنظیمات جدید در مسیر /get_config/."""
    file_name = f"{config.file_name}.json"
    save_config_to_file(config.dict(exclude={"file_name"}), file_name)
    return {"message": f"Configuration saved successfully az {file_name}!", "data": config}



UPLOAD_FOLDER = "uploaded_configs"

# ایجاد فولدر آپلود (در صورت عدم وجود)
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.post("/run-crawler/")
async def run_crawler(config_file: UploadFile, output_directory: str = Form(...), depth: int = Form(2)):
    # ذخیره فایل JSON آپلود شده
    config_path = os.path.join(UPLOAD_FOLDER, config_file.filename)
    with open(config_path, "wb") as f:
        shutil.copyfileobj(config_file.file, f)
    
    try:
        # اجرای برنامه کرالر
        result = subprocess.run(
            [
                "python", "web_crawler_mongo.py", 
                "--config", config_path,
                "--directory", output_directory,
                "--depth", str(depth)
            ],
            capture_output=True, text=True
        )
        # بررسی نتیجه اجرای برنامه
        if result.returncode == 0:
            return JSONResponse(
                status_code=200,
                content={"message": "Crawler executed successfully.", "output": result.stdout}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Crawler execution failed.", "error": result.stderr}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": "An error occurred while running the crawler.", "error": str(e)}
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # در محیط توسعه
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


