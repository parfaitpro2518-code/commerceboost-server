import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    from: {
      type: String,
      enum: ['user', 'bot'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    ts: {
      type: Date,
      default: Date.now
    },
    message_type: {
      type: String,
      enum: ['text', 'quick_reply', 'button', 'postback'],
      default: 'text'
    },
    payload: String // Pour stocker les payloads de postback
  }],
  last_updated: {
    type: Date,
    default: Date.now
  },
  message_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour performance
conversationSchema.index({ user_id: 1 });
conversationSchema.index({ last_updated: -1 });

// Middleware pour mettre à jour le compteur
conversationSchema.pre('save', function(next) {
  this.message_count = this.messages.length;
  this.last_updated = new Date();
  next();
});

export default mongoose.model('Conversation', conversationSchema);