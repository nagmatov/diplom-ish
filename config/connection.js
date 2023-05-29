import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
// // const DBL = process.env.DATABASE_LOCAL;

const mongoos = mongoose.connect(
  `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@deplomishi.eq6fptx.mongodb.net/test`,
  {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

export default mongoos;
