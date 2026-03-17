import os
import re

env_path = r'C:\asyl-ai\backend\alembic\env.py'
with open(env_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace('from logging.config import fileConfig', 'from logging.config import fileConfig\nimport sys\nimport os\nsys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))\nfrom app.core.database import Base\nfrom app.models import *')

# Change target_metadata
content = content.replace('target_metadata = None', 'target_metadata = Base.metadata')

with open(env_path, 'w', encoding='utf-8') as f:
    f.write(content)
