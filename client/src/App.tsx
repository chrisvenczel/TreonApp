import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

interface TreonData {
  timestamp: number;
}

const App = () => {

  const [data, setData] = useState<TreonData[]>([]);

  useEffect(() => {
    axios.get("/treonData").then((res: any) => {
      const data = res.data.allData;
      setData(data);
    });
  }, []);

  return (
    <div className="App">
      <h1>
          Treon Data
        </h1>
      <div>
          {data.map((d: TreonData, i: number) => {
            return (
              <div key={i}>{d.timestamp}</div>
            );
          })}
        </div>
    </div>
  );
}

export default App;
