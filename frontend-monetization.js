// Frontend-Only Monetization System
class FrontendMonetization {
    constructor() {
        this.initializeAuth();
        this.initializePayments();
        this.initializeFreemiumLimits();
    }

    // 1. Simple Authentication (No Backend Needed)
    initializeAuth() {
        // Use localStorage for simple user management
        this.user = JSON.parse(localStorage.getItem('bigTimerUser')) || {
            id: this.generateUserId(),
            email: null,
            isPremium: false,
            trialEndsAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 day trial
            dailyUsage: 0,
            lastUsageReset: new Date().toDateString()
        };
        
        this.saveUser();
        this.checkTrialStatus();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    saveUser() {
        localStorage.setItem('bigTimerUser', JSON.stringify(this.user));
    }

    // 2. Freemium Limits (Frontend Only)
    initializeFreemiumLimits() {
        this.limits = {
            free: {
                dailyTimers: 5,
                themes: 1,
                sounds: 1,
                features: ['basic-timer', 'basic-stopwatch']
            },
            premium: {
                dailyTimers: Infinity,
                themes: Infinity,
                sounds: Infinity,
                features: ['all']
            }
        };

        this.resetDailyUsageIfNeeded();
        this.enforceFreemiumLimits();
    }

    resetDailyUsageIfNeeded() {
        const today = new Date().toDateString();
        if (this.user.lastUsageReset !== today) {
            this.user.dailyUsage = 0;
            this.user.lastUsageReset = today;
            this.saveUser();
        }
    }

    enforceFreemiumLimits() {
        if (!this.user.isPremium && !this.isInTrial()) {
            this.addFreemiumUI();
            this.limitFeatures();
        }
    }

    isInTrial() {
        return Date.now() < this.user.trialEndsAt;
    }

    // 3. Payment Integration (Stripe Checkout - Frontend Only)
    initializePayments() {
        // Load Stripe
        const stripeScript = document.createElement('script');
        stripeScript.src = 'https://js.stripe.com/v3/';
        stripeScript.onload = () => {
            this.stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE'); // Replace with your key
        };
        document.head.appendChild(stripeScript);
    }

    async handlePayment(plan) {
        const prices = {
            monthly: 'price_monthly_id', // Replace with your Stripe price IDs
            yearly: 'price_yearly_id',
            lifetime: 'price_lifetime_id'
        };

        try {
            // Create checkout session (using Stripe's hosted checkout)
            const { error } = await this.stripe.redirectToCheckout({
                lineItems: [{
                    price: prices[plan],
                    quantity: 1,
                }],
                mode: plan === 'lifetime' ? 'payment' : 'subscription',
                successUrl: window.location.origin + '?success=true&plan=' + plan,
                cancelUrl: window.location.origin + '?canceled=true',
                clientReferenceId: this.user.id
            });

            if (error) {
                console.error('Payment error:', error);
                alert('Payment failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment system unavailable. Please try again later.');
        }
    }

    // 4. Check Payment Success (URL Parameters)
    checkPaymentSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            const plan = urlParams.get('plan');
            this.activatePremium(plan);
            this.showSuccessMessage();
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    activatePremium(plan) {
        this.user.isPremium = true;
        this.user.plan = plan;
        this.user.activatedAt = Date.now();
        this.saveUser();
        this.enablePremiumFeatures();
    }

    // 5. Freemium UI Components
    addFreemiumUI() {
        this.addUpgradeButton();
        this.addUsageMeter();
        this.addTrialBanner();
    }

    addUpgradeButton() {
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = 'upgrade-btn';
        upgradeBtn.innerHTML = '⭐ Upgrade to Premium';
        upgradeBtn.onclick = () => this.showPricingModal();
        
        // Add to header
        const header = document.querySelector('.header');
        if (header && !header.querySelector('.upgrade-btn')) {
            header.appendChild(upgradeBtn);
        }
    }

    addUsageMeter() {
        if (this.user.isPremium || this.isInTrial()) return;

        const usageMeter = document.createElement('div');
        usageMeter.className = 'usage-meter';
        usageMeter.innerHTML = `
            <div class="usage-info">
                <span>Daily timers: ${this.user.dailyUsage}/${this.limits.free.dailyTimers}</span>
                <div class="usage-bar">
                    <div class="usage-fill" style="width: ${(this.user.dailyUsage / this.limits.free.dailyTimers) * 100}%"></div>
                </div>
            </div>
        `;
        
        document.querySelector('.main-container').prepend(usageMeter);
    }

    addTrialBanner() {
        if (!this.isInTrial() || this.user.isPremium) return;

        const daysLeft = Math.ceil((this.user.trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000));
        const trialBanner = document.createElement('div');
        trialBanner.className = 'trial-banner';
        trialBanner.innerHTML = `
            <span>🎉 Free Trial: ${daysLeft} days left</span>
            <button onclick="monetization.showPricingModal()">Upgrade Now</button>
        `;
        
        document.body.prepend(trialBanner);
    }

    // 6. Feature Limiting
    limitFeatures() {
        // Limit timer starts
        const originalStartTimer = window.bigTimer?.startTimer;
        if (originalStartTimer) {
            window.bigTimer.startTimer = () => {
                if (this.canUseTimer()) {
                    this.user.dailyUsage++;
                    this.saveUser();
                    this.updateUsageMeter();
                    originalStartTimer.call(window.bigTimer);
                } else {
                    this.showUpgradePrompt('You\'ve reached your daily limit of 5 timers.');
                }
            };
        }

        // Lock premium themes
        this.lockPremiumThemes();
    }

    canUseTimer() {
        return this.user.isPremium || this.isInTrial() || this.user.dailyUsage < this.limits.free.dailyTimers;
    }

    lockPremiumThemes() {
        // Add locked theme options
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector';
        themeSelector.innerHTML = `
            <h3>🎨 Themes</h3>
            <div class="theme-grid">
                <div class="theme-item active" data-theme="default">
                    <div class="theme-preview red"></div>
                    <span>Default</span>
                </div>
                <div class="theme-item locked" onclick="monetization.showUpgradePrompt('Unlock premium themes')">
                    <div class="theme-preview blue"></div>
                    <span>Ocean Blue 🔒</span>
                </div>
                <div class="theme-item locked" onclick="monetization.showUpgradePrompt('Unlock premium themes')">
                    <div class="theme-preview green"></div>
                    <span>Forest Green 🔒</span>
                </div>
                <div class="theme-item locked" onclick="monetization.showUpgradePrompt('Unlock premium themes')">
                    <div class="theme-preview purple"></div>
                    <span>Galaxy Purple 🔒</span>
                </div>
            </div>
        `;
        
        document.querySelector('.main-container').appendChild(themeSelector);
    }

    // 7. Pricing Modal
    showPricingModal() {
        const modal = document.createElement('div');
        modal.className = 'pricing-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>⭐ Upgrade to Big Timer Premium</h2>
                <div class="pricing-plans">
                    <div class="plan">
                        <h3>Monthly</h3>
                        <div class="price">$4.99<span>/month</span></div>
                        <button class="buy-btn" onclick="monetization.handlePayment('monthly')">
                            Choose Monthly
                        </button>
                    </div>
                    <div class="plan popular">
                        <div class="badge">Most Popular</div>
                        <h3>Yearly</h3>
                        <div class="price">$39.99<span>/year</span></div>
                        <div class="savings">Save 33%!</div>
                        <button class="buy-btn" onclick="monetization.handlePayment('yearly')">
                            Choose Yearly
                        </button>
                    </div>
                    <div class="plan">
                        <h3>Lifetime</h3>
                        <div class="price">$79.99<span>once</span></div>
                        <button class="buy-btn" onclick="monetization.handlePayment('lifetime')">
                            Buy Lifetime
                        </button>
                    </div>
                </div>
                <div class="features-list">
                    <h4>✨ Premium Features:</h4>
                    <ul>
                        <li>🎨 8+ Beautiful Themes</li>
                        <li>🍅 Pomodoro Timer</li>
                        <li>🔊 Custom Sound Packs</li>
                        <li>📊 Detailed Statistics</li>
                        <li>⏰ Unlimited Daily Timers</li>
                        <li>🚫 No Ads</li>
                        <li>💾 Cloud Backup</li>
                        <li>📱 Mobile App Access</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showUpgradePrompt(message) {
        const prompt = document.createElement('div');
        prompt.className = 'upgrade-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h3>🔒 Premium Feature</h3>
                <p>${message}</p>
                <button onclick="monetization.showPricingModal(); this.parentElement.parentElement.remove()">
                    Upgrade to Premium
                </button>
                <button onclick="this.parentElement.parentElement.remove()">
                    Maybe Later
                </button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        setTimeout(() => prompt.remove(), 5000); // Auto-remove after 5s
    }

    updateUsageMeter() {
        const usageMeter = document.querySelector('.usage-meter');
        if (usageMeter) {
            const usageInfo = usageMeter.querySelector('.usage-info span');
            const usageFill = usageMeter.querySelector('.usage-fill');
            
            usageInfo.textContent = `Daily timers: ${this.user.dailyUsage}/${this.limits.free.dailyTimers}`;
            usageFill.style.width = `${(this.user.dailyUsage / this.limits.free.dailyTimers) * 100}%`;
        }
    }

    enablePremiumFeatures() {
        // Remove all limitations
        document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));
        document.querySelector('.upgrade-btn')?.remove();
        document.querySelector('.usage-meter')?.remove();
        document.querySelector('.trial-banner')?.remove();
        
        // Show premium features
        this.showPremiumThemes();
        this.showPremiumStats();
    }

    showPremiumThemes() {
        // Enable all themes
        document.querySelectorAll('.theme-item.locked').forEach(item => {
            item.classList.remove('locked');
            item.onclick = () => this.applyTheme(item.dataset.theme);
        });
    }

    showPremiumStats() {
        // Add statistics panel
        const statsPanel = document.createElement('div');
        statsPanel.className = 'stats-panel';
        statsPanel.innerHTML = `
            <h3>📊 Your Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">47</span>
                    <span class="stat-label">Sessions Today</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">12.5h</span>
                    <span class="stat-label">Total Focus Time</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">25m</span>
                    <span class="stat-label">Average Session</span>
                </div>
            </div>
        `;
        
        document.querySelector('.main-container').appendChild(statsPanel);
    }

    showSuccessMessage() {
        const success = document.createElement('div');
        success.className = 'success-message';
        success.innerHTML = `
            <div class="success-content">
                <h2>🎉 Welcome to Premium!</h2>
                <p>Thank you for upgrading! All premium features are now unlocked.</p>
                <button onclick="this.parentElement.parentElement.remove()">Start Using Premium</button>
            </div>
        `;
        
        document.body.appendChild(success);
        setTimeout(() => success.remove(), 5000);
    }
}

// Initialize monetization system
let monetization;
document.addEventListener('DOMContentLoaded', () => {
    monetization = new FrontendMonetization();
    monetization.checkPaymentSuccess();
});

// Make it globally accessible
window.monetization = monetization;
