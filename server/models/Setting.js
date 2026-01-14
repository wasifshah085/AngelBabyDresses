import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  siteName: {
    en: {
      type: String,
      default: 'Angel Baby Dresses'
    },
    ur: {
      type: String,
      default: 'اینجل بیبی ڈریسز'
    }
  },
  siteTagline: {
    en: {
      type: String,
      default: 'Beautiful Clothes for Beautiful Kids'
    },
    ur: {
      type: String,
      default: 'خوبصورت بچوں کے لیے خوبصورت کپڑے'
    }
  },
  logo: {
    url: String,
    publicId: String
  },
  favicon: {
    url: String,
    publicId: String
  },
  contact: {
    email: String,
    phone: String,
    whatsapp: String,
    address: {
      en: String,
      ur: String
    }
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    tiktok: String
  },
  shipping: {
    freeShippingThreshold: {
      type: Number,
      default: 3000 // PKR
    },
    standardShippingRate: {
      type: Number,
      default: 200 // PKR
    },
    expressShippingRate: {
      type: Number,
      default: 400 // PKR
    },
    estimatedDeliveryDays: {
      standard: {
        type: Number,
        default: 5
      },
      express: {
        type: Number,
        default: 2
      }
    }
  },
  payment: {
    jazzcashEnabled: {
      type: Boolean,
      default: true
    },
    easypaisaEnabled: {
      type: Boolean,
      default: true
    },
    codEnabled: {
      type: Boolean,
      default: true
    },
    bankTransferEnabled: {
      type: Boolean,
      default: false
    },
    bankDetails: {
      bankName: String,
      accountTitle: String,
      accountNumber: String,
      iban: String
    }
  },
  seo: {
    metaTitle: {
      en: String,
      ur: String
    },
    metaDescription: {
      en: String,
      ur: String
    },
    metaKeywords: [String],
    googleAnalyticsId: String,
    facebookPixelId: String
  },
  notifications: {
    orderConfirmationEmail: {
      type: Boolean,
      default: true
    },
    orderShippedEmail: {
      type: Boolean,
      default: true
    },
    orderDeliveredEmail: {
      type: Boolean,
      default: true
    },
    whatsappNotifications: {
      type: Boolean,
      default: true
    }
  },
  maintenance: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    message: {
      en: String,
      ur: String
    }
  },
  customCss: String,
  customJs: String
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
