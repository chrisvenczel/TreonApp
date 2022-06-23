import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

enum DataType {
  Acceleration = 2,
  FFT_Coefficients = 19
}

enum Type {
  Scalar = "scalar",
  Burst = "burst"
}

enum Trigger {
  Timed = 0,
  Alert = 1,
  ResponseToRequest = 2,
  Timed2 = 3,
  Timed3 = 4
}

enum FFTWindow {
  NoWindow = 0,
  Hanning = 1
}

enum Precision {
  Float = 0,
  FixedPointQ15 = 1
}

// More docs on the raw JSON data:
// https://kb.treon.fi/knowledge_base/sensors/sensorjson/
interface TreonData {

  Type: Type;
  NodeStatus: number,
  Timestamp: number,
  SourceAddress: string,
  SensorNodeId: string,
  GatewayId: string,

  // -------------------
  // --- Vector Data ---
  // -------------------
  BatteryVoltage: number, // mV
  Temperature: number, // Celsius
  Vibration: {
    Kurtosis: {
      X: number,
      Y: number,
      Z: number
    },
    RMS: {
      // Root mean squre
      X: number,
      Y: number,
      Z: number
    },
    P2P: {
      // Velocity amplitude, mm/s
      X: number,
      Y: number,
      Z: number
    },
    Z2P: {
      // Max zero-to-peak amplitude, mm/s
      X: number,
      Y: number,
      Z: number
    },
    MeasDetails: {
      // Node’s internal FFT calculation parameter 512, 1024, 2048, 4096
      FftSize: number,
      FftWindow: FFTWindow,
      Precision: Precision,
      "G-range": number,          // 2G, 4G, 8G, 16G
      BinSize: number,            // Bin for FFT values (x1000)
      ValueOffset: number,        // Frequency offset for value array (x10)
      Trigger: Trigger,           // Measurement Reason
      Id: number,                 // Measurement ID      
    }
  },

  // -------------------
  // --- Vector Data ---
  // -------------------
  DataType: DataType,
  /*Acceleration Data Burst - DataType: 2
    ValueMapping	Notes
    4	            Triplet of X,Y,Z acceleration 2G range [-128,127]
    5	            Triplet of X,Y,Z acceleration 4G range [-128,127]
    6	            Triplet of X,Y,Z acceleration 2G range [-32768,32767]
    7	            Triplet of X,Y,Z acceleration 4G range [-32768,32767]
    8	            Triplet of X,Y,Z acceleration 8G range [-32768,32767]
    9	            Triplet of X,Y,Z acceleration 16G range [-32768,32767]
    10	          X-axis [-32768,32767]
    11	          Y-axis [-32768,32767]
    12	          Z-axis [-32768,32767]
    13	          X-axis filtered and decimated values [-32768,32767]
    14	          Y-axis filtered and decimated values [-32768,32767]
    15	          Z-axis filtered and decimated values [-32768,32767]

    FFT Data Burst - DataType: 19
    ValueMapping	Notes	                                          Unit
    0	            FFT values from X-axis, uint16	                mm/s
    1	            FFT values from Y-axis, uint16	                mm/s
    2	            FFT values from Z-axis, uint16	                mm/s
    3	            Delta compressed FFT values from X-axis, uint8	mm/s
    4	            Delta compressed FFT values from Y-axis, uint8	mm/s
    5	            Delta compressed FFT values from Z-axis, uint8	mm/s
    6	            FFT values from X-axis, uint16	                m/s2
    7	            FFT values from Y-axis, uint16	                m/s2
    8	            FFT values from Z-axis, uint16	                m/s2
    9            	Delta compressed FFT values from X-axis, uint8	m/s2
    10	          Delta compressed FFT values from Y-axis, uint8	m/s2
    11	          Delta compressed FFT values from Z-axis, uint8	m/s2
    12	          FFT values from X-axis, uint16	                m/s2
    13	          FFT values from Y-axis, uint16	                m/s2
    14	          FFT values from Z-axis, uint16	                m/s2 
  */
  ValueMapping: number,           // See chart above. Depends on DataType.
  Values: number[],               // Byte array containing burst data
  DataSize: number,               // Total # of bytes in this burst
  MeasurementTimeInterval: number // Sampling time in microseconds
  MeasurementId: number,          // Measurement Id associated with current measurement event
  BurstId: number,                // Burst identifier. Same for all JSON messages belonging to the same burst
  BurstDataOffset: number,        // Start offset of the values in the data array. Offset starts from 0
  FragCount: number               // ???
}

