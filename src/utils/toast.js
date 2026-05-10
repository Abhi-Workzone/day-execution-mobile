import Toast from 'react-native-toast-message';

/**
 * Centralized Toast utility to manage toast styles and positions from one place.
 */
export const showToast = {
  success: (title, message = '') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top', // Change this to 'bottom' to move all toasts globally
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  },
  error: (title, message = '') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  },
  info: (title, message = '') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  }
};
