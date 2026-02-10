// src/services/notificationService.js
import { toast } from 'react-toastify';

class NotificationService {
  // Play notification sound
  playSound() {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (err) {
      console.log('Sound not available:', err);
    }
  }

  // Show toast notification
  showToast(message, options = {}) {
    console.log('📢 Showing toast:', message); // ✅ THÊM LOG
    
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      icon: '💬',
      ...options,
    });
  }
}

export default new NotificationService();