import React, { useState, useEffect, useRef } from "react";
import Indicator from './components/comp-indicator-content';
import Navigation from "./components/comp-navigation";
import AssetSelector from "./components/comp-asset-selector";

export default function App() {
  
  const url = "https://api.pro.coinbase.com";
  const title = 'Crypto Risk Analysis';
  const defaultPair = 'BTC-USD'; 

  let ws = useRef(null);
  let first = useRef(false);
  
  const [appTitle, setAppTitle] = React.useState(defaultPair);
  const [dataIndicators, setDataIndicators] = React.useState(null);
  const [currencies, setcurrencies] = useState([]);
  const [pair, setpair] = useState(defaultPair);
  const [pastData, setPastData] = useState({});
  const [currentData, setCurrentData] = useState({});

  useEffect(() => {

    console.log('Start for',pair,'!');

    const apiCall = async () => {

      console.log('fetch from historical url \n',pair);

      setAppTitle(title);

      let historicalDataURL = `${url}/products/${pair}/candles?granularity=86400`;
      let dataArr = []; //format [date in seconds (*1000 to ms), open, low, high, close]
      
      fetch(historicalDataURL)
        .then(res => res.json())
        .then(data => {
      
          dataArr = data;
          
          let postBody = {
            pair : pair, 
            data : dataArr
          };

          console.log('before sync historical data with server');
          
          postData('/api/testing', postBody)
            .then(data => {
              console.log('after sync historical data with server');
              let histData = data.message;
              wsSubscribe(ws,pair).then(wsOnMessage(ws,histData));
              setpair(pair);
              setPastData(histData);
            });
      
          fetch('/api/get/indicators/description')
            .then(res => res.json())
            .then(data => setDataIndicators(data.message));

          fetch(url + "/products")
            .then(res => res.json())
            .then(data => {  
              let filtered = data.filter(pair => {if (pair.quote_currency === "USD") return pair; });

              filtered = filtered.sort((a, b) => {
                if (a.base_currency < b.base_currency) return -1;
                if (a.base_currency > b.base_currency) return 1;
                return 0;
              });

              setcurrencies(filtered);
            });

          first.current = true;
        });
    };

    ws.current = new WebSocket("wss://ws-feed.pro.coinbase.com");
    
    ws.current.onopen = () => {
      console.log('Websocket is open now');
      apiCall();
    };
    
    return () => {};
  }, [pair]);


  const wsSubscribe = async (ws,pair) => new Promise (resolve=>{
    let msg = {
      type: "subscribe",
      product_ids: [pair],
      channels: ["ticker"]
    };
    resolve(ws.current.send(JSON.stringify(msg)));
  });
  

  const wsUnsubscribe = async (ws,pair) => new Promise (resolve=>{
    let msg = {
      type: "unsubscribe",
      product_ids: [pair],
      channels: ["ticker"]
    };
    resolve(ws.current.send(JSON.stringify(msg)));
  });


  const wsOnMessage = (ws,histData) => {

    ws.current.onmessage = e => {

      let data = JSON.parse(e.data);

      if (data.type !== "ticker") return;
      if (data.product_id !== pair) return;
      
      setCurrentData(data);

      let todayData = histData['prices'][Object.keys(histData['prices'])[0]];

      console.log('Update price from', todayData.Close, 'to', data.price);

      todayData.Close = data.price;
      if( data.price < todayData.Low ) todayData.Low = data.price;
      if( data.price > todayData.High ) todayData.High = data.price;

      histData['prices'][Object.keys(histData['prices'])[0]] = todayData;

      todayData = histData['prices'][Object.keys(histData['prices'])[0]];
    
      setPastData(histData);

    };
  };
  
  
  const postData = async (url = '', data = {}) => {
    const response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data) 
    });
    return response.json();
  }


  const handleSelect = e => {
    let newPair = e.currentTarget.textContent;
    wsUnsubscribe(ws,pair).then(setpair(newPair));
  };


  const getAssetSelector = () => (
    <AssetSelector 
      handleSelect={handleSelect} 
      pair={pair} 
      currentData={currentData} 
      currencies={currencies}
    />
  );


  const getNavigationSection = () => (
    <div className="navigation-content">
      <Navigation 
        appTitle={appTitle} 
        indicatorTitles={Object.keys(dataIndicators.Indicators)} 
        assetSelector={getAssetSelector()}
      />
    </div>
  );
  
  
  const getMainSection = () => {
    let indicators = Object.keys(dataIndicators.Indicators).map(title => (
      <Indicator 
        asset={pair}
        title={title} 
        key={title}
        data={pastData}
        currentData={currentData} 
        indicatorData={dataIndicators}
      />
    ));
    return (<div className="main-content">{indicators}</div>);
  };
  

  const getComponent = () => {
    if(!appTitle || !dataIndicators || !pastData || !currentData || !currencies){

      console.log('HEY SOMETHING HASNT LOADED YET');


      const checkIfNull = (variableName, variable) => 
        variable && true ? "" :  <p>{variableName} : <span className="inline-error">NULL</span></p>;

      return (
        <div className="App">
          <div className="loading-screen">
            <h1>Data is being retrieved. Please Wait.</h1>
            {checkIfNull("dataIndicators",dataIndicators)}
            {checkIfNull("pastData",pastData)}
            {checkIfNull("currentData",currentData)}
            {checkIfNull("currencies",currencies)}
          </div>
        </div>
      );
    }
    
      
    return (
      <div className="App">
        {getNavigationSection()}
        {getMainSection()}
      </div>
    );
  };

  return getComponent();
}