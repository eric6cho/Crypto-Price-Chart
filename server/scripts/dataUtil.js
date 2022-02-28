const _ = require('lodash');
const moment= require('moment');

// start string constant definitions

const VALUE = 'Value';
const SIGNAL = 'Signal';
const START = 'Start';
const END = 'End';
const OPEN = 'Open';
const HIGH = 'High';
const LOW = 'Low';
const CLOSE = 'Close';
const VOLUME = 'Volume';
const HISTOGRAM = 'Histogram';
const MA = 'MA';
const SMA = 'SMA';
const EMA = 'EMA';
const VOLATILITY = 'Volatility';
const OPENCLOSE = 'Open Close';
const HIGHLOW = 'High Low';
const MACD = 'MACD';

const STOCH = 'Stoch';
const STOCHFASTK = 'StochFastK';
const STOCHFASTD = 'StochFastD';
const STOCHSLOWK = 'StochSlowK';
const STOCHSLOWD = 'StochSlowD';

const STOCHRSI = 'StochRSI';
const STOCHRSIFASTK = 'StochRSIFastK';
const STOCHRSIFASTD = 'StochRSIFastD';
const STOCHRSISLOWK = 'StochRSISlowK';
const STOCHRSISLOWD = 'StochRSISlowD';

const RSI = 'RSI';

const RVI = 'RVI';

const PRICE = 'Price';
const HEIKINASHI = 'Heikin Ashi';
const FEARANDGREED = 'Fear and Greed';

// end string constant definitions


// start object function definitions

const keys = obj => Object.keys(obj);


const checkIfEntryCreated = (data, key) => {
    if(!keys(data).find(x => x === key)) data[key] = {};
};


const sortDataObject = (data) => 
    keys(data)
        .sort((a,b) => new Date(b) - new Date(a))
        .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});


const reverseDataObject = data => 
    keys(data)
        .sort((a,b) => new Date(a) - new Date(b))
        .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});


const reduceDataObject = (data) => {
    let newDataObject = {};
    keys(data).map(date => {
        if(data[date]['Price']!==undefined) newDataObject[date] = data[date];
    });
    return newDataObject;
};

// end object function definitions


// start global data parsing function definitions

const parseCMCGlobalData = (data) => { 
    if(data['status']['error_message'])return null;

    data = data['data'];
    usdData = data['quote']['USD'];

    let parsedData = {};
    parsedData['last updated'] = data['last_updated'];
    parsedData['total market cap'] = usdData['total_market_cap'];
    parsedData['alt market cap'] = usdData['altcoin_market_cap'];
    parsedData['btc dominance'] = data['btc_dominance'];
    parsedData['btc dominance change'] = data['btc_dominance_24h_percentage_change'];
    parsedData['eth dominance'] = data['eth_dominance'];
    parsedData['eth dominance change'] = data['eth_dominance_24h_percentage_change'];

    return parsedData;
};

// end global data parsing function definitions


// start price data parsing function definitions

const getCandleFromData = (data,date,open,high,low,close,volume) => {
    checkIfEntryCreated(data,date);
    checkIfEntryCreated(data[date],PRICE);
    checkIfEntryCreated(data[date],VOLUME);

    data[date][PRICE][OPEN] = open;
    data[date][PRICE][HIGH] = high;
    data[date][PRICE][LOW] = low;
    data[date][PRICE][CLOSE] = close;
    data[date][VOLUME][VALUE] = volume;

    return data;
};


const parseCBPriceData = (data) => {  
    if(data['message']==='NotFound') return null;

    let parsedData = {};

    data.map(entry => {
        let momentDate = moment(entry[0]*1000).utc();
        let date = momentDate.format('YYYY')+'-'+momentDate.format('M')+'-'+momentDate.format('D');
        parsedData = getCandleFromData(parsedData,date,entry[3],entry[2],entry[1],entry[4],entry[5])
    });

    return parsedData;
};


