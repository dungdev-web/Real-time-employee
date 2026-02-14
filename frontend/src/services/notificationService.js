import { toast } from 'react-toastify';

class NotificationService {
  playSound() {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (err) {
      console.log('Sound not available:', err);
    }
  }

  showToast(message, options = {}) {    
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