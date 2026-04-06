import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """Получение списка всех загруженных файлов"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT id, name, url, size, created_at FROM files ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    files = [
        {
            'id': row[0],
            'name': row[1],
            'url': row[2],
            'size': row[3],
            'created_at': row[4].isoformat() if row[4] else None
        }
        for row in rows
    ]

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'files': files})
    }