const parseAVPriceData = (data) => {
    if(data['Error Message']!==undefined || data['Note']!==undefined)return null;
    
    let parsedData = {};
    
    if(data && data!==undefined){ // write function to check if the data is not valid
        data = data["Time Series (Digital Currency Daily)"];
        keys(data).map(originalDate => {
            let date = formatDate(originalDate);
            let getVal = index => parseFloat(data[originalDate][keys(data[originalDate])[index]]);
            parsedData = getCandleFromData(parsedData,date,getVal(0),getVal(2),getVal(4),getVal(6),getVal(8));
        });
    }

    return parsedData;
};    


const parseFearAndGreedData = (data) => {  
    data = data['data'];

    let parsedData = {};

    data.map(entry => {
        let date = formatDate(entry['timestamp']);
        checkIfEntryCreated(parsedData,date);
        checkIfEntryCreated(parsedData[date],FEARANDGREED);
        parsedData[date][FEARANDGREED][VALUE] = parseInt(entry['value']);
    });

    return parsedData;
};

// end price data parsing function definitions


// start metadata data parsing function definitions

const convertCsvToJson = csv => {
    let lines=(csv.split(/\r|\n/)).filter(entry=>entry!=='');
    let headers=lines[0].split(",");
    let result = [];
    
    for(let i=1;i<lines.length;i++){
        let obj = {};
        let currentline=lines[i].split(",");
        for(let j=0;j<headers.length;j++) obj[headers[j]] = currentline[j];
        result.push(obj);
    }

    return result;
}


const parseAVCurrencyData = (data) => {
    data = convertCsvToJson(data);

    let parsed = {};

    data.map( entry=>{
        let id = entry['currency code'];

        parsed[id] = {};
        parsed[id]['id']=entry['currency name'];
        parsed[id]['symbol']=id;
        parsed[id]['name']=entry['currency name'];
        parsed[id]['sources'] = {};
        parsed[id]['sources']['alphavantage'] = true;
        parsed[id]['last updated']= moment().format('YYYY-MM-DD');
    });

    return parsed;
};


const parseCBCurrencyData = (data) => {  
    let parsed = {};
  
    data.map( entry=>{
        if(entry['quote_currency']!=='USD')return;
    
        let id = entry['base_currency'];
        
        parsed[id] = {};
        parsed[id]['symbol']=id;
        parsed[id]['sources'] = {};
        parsed[id]['sources']['coinbase'] = true;
        parsed[id]['last updated']= moment().format('YYYY-MM-DD');
    });
  
    return parsed;
};


const parseCMCCurrencyData = (data) => {
    let parsed = {};
  
    data = data['data'];

    data.map( entry=>{
        let id = entry['symbol'].toString().toUpperCase();
    
        parsed[id] = {};
        parsed[id]['id']=entry['slug'];
        parsed[id]['symbol']=id;
        parsed[id]['name']=entry['name'];
        parsed[id]['price']=entry['quote']['USD']['price'];
        parsed[id]['market cap']=entry['quote']['USD']['market_cap'];
        parsed[id]['24h price change percentage']=entry['quote']['USD']['percent_change_24h'];
        parsed[id]['circulating supply']=entry['circulating_supply'];
        parsed[id]['total supply']=entry['total_supply'];
        parsed[id]['sources'] = {};
        parsed[id]['sources']['coinmarketcap'] = true;
        parsed[id]['last updated']= moment().format('YYYY-MM-DD');
    });
  
    return parsed;
};


const parseCGCurrencyData = (data) => {
    let parsed = {};
  
    data.map( entry=>{
        let id = entry['symbol'].toString().toUpperCase();
        
        parsed[id] = {};
        parsed[id]['id']=entry['id'];
        parsed[id]['symbol']=id;
        parsed[id]['name']=entry['name'];
        parsed[id]['price']=entry['current_price'];
        parsed[id]['iconUrl']=entry['image'];
        parsed[id]['rank']=entry['market_cap_rank'];
        parsed[id]['market cap']=entry['market_cap'];
        parsed[id]['24h high']=entry['high_24h'];
        parsed[id]['24h low']=entry['low_24h'];
        parsed[id]['24h price change']=entry['price_change_24h'];
        parsed[id]['24h price change percentage']=entry['price_change_percentage_24h'];
        parsed[id]['circulating supply']=entry['circulating_supply'];
        parsed[id]['total supply']=entry['total_supply'];
        parsed[id]['sources'] = {};
        parsed[id]['sources']['coingecko'] = true;
        parsed[id]['last updated']= moment().format('YYYY-MM-DD');
    });
    
    return parsed;
};
  

