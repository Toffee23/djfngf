import mongoose from 'mongoose';
const { Schema } = mongoose;

const ExtraProfileSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nickname: { type: String, required: true },
});

export const Profile = mongoose.model('ExtraProfile', ExtraProfileSchema);
