// public/script.js
document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendingIndicator = document.createElement('div');

  // Tambahkan indicator loading
  sendingIndicator.className = 'message bot sending-indicator';
  sendingIndicator.innerHTML = `<div class="typing-dots">
    <span></span><span></span><span></span>
  </div>`;

  function addMessage(text, sender = 'user') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    
    msgDiv.appendChild(content);
    chatBox.appendChild(msgDiv);
    
    // Auto scroll ke bawah
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return msgDiv;
  }

  // Handle submit form
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Tampilkan pesan user
    addMessage(message, 'user');
    userInput.value = '';
    userInput.disabled = true;

    // Tampilkan loading indicator
    chatBox.appendChild(sendingIndicator);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // Hapus loading indicator
      sendingIndicator.remove();
      
      if (response.ok) {
        addMessage(data.reply, 'bot');
      } else {
        addMessage(`⚠️ Error: ${data.error || 'Gagal memproses'}`, 'bot');
      }
    } catch (err) {
      console.error('Network error:', err);
      sendingIndicator.remove();
      addMessage('⚠️ Tidak terhubung ke server. Pastikan server sedang berjalan.', 'bot');
    } finally {
      userInput.disabled = false;
      userInput.focus();
    }
  });

  // Tambahkan pesan selamat datang
  setTimeout(() => {
    addMessage('Halo! Saya chatbot pendamping kesehatan mental. Bagaimana kabarmu hari ini?', 'bot');
  }, 500);
});