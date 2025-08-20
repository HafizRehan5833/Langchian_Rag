// PDF ChatBot Application JavaScript

class PDFChatBot {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkStatus();
        this.setupDragAndDrop();
    }

    initializeElements() {
        // File upload elements
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadContent = document.getElementById('upload-content');
        this.uploadProgress = document.getElementById('upload-progress');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');

        // Chat elements
        this.chatForm = document.getElementById('chat-form');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.typingIndicator = document.getElementById('typing-indicator');

        // Status and control elements
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.clearBtn = document.getElementById('clear-btn');

        // Modal and toast elements
        this.loadingModal = document.getElementById('loading-modal');
        this.errorToast = document.getElementById('error-toast');
        this.successToast = document.getElementById('success-toast');
        this.errorMessage = document.getElementById('error-message');
        this.successMessage = document.getElementById('success-message');
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Chat events
        this.chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleChatSubmit(e);
            }
        });

        // Clear button event
        this.clearBtn.addEventListener('click', () => this.clearChat());

        // Auto-resize message input
        this.messageInput.addEventListener('input', this.autoResizeInput);
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        this.uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    async handleFile(file) {
        // Validate file type
        if (!file.type.includes('pdf')) {
            this.showError('Please select a PDF file.');
            return;
        }

        // Validate file size (16MB limit)
        const maxSize = 16 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size must be less than 16MB.');
            return;
        }

        // Show upload progress
        this.showUploadProgress();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showUploadSuccess(result.filename);
                this.enableChat();
                this.showSuccess(result.message);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message || 'Failed to upload file');
            this.hideUploadProgress();
        }
    }

    showUploadProgress() {
        this.uploadContent.classList.add('hidden');
        this.uploadProgress.classList.remove('hidden');
        this.fileInfo.classList.add('hidden');
    }

    hideUploadProgress() {
        this.uploadContent.classList.remove('hidden');
        this.uploadProgress.classList.add('hidden');
    }

    showUploadSuccess(filename) {
        this.uploadContent.classList.add('hidden');
        this.uploadProgress.classList.add('hidden');
        this.fileInfo.classList.remove('hidden');
        this.fileName.textContent = filename;
        
        // Update status indicator
        this.updateStatus(true, filename);
    }

    enableChat() {
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        this.clearBtn.disabled = false;
        this.messageInput.placeholder = 'Ask a question about your PDF...';
        this.messageInput.focus();
    }

    disableChat() {
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        this.clearBtn.disabled = true;
        this.messageInput.placeholder = 'Upload a PDF to start chatting...';
    }

    async handleChatSubmit(event) {
        event.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const result = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();

            if (response.ok) {
                this.addMessage(result.response, 'bot');
            } else {
                throw new Error(result.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
            this.showError(error.message || 'Failed to send message');
        }
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start space-x-3 message-enter ${isError ? 'opacity-75' : ''}`;

        const isUser = sender === 'user';
        const avatarClass = isUser ? 'bg-blue-600' : 'bg-white';
        const iconClass = isUser ? 'fas fa-user text-white' : 'fas fa-robot text-black';
        const messageClass = isUser ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-800 text-gray-100';
        const flexClass = isUser ? 'flex-row-reverse' : '';

        messageDiv.innerHTML = `
            <div class="w-8 h-8 ${avatarClass} rounded-full flex items-center justify-center flex-shrink-0">
                <i class="${iconClass} text-sm"></i>
            </div>
            <div class="${messageClass} rounded-lg p-3 max-w-3xl ${isError ? 'border border-red-500' : ''}">
                <p class="whitespace-pre-wrap">${this.escapeHtml(content)}</p>
            </div>
        `;

        if (isUser) {
            messageDiv.className += ' flex-row-reverse';
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-message';
        typingDiv.className = 'flex items-start space-x-3 opacity-75';
        typingDiv.innerHTML = `
            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-black text-sm"></i>
            </div>
            <div class="bg-gray-800 rounded-lg p-3">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = document.getElementById('typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    async clearChat() {
        if (!confirm('Are you sure you want to clear the chat and remove the uploaded file?')) {
            return;
        }

        try {
            const response = await fetch('/clear', {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Clear chat messages except welcome message
                const messages = this.chatMessages.querySelectorAll('.message-enter');
                messages.forEach(msg => msg.remove());

                // Reset upload area
                this.resetUploadArea();
                
                // Disable chat
                this.disableChat();
                
                // Update status
                this.updateStatus(false);
                
                this.showSuccess('Chat cleared successfully');
            } else {
                throw new Error(result.error || 'Failed to clear chat');
            }
        } catch (error) {
            console.error('Clear error:', error);
            this.showError(error.message || 'Failed to clear chat');
        }
    }

    resetUploadArea() {
        this.uploadContent.classList.remove('hidden');
        this.uploadProgress.classList.add('hidden');
        this.fileInfo.classList.add('hidden');
        this.fileInput.value = '';
    }

    updateStatus(hasFile, filename = '') {
        const statusDot = this.statusIndicator.querySelector('div');
        
        if (hasFile) {
            statusDot.className = 'w-2 h-2 bg-green-500 rounded-full pulse-green';
            this.statusText.textContent = `PDF loaded: ${filename}`;
        } else {
            statusDot.className = 'w-2 h-2 bg-red-500 rounded-full pulse-red';
            this.statusText.textContent = 'No PDF loaded';
        }
    }

    async checkStatus() {
        try {
            const response = await fetch('/status');
            const result = await response.json();

            if (response.ok) {
                if (result.has_file && result.ready) {
                    this.showUploadSuccess(result.filename);
                    this.enableChat();
                } else {
                    this.disableChat();
                    this.updateStatus(false);
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
            this.disableChat();
            this.updateStatus(false);
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    autoResizeInput() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.classList.remove('hidden');
        this.errorToast.classList.add('toast-enter');
        this.errorToast.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorToast.classList.add('toast-exit');
        setTimeout(() => {
            this.errorToast.classList.add('hidden');
            this.errorToast.classList.remove('toast-enter', 'toast-exit');
            this.errorToast.style.transform = 'translateX(100%)';
        }, 300);
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successToast.classList.remove('hidden');
        this.successToast.classList.add('toast-enter');
        this.successToast.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            this.hideSuccess();
        }, 3000);
    }

    hideSuccess() {
        this.successToast.classList.add('toast-exit');
        setTimeout(() => {
            this.successToast.classList.add('hidden');
            this.successToast.classList.remove('toast-enter', 'toast-exit');
            this.successToast.style.transform = 'translateX(100%)';
        }, 300);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFChatBot();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add floating animation to upload area when no file is uploaded
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.classList.add('upload-float');
    }

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.classList.add('btn-hover-scale');
    });
});
