import os
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
import uuid
from chat_service import ChatService
from dotenv import load_dotenv
import aiofiles
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="PDF ChatBot API", description="AI Document Assistant", version="1.0.0")

# Add session middleware
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Global chat service instance
chat_service = None

# Pydantic models
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    message: str

class UploadResponse(BaseModel):
    success: bool
    message: str
    filename: str

class StatusResponse(BaseModel):
    has_file: bool
    filename: str
    ready: bool

class ErrorResponse(BaseModel):
    error: str

def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def secure_filename(filename: str) -> str:
    """Secure a filename by removing unsafe characters."""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[^\w\s\-_\.]', '', filename)
    # Replace spaces with underscores
    filename = re.sub(r'[\s]+', '_', filename)
    return filename

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Main page route."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload", response_model=UploadResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Handle PDF file upload."""
    global chat_service
    
    try:
        # Check if file is provided
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        # Check file extension
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 16MB.")
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        # Store file info in session
        request.session['uploaded_file'] = {
            'filename': filename,
            'path': file_path,
            'unique_filename': unique_filename
        }
        
        # Initialize chat service with the uploaded PDF
        try:
            chat_service = ChatService(file_path)
            logger.info(f"Successfully initialized chat service with file: {filename}")
            return UploadResponse(
                success=True,
                message=f'Successfully uploaded and processed {filename}',
                filename=filename
            )
        except Exception as e:
            logger.error(f"Error initializing chat service: {str(e)}")
            # Clean up uploaded file if processing fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f'Error processing PDF: {str(e)}')
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: Request, chat_message: ChatMessage):
    """Handle chat messages."""
    global chat_service
    
    try:
        message = chat_message.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="Empty message")
        
        # Check if chat service is initialized
        if chat_service is None:
            raise HTTPException(status_code=400, detail="Please upload a PDF file first")
        
        # Handle greeting messages
        if message.lower() in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]:
            response = "Hello! I'm your PDF assistant. I can help you with questions about the uploaded document. How can I assist you today?"
        else:
            # Get response from chat service
            response = chat_service.get_response(message)
        
        return ChatResponse(response=response, message=message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process message")

@app.post("/clear")
async def clear_chat(request: Request):
    """Clear the current chat session and uploaded file."""
    global chat_service
    
    try:
        # Clean up uploaded file
        uploaded_file = request.session.get('uploaded_file')
        if uploaded_file:
            file_path = uploaded_file.get('path')
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Removed uploaded file: {file_path}")
        
        # Clear session and chat service
        request.session.clear()
        chat_service = None
        
        return {"success": True, "message": "Chat cleared successfully"}
        
    except Exception as e:
        logger.error(f"Clear chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear chat")

@app.get("/status", response_model=StatusResponse)
async def status(request: Request):
    """Get current chat status."""
    try:
        has_file = 'uploaded_file' in request.session and chat_service is not None
        filename = request.session.get('uploaded_file', {}).get('filename', '') if has_file else ''
        
        return StatusResponse(
            has_file=has_file,
            filename=filename,
            ready=has_file
        )
        
    except Exception as e:
        logger.error(f"Status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get status")

# Error handlers are replaced by HTTPException in FastAPI

if __name__ == "__main__":
    # for local dev only
    import uvicorn
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True)