const sortCurrencyMetadataObject = data => {
    let woMarketCap = {};
    let wMarketCap = {};
    
    keys(data).map(entry => {
        if(data[entry]['market cap']===undefined) woMarketCap[entry] = data[entry];
        else wMarketCap[entry] = data[entry];
    });

    wMarketCap = Object.fromEntries(
        Object.entries(wMarketCap).sort(([,a],[,b]) => b['market cap']-a['market cap'])
    );

    keys(wMarketCap).map((entry,i)=>wMarketCap[entry]['rank']=(i+1));

    woMarketCap = Object.fromEntries(
        Object.entries(woMarketCap).sort(([,a],[,b]) => {
            if(a.symbol < b.symbol) return -1;
            if(a.symbol > b.symbol) return 1;
            return 0;  
        }
      )
    );

    keys(woMarketCap).map(entry=>woMarketCap[entry]['rank']=-1);

    let merged = _.merge(wMarketCap,woMarketCap);
    let reduced = {};

    keys(merged).map(entry=>{
        let sources = merged[entry]['sources'];
        if(!(keys(sources).length===1 && sources['alphavantage']))
            reduced[entry]=merged[entry]
    });

    return reduced;
};


const compileCurrencyMetadata = (avData,cbData,cmcData,cgData) => {
    let parsed = {};
    
    avData = parseAVCurrencyData(avData);
    cbData = parseCBCurrencyData(cbData);
    cmcData = parseCMCCurrencyData(cmcData);
    cgData = parseCGCurrencyData(cgData);
    parsed = _.merge(avData,cbData,cmcData,cgData);
    parsed = sortCurrencyMetadataObject(parsed);

    return parsed;
};

// end metadata data parsing function definitions


// start chart data function definitions

const formatDate = date => date.replaceAll('-0','-');

const getMax = values => Math.max(...values);

const getMin = values => Math.min(...values);

const getPercentMovement = (open,close) => ((close-open)/open) * 100;

const getSMA = values => values.reduce((a,b)=>a+b,0)/values.length;

const getEMA = (value,period,EMAp) => (2 / (period + 1)) * (value - EMAp) + EMAp;

const getTitle = (period,indicator) => period+' Day '+indicator; 


const getPriceCandleValues = (data,type) => {
    return keys(data).map(date => {
        if(data[date]!==undefined && data[date][PRICE]!==undefined) 
        return data[date][PRICE][type];
    });
};


const getDatesInRange = (startDate, stopDate) => {
    let dateArray = [];
    let currentDate = moment(startDate,'YYYY-MM-DD');
    while (currentDate <= moment(stopDate,'YYYY-MM-DD')) {
        dateArray.push( formatDate(moment(currentDate).format('YYYY-MM-DD')) )
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}


const getDataSMA = (data,period) => {
    let dates = keys(data);
    let closes = getPriceCandleValues(data,CLOSE);
    let title = getTitle(period,SMA);

    for(let i=period;i<=dates.length;i++){
        let date = dates[i-1];
        let smaValue = getSMA(closes.slice(i-period,i));
    
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],MA);
        checkIfEntryCreated(data[date][MA],title);
        data[date][MA][title] = smaValue;
    }

    return data;
};


const getDataEMA = (data,period) => {
    let dates = keys(data);
    let closes = getPriceCandleValues(data,CLOSE);
    let title = getTitle(period,EMA);

    for(let i=period;i<=dates.length;i++){
        let date = dates[i-1];
        let prevDate = dates[i-2];  
        let emaValue = 0;
    
        if(i==period) emaValue = getSMA(closes.slice(0,period));
        else emaValue = getEMA(closes[i-1],period,data[prevDate][MA][title]);
    
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],MA);
        checkIfEntryCreated(data[date][MA],title);
        data[date][MA][title] = emaValue;
    }

    return data;
};


