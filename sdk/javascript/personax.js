/**
 * PERSONAX JavaScript SDK
 * AI Personalization Engine for client-side tracking
 * 
 * @version 1.0.0
 * @license MIT
 */

(function(global) {
  'use strict';

  const PERSONAX_VERSION = '1.0.0';
  const STORAGE_KEY = 'personax_session';
  const PROFILE_KEY = 'personax_profile';

  class Personax {
    constructor(config) {
      this.config = {
        apiUrl: config.apiUrl || 'https://api.personax.ai',
        apiKey: config.apiKey,
        websiteId: config.websiteId,
        track: config.track || ['clicks', 'scroll', 'pageview'],
        sessionTimeout: config.sessionTimeout || 30 * 60 * 1000,
        debug: config.debug || false
      };

      this.sessionId = null;
      this.anonymousId = null;
      this.profileId = null;
      this.lastActivity = Date.now();
      this.recommendations = [];

      if (!this.config.apiKey || !this.config.websiteId) {
        this.warn('API key and website ID are required');
        return;
      }

      this.init();
    }

    init() {
      // Load or create session
      this.loadSession();
      
      // Start activity tracking
      this.setupEventListeners();
      
      // Track initial page view
      this.trackPageView();
      
      // Periodic activity flush
      this.startActivityTracker();
      
      this.log('Initialized', { version: PERSONAX_VERSION });
    }

    loadSession() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          if (Date.now() - session.createdAt < this.config.sessionTimeout) {
            this.sessionId = session.id;
            this.anonymousId = session.anonymousId;
            return;
          }
        }
      } catch (e) {
        this.warn('Failed to load session', e);
      }

      // Create new session
      this.sessionId = this.generateId();
      this.anonymousId = this.generateId();
      this.saveSession();
    }

    saveSession() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          id: this.sessionId,
          anonymousId: this.anonymousId,
          createdAt: Date.now()
        }));
      } catch (e) {
        this.warn('Failed to save session', e);
      }
    }

    generateId() {
      return 'px_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    setupEventListeners() {
      // Click tracking
      if (this.config.track.includes('clicks')) {
        document.addEventListener('click', (e) => {
          this.handleClick(e);
        }, { capture: true });
      }

      // Scroll tracking
      if (this.config.track.includes('scroll')) {
        this.setupScrollTracking();
      }

      // Time on page
      if (this.config.track.includes('time')) {
        this.setupTimeTracking();
      }

      // Form submissions
      if (this.config.track.includes('forms')) {
        document.addEventListener('submit', (e) => {
          this.handleFormSubmit(e);
        });
      }

      // Visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.trackPageView();
        }
      });
    }

    handleClick(e) {
      const target = e.target.closest('a, button, [data-personax-track]');
      if (!target) return;

      this.trackEvent('CLICK', {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.trim().substring(0, 100),
        href: target.href,
        id: target.id,
        classes: target.className?.split(' ').slice(0, 3).join(' ')
      }, {
        element: target.outerHTML.substring(0, 200)
      });
    }

    setupScrollTracking() {
      let maxScroll = 0;
      const trackScroll = () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          if (maxScroll >= 25 && maxScroll < 50) {
            this.trackEvent('SCROLL', { depth: '25%' });
          } else if (maxScroll >= 50 && maxScroll < 75) {
            this.trackEvent('SCROLL', { depth: '50%' });
          } else if (maxScroll >= 75 && maxScroll < 100) {
            this.trackEvent('SCROLL', { depth: '75%' });
          } else if (maxScroll === 100) {
            this.trackEvent('SCROLL', { depth: '100%' });
          }
        }
      };

      window.addEventListener('scroll', trackScroll, { passive: true });
    }

    setupTimeTracking() {
      let startTime = Date.now();
      
      setInterval(() => {
        const duration = Date.now() - startTime;
        if (duration >= 30000) {
          this.trackEvent('TIME_ON_PAGE', { 
            duration: duration,
            url: window.location.pathname 
          }, { duration });
          startTime = Date.now();
        }
      }, 30000);
    }

    handleFormSubmit(e) {
      const form = e.target;
      this.trackEvent('FORM_SUBMIT', {
        formId: form.id,
        action: form.action,
        method: form.method
      });
    }

    trackPageView() {
      this.trackEvent('PAGE_VIEW', {
        url: window.location.pathname,
        title: document.title,
        referrer: document.referrer
      });
    }

    trackEvent(type, data = {}, eventData = {}) {
      this.lastActivity = Date.now();

      const event = {
        type: type,
        name: data.name || type,
        data: data,
        url: window.location.href,
        anonymousId: this.anonymousId,
        websiteId: this.config.websiteId,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        location: this.getLocation()
      };

      // Include event-specific data
      Object.assign(event, eventData);

      // Send to API
      this.sendEvent(event);

      this.log('Event tracked', event);
    }

    track(name, data = {}) {
      this.trackEvent('CUSTOM', { name, ...data });
    }

    async sendEvent(event) {
      try {
        const response = await fetch(`${this.config.apiUrl}/sdk/v1/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'x-session-id': this.sessionId
          },
          body: JSON.stringify(event),
          keepalive: true
        });

        const result = await response.json();
        
        if (result.profileId) {
          this.profileId = result.profileId;
          this.saveProfileId(result.profileId);
        }

        if (result.recommendations) {
          this.recommendations = result.recommendations;
          this.applyRecommendations(result.recommendations);
        }

        return result;
      } catch (error) {
        this.warn('Failed to send event', error);
      }
    }

    saveProfileId(id) {
      try {
        localStorage.setItem(PROFILE_KEY, id);
      } catch (e) {}
    }

    getLocation() {
      try {
        return {
          country: 'unknown',
          city: 'unknown'
        };
      } catch (e) {
        return null;
      }
    }

    applyRecommendations(recommendations) {
      for (const rec of recommendations) {
        if (rec.type === 'CTA' && rec.data.cta) {
          this.showNotification(rec.data);
        } else if (rec.type === 'UI_CHANGE') {
          this.applyUIChange(rec.data);
        }
      }
    }

    showNotification(data) {
      // Create toast notification
      const toast = document.createElement('div');
      toast.className = 'personax-toast';
      toast.innerHTML = `
        <div class="personax-toast-content">
          <strong>${data.cta}</strong>
          ${data.message ? `<p>${data.message}</p>` : ''}
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }

    applyUIChange(data) {
      if (data.action === 'show_tour') {
        // Trigger onboarding tour
        this.log('Show tour', data);
      }
    }

    startActivityTracker() {
      // Send heartbeat every minute
      setInterval(() => {
        const idleTime = Date.now() - this.lastActivity;
        if (idleTime < this.config.sessionTimeout) {
          this.trackEvent('HEARTBEAT', { idleTime });
        }
      }, 60000);
    }

    // Public API
    identify(userId, traits = {}) {
      this.trackEvent('IDENTIFY', { userId, traits });
    }

    reset() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_KEY);
      this.sessionId = null;
      this.anonymousId = null;
      this.profileId = null;
      this.init();
    }

    getSessionId() {
      return this.sessionId;
    }

    getProfileId() {
      return this.profileId;
    }

    getRecommendations() {
      return this.recommendations;
    }

    // Debug logging
    log(message, data) {
      if (this.config.debug) {
        console.log(`[PERSONAX] ${message}`, data);
      }
    }

    warn(message, data) {
      console.warn(`[PERSONAX] ${message}`, data);
    }
  }

  // Export
  global.Personax = Personax;

  // Auto-initialize if config is provided
  if (global.personaxConfig) {
    new Personax(global.personaxConfig);
  }

})(typeof window !== 'undefined' ? window : global);

// Add default styles for notifications
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .personax-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      background: #1e293b;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    }
    .personax-toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    .personax-toast-content strong {
      display: block;
      margin-bottom: 4px;
    }
    .personax-toast-content p {
      margin: 0;
      font-size: 14px;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
}

export default Personax;