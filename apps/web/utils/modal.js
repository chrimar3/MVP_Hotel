/**
 * Modal utility for non-blocking user interactions
 * Replaces blocking dialog methods like alert, confirm, etc.
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

/**
 * Creates and manages modal dialogs
 */
class Modal {
  /**
   * Creates a new Modal instance
   */
  constructor() {
    this.currentModal = null;
    this.setupStyles();
  }

  /**
   * Sets up the CSS styles for modal dialogs
   * @returns {void}
   */
  setupStyles() {
    if (document.getElementById('modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'modal-styles';
    styles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .modal-overlay.show {
        opacity: 1;
      }
      
      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }
      
      .modal-overlay.show .modal-content {
        transform: scale(1);
      }
      
      .modal-header {
        margin-bottom: 16px;
      }
      
      .modal-title {
        font-size: 1.25em;
        font-weight: 600;
        color: #333;
        margin: 0;
      }
      
      .modal-body {
        margin-bottom: 24px;
        color: #666;
        line-height: 1.5;
      }
      
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .modal-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s ease;
      }
      
      .modal-button-primary {
        background: #007bff;
        color: white;
      }
      
      .modal-button-primary:hover {
        background: #0056b3;
      }
      
      .modal-button-secondary {
        background: #6c757d;
        color: white;
      }
      
      .modal-button-secondary:hover {
        background: #545b62;
      }
      
      .modal-button-cancel {
        background: #f8f9fa;
        color: #6c757d;
        border: 1px solid #dee2e6;
      }
      
      .modal-button-cancel:hover {
        background: #e2e6ea;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Shows a confirmation modal
   * @param {string} message - The confirmation message
   * @param {Object} options - Modal options
   * @param {string} options.title - The modal title
   * @param {string} options.confirmText - Text for confirm button
   * @param {string} options.cancelText - Text for cancel button
   * @returns {Promise<boolean>} Promise that resolves to true if confirmed
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm',
        confirmText = 'OK',
        cancelText = 'Cancel'
      } = options;

      this.show({
        title,
        content: message,
        actions: [
          {
            text: cancelText,
            class: 'modal-button-cancel',
            click: () => {
              this.hide();
              resolve(false);
            }
          },
          {
            text: confirmText,
            class: 'modal-button-primary',
            click: () => {
              this.hide();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  /**
   * Shows an alert modal
   * @param {string} message - The alert message
   * @param {Object} options - Modal options
   * @param {string} options.title - The modal title
   * @param {string} options.buttonText - Text for the button
   * @returns {Promise<void>} Promise that resolves when dismissed
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Alert',
        buttonText = 'OK'
      } = options;

      this.show({
        title,
        content: message,
        actions: [
          {
            text: buttonText,
            class: 'modal-button-primary',
            click: () => {
              this.hide();
              resolve();
            }
          }
        ]
      });
    });
  }

  /**
   * Shows a custom modal
   * @param {Object} config - Modal configuration
   * @param {string} config.title - The modal title
   * @param {string} config.content - The modal content
   * @param {Array} config.actions - Array of action buttons
   * @returns {void}
   */
  show(config) {
    // Close existing modal first
    if (this.currentModal) {
      this.hide();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';

    // Header
    if (config.title) {
      const header = document.createElement('div');
      header.className = 'modal-header';

      const title = document.createElement('h3');
      title.className = 'modal-title';
      title.textContent = config.title;

      header.appendChild(title);
      content.appendChild(header);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = config.content;
    content.appendChild(body);

    // Actions
    if (config.actions && config.actions.length > 0) {
      const actions = document.createElement('div');
      actions.className = 'modal-actions';

      config.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = `modal-button ${action.class || 'modal-button-secondary'}`;
        button.textContent = action.text;
        button.addEventListener('click', action.click);
        actions.appendChild(button);
      });

      content.appendChild(actions);
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Show modal with animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // Handle escape key and overlay click
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    };

    const handleOverlayClick = (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    };

    document.addEventListener('keydown', handleEscape);
    overlay.addEventListener('click', handleOverlayClick);

    this.currentModal = {
      element: overlay,
      cleanup: () => {
        document.removeEventListener('keydown', handleEscape);
        overlay.removeEventListener('click', handleOverlayClick);
      }
    };
  }

  /**
   * Hides the current modal
   * @returns {void}
   */
  hide() {
    if (!this.currentModal) return;

    const { element, cleanup } = this.currentModal;

    element.classList.remove('show');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      cleanup();
    }, 300);

    this.currentModal = null;
  }
}

// Global modal instance
const modal = new Modal();

/**
 * Shows a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {Object} options - Modal options
 * @returns {Promise<boolean>} Promise that resolves to true if confirmed
 */
export function confirmModal(message, options = {}) {
  return modal.confirm(message, options);
}

/**
 * Shows an alert dialog
 * @param {string} message - The alert message
 * @param {Object} options - Modal options
 * @returns {Promise<void>} Promise that resolves when dismissed
 */
export function alertModal(message, options = {}) {
  return modal.alert(message, options);
}

export { Modal };
export default modal;