const getDataVolatility = (data,period) => {
    let dates = keys(data);
    let opens = getPriceCandleValues(data,OPEN);
    let closes = getPriceCandleValues(data,CLOSE);
    let highs = getPriceCandleValues(data,HIGH);
    let lows = getPriceCandleValues(data,LOW); 
    let highLowMovementValues = [];

    for(let i=1;i<=dates.length;i++){
        let date = dates[i-1];
        let open = opens[i-1];
        let close = closes[i-1];
        let high = highs[i-1];
        let low = lows[i-1];
        
        let openCloseMovement = getPercentMovement(open, close);
        
        let highLowMovement = 
        openCloseMovement>=0 ? getPercentMovement(open,high) : getPercentMovement(open,low);
        
        checkIfEntryCreated(data[date],VOLATILITY);
        data[date][VOLATILITY][OPENCLOSE] = openCloseMovement;
        data[date][VOLATILITY][HIGHLOW] = highLowMovement;
    
        highLowMovementValues.push(highLowMovement);
    }

    for(let i=period;i<=dates.length;i++){
        let date = dates[i-1];
        let smaValue = getSMA(highLowMovementValues.slice(i-period,i)) * 7;
    
        data[date][VOLATILITY][SIGNAL] = smaValue;
    }

    return data;
};


const getDataMACD = (data,EMAPeriod1=12,EMAPeriod2=26,signalLineTime=9) => {
    let dates = keys(data);
    let title = getTitle(EMAPeriod2,MACD);
    let MACDList = [];
    let signalLineDatesList = [];

    for(let i=EMAPeriod2; i<=dates.length; i++){
        let date = dates[i-1];
        let MACDEMA1 = data[date][MA][getTitle(EMAPeriod1,EMA)]; // 12 day ema by default
        let MACDEMA2 = data[date][MA][getTitle(EMAPeriod2,EMA)]; // 26 day ema by default
        let MACDValue = MACDEMA1 - MACDEMA2;
        
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],title);
        data[date][title][MACD] = MACDValue;
    
        MACDList.push(MACDValue);
        signalLineDatesList.push(date);
    }

    for(let i=signalLineTime;i<=signalLineDatesList.length;i++){
        let date = signalLineDatesList[i-1];
        let prevDate = signalLineDatesList[i-2];  
        let emaValue = 0;
    
        if(i==signalLineTime) emaValue = getSMA(MACDList.slice(0,signalLineTime));
        else emaValue = getEMA(MACDList[i-1],signalLineTime,data[prevDate][title][SIGNAL]);
    
        let MACDVal = data[date][title][MACD];
        let histogramVal = MACDVal - emaValue;
    
        // assign value
        data[date][title][SIGNAL] = emaValue;
        data[date][title][HISTOGRAM] = histogramVal;
    }

    return data;
};


const getDataStochOsc = (data,period) => {
    let dates = keys(data);
    let closes = getPriceCandleValues(data,CLOSE);
    let highs = getPriceCandleValues(data,HIGH);
    let lows = getPriceCandleValues(data,LOW);
    let title = getTitle(period,STOCH);
    let smoothingValue = 3; // 3 day is default
    let stochFastKList = [];
    let stochFastDList = [];
    let updatedDatesList = [];
    let tempDatesList = [];

    const getStochKFast = (c,l,h) => 100 * ((c-l)/(h-l)); 

    for(let i=period;i<=dates.length;i++){
        let date = dates[i-1];
        let h = Math.max(...highs.slice(i-period,i));
        let l = Math.min(...lows.slice(i-period,i));
        let c = closes[i-1];
        let stochFastKValue = getStochKFast(c,l,h);
        
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],title);
        data[date][title][STOCHFASTK] = stochFastKValue;
    
        stochFastKList.push(stochFastKValue); // least to most recent
        tempDatesList.push(date);
    }

    updatedDatesList = tempDatesList;
    tempDatesList = [];

    for(let i=smoothingValue;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let stochFastDValue = getSMA(stochFastKList.slice(i-smoothingValue,i));
    
        // assign value 
        data[date][title][STOCHFASTD] = stochFastDValue; // 3 day since D is a 3 sma of K
        data[date][title][STOCHSLOWK] = stochFastDValue; // SlowK == FastD
        
        stochFastDList.push(stochFastDValue); // least to most recent
        tempDatesList.push(date);
    }

    updatedDatesList = tempDatesList;
    tempDatesList = [];

    for(let i=smoothingValue;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let stochSlowDValue = getSMA(stochFastDList.slice(i-smoothingValue,i));
    
        // assign value 
        data[date][title][STOCHSLOWD] = stochSlowDValue;
    }

    return data;
};


