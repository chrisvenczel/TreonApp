const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Reroute the app through the React front end build folder
app.use('/static/js', express.static(__dirname + "/client/build/static/js"));
app.use('/static/css', express.static(__dirname + "/client/build/static/css"));
app.use('/static/media', express.static(__dirname + "/client/build/static/media"));

// The home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + "/client/build/index.html");
});

app.get('/treonData', (req, res) => {
  res.send("Yo what up!");
});

app.post('/treonData', (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`
  );
});

app.listen(port, () => console.log(`Listening on port ${port}`));