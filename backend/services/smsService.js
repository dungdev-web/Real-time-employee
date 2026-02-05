const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
    this.provider = null;
    this.initialize();
  }

  initialize() {
    // Check which SMS provider is configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.initializeTwilio();
    } else if (process.env.SMSAPI_KEY) {
      this.initializeSMSTo();
    } else {
      console.warn('⚠️  No SMS provider configured. SMS features will be simulated.');
      this.provider = 'mock';
    }
  }

  initializeTwilio() {
    try {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
      this.provider = 'twilio';
      console.log('✅ Twilio SMS service initialized');
    } catch (error) {
      console.error('❌ Error initializing Twilio:', error.message);
      this.provider = 'mock';
    }
  }

  initializeSMSTo() {
    // SMS.to uses simple HTTP API
    this.apiKey = process.env.SMSAPI_KEY;
    this.provider = 'smsto';
    console.log('✅ SMS.to service initialized');
  }

  async sendSMS(phoneNumber, message) {
    try {
      if (this.provider === 'twilio') {
        return await this.sendViaTwilio(phoneNumber, message);
      } else if (this.provider === 'smsto') {
        return await this.sendViaSMSTo(phoneNumber, message);
      } else {
        return this.simulateSMS(phoneNumber, message);
      }
    } catch (error) {
      console.error('Error sending SMS:', error.message);
      throw error;
    }
  }

  async sendViaTwilio(phoneNumber, message) {
    const result = await this.client.messages.create({
      body: message,
      from: this.phoneNumber,
      to: phoneNumber
    });
    console.log(`✅ SMS sent via Twilio to ${phoneNumber}`);
    return result;
  }

  async sendViaSMSTo(phoneNumber, message) {
    const fetch = require('node-fetch');
    
    const response = await fetch('https://api.sms.to/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        message: message,
        to: phoneNumber,
        sender_id: 'TaskMgmt'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`SMS.to API error: ${data.message || 'Unknown error'}`);
    }

    console.log(`✅ SMS sent via SMS.to to ${phoneNumber}`);
    return data;
  }

  simulateSMS(phoneNumber, message) {
    console.log('\n📱 ========== SIMULATED SMS ==========');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('=====================================\n');
    
    return {
      simulated: true,
      to: phoneNumber,
      message: message,
      timestamp: new Date().toISOString()
    };
  }

  async sendAccessCode(phoneNumber, accessCode) {
    const message = `Your access code for Employee Task Management is: ${accessCode}. This code will expire in 10 minutes.`;
    return await this.sendSMS(phoneNumber, message);
  }
}

module.exports = new SMSService();