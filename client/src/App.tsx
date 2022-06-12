import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

interface TreonData {

}

interface DataPackage {
  timestamp: number;
  data: TreonData;
}

const App = () => {

  const [data, setData] = useState<DataPackage[]>([]);
  const [pythonData, setPythonData] = useState(null);

  useEffect(() => {
    axios.get("/treonData").then((res: any) => {
      const data = res.data.allData;
      setData(data);
    });

    axios.get("/python").then((res: any) => {
      const data = res.data;
      setPythonData(data);
    });
  }, []);

  return (
    <div className="App">
      <h1>
        Treon Data
      </h1>
      {pythonData}
      <a href="/treonData" download="TreonData.json">
        Download Data as JSON!
      </a>
      <div>
        {data.map((d: DataPackage, i: number) => {
          return (
            <div key={i}>{d.timestamp}</div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