const getDataRSI = (data,period) => {
    let dates = keys(data);
    let closes = getPriceCandleValues(data,CLOSE);
    let title = getTitle(period,RSI);
    let prevAvgGain;
    let prevAvgLoss;

    const getRSI = (closes,isInit=false) => {
        let RS = 1;
        let avgGain;
        let avgLoss;
    
        if(isInit){
            let gainList = [];
            let lossList = [];
    
            closes.reduce((a,b) => {
                if(a<=b) gainList.push(b-a);
                else lossList.push(a-b);
                return b;
            });
            
            avgGain = gainList.reduce((a,b)=> a+b , 0)/period;
            avgLoss = lossList.reduce((a,b)=> a+b , 0)/period;
        }
        else{
            let currentGain = 0;
            let currentLoss = 0;
    
            closes.slice(closes.length-2).reduce((a,b)=>{
                if(a<=b) currentGain = b-a;
                else currentLoss = a-b;
                return b;
            });
    
            avgGain = ((period-1) * prevAvgGain + currentGain) / period;
            avgLoss = ((period-1) * prevAvgLoss + currentLoss) / period;
        }
    
        prevAvgGain = avgGain;
        prevAvgLoss = avgLoss;
        RS = avgGain/avgLoss;
    
        return 100 - (100/(1+RS));
    };

    for(let i=period;i<=dates.length;i++){
        let date = dates[i-1];
        let rsiValue = getRSI(closes.slice(i-period,i),i==period); // i==timeframe if 1st iteration
        
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],title);
        data[date][title][RSI] = rsiValue;
    }

    return data;
};


const getDataStochRSI = (data,period) => {
    let dates = keys(data);
    let title = getTitle(period,STOCHRSI);
    let RSITitle = getTitle(period,RSI);
    let smoothingValueD = 3; // 3 day is the default
    let smoothingValue = 5; // 5 day is the default
    let stochRSIFastKList = [];
    let stochRSIFastDList = [];
    let stochRSISlowKList = [];
    let updatedDatesList = [];
    let tempDatesList = [];

    // stoch rsi fast k
    for(let i=period*2; i<=dates.length; i++){
        let currentDate = dates[i-1];
        let currentRSI = data[currentDate][RSITitle][RSI];
        let RSIList = [];
    
        dates.slice(i-period,i).forEach(date => {
            RSIList.push(data[date][RSITitle][RSI]);
        });
    
        let maxRSI = getMax(RSIList);
        let minRSI = getMin(RSIList);
        let stochRSIFastK = ((currentRSI - minRSI) / (maxRSI - minRSI))*100;
        
        // undefined checks for entry and assign value
        checkIfEntryCreated(data[currentDate],title);
        data[currentDate][title][STOCHRSIFASTK] = stochRSIFastK;
    
        stochRSIFastKList.push(stochRSIFastK);
        tempDatesList.push(currentDate);
    }

    updatedDatesList = tempDatesList;
    tempDatesList = [];

    // stoch rsi fast d
    for(let i=smoothingValueD;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let stochRSIFastD = getSMA(stochRSIFastKList.slice(i-smoothingValueD,i));
    
        // assign value 
        data[date][title][STOCHRSIFASTD] = stochRSIFastD; 
        
        stochRSIFastDList.push(stochRSIFastD); // least to most recent
    }

    // stoch rsi slow k (unable to verfiy with alphavantage)
    for(let i=smoothingValue;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let stochRSISlowK = getSMA(stochRSIFastKList.slice(i-smoothingValue,i));
    
        // assign value 
        data[date][title][STOCHRSISLOWK] = stochRSISlowK; 
        
        stochRSISlowKList.push(stochRSISlowK); // least to most recent
        tempDatesList.push(date);
    }
    
    updatedDatesList = tempDatesList;
    tempDatesList = [];

    // stoch rsi slow D (unable to verfiy with alphavantage)
    for(let i=smoothingValueD;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let stochRSISlowD = getSMA(stochRSISlowKList.slice(i-smoothingValueD,i));
    
        // assign value 
        data[date][title][STOCHRSISLOWD] = stochRSISlowD; 
    }

    return data;
};


