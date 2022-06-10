import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import axios from 'axios';
import './App.css';

const App = () => {

  const [data, setData] = useState("temporary");

  useEffect(() => {
    axios.get("/treonData").then((res: any) => {
      const data = res.data;
      setData(data);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Yeet <code>src/App.tsx</code> and save to reload.
        </p>
        <div>{data}</div>
      </header>
    </div>
  );
}

export default App;
