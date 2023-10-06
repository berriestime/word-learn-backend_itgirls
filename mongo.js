import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://root:password@localhost:27017');
const db = client.db();

const wordsCollection = db.collection('words');
const counterCollection = db.collection('counter');

const getCounter = async (type = 'word') => {
  const result = await counterCollection.findOne({ type });
  if (!result) {
    await counterCollection.insertOne({ counter: 1, type });
    return 0;
  }

  await counterCollection.updateOne(
    { type },
    { $set: { counter: result.counter + 1 } }
  );

  return result.counter;
};

export { getCounter, wordsCollection };
