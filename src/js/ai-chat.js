/**
 * AI Chat Module
 * Handles AI assistant chat interface and API calls
 */

import StorageManager from './storage.js';
import I18n from './il8n.js';

const AIChat = {
  isOpen: false,
  isProcessing: false,
  messageQueue: [],

  init() {
    this.attachEventListeners();
    this.loadChatHistory();
  },

  attachEventListeners() {
    const fab = document.getElementById('aiFab');
    const modal = document.getElementById('aiModal');
    const closeBtn = modal?.querySelector('.close-modal');
    const sendBtn = document.getElementById('sendChat');
    const input = document.getElementById('chatInput');

    fab?.addEventListener('click', () => this.openChat());
    closeBtn?.addEventListener('click', () => this.closeChat());
    
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeChat();
    });

    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });
  },

  openChat() {
    const modal = document.getElementById('aiModal');
    if (!modal) return;

    modal.style.display = 'flex';
    this.isOpen = true;
    
    const input = document.getElementById('chatInput');
    setTimeout(() => input?.focus(), 100);

    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  closeChat() {
    const modal = document.getElementById('aiModal');
    if (!modal) return;

    modal.style.display = 'none';
    this.isOpen = false;

    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  async loadChatHistory() {
    try {
      const history = await StorageManager.getChatHistory();
      const container = document.getElementById('chatContainer');
      
      if (!container) return;

      const welcomeMsg = container.querySelector('.chat-message.bot');
      container.innerHTML = '';
      if (welcomeMsg) container.appendChild(welcomeMsg);

      const recentHistory = history.slice(-20);
      recentHistory.forEach(msg => {
        this.renderMessage(msg.role, msg.content, msg.sources, false);
      });

      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  },

  async sendMessage() {
    if (this.isProcessing) return;

    const input = document.getElementById('chatInput');
    const question = input?.value.trim();

    if (!question) return;

    if (question.length > 500) {
      this.showError('Question is too long. Please keep it under 500 characters.');
      return;
    }

    input.value = '';
    input.style.height = 'auto';

    this.renderMessage('user', question);
    this.scrollToBottom();

    try {
      await StorageManager.saveChatMessage({
        role: 'user',
        content: question,
        sources: []
      });
    } catch (error) {
      console.warn('Failed to save message to history:', error);
    }

    this.showTypingIndicator();

    this.isProcessing = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          lang: I18n.getCurrentLanguage()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      this.hideTypingIndicator();

      if (result.success) {
        const { answer, sources, confidence } = result.data;
        
        this.renderMessage('bot', answer, sources, true, confidence);

        try {
          await StorageManager.saveChatMessage({
            role: 'bot',
            content: answer,
            sources: sources || []
          });
        } catch (error) {
          console.warn('Failed to save response to history:', error);
        }
      } else {
        throw new Error(result.error || 'AI request failed');
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error('AI chat error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again with a shorter question.';
      } else if (error.message.includes('offline')) {
        errorMessage = 'You are offline. Please check your internet connection.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'You\'ve asked too many questions. Please wait a moment.';
      }
      
      this.renderMessage('bot', `❌ ${errorMessage}`, [], false);
    } finally {
      this.isProcessing = false;
      this.scrollToBottom();
    }
  },

  renderMessage(role, content, sources = [], scrollToView = true, confidence = null) {
    const container = document.getElementById('chatContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;

    const contentP = document.createElement('p');
    contentP.textContent = content;
    messageDiv.appendChild(contentP);

    if (role === 'bot' && confidence) {
      const confidenceSpan = document.createElement('div');
      confidenceSpan.className = 'confidence';
      confidenceSpan.style.cssText = 'font-size: 0.8rem; margin-top: 0.5rem; color: var(--color-text-secondary);';
      
      const confidenceColor = confidence === 'high' ? '#4caf50' : 
                              confidence === 'medium' ? '#ff9800' : '#f44336';
      
      confidenceSpan.innerHTML = `<span style="color: ${confidenceColor};">●</span> Confidence: ${confidence}`;
      messageDiv.appendChild(confidenceSpan);
    }

    if (sources && sources.length > 0) {
      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'sources';
      sourcesDiv.style.cssText = 'margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem;';
      
      const sourcesLabel = document.createElement('strong');
      sourcesLabel.textContent = I18n.t('sources') + ': ';
      sourcesDiv.appendChild(sourcesLabel);

      sources.forEach((source, index) => {
        if (index > 0) {
          sourcesDiv.appendChild(document.createTextNode(', '));
        }

        if (typeof source === 'string' && source.startsWith('http')) {
          const link = document.createElement('a');
          link.href = source;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = `[${index + 1}]`;
          link.style.color = 'var(--gold-primary)';
          link.style.textDecoration = 'underline';
          sourcesDiv.appendChild(link);
        } else {
          const span = document.createElement('span');
          span.textContent = source;
          span.style.color = 'var(--gold-light)';
          sourcesDiv.appendChild(span);
        }
      });

      messageDiv.appendChild(sourcesDiv);
    } else if (role === 'bot' && !content.startsWith('❌')) {
      const noSources = document.createElement('div');
      noSources.className = 'sources';
      noSources.style.cssText = 'margin-top: 0.5rem; font-size: 0.85rem; font-style: italic; color: var(--color-text-secondary);';
      noSources.textContent = I18n.t('no_sources');
      messageDiv.appendChild(noSources);
    }

    container.appendChild(messageDiv);

    if (scrollToView) {
      this.scrollToBottom();
    }
  },

  showTypingIndicator() {
    const container = document.getElementById('chatContainer');
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'chat-message bot typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
      <style>
        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .typing-dots span {
          width: 8px;
          height: 8px;
          background: var(--gold-primary);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      </style>
    `;

    container.appendChild(indicator);
    this.scrollToBottom();
  },

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  },

  scrollToBottom() {
    const container = document.getElementById('chatContainer');
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  },

  showError(message) {
    this.renderMessage('bot', `❌ ${message}`, [], true);
  },

  async clearHistory() {
    if (confirm('Clear all chat history? This cannot be undone.')) {
      await StorageManager.clearChatHistory();
      const container = document.getElementById('chatContainer');
      if (container) {
        container.innerHTML = `
          <div class="chat-message bot">
            <p>As-salamu alaykum! I'm here to answer your Islamic questions. Ask me anything about Quran, Hadith, Fiqh, or Islamic practices.</p>
          </div>
        `;
      }
    }
  }
};

export default AIChat;