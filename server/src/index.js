require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { validateVault } = require('./vault/reader');

validateVault();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/notes',  require('./routes/notes'));
app.use('/api/todos',  require('./routes/todos'));
app.use('/api/goals',  require('./routes/goals'));
app.use('/api/debrief', require('./routes/debrief'));
app.use('/api/chat',   require('./routes/chat'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
