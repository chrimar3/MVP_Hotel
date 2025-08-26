/**
 * Exit Intent Prevention Module
 * Reduces bounce rate by showing special offers when users try to leave
 */

export function showExitOffer() {
    // Check if offer was already shown
    if (sessionStorage.getItem('exitOfferShown')) {
        return;
    }
    
    sessionStorage.setItem('exitOfferShown', 'true');
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'exit-modal-overlay';
    overlay.innerHTML = `
        <div class="exit-modal">
            <button class="exit-close" onclick="this.closest('.exit-modal-overlay').remove()">×</button>
            
            <div class="exit-content">
                <h2>✋ Wait! Don't leave yet!</h2>
                <p class="exit-subtitle">You're just 30 seconds away from helping your hotel!</p>
                
                <div class="exit-offer">
                    <div class="offer-badge">LIMITED TIME</div>
                    <h3>🎁 Complete your review now and get:</h3>
                    <ul class="offer-list">
                        <li>✅ <strong>50 Bonus Points</strong> instantly</li>
                        <li>✅ <strong>Priority Support</strong> badge</li>
                        <li>✅ <strong>VIP Reviewer</strong> status</li>
                    </ul>
                    
                    <div class="urgency-message">
                        <span class="pulse">🔥</span>
                        <span>127 people completed reviews in the last hour</span>
                    </div>
                </div>
                
                <div class="exit-actions">
                    <button class="btn-stay" onclick="stayAndComplete()">
                        Complete My Review (30 seconds)
                    </button>
                    <button class="btn-leave" onclick="this.closest('.exit-modal-overlay').remove()">
                        No thanks, I'll leave
                    </button>
                </div>
                
                <p class="social-proof">
                    "I almost left but glad I stayed - took me just 45 seconds!" - Sarah M.
                </p>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .exit-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            animation: fadeIn 0.3s ease;
        }
        
        .exit-modal {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s ease;
        }
        
        .exit-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 30px;
            cursor: pointer;
            color: #999;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .exit-close:hover {
            background: #f0f0f0;
            color: #333;
        }
        
        .exit-content h2 {
            font-size: 28px;
            margin-bottom: 10px;
            color: #333;
        }
        
        .exit-subtitle {
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
        }
        
        .exit-offer {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            position: relative;
        }
        
        .offer-badge {
            position: absolute;
            top: -10px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            animation: pulse 2s infinite;
        }
        
        .exit-offer h3 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #333;
        }
        
        .offer-list {
            list-style: none;
            padding: 0;
            margin: 0 0 20px 0;
        }
        
        .offer-list li {
            padding: 8px 0;
            font-size: 16px;
            color: #555;
        }
        
        .offer-list strong {
            color: #667eea;
        }
        
        .urgency-message {
            background: #fff3cd;
            padding: 10px 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #856404;
        }
        
        .pulse {
            animation: pulse 1s infinite;
            font-size: 20px;
        }
        
        .exit-actions {
            display: flex;
            gap: 15px;
            margin: 25px 0;
        }
        
        .btn-stay {
            flex: 2;
            padding: 15px 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-stay:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .btn-leave {
            flex: 1;
            padding: 15px 20px;
            background: #f8f9fa;
            color: #666;
            border: 2px solid #e1e8ed;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-leave:hover {
            background: #e9ecef;
        }
        
        .social-proof {
            text-align: center;
            color: #666;
            font-style: italic;
            font-size: 14px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e1e8ed;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @media (max-width: 640px) {
            .exit-modal {
                padding: 25px;
                width: 95%;
            }
            
            .exit-content h2 {
                font-size: 22px;
            }
            
            .exit-actions {
                flex-direction: column;
            }
            
            .btn-stay, .btn-leave {
                flex: 1;
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    // Track event
    if (window.gtag) {
        gtag('event', 'exit_intent_shown', {
            'event_category': 'engagement'
        });
    }
}

// Global function for staying
window.stayAndComplete = function() {
    document.querySelector('.exit-modal-overlay')?.remove();
    
    // Award bonus points
    if (window.GameSystem) {
        window.GameSystem.addPoints(50, 'staying to complete!');
    }
    
    // Scroll to form
    document.getElementById('reviewForm')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // Track event
    if (window.gtag) {
        gtag('event', 'exit_intent_stayed', {
            'event_category': 'engagement'
        });
    }
};