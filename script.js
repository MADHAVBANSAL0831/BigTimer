class BigTimer {
    constructor() {
        this.timerInterval = null;
        this.stopwatchInterval = null;
        this.timerTime = 0;
        this.stopwatchTime = 0;
        this.isTimerRunning = false;
        this.isStopwatchRunning = false;
        this.lapCount = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateTimerDisplay();
        this.updateStopwatchDisplay();
    }

    initializeElements() {
        // Mode switching
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.timerMode = document.getElementById('timer-mode');
        this.stopwatchMode = document.getElementById('stopwatch-mode');

        // Timer elements
        this.timerDisplay = document.getElementById('timer-display');
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.secondsInput = document.getElementById('seconds');
        this.timerStartBtn = document.getElementById('timer-start');
        this.timerPauseBtn = document.getElementById('timer-pause');
        this.timerResetBtn = document.getElementById('timer-reset');

        // Stopwatch elements
        this.stopwatchDisplay = document.getElementById('stopwatch-display');
        this.stopwatchStartBtn = document.getElementById('stopwatch-start');
        this.stopwatchPauseBtn = document.getElementById('stopwatch-pause');
        this.stopwatchLapBtn = document.getElementById('stopwatch-lap');
        this.stopwatchResetBtn = document.getElementById('stopwatch-reset');
        this.lapsList = document.getElementById('laps-list');

        // Notification
        this.notification = document.getElementById('notification');

        // Laps container
        this.lapsContainer = document.getElementById('laps-container');

        // Fullscreen button
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
    }

    bindEvents() {
        // Mode switching
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // Timer events
        this.timerStartBtn.addEventListener('click', () => this.startTimer());
        this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
        this.timerResetBtn.addEventListener('click', () => this.resetTimer());

        // Stopwatch events
        this.stopwatchStartBtn.addEventListener('click', () => this.startStopwatch());
        this.stopwatchPauseBtn.addEventListener('click', () => this.pauseStopwatch());
        this.stopwatchLapBtn.addEventListener('click', () => this.addLap());
        this.stopwatchResetBtn.addEventListener('click', () => this.resetStopwatch());

        // Input validation
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
            input.addEventListener('change', () => this.updateTimerFromInputs());
        });

        // Fullscreen toggle
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Listen for fullscreen changes to update button icon
        document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('mozfullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('MSFullscreenChange', () => this.updateFullscreenIcon());
    }

    switchMode(mode) {
        this.modeBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        const modeSwitcher = document.querySelector('.mode-switcher');

        if (mode === 'timer') {
            this.timerMode.classList.add('active');
            this.stopwatchMode.classList.remove('active');
            modeSwitcher.classList.remove('stopwatch-active');
        } else {
            this.stopwatchMode.classList.add('active');
            this.timerMode.classList.remove('active');
            modeSwitcher.classList.add('stopwatch-active');
        }
    }

    validateInput(input) {
        const value = parseInt(input.value);
        const max = parseInt(input.max);
        const min = parseInt(input.min);

        if (value > max) input.value = max;
        if (value < min) input.value = min;
    }

    updateTimerFromInputs() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        
        this.timerTime = (hours * 3600) + (minutes * 60) + seconds;
        this.updateTimerDisplay();
        this.updateProgressRing();
    }

    formatTime(totalSeconds, showHours = null) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Auto-determine if hours should be shown
        if (showHours === null) {
            showHours = hours > 0;
        }

        if (showHours) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateTimerDisplay() {
        // For timer, show hours if user has set hours or if time is >= 1 hour
        const totalTime = this.getTotalTimerTime();
        const userSetHours = parseInt(this.hoursInput.value) > 0;
        const showHours = userSetHours || this.timerTime >= 3600;

        this.timerDisplay.textContent = this.formatTime(this.timerTime, showHours);
    }

    updateStopwatchDisplay() {
        // For stopwatch, only show hours if time is >= 1 hour (60+ minutes)
        const showHours = this.stopwatchTime >= 3600;
        this.stopwatchDisplay.textContent = this.formatTime(this.stopwatchTime, showHours);
    }



    getTotalTimerTime() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    startTimer() {
        if (this.timerTime <= 0) {
            this.updateTimerFromInputs();
        }
        
        if (this.timerTime <= 0) return;

        this.isTimerRunning = true;
        this.timerStartBtn.style.display = 'none';
        this.timerPauseBtn.style.display = 'flex';

        this.timerInterval = setInterval(() => {
            this.timerTime--;
            this.updateTimerDisplay();

            if (this.timerTime <= 0) {
                this.timerFinished();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerStartBtn.style.display = 'flex';
        this.timerPauseBtn.style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        this.updateTimerFromInputs();
    }

    timerFinished() {
        this.pauseTimer();
        this.showNotification();
        this.playNotificationSound();
    }

    startStopwatch() {
        this.isStopwatchRunning = true;
        this.stopwatchStartBtn.style.display = 'none';
        this.stopwatchPauseBtn.style.display = 'flex';
        this.stopwatchLapBtn.style.display = 'flex';

        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime++;
            this.updateStopwatchDisplay();
        }, 1000);
    }

    pauseStopwatch() {
        this.isStopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.stopwatchStartBtn.style.display = 'flex';
        this.stopwatchPauseBtn.style.display = 'none';
        this.stopwatchLapBtn.style.display = 'none';
    }

    resetStopwatch() {
        this.pauseStopwatch();
        this.stopwatchTime = 0;
        this.lapCount = 0;
        this.updateStopwatchDisplay();
        this.lapsList.innerHTML = '';

        // Hide laps container when reset
        this.lapsContainer.classList.remove('show');
    }

    addLap() {
        this.lapCount++;
        const lapItem = document.createElement('div');
        lapItem.className = 'lap-item';
        lapItem.innerHTML = `
            <span class="lap-number">Lap ${this.lapCount}</span>
            <span class="lap-time">${this.formatTime(this.stopwatchTime)}</span>
        `;
        this.lapsList.appendChild(lapItem);

        // Show laps container when first lap is added
        if (this.lapCount === 1) {
            this.lapsContainer.classList.add('show');
        }

        // Only scroll if there are more than 2 laps
        if (this.lapCount > 2) {
            this.lapsList.parentElement.scrollTop = this.lapsList.parentElement.scrollHeight;
        }
    }

    showNotification() {
        this.notification.classList.add('show');
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            // Enter fullscreen
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    updateFullscreenIcon() {
        const isFullscreen = document.fullscreenElement ||
                           document.webkitFullscreenElement ||
                           document.mozFullScreenElement ||
                           document.msFullscreenElement;

        const svg = this.fullscreenBtn.querySelector('svg');

        if (isFullscreen) {
            // Exit fullscreen icon - arrows pointing inward
            svg.innerHTML = '<path d="M15 9l6-6m0 6h-6V3"/><path d="M9 15l-6 6m6 0H3v-6"/>';
            this.fullscreenBtn.title = 'Exit Fullscreen';
        } else {
            // Enter fullscreen icon - arrows pointing outward
            svg.innerHTML = '<path d="M3 21l6-6m0 6H3v-6"/><path d="M21 3l-6 6m6 0V3h-6"/>';
            this.fullscreenBtn.title = 'Toggle Fullscreen';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BigTimer();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        const activeMode = document.querySelector('.timer-container.active');
        if (activeMode.id === 'timer-mode') {
            const startBtn = document.getElementById('timer-start');
            const pauseBtn = document.getElementById('timer-pause');
            if (startBtn.style.display !== 'none') {
                startBtn.click();
            } else {
                pauseBtn.click();
            }
        } else {
            const startBtn = document.getElementById('stopwatch-start');
            const pauseBtn = document.getElementById('stopwatch-pause');
            if (startBtn.style.display !== 'none') {
                startBtn.click();
            } else {
                pauseBtn.click();
            }
        }
    }
});

// Info Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const infoBtn = document.getElementById('info-btn');
    const infoDropdown = document.getElementById('info-dropdown');

    if (infoBtn && infoDropdown) {
        infoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            infoDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            infoDropdown.classList.remove('show');
        });

        // Prevent dropdown from closing when clicking inside it
        infoDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});
