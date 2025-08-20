import os
import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain.text_splitter import CharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.memory import ConversationBufferWindowMemory
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class ChatService:
    """Service class for handling PDF chat functionality using LangChain and Google AI."""
    
    def __init__(self, pdf_path):
        """Initialize the chat service with a PDF file."""
        self.pdf_path = pdf_path
        self.llm = None
        self.memory = None
        self.store = None
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize all LangChain components."""
        try:
            # Get API key
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY is not set in environment variables")
            
            logger.info("Initializing Google Generative AI components...")
            
            # Initialize LLM
            self.llm = GoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.7,
                max_tokens=1024
            )
            
            # Initialize memory
            self.memory = ConversationBufferWindowMemory(k=5)
            
            # Load PDF
            logger.info(f"Loading PDF: {self.pdf_path}")
            loader = PyPDFLoader(self.pdf_path)
            
            # Create embeddings
            logger.info("Creating embeddings...")
            embedding = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001"
            )
            
            # Create text splitter
            text_splitter = CharacterTextSplitter(
                chunk_size=500, 
                chunk_overlap=100
            )
            
            # Create index
            logger.info("Creating vector store index...")
            index_creator = VectorstoreIndexCreator(
                embedding=embedding,
                text_splitter=text_splitter
            )
            
            self.store = index_creator.from_loaders([loader])
            logger.info("Chat service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing chat service: {str(e)}")
            raise e
    
    def get_response(self, message):
        """Get a response from the AI based on the PDF content and user message."""
        try:
            if not self.store or not self.llm:
                raise ValueError("Chat service not properly initialized")
            
            # Create system instruction for hotel assistant behavior
            hotel_context = """
            You are a professional assistant for analyzing PDF documents. Please:
            1. Answer questions based on the content of the uploaded PDF document
            2. Be helpful, accurate, and concise in your responses
            3. If a question cannot be answered from the PDF content, politely state that the information is not available in the document
            4. Maintain a professional and friendly tone
            5. Focus on providing relevant information from the document
            """
            
            # Prepend context to the user message
            contextual_message = f"{hotel_context}\n\nUser question: {message}"
            
            # Query the vector store
            response = self.store.query(
                contextual_message, 
                llm=self.llm, 
                memory=self.memory
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting response: {str(e)}")
            return "I apologize, but I encountered an error while processing your question. Please try again or rephrase your question."
    
    def clear_memory(self):
        """Clear the conversation memory."""
        try:
            if self.memory:
                self.memory.clear()
                logger.info("Memory cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing memory: {str(e)}")
    
    def get_document_info(self):
        """Get basic information about the loaded document."""
        try:
            if self.store:
                return {
                    'status': 'loaded',
                    'path': self.pdf_path,
                    'ready': True
                }
            else:
                return {
                    'status': 'not_loaded',
                    'path': None,
                    'ready': False
                }
        except Exception as e:
            logger.error(f"Error getting document info: {str(e)}")
            return {
                'status': 'error',
                'path': self.pdf_path,
                'ready': False,
                'error': str(e)
            }
