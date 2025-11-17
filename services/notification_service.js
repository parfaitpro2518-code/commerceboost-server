// services/notification_service.js
export class NotificationService {
  static async sendDailyAdvice(userId, message) {
    console.log(`📨 Notification quotidienne à ${userId}: ${message}`);
    return true;
  }
  
  static async sendPaymentReminder(userId) {
    console.log(`⏰ Rappel paiement à ${userId}`);
    return true;
  }
}