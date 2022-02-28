import React, { useState, useEffect, useRef } from "react";
import Navigation from "./components/comp-navigation";
import Chart from "./components/comp-chart";

export default function App() {
  
  const defaultSymbol = 'BTC';
  const chartUrl = '/api/data/currency';
  const currencyUrl = '/api/metadata/currency';
  const globalUrl = '/api/data/global';
  const indicatorUrl = '/api/metadata/indicators';
  const SUBSCRIBE = 'subscribe';
  const UNSUBSCRIBE = 'unsubscribe';

  let ws = useRef(null);
  
  const [chartData, setChartData] = useState(null); 
  const [globalData, setGlobalData] = useState(null); 
  const [currencyData, setCurrencyData] = useState(null);
  const [indicatorData, setIndicatorData] = useState(null);
  const [activeIndicators, setActiveIndicators] = useState(null);
  const [activeCurrency, setActiveCurrency] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null); 
  const [assetSymbol, setAssetSymbol] = useState(defaultSymbol);

  useEffect(() => {

    const apiCall = async () => {

      let pair = toPair(assetSymbol);

      fetchGet(getCoinbaseUrl(pair)).then(data => {
      
        // get chart data from the server
        fetchPost(chartUrl, {pair:pair, data:data}).then(data => {
          data = data['message'];

          if(data['data'] && data['live']) 
            wsToggleSubscribe(ws,SUBSCRIBE,pair).then(wsOnMessage(ws));

          let today = (Object.keys(data['data']))[0];
          setCurrentPrice(data['data'][today]['Price']['Close']);
          setChartData(data);  
        });
      });
     
      fetchGet(currencyUrl).then(data => {
        data = data['message'];
        let activeCurrency = null;
          
        Object.keys(data).forEach(currency => 
          data[currency]['symbol']===assetSymbol ? activeCurrency=data[currency] : null);

        setActiveCurrency(activeCurrency);
        setCurrencyData(data);
      });

      fetchGet(globalUrl).then(data => {
        data = data['message'];
        setGlobalData(data);
      });

      fetchGet(indicatorUrl).then(data => {
        data = data['message'];
        setIndicatorData(data);
        setActiveIndicators(getActiveIndicators(data));
      });
    };

    ws.current = new WebSocket("wss://ws-feed.pro.coinbase.com");
    
    ws.current.onopen = () => apiCall();
    
    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetSymbol]);


  const getCoinbaseUrl = pair => 'https://api.pro.coinbase.com/products/'+pair+'/candles?granularity=86400';


  const toPair = symbol => symbol.toUpperCase()+'-USD';


  const fetchGet = async (url) => new Promise (resolve=>{
    fetch(url)
      .then(res => res.json())
      .then(data => resolve(data));  
  });


  const fetchPost = async (url, data) => new Promise (resolve=>{
    let post = {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data) 
    };
    fetch(url, post)
      .then(res => res.json())
      .then(data => resolve(data));
  });
   

  const wsToggleSubscribe = async (ws,status,pair) => new Promise (resolve=>{
    let msg = {
      type: status,
      product_ids: [pair],
      channels: ["ticker"]
    };
    resolve(ws.current.send(JSON.stringify(msg)));
  });


  const wsOnMessage = (ws) => {
    ws.current.onmessage = e => {
      let data = JSON.parse(e.data);
      if (data.type!=="ticker" || data.product_id!==toPair(assetSymbol)) return;
      //console.log(assetSymbol,':', data.price); // console price changes
      setCurrentPrice(data.price);
    };
  };
  

  const getActiveIndicators = (data) => 
    Object.keys(data).filter(indicator => data[indicator]['Metadata']['isActive']==='true');


  const handleAssetSelect = symbol => {
    let sources = currencyData[symbol]['sources']
    let isCB = sources['coinbase']!==undefined;
    let isAV = sources['alphavantage']!==undefined;

    // if symbol hasnt changed or symbol has no chart data, then return false
    if((symbol===assetSymbol)||(!isCB&&!isAV)) return false;
    
    wsToggleSubscribe(ws,UNSUBSCRIBE,toPair(assetSymbol));
    setAssetSymbol(symbol);
    return true; 
  };


  const handleIndicatorSelect = (title) => {
    let updatedIndicatorData = toggleIndicatorState(indicatorData,title);
    setIndicatorData(updatedIndicatorData);
    setActiveIndicators(getActiveIndicators(updatedIndicatorData));
  }
  
    
  const toggleIndicatorState = (data,title) => {
    let newState = !(data[title]['Metadata']['isActive']==='true');
    data[title]['Metadata']['isActive']=newState?'true':'false';
    if(title==='Price') data['Heikin Ashi']['Metadata']['isActive']=newState?'false':'true';
    if(title==='Heikin Ashi') data['Price']['Metadata']['isActive']=newState?'false':'true';
    return data; 
  };


  const getNavigationSection = () => {
    return (
      <Navigation 
        globalData={globalData}
        indicatorData={indicatorData}
        activeIndicators={activeIndicators}
        currencyData={currencyData}
        activeCurrency={activeCurrency}
        currentPrice={currentPrice} 
        handleAssetSelect={handleAssetSelect} 
        handleIndicatorSelect={handleIndicatorSelect}
      />
    );
  };


  const getMainSection = () => {
    if(indicatorData && Object.keys(indicatorData).length!==0)
      return (
        <Chart 
          symbol={activeCurrency['symbol']}
          data={chartData} 
          price={currentPrice} 
          indicators={activeIndicators}
        />
      ); 
  };

  
  const getComponent = () => {
    if(!indicatorData || !chartData || !currentPrice || !currencyData){
      const checkIfNull = (name,data) => data?"":<p>{name}:<span className="inline-error">NULL</span></p>;

      return (
        <div className="App">
          <div className="loading-screen">
            <h1>Data is being retrieved. Please Wait.</h1>
            {checkIfNull("Indicator Data",indicatorData)}
            {checkIfNull("Chart Data",chartData)}
            {checkIfNull("Price Data",currentPrice)}
            {checkIfNull("Currency Data",currencyData)}
          </div>
        </div>
      );
    }
      
    return (
      <div className="App">
        {getMainSection()}
        {getNavigationSection()}
      </div>
    );
  };

  return getComponent();
}