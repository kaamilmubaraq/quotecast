import json

from app.main import app

print(json.dumps(app.openapi(), indent=2, ensure_ascii=False))
