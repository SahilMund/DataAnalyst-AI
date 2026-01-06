import os
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel
from starlette.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    message: str

class EmailUtils:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
            MAIL_FROM=os.getenv("MAIL_FROM", "admin@example.com"),
            MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
            MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
            MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
            MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
            USE_CREDENTIALS=os.getenv("USE_CREDENTIALS", "True").lower() == "true",
            VALIDATE_CERTS=os.getenv("VALIDATE_CERTS", "True").lower() == "true",
            MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Lumin AI")
        )
        self.fm = FastMail(self.conf)

    async def send_email(self, email: List[EmailStr], subject: str, Body: str):
        message = MessageSchema(
            subject=subject,
            recipients=email,
            body=Body,
            subtype=MessageType.html
        )
        await self.fm.send_message(message)
        return JSONResponse(status_code=200, content={"message": "Email has been sent"})

email_utils = EmailUtils()
