import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  latitude: {
    type: String,
  },
  longitude: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});
const Address = mongoose.model('Address', addressSchema);

export default Address;