const getDataRVI = (data,period) => {
    let dates = keys(data);
    let opens = getPriceCandleValues(data,OPEN);
    let closes = getPriceCandleValues(data,CLOSE);
    let highs = getPriceCandleValues(data,HIGH);
    let lows = getPriceCandleValues(data,LOW);
    let title = getTitle(period,RVI);
    let numerators = [];
    let denominators = []; 
    let rviList = []; 
    let updatedDatesList = [];
    let tempDatesList = [];

    for(let i=4;i<=dates.length;i++){
        let date = dates[i-1];
        let a = closes[i-1] - opens[i-1];
        let b = closes[i-2] - opens[i-2];
        let c = closes[i-3] - opens[i-3];
        let d = closes[i-4] - opens[i-4];
        let e = highs[i-1] - lows[i-1];
        let f = highs[i-2] - lows[i-2];
        let g = highs[i-3] - lows[i-3];
        let h = highs[i-4] - lows[i-4];
        let numerator = (a + 2*b + 2*c + d)/6;
        let denominator = (e + 2*f + 2*g + h)/6;

        numerators.push(numerator);
        denominators.push(denominator);
        tempDatesList.push(date);
    }

    updatedDatesList = tempDatesList;
    tempDatesList = [];

    for(let i=period;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let numeratorSMA = getSMA(numerators.slice(i-period,i));
        let denominatorSMA = getSMA(denominators.slice(i-period,i));
        let rviValue = numeratorSMA/denominatorSMA;

        // undefined checks for entry and assign value
        checkIfEntryCreated(data[date],title);
        data[date][title][RVI] = rviValue;

        rviList.push(rviValue);
        tempDatesList.push(date);
    }

    updatedDatesList = tempDatesList;
    tempDatesList = [];

    for(let i=4;i<=updatedDatesList.length;i++){
        let date = updatedDatesList[i-1];
        let a = rviList[i-1];
        let b = rviList[i-2];
        let c = rviList[i-3];
        let d = rviList[i-4];
        let signal = (a + 2*b + 2*c + d)/6;

        // assign value
        data[date][title][SIGNAL] = signal;
    }

    return data;
}; 