interface DataPackage {
  timestamp: number;
  data: TreonData;
}

// Main Chart Types (line graph over time)
/*

*** Scalar Values ***
- Tempurature
- BatteryVoltage
- Vibration (X, Y, Z for P2P, RMS, Z2P, Kurtosis)

*** Burst Values ***
- 
*/

const App = () => {

  const [rawData, setRawData] = useState<DataPackage[]>([]);
  const [cleanData, setCleanData] = useState<any[]>([]);
  const [pythonData, setPythonData] = useState(null);

  useEffect(() => {
    axios.get("/treonData").then((res: any) => {
      const rawData = res.data.allData;
      setRawData(rawData);
    });

    /*axios.get("/python").then((res: any) => {
      const data = res.data;
      setPythonData(data);
    });*/
  }, []);

  enum CleanDataTypes {
    Tempurature = 0,
    BatteryVoltage = 1,
    VibX = 2,
    VibY = 3,
    VibZ = 4
  }

  useEffect(() => {
    if (!rawData || !rawData.length) return;
    const scalar = rawData.filter(d => d.data.Type === Type.Scalar).map(d => d.data);
    const newCleanData = rawData.map(d => {
      let dOut = {};
      if (d.data.Type === Type.Scalar) {
        if (d.data.Temperature) {
          dOut = { ...dOut, tempurature: d.data.Temperature };
        }
        if (d.data.BatteryVoltage) {
          dOut = { ...dOut, batteryVoltage: d.data.BatteryVoltage };
        }
        if (d.data.Vibration) {
          let coordinate: "X" | "Y" | "Z" = "X";
          if (d.data.Vibration.Kurtosis.X) coordinate = "X";
          if (d.data.Vibration.Kurtosis.Y) coordinate = "Y";
          if (d.data.Vibration.Kurtosis.Z) coordinate = "Z";
          dOut = {
            ...dOut,
            [`vibration${coordinate}`]: {
              Kurtosis: d.data.Vibration.Kurtosis[`${coordinate}`],
              RMS: d.data.Vibration.RMS[`${coordinate}`],
              P2P: d.data.Vibration.P2P[`${coordinate}`],
              Z2P: d.data.Vibration.Z2P[`${coordinate}`]
            }
          };
        }
      } else {
        if (d.data.DataType === DataType.Acceleration) {

        }
        if (d.data.DataType === DataType.FFT_Coefficients) {
          let coord = "";
          // Delta compressed FFT values from X, Y, and Z-axis (mm/s)
          if (d.data.ValueMapping === 3) coord = "X";
          if (d.data.ValueMapping === 4) coord = "Y";
          if (d.data.ValueMapping === 5) coord = "Z";
          if (!coord) return;
          dOut = {
            ...dOut,
            [`compressedFFTValues${coord}`]: [...d.data.Values]
          }
        }
      }
      if (!Object.keys(dOut).length) {
        return null;
      } else {
        dOut = { ...dOut, timestamp: d.timestamp };
        return dOut;
      }
    }).filter(d => d !== null);
    console.log(newCleanData);
    const tempurature = scalar.filter(d => d.Temperature !== undefined).map(d => {
      return { type: CleanDataTypes.Tempurature, timestamp: d.Timestamp, tempurature: d.Temperature }
    });
    const batteryVoltage = scalar.filter(d => d.BatteryVoltage !== undefined).map(d => {
      return { type: CleanDataTypes.BatteryVoltage, timestamp: d.Timestamp, voltage: d.BatteryVoltage }
    });
    const vibration = scalar.filter(d => d.Vibration !== undefined);
    const vibX = vibration.filter(d => d.Vibration.Kurtosis.X !== undefined).map(d => {
      return { type: CleanDataTypes.VibX, timestamp: d.Timestamp, vibration: d.Vibration }
    });
    const vibY = vibration.filter(d => d.Vibration.Kurtosis.Y !== undefined).map(d => {
      return { type: CleanDataTypes.VibY, timestamp: d.Timestamp, vibration: d.Vibration }
    });
    const vibZ = vibration.filter(d => d.Vibration.Kurtosis.Z !== undefined).map(d => {
      return { type: CleanDataTypes.VibZ, timestamp: d.Timestamp, vibration: d.Vibration }
    });


    const burst = rawData.filter(d => d.data.Type === Type.Burst);

    // Ordered Latest First
    const orderedData = [
      ...tempurature,
      ...batteryVoltage,
      ...vibX,
      ...vibY,
      ...vibZ
    ].sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return 0;
      } else if (a.timestamp > b.timestamp) {
        return -1;
      } else {
        return 1;
      }
    });

    setCleanData(newCleanData);
  }, [rawData]);

  return (
    <div className="App">
      {pythonData}
      <h2>Data Log</h2>
      <p className="description">
        The following is a cleaned up log of the telemetry data sent by the Treon Node.
        It is sorted with the most recently recieved data first.
      </p>
      <div className="buttons">
        <a className="downloadBtn" href="/treonData" download="TreonData.json">
          Download Data as JSON
        </a>
        <a className="downloadBtn" href="/treonData" download="TreonData.json">
          Download Data as Excel
        </a>
      </div>
      <div className="dataContainer">
        {cleanData.map((d: {
          type: CleanDataTypes
          timestamp: string,
          tempurature: number,
          batteryVoltage: number,
          vibrationX: {
            Kurtosis: number,
            P2P: number,
            RMS: number,
            Z2P: number
          },
          vibrationY: {
            Kurtosis: number,
            P2P: number,
            RMS: number,
            Z2P: number
          },
          vibrationZ: {
            Kurtosis: number,
            P2P: number,
            RMS: number,
            Z2P: number
          },
          compressedFFTValuesX: number[],
          compressedFFTValuesY: number[],
          compressedFFTValuesZ: number[]
        }, i: number) => {
          return (
            <div className="singleDataBox" key={i}>
              <p className="timestamp">{d.timestamp}</p>
              {d.tempurature && (
                <p><b>Tempurature (Celcius):</b> {d.tempurature}</p>
              )}
              {d.batteryVoltage && (
                <p><b>Battery Voltage (mV):</b> {d.batteryVoltage}</p>
              )}
              {d.vibrationX && (
                <>
                  <p><b>--- X Vibration Data ---</b></p>
                  <p><b>Kurtosis:</b> {d.vibrationX.Kurtosis}</p>
                  <p><b>Velocity Amplitude (mm/s):</b> {d.vibrationX.P2P}</p>
                  <p><b>Velocity Root Mean Square (mm/s):</b> {d.vibrationX.RMS}</p>
                  <p><b>Max zero-to-peak amplitude (mm/s):</b> {d.vibrationX.Z2P}</p>
                </>
              )}
              {d.vibrationY && (
                <>
                  <p><b>--- Y Vibration Data ---</b></p>
                  <p><b>Kurtosis:</b> {d.vibrationY.Kurtosis}</p>
                  <p><b>Velocity Amplitude (mm/s):</b> {d.vibrationY.P2P}</p>
                  <p><b>Velocity Root Mean Square (mm/s):</b> {d.vibrationY.RMS}</p>
                  <p><b>Max zero-to-peak amplitude (mm/s):</b> {d.vibrationY.Z2P}</p>
                </>
              )}
              {d.vibrationZ && (
                <>
                  <p><b>--- Z Vibration Data ---</b></p>
                  <p><b>Kurtosis:</b> {d.vibrationZ.Kurtosis}</p>
                  <p><b>Velocity Amplitude (mm/s):</b> {d.vibrationZ.P2P}</p>
                  <p><b>Velocity Root Mean Square (mm/s):</b> {d.vibrationZ.RMS}</p>
                  <p><b>Max zero-to-peak amplitude (mm/s):</b> {d.vibrationZ.Z2P}</p>
                </>
              )}
              {d.compressedFFTValuesX && (
                <>
                  <p><b>--- Delta Compressed FFT X-Axis Values ---</b></p>
                  <div className="values">
                    {d.compressedFFTValuesX.map((d, i) => {
                      return (
                        <span key={i}>{d}, </span>
                      );
                    })}
                  </div>
                </>
              )}
              {d.compressedFFTValuesY && (
                <>
                  <p><b>--- Delta Compressed FFT Y-Axis Values ---</b></p>
                  <div className="values">
                    {d.compressedFFTValuesY.map((d, i) => {
                      return (
                        <span key={i}>{d}, </span>
                      );
                    })}
                  </div>
                </>
              )}
              {d.compressedFFTValuesZ && (
                <>
                  <p><b>--- Delta Compressed FFT Z-Axis Values ---</b></p>
                  <div className="values">
                    {d.compressedFFTValuesZ.map((d, i) => {
                      return (
                        <span key={i}>{d}, </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
