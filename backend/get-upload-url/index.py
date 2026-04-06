import json
import os
import uuid
import boto3
import psycopg2


def handler(event: dict, context) -> dict:
    """Генерация presigned URL для прямой загрузки файла в S3"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if raw_body.strip() else {}
    file_name = body.get('name', 'file')
    content_type = body.get('type', 'application/octet-stream')
    file_size = body.get('size', 0)

    if not file_name:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Имя файла не указано'})
        }

    ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else ''
    unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    key = f"uploads/{unique_name}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'files',
            'Key': key,
            'ContentType': content_type,
        },
        ExpiresIn=3600
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO files (name, key, url, size) VALUES (%s, %s, %s, %s) RETURNING id",
        (file_name, key, cdn_url, file_size)
    )
    file_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'upload_url': upload_url,
            'cdn_url': cdn_url,
            'key': key,
            'id': file_id,
            'name': file_name,
            'size': file_size
        })
    }
