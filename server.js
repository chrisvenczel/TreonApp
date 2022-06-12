const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { spawn } = require('child_process');
const { PythonShell } = require('python-shell');

const app = express();
const port = process.env.PORT || 8888;

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

// Run a python script
app.get('/python', (req, res) => {
  /*let dataToSend;

  // Spawn new child process to call the python script
  const args = ['Christopher', 'Venczel'];
  const python = spawn('python', [__dirname+'/helloworld.py', ...args]);

  // Collect data from script
  python.stdout.on('data', (data) => {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
  });

  // In the close event we are sure that stream 
  // from the child process is closed
  python.on('close', (code) => {
    console.log(`Child process close all stdio with code ${code}`);
    // Send data to browser
    res.send(dataToSend);
  });*/

  const pythonOptions = {
    // For Production:
    //pythonPath: 'C:/home/python364x64/python',
    //scriptPath: 'D:/home/site/wwwroot',

    // For Development:
    pythonPath: 'C:/Users/Chris/AppData/Local/Programs/Python/Python37-32/python',
    scriptPath: __dirname,

    // args:
    // [
    //     req.query.term,
    //     req.params.id,
    //     req.session.user.searchName,
    //     req.session.user.searchKey
    args: ["Christopher", "Venczel"]
  };


  PythonShell.run('helloworld.py', pythonOptions, (err, data) => {
    if (err) throw err;

    console.log('DATA:', data);

    res.send(data);
  });
});

// Get and set treonData
app.get('/treonData', (req, res) => {
  // Send the current data to the front end
  const currentData = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf8'));
  res.send(currentData);
});

const formatAMPM = (date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes.toString().padStart(2, '0');
  seconds = seconds.toString().padStart(2, '0');
  let strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
  return strTime;
}

app.post('/treonData', (req, res) => {
  const newData = req.body;
  const currentData = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf8'));

  // Get the date as an easily readable string
  // Example: January 2, 2022 - 10:15:32 PM
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  const time = formatAMPM(now);
  const timestamp = `${month} ${day}, ${year} - ${time}`;

  const allData = JSON.stringify({
    allData: [
      ...currentData.allData,
      {
        timestamp: timestamp,
        data: newData
      }
    ]
  });

  try {
    fs.writeFileSync(__dirname + '/data.json', allData);
  } catch (err) {
    console.error(err);
  }

  res.sendStatus(200);
});

app.listen(port, () => console.log(`Listening on port ${port}`));