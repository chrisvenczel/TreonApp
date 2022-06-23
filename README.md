# TreonApp

## Telemetry Data Description
The Treon Node sends data in a JSON format. There are two main types of data - scalar data and stream (or "burst") data. 

Scalar data is a single value sent once per measurement and includes data such as battery voltage and tempurature measurements.

Stream data is sent as an array of raw data which can either be acceleration data or FFT coefficients.

Here is the official Treon docs for more: https://kb.treon.fi/knowledge_base/sensors/sensorjson/

## Sending Data from Node to Website

The Node is set up to automatically make POST requests to the URL https://treongatewaytest.azurewebsites.net/treonData which updates the file data.json (by appending the new data to the log). Data.json can be found in the root folder (wwwroot on Azure Web Apps). 

## App Structure
This app uses a React front-end with TypeScript and a Node.js back-end using Express which can also call Python scripts by spawning child processes. This allows for routing and handling HTTP REST calls to be done in Node.js and more complex math and data processing to be done in Python using the wide variety of available libraries.
