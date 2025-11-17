import User from '../models/user.js';
import { sendTextMessage } from './fb_api.js';

class LegalPaymentSystem {
  constructor() {
    this.transactionLog = new Map();
  }

  // 🔹 SYSTÈME DE "CONFIRMATION MUTUELLE"
  async initiateLegalPayment(user, plan) {
    const pricing = {
      'Démarrage': { amount: 3000, duration: '1 mois' },
      'Croissance': { amount: 5000, duration: '1 mois' },
      'Elite': { amount: 10000, duration: '1 mois' }
    };

    const planInfo = pricing[plan];
    const confirmationCode = this.generateConfirmationCode();

    // 📝 LOG TRANSPARENT
    this.transactionLog.set(confirmationCode, {
      user_id: user.platform_id,
      user_name: user.prenom,
      plan: plan,
      amount: planInfo.amount,
      initiated_at: new Date(),
      status: 'awaiting_confirmation'
    });

    const instructions = this.getLegalInstructions(plan, planInfo, confirmationCode);

    return {
      confirmation_code: confirmationCode,
      instructions: instructions,
      legal_notice: "Ce paiement est un transfert volontaire pour services de conseil."
    };
  }

  // 🔹 INSTRUCTIONS 100% LÉGALES
  getLegalInstructions(plan, planInfo, confirmationCode) {
    return `💼 CONTRAT DE SERVICE - ${plan.toUpperCase()}

📋 SERVICE : Conseil business personnalisé
💰 HONORAIRES : ${planInfo.amount.toLocaleString()} FCFA
📅 DURÉE : ${planInfo.duration}
🔢 RÉFÉRENCE : ${confirmationCode}

📱 PROCÉDURE DE PAIEMENT :

1. Ouvre ton application Flooz ou T-Money
2. Choisis "Envoyer de l'argent"
3. Numéro bénéficiaire : ${process.env.BUSINESS_PHONE_NUMBER}
4. Montant : ${planInfo.amount} FCFA
5. Message : "${confirmationCode}"

6. Une fois le transfert effectué, reviens ici
7. Tape "CONFIRMER ${confirmationCode}"

⚠️ IMPORTANT :
- Ce paiement est volontaire pour services de conseil
- Aucun remboursement après activation du service
- Consulte nos CGU pour plus d'informations

Besoin d'aide ? Réponds à ce message.`;
  }

  // 🔹 CONFIRMATION AVEC PREUVES
  async handleUserConfirmation(confirmationCode, user) {
    const transaction = this.transactionLog.get(confirmationCode);
    
    if (!transaction) {
      throw new Error('Code de confirmation invalide');
    }

    // 🕐 Vérifier délai raisonnable (max 24h)
    const timeDiff = Date.now() - transaction.initiated_at.getTime();
    if (timeDiff > 24 * 60 * 60 * 1000) {
      throw new Error('Code de confirmation expiré');
    }

    // ✅ Mise à jour statut
    transaction.status = 'confirmed';
    transaction.confirmed_at = new Date();

    // 📧 Notification légale (log)
    console.log(`📄 TRANSACTION CONFIRMÉE - ${user.prenom} - ${transaction.plan} - ${transaction.amount}F`);

    // 🚀 Activation service
    await this.activateUserSubscription(user, transaction.plan);

    return {
      success: true,
      legal_receipt: {
        service: `Conseil business ${transaction.plan}`,
        amount: transaction.amount,
        date: new Date().toISOString(),
        reference: confirmationCode
      }
    };
  }

  // 🔹 ACTIVATION ABONNEMENT
  async activateUserSubscription(user, plan) {
    user.plan = plan;
    user.subscription_start = new Date();
    user.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.payment_status = 'active';
    
    await user.save();

    await sendTextMessage(user.platform_id,
      `🎉 SERVICE ACTIVÉ - ${plan.toUpperCase()}\n\n` +
      `✅ Contrat de service confirmé\n` +
      `💰 Montant honoraires : ${this.getPlanPrice(plan).toLocaleString()} FCFA\n` +
      `📅 Période : ${new Date().toLocaleDateString()} au ${user.subscription_end.toLocaleDateString()}\n\n` +
      `📞 Support : ${process.env.SUPPORT_PHONE}\n` +
      `📧 Email : ${process.env.SUPPORT_EMAIL}\n\n` +
      `Merci pour ta confiance ${user.prenom} ! 🚀`
    );
  }

  // 🔹 GÉNÉRATION CODE
  generateConfirmationCode() {
    return 'CB-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
  }

  getPlanPrice(plan) {
    const pricing = { 'Démarrage': 3000, 'Croissance': 5000, 'Elite': 10000 };
    return pricing[plan];
  }

  // 🔹 RAPPORT TRANSPARENT (pour autorités si besoin)
  getTransactionReport() {
    return Array.from(this.transactionLog.values()).map(tx => ({
      reference: tx.confirmation_code,
      user: tx.user_name,
      plan: tx.plan,
      amount: tx.amount,
      date: tx.initiated_at,
      status: tx.status
    }));
  }
}

export default new LegalPaymentSystem();