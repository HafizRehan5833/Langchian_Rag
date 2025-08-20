# PDF ChatBot - FastAPI Version

An intelligent PDF document assistant powered by FastAPI, LangChain, and Google Generative AI. Upload PDF documents and chat with them using natural language queries.

## Features

- **PDF Upload & Processing**: Upload PDF files with drag-and-drop support
- **Intelligent Chat**: Ask questions about your PDF content using natural language
- **Modern UI**: Responsive web interface with real-time chat
- **AI-Powered**: Uses Google's Gemini AI for understanding and responding
- **Session Management**: Maintains conversation context
- **File Management**: Secure file handling with cleanup

## Technology Stack

- **Backend**: FastAPI (Python)
- **AI/ML**: LangChain, Google Generative AI (Gemini)
- **Frontend**: HTML5, TailwindCSS, JavaScript
- **File Processing**: PyPDF for PDF parsing
- **Embeddings**: Google Generative AI Embeddings

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- Google API Key for Generative AI

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd langchain-pdf-chatter
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   # or using uv
   uv sync
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   SESSION_SECRET=your_secret_key_here
   HOST=0.0.0.0
   PORT=5000
   RELOAD=True
   LOG_LEVEL=info
   ```

4. **Get Google API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

### Running the Application

#### Option 1: Using the run script
```bash
python run.py
```

#### Option 2: Using uvicorn directly
```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

#### Option 3: Using the FastAPI development server
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## API Endpoints

### Web Interface
- `GET /` - Main application interface

### File Operations
- `POST /upload` - Upload PDF file
- `POST /clear` - Clear chat and remove uploaded file

### Chat Operations  
- `POST /chat` - Send chat message
- `GET /status` - Get current session status

### Static Files
- `/static/*` - Static assets (CSS, JS, images)

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## Usage

1. **Upload PDF**: Click the upload area or drag-and-drop a PDF file
2. **Wait for Processing**: The system will process and index your document
3. **Start Chatting**: Ask questions about your PDF content
4. **Clear Session**: Use the "Clear Chat" button to start over

## Project Structure

```
langchain-pdf-chatter/
├── app.py                 # FastAPI application
├── chat_service.py        # LangChain chat service
├── run.py                 # Startup script
├── requirements.txt       # Python dependencies
├── pyproject.toml        # Project configuration
├── .env                  # Environment variables (create this)
├── templates/
│   └── index.html        # Main web interface
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── app.js        # Frontend JavaScript
└── uploads/              # Uploaded files (auto-created)
```

## Key Changes from Flask Version

1. **FastAPI Framework**: Replaced Flask with FastAPI for better performance and automatic API docs
2. **Async Support**: Added async file handling with aiofiles
3. **Pydantic Models**: Type-safe request/response models
4. **Modern Python**: Uses Python 3.11+ features
5. **ASGI Server**: Uses Uvicorn instead of Gunicorn
6. **Auto Documentation**: Built-in Swagger/OpenAPI docs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Generative AI API key | Required |
| `SESSION_SECRET` | Secret key for sessions | `dev-secret-key-change-in-production` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `5000` |
| `RELOAD` | Enable auto-reload in development | `True` |
| `LOG_LEVEL` | Logging level | `info` |

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all dependencies are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **Google API Key**: Ensure your API key is valid and has Generative AI access enabled

3. **File Upload Issues**: Check that the `uploads/` directory has write permissions

4. **Port Conflicts**: Change the PORT in your `.env` file if 5000 is already in use

### Development

To run in development mode with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

## License

This project is available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please create an issue in the repository.
