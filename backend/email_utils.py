import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from config import Config


def get_gmail_service():
    """
    We authenticate to Gmail using a refresh token we generated once
    This builds a Gmail API client we can use
    to send emails on behalf of our own Gmail account.
    """
    creds = Credentials(
        token=None,
        refresh_token=Config.GMAIL_REFRESH_TOKEN,
        client_id=Config.GMAIL_CLIENT_ID,
        client_secret=Config.GMAIL_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("gmail", "v1", credentials=creds)


def send_email(to_email, subject, body_text):
    """
    Builds a plain text email and sends it through Gmail API.
    Gmail API wants the email base64-encoded, so we do that conversion here.
    """
    try:
        service = get_gmail_service()

        message = MIMEText(body_text)
        message["to"] = to_email
        message["from"] = Config.GMAIL_SENDER_EMAIL
        message["subject"] = subject

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        service.users().messages().send(
            userId="me",
            body={"raw": raw_message}
        ).execute()

        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")