import os, sys
# allow imports from root folder
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app_fastapi import app  # your FastAPI() instance

