import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid

class S3Service:
    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        if settings.AWS_ACCESS_KEY_ID:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        else:
            self.s3_client = None

    def upload_audio(self, file_bytes: bytes, file_extension: str = "webm") -> str:
        """
        Uploads audio to S3 and returns the object key.
        If S3 is not configured, returns a mock key.
        """
        if not self.s3_client:
            return f"mock_s3_key_{uuid.uuid4().hex}.{file_extension}"
            
        file_key = f"sessions/{uuid.uuid4().hex}.{file_extension}"
        try:
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=file_key,
                Body=file_bytes,
                ContentType=f"audio/{file_extension}"
            )
            return file_key
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            return None

s3_service = S3Service()
