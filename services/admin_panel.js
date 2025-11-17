import User from "../models/user.js";
import { sendTextMessage } from "./fb_api.js";

class AdminPanel {
  constructor() {
    this.adminKey = process.env.ADMIN_KEY;
    this.stats = {
      broadcasts: 0,
      targeted: 0,
      errors: 0
    };
  }

  // 🔹 VÉRIFICATION ADMIN
  verifyAdmin(adminKey) {
    return adminKey === this.adminKey;
  }

  // 🔹 ENVOI À TOUS LES USERS
  async broadcastToAll(message, adminKey) {
    if (!this.verifyAdmin(adminKey)) {
      throw new Error("❌ Accès admin refusé - Clé invalide");
    }

    console.log(`📢 ADMIN: Broadcast à tous les users - "${message.substring(0, 50)}..."`);

    const users = await User.find({});
    let sent = 0;
    let failed = 0;
    const details = [];

    for (const user of users) {
      try {
        // Vérifier que l'user veut des notifications
        if (user.notificationsEnabled !== false) {
          await sendTextMessage(user.platform_id, `📢 ${message}`);
          sent++;
          details.push(`✅ ${user.prenom} (${user.typeCommerce})`);
        } else {
          details.push(`🔇 ${user.prenom} - Notifs désactivées`);
        }

        // Anti-spam - pause entre envois
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Erreur envoi à ${user.prenom}:`, error.message);
        failed++;
        details.push(`❌ ${user.prenom}: ${error.message}`);
      }
    }

    this.stats.broadcasts++;

    return {
      success: true,
      total: users.length,
      sent,
      failed,
      details: details.slice(0, 10), // Premier 10 pour preview
      message: `📢 Broadcast: ${sent}/${users.length} messages envoyés`
    };
  }

  // 🔹 ENVOI CIBLÉ INTELLIGENT
  async sendTargetedPromo(targets, message, adminKey) {
    if (!this.verifyAdmin(adminKey)) {
      throw new Error("❌ Accès admin refusé");
    }

    console.log(`🎯 ADMIN: Promo ciblée - ${targets.length} cibles`);

    let users = [];
    const filters = [];

    // 🔍 CONSTRUCTION FILTRES INTELLIGENTS
    for (const target of targets) {
      let filter = {};
      
      switch (target.type) {
        case "plan":
          filter.plan = target.value;
          filters.push(`Plan: ${target.value}`);
          break;
        
        case "commerce":
          filter.typeCommerce = target.value;
          filters.push(`Commerce: ${target.value}`);
          break;
        
        case "ville":
          filter.ville = target.value;
          filters.push(`Ville: ${target.value}`);
          break;
        
        case "anciennete":
          filter.anciennete = target.value;
          filters.push(`Expérience: ${target.value}`);
          break;
        
        case "physique_online":
          filter.physiqueOnline = target.value;
          filters.push(`Type: ${target.value}`);
          break;
        
        case "essai_niveau":
          filter.essaiLimitLevel = parseInt(target.value);
          filters.push(`Niveau essai: ${target.value}`);
          break;

        default:
          continue;
      }

      const filteredUsers = await User.find(filter);
      users = [...users, ...filteredUsers];
    }

    // 🔧 DÉDOUBLONNAGE
    const uniqueUsers = Array.from(new Set(users.map(u => u.platform_id)))
      .map(id => users.find(u => u.platform_id === id));

    console.log(`🎯 ${uniqueUsers.length} users uniques trouvés`);

    // ✉️ ENVOI MESSAGES
    let sent = 0;
    let failed = 0;
    const details = [];

    for (const user of uniqueUsers) {
      try {
        if (user.notificationsEnabled !== false) {
          const personalizedMessage = this.personalizeMessage(message, user);
          await sendTextMessage(user.platform_id, personalizedMessage);
          sent++;
          details.push(`✅ ${user.prenom} (${user.typeCommerce})`);
        } else {
          details.push(`🔇 ${user.prenom} - Notifs désactivées`);
        }

        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        failed++;
        details.push(`❌ ${user.prenom}: ${error.message}`);
      }
    }

    this.stats.targeted++;

    return {
      success: true,
      filters: filters,
      totalUsers: uniqueUsers.length,
      sent,
      failed,
      details: details.slice(0, 15),
      message: `🎯 Promo ciblée: ${sent}/${uniqueUsers.length} envoyés (${filters.join(', ')})`
    };
  }

  // 🔹 PERSONNALISATION MESSAGE
  personalizeMessage(message, user) {
    let personalized = message;
    
    // Remplacements automatiques
    const replacements = {
      '{PRENOM}': user.prenom,
      '{COMMERCE}': user.typeCommerce,
      '{VILLE}': user.ville || 'ta ville',
      '{ANCIENNETE}': user.anciennete
    };

    Object.keys(replacements).forEach(key => {
      personalized = personalized.replace(new RegExp(key, 'g'), replacements[key]);
    });

    return `🎁 ${personalized}`;
  }

  // 🔹 ENVOI À UN USER SPÉCIFIQUE
  async sendToUser(userId, message, adminKey) {
    if (!this.verifyAdmin(adminKey)) {
      throw new Error("❌ Accès admin refusé");
    }

    const user = await User.findOne({ platform_id: userId });
    if (!user) {
      throw new Error(`Utilisateur ${userId} non trouvé`);
    }

    try {
      const personalizedMessage = this.personalizeMessage(message, user);
      await sendTextMessage(userId, personalizedMessage);

      console.log(`📨 ADMIN: Message envoyé à ${user.prenom}`);

      return {
        success: true,
        user: {
          prenom: user.prenom,
          typeCommerce: user.typeCommerce,
          ville: user.ville,
          plan: user.plan
        },
        message: `✅ Message envoyé à ${user.prenom}`
      };
    } catch (error) {
      throw new Error(`Erreur envoi: ${error.message}`);
    }
  }

  // 🔹 STATISTIQUES ADMIN
  async getAdminStats(adminKey) {
    if (!this.verifyAdmin(adminKey)) {
      throw new Error("❌ Accès admin refusé");
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastMessageAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const usersByPlan = await User.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } }
    ]);

    const usersByType = await User.aggregate([
      { $group: { _id: "$typeCommerce", count: { $sum: 1 } } }
    ]);

    const usersByVille = await User.aggregate([
      { $match: { ville: { $exists: true, $ne: null } } },
      { $group: { _id: "$ville", count: { $sum: 1 } } }
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        activityRate: ((activeUsers / totalUsers) * 100).toFixed(1) + '%',
        newUsersToday: await User.countDocuments({
          createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        })
      },
      byPlan: usersByPlan,
      byType: usersByType,
      byVille: usersByVille,
      adminStats: this.stats,
      timestamp: new Date().toISOString()
    };
  }

  // 🔹 LISTE USERS POUR ADMIN
  async getUsersList(adminKey, options = {}) {
    if (!this.verifyAdmin(adminKey)) {
      throw new Error("❌ Accès admin refusé");
    }

    const { page = 1, limit = 20, search = '' } = options;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { prenom: new RegExp(search, 'i') },
          { typeCommerce: new RegExp(search, 'i') },
          { ville: new RegExp(search, 'i') }
        ]
      };
    }

    const users = await User.find(filter)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('prenom typeCommerce ville plan lastMessageAt platform_id');

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new AdminPanel();