import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    require: true,
    unique: true,
  },
  isPercent: {
    type: Boolean,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expireAfter: {
    type: Date,
    default: Date.now
  },
  usageLimit: {
    type: Number,
  },
  minCartAmount: {
    type: Number,
  },
  maxDiscountAmount: {
    type: Number,
  },
  userUsed: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
