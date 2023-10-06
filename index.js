import bodyParser from 'body-parser';
import express from 'express';

import { getCounter, wordsCollection } from './mongo.js';

const app = express();
app.use(bodyParser.json());

const parseDBWord = (word) => ({
  ...word,
  tags: word.tags.join(','),
  tags_json: JSON.stringify(word.tags),
});

// GET - Get words
app.get('/api/words', async (req, res) => {
  const cursor = await wordsCollection.find();
  const words = await cursor.toArray();
  res.status(200).json(words.map(parseDBWord));
});

// GET - Get word by id
app.get('/api/words/:id', async (req, res) => {
  const wordId = parseInt(req.params.id);
  const word = await wordsCollection.findOne({ id: wordId });
  if (!word) {
    // return res.status(404).json(null);
    return res.status(404).send({
      status: 'error',
      error: 'Word not found',
    });
  }
  res.status(200).json(parseDBWord(word));
});

const validateInput = ({ english, transcription, russian, tags }) => {
  const errors = [];

  if (!english) errors.push('You did not provide english key!');
  if (!transcription) errors.push('You did not provide transcription key!');
  if (!russian) errors.push('You did not provide russian key!');
  if (!tags) errors.push('You did not provide tags key!');

  return [Boolean(!errors.length), errors];
};

// POST - Add new word
app.post('/api/words/add', async (req, res) => {
  const { english, transcription, russian, tags } = req.body;
  const [isValid, errors] = validateInput({
    english,
    transcription,
    russian,
    tags,
  });
  if (!isValid)
    return res.status(500).json({
      status: 'error',
      error: errors,
    });

  const insertResult = await wordsCollection.insertOne({
    id: await getCounter(),
    english,
    transcription,
    russian,
    tags: tags.split(','),
  });

  const findResult = await wordsCollection.findOne({
    _id: insertResult.insertedId,
  });
  res.status(201).json(parseDBWord(findResult));
});

// POST - Update word by id
app.post('/api/words/:id/update', async (req, res) => {
  const wordId = parseInt(req.params.id);
  const { english, transcription, russian, tags } = req.body;
  const [isValid, errors] = validateInput({
    english,
    transcription,
    russian,
    tags,
  });
  if (!isValid) {
    // return res.status(500).json(['00000', null, null]);
    return res.status(500).json({
      status: 'error',
      error: errors,
    });
  }

  const updateResult = await wordsCollection.updateOne(
    { id: wordId },
    { $set: { english, transcription, russian, tags: tags.split(',') } }
  );
  if (updateResult.matchedCount === 0) {
    return res.status(404).json(['00000', null, null]);
    // return res.status(404).json({
    //   status: 'error',
    //   error: 'Word not found',
    // });
  }

  const findResult = await wordsCollection.findOne({ id: wordId });
  res.status(200).json(parseDBWord(findResult));
});

// POST - Delete word by id
app.post('/api/words/:id/delete', async (req, res) => {
  const wordId = parseInt(req.params.id);
  const result = await wordsCollection.deleteOne({ id: wordId });
  if (!result.deletedCount) {
    return res.status(404).json(['00000', null, null]);
    // return res.status(404).json({
    //   status: 'error',
    //   error: 'Word not found',
    // });
  }
  return res.status(200).json(true);
  // return res.status(200).json({
  //   status: 'ok',
  //   data: 'Word has been deleted',
  // });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