const getHeikinAshiCandles = (data,period) => {
    let dates = keys(data);
    let title = HEIKINASHI;
    let interval = 1;
    let dateSum = 0;
    let weeklyPriceCandles = {};

    for(let i=0;i<dates.length;i+=interval){
        interval=1;
    
        if(data[dates[i]][PRICE]===undefined) {
            dateSum+=interval;
            continue;
        }
    
        interval = period-moment(dates[i],'YYYY-MM-DD').day();
        if(dateSum+interval>=dates.length) interval = dates.length-dateSum;
    
        for(;;){
            if(data[dates[i+interval-1]][PRICE]===undefined) interval--;
            else break;
        }
    
        let start = dates[i];
        let end = dates[i+interval-1];
        let open  = data[start][PRICE][OPEN];
        let close = data[end][PRICE][CLOSE];
        let highs = [];
        let lows = [];
        
        dates.slice(i,i+interval).map(date=>{
            highs.push(data[date][PRICE][HIGH]);
            lows.push(data[date][PRICE][LOW]);
        });
    
        let high = getMax(highs);
        let low = getMin(lows);
    
        let candle = {};
        candle[START] = start;
        candle[END] = end;
        candle[OPEN] = open;
        candle[HIGH] = high;
        candle[LOW] = low;
        candle[CLOSE] = close;
    
        weeklyPriceCandles[start] = candle;
        
        dateSum+=interval;
    };

    keys(weeklyPriceCandles).map((date,i) => {
    
        let prevDate = keys(weeklyPriceCandles)[i-1];
        
        if(prevDate!==undefined){
            
            let prevCandle = weeklyPriceCandles[prevDate];
            let currCandle = weeklyPriceCandles[date];
    
            if(prevCandle!==undefined){
                let candle = {};
                candle[CLOSE]=(currCandle[OPEN]+currCandle[HIGH]+currCandle[LOW]+currCandle[CLOSE])/4;
                candle[OPEN]=(prevCandle[OPEN]+prevCandle[CLOSE])/2;
                candle[HIGH]=getMax([currCandle[HIGH],currCandle[OPEN],currCandle[CLOSE]]);
                candle[LOW]=getMin([currCandle[LOW],currCandle[OPEN],currCandle[CLOSE]]);
        
                let direction = candle[CLOSE]>candle[OPEN] ? 1 : -1;
        
                // undefined checks for entry and assign value
                checkIfEntryCreated(data[date],title);
                data[date][title] = candle;
        
                let weeklyDates = getDatesInRange(currCandle[START],currCandle[END]);
        
                weeklyDates.map(date=>{
                    checkIfEntryCreated(data[date],title);
        
                    let close = data[date][PRICE][CLOSE];
                    let open = data[date][PRICE][OPEN];
        
                    if(direction===1){
                        if(data[date][PRICE][OPEN]>data[date][PRICE][CLOSE]){
                            close = data[date][PRICE][OPEN];
                            open = data[date][PRICE][CLOSE];
                        }
                    }
                    else if(direction===-1){
                        if(data[date][PRICE][OPEN]<data[date][PRICE][CLOSE]){
                            close = data[date][PRICE][OPEN];
                            open = data[date][PRICE][CLOSE];
                        }
                    }
        
                    let candle = {};
                    candle[CLOSE]= close;
                    candle[OPEN] = open;
                    candle[HIGH] = data[date][PRICE][HIGH];
                    candle[LOW] = data[date][PRICE][LOW];
                    
                    data[date][title] = candle;
                })
            }
        }    
    });

    return data;
};


const compileChartData = (fileData,greedData,avData,cbData) => {

    cbData = parseCBPriceData(cbData);
    avData = parseAVPriceData(avData);
    greedData = parseFearAndGreedData(greedData);

    // merge all parsed data, and rearrange to oldest->newest for indicator processing
    let initData = reverseDataObject(_.merge(fileData,greedData,avData,cbData));
    let data = initData;

    data = reduceDataObject(data);

    data = getDataSMA(data,50); // 50 day sma
    data = getDataSMA(data,140); // 20 week sma for bull market support band
    data = getDataSMA(data,200); // 200 day sma
    data = getDataSMA(data,350); // 50 week sma
    data = getDataEMA(data,12); // 12 day ema for macd
    data = getDataEMA(data,26); // 26 day ema for macd
    data = getDataEMA(data,147); // 21 week ema for bull market support band
    data = getDataStochOsc(data,5); // 5 day stoch osc
    data = getDataMACD(data); // 12 day / 26 day macd
    data = getDataRSI(data,14); // 2 week rsi
    data = getDataStochRSI(data,14); // 2 week stoch rsi
    data = getDataRVI(data,10); // 100 day rvi 
    data = getDataVolatility(data,21); // 3 week long term volatility
    data = getHeikinAshiCandles(data,14); // get heikin ashi candle colors
    
    data = sortDataObject(_.merge(initData,data)); // merge data from apis with new indicator data
        
    return data;
};

// end chart data function definitions


// start dataUtil class definition

let dataUtil = class {

    getFinalGlobalData=(data)=>parseCMCGlobalData(data);

    getFinalChartData=(fileData,greedData,avData,cbData)=>compileChartData(fileData,greedData,avData,cbData);

    getFinalCurrencyMetadata=(avData,cbData,cmcData,cgData)=>compileCurrencyMetadata(avData,cbData,cmcData,cgData);

    reduceChartData = (data) => reduceDataObject(data);
}

module.exports = new dataUtil();

/*
  dataUtil.js is meant to be a helper class for severUtil.js

  serverUtils is responsible for:
    parsing raw array/json/csv data retrived from urls/files into a common object format
    processing historical data to generate chart data for price and other indicators
*/

// end dataUtil class definition