const _ = require('lodash');
const path = require('path');
const request = require('request');
const fs = require('fs');
const express = require("express");
const moment= require('moment');
const { sign } = require('crypto');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build'))); 

let dataObject = {};

const getPercentMovement = (open,close) => ((close-open)/open) * 100;

const getSum = values => values.reduce((a, b) => a + b, 0);

const getAvg = values => getSum(values)/(values.length);

const getMax = values => Math.max(...values);

const getMin = values => Math.min(...values);

const pairToAsset = (pair) => pair.substring(0,pair.indexOf('-'));

const fileContentNullCheck = file => (!file || file===undefined || file.length==0 || file=='{}');

const reduceDataObject = (data) => {
  let newDataObject = {};
  Object.keys(data).map(date => {
    if(data[date]['Volume']!==undefined) newDataObject[date] = data[date];
  });
  return newDataObject;
};

const sortDataObject = (data) => { 
  return Object.keys(data)
    .sort((a,b) => new Date(b) - new Date(a))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});
};

const checkIfEntryCreated = (data, key) => {
  if(!Object.keys(data).find(x => x === key)) data[key] = {};
};

const getSMA = values => values.reduce((a,b)=>a+b,0)/values.length;

const getSMAFromData = (timeFrame,dateValues,closeValues) => {

  let entryName = timeFrame+' Day SMA';

  for(let i=timeFrame;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let smaValue = getSMA(closeValues.slice(i-timeFrame,i));

    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);

    // assign value
    let entry = {
      'SMA': smaValue,
    };
    
    dataObject[date][entryName] = entry;
  }
};

const getSMAForVolatility = (timeFrame,dateValues,values) => {
  
  let entryName = 'Signal';

  for(let i=timeFrame;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let smaValue = getSMA(values.slice(i-timeFrame,i)) * 7; // multiplier to amplify signal

    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date]['Volatility'],entryName);

    dataObject[date]['Volatility'][entryName] = smaValue;
  }
};

const getEMA = (value,period,EMAp) => {
  let k = 2 / (period + 1);
  return k * (value - EMAp) + EMAp;
};

const getEMAFromData = (timeFrame,dateValues,closeValues) => {

  let entryName = timeFrame+' Day EMA';

  for(let i=timeFrame;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let prevDate = dateValues[i-2];  
    let emaValue = 0;

    if(i==timeFrame) emaValue = getSMA(closeValues.slice(0,timeFrame));
    else emaValue = getEMA(closeValues[i-1],timeFrame,dataObject[prevDate][entryName]['EMA']);

    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);

    // assign value
    let entry = {
      'EMA': emaValue,
    };
    
    dataObject[date][entryName] = entry;
  }
};

const getMACDFromData = (MACDEMATime1,MACDEMATime2,signalLineTime,dateValues) => {

  let MACDList = [];
  let signalLineDatesList = [];
  let entryName = MACDEMATime2+' Day MACD';

  for(let i=MACDEMATime2;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let MACDEMA1 = dataObject[date][MACDEMATime1+' Day EMA']['EMA']; // 12 day ema by default
    let MACDEMA2 = dataObject[date][MACDEMATime2+' Day EMA']['EMA']; // 26 day ema by default
    let MACD = MACDEMA1 - MACDEMA2;
     
    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);
    
    let entry = {
      'MACD': MACD,
    };

    // assign value
    dataObject[date][entryName] = entry;

    MACDList.push(MACD);
    signalLineDatesList.push(date);
  }

  for(let i=signalLineTime;i<=signalLineDatesList.length;i++){
    let date = signalLineDatesList[i-1];
    let prevDate = signalLineDatesList[i-2];  
    let emaValue = 0;

    if(i==signalLineTime) emaValue = getSMA(MACDList.slice(0,signalLineTime));
    else emaValue = getEMA(MACDList[i-1],signalLineTime,dataObject[prevDate][entryName]['Signal']);

    let MACD = dataObject[date][entryName]['MACD'];
    let histogramVal = MACD - emaValue;

    // assign value
    dataObject[date][entryName]['Signal'] = emaValue;
    dataObject[date][entryName]['Histogram'] = histogramVal;
  }
};

const getStochOscFromData = (timeFrame,dateValues,closeValues,highValues,lowValues) => {

  const getStochKFast = (c,l,h) => 100 * ((c-l)/(h-l)); 

  let entryName = timeFrame+' Day Stoch';
  let smoothingValue = 3; // 3 day is default
  let stochFastKList = [];
  let stochFastDList = [];
  let updatedDatesList = [];
  let tempDatesList = [];

  for(let i=timeFrame;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let h = Math.max(...highValues.slice(i-timeFrame,i));
    let l = Math.min(...lowValues.slice(i-timeFrame,i));
    let c = closeValues[i-1];
    let stochFastKValue = getStochKFast(c,l,h);
  
    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);

    let entry = {
      'StochFastK': stochFastKValue,
    };

    // assign value
    dataObject[date][entryName] = entry;

    stochFastKList.push(stochFastKValue); // least to most recent
    tempDatesList.push(date);
  }

  updatedDatesList = tempDatesList;
  tempDatesList = [];

  for(let i=smoothingValue;i<=updatedDatesList.length;i++){
    let date = updatedDatesList[i-1];
    let stochFastDValue = getSMA(stochFastKList.slice(i-smoothingValue,i));

    // assign value 
    dataObject[date][entryName]['StochFastD'] = stochFastDValue; // 3 day since D is a 3 sma of K
    dataObject[date][entryName]['StochSlowK'] = stochFastDValue; // SlowK == FastD
    
    stochFastDList.push(stochFastDValue); // least to most recent
    tempDatesList.push(date);
  }

  updatedDatesList = tempDatesList;
  tempDatesList = [];

  for(let i=smoothingValue;i<=updatedDatesList.length;i++){
    let date = updatedDatesList[i-1];
    let stochSlowDValue = getSMA(stochFastDList.slice(i-smoothingValue,i));

    // assign value 
    dataObject[date][entryName]['StochSlowD'] = stochSlowDValue;
  }
};

const getRSIFromData = (timeFrame,dateValues,closeValues) => {

  let prevAvgGain;
  let prevAvgLoss;
  let entryName = timeFrame+' Day RSI';

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
      
      avgGain = gainList.reduce((a,b)=> a+b , 0)/timeFrame;
      avgLoss = lossList.reduce((a,b)=> a+b , 0)/timeFrame;
    }
    else{
      let currentGain = 0;
      let currentLoss = 0;

      closes.slice(closes.length-2).reduce((a,b)=>{
        if(a<=b) currentGain = b-a;
        else currentLoss = a-b;
        return b;
      });

      avgGain = ((timeFrame-1) * prevAvgGain + currentGain) / timeFrame;
      avgLoss = ((timeFrame-1) * prevAvgLoss + currentLoss) / timeFrame;

    }

    prevAvgGain = avgGain;
    prevAvgLoss = avgLoss;
    RS = avgGain/avgLoss;

    return 100 - (100/(1+RS));
  };

  for(let i=timeFrame;i<=dateValues.length;i++){
    let date = dateValues[i-1];
    let rsiValue = getRSI(closeValues.slice(i-timeFrame,i),i==timeFrame); // i==timeframe if 1st iteration
   
    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);

    let entry = {
      'RSI': rsiValue,
    };
    
    // assign value
    dataObject[date][entryName] = entry;
  }
};

const getStochRSIFromData = (timeFrame,dateValues) => {

  let entryName = timeFrame+' Day StochRSI';
  let smoothingValueD = 3; // 3 day is the default
  let smoothingValue = 5; // 5 day is the default
  let stochRSIFastKList = [];
  let stochRSIFastDList = [];
  let stochRSISlowKList = [];
  let updatedDatesList = [];
  let tempDatesList = [];

  // stoch rsi fast k
  for(let i=timeFrame*2;i<=dateValues.length;i++){
    let currentDate = dateValues[i-1];
    let currentRSI = dataObject[currentDate][timeFrame+' Day RSI']['RSI'];
    let RSIList = [];
    dateValues.slice(i-timeFrame,i).forEach(date => {
      RSIList.push(dataObject[date][timeFrame+' Day RSI']['RSI']);
    } );

    let maxRSI = getMax(RSIList);
    let minRSI = getMin(RSIList);
    let stochRSIFastK = ((currentRSI - minRSI) / (maxRSI - minRSI))*100;
    
    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[currentDate],entryName);

    let entry = {
      'StochRSIFastK' : stochRSIFastK,
    };
    
    // assign value
    dataObject[currentDate][entryName] = entry;

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
    dataObject[date][entryName]['StochRSIFastD'] = stochRSIFastD; 
   
    stochRSIFastDList.push(stochRSIFastD); // least to most recent
  }

  // stoch rsi slow k (unable to verfiy with alphavantage)
  for(let i=smoothingValue;i<=updatedDatesList.length;i++){
    let date = updatedDatesList[i-1];
    let stochRSISlowK = getSMA(stochRSIFastKList.slice(i-smoothingValue,i));

    // assign value 
    dataObject[date][entryName]['stochRSISlowK'] = stochRSISlowK; 
   
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
    dataObject[date][entryName]['stochRSISlowD'] = stochRSISlowD; 
  }

};

const getRVIFromData = (timeFrame,openValues,closeValues,lowValues,highValues,dateValues) => {
    
  let entryName = timeFrame+' Day RVI';

  let numerators = [];
  let denominators = []; 
  let rviList = []; 
  let updatedDatesList = [];
  let tempDatesList = [];

  for(let i=4;i<=dateValues.length;i++){
    let date = dateValues[i-1];

    let a = closeValues[i-1] - openValues[i-1];
    let b = closeValues[i-2] - openValues[i-2];
    let c = closeValues[i-3] - openValues[i-3];
    let d = closeValues[i-4] - openValues[i-4];
    
    let e = highValues[i-1] - lowValues[i-1];
    let f = highValues[i-2] - lowValues[i-2];
    let g = highValues[i-3] - lowValues[i-3];
    let h = highValues[i-4] - lowValues[i-4];

    let numerator = (a + 2*b + 2*c + d)/6;
    let denominator = (e + 2*f + 2*g + h)/6;

    numerators.push(numerator);
    denominators.push(denominator);
  
    tempDatesList.push(date);
  }

  updatedDatesList = tempDatesList;
  tempDatesList = [];

  for(let i=timeFrame;i<=updatedDatesList.length;i++){
    let date = updatedDatesList[i-1];

    let numeratorSMA = getSMA(numerators.slice(i-timeFrame,i));
    let denominatorSMA = getSMA(denominators.slice(i-timeFrame,i));
    let RVI = numeratorSMA/denominatorSMA;

    // create data object if doesnt already exist
    checkIfEntryCreated(dataObject[date],entryName);

    // assign value

    let entry = {
      'RVI': RVI,
    };
    
    dataObject[date][entryName] = entry;

    rviList.push(RVI);
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
    dataObject[date][entryName]['Signal'] = signal;
  }
}; 



const fetchFearAndGreedData = async () => new Promise (resolve => {
  
  const num3Years = 1095;
  
  let url = `https://api.alternative.me/fng/?limit=${num3Years}&date_format=kr`;
  
  request.get(url, (error, response, body) => {
              
    let urlData = (JSON.parse(body))['data'];
    let parsedUrlData = {};

    for(let i =0;i< urlData.length;i++){
      let date = (urlData[i]['timestamp']).replaceAll('-0','-');
      parsedUrlData[date] = {'Fear And Greed' : parseInt(urlData[i]['value'])};
    }

    resolve(parsedUrlData);
  });
});



const fetchAlphaVantageData = async (asset,fileData) => new Promise (resolve => {
  
  if(fileData)resolve(fileData);

  let url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_Daily&symbol=${asset}&market=USD&apikey=apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  
  request.get(url, (error, response, body) => {
              
    let data = JSON.parse(body)["Time Series (Digital Currency Daily)"];
    let dataObject = {};

    Object.keys(data).map(date => {
      
      let formattedDate = date.replaceAll('-0','-');

      let getValue = index => parseFloat(data[date][Object.keys(data[date])[index]]);

      dataObject[formattedDate] = {
        "Open" : getValue(0),
        "High" : getValue(2),
        "Low" : getValue(4),
        "Close" : getValue(6),
        "Volume" : getValue(8),
      }
    });

    resolve(dataObject);
  });
});



const checkIfFolderExists = async (dir) => new Promise(resolve => {
  let doesDirExist = fs.existsSync(dir);
  if (!doesDirExist) fs.mkdirSync(dir, { recursive: true });
  resolve(true);
});



const checkIfFileExists = async (file) => new Promise(resolve => {

  fs.stat(file, function(err, stat) {
    if(!err){
      console.log(file,'exists. Attempt to update data'); 
      resolve(true);
    }
    else if(err.code === 'ENOENT') 
      console.log(file,'err.code is: ', err.code);
    else 
      console.log(file,'err.code is: ', err.code);
      
    resolve(false);
  }); 
});



const readDataFromFile = async (file) => new Promise(resolve => {

  console.log('attempt to read file: ',file);

  let fileData = null;

  fs.readFile(file, 'utf8', (err, fileString) => {
    if (err) 
      console.log(file,'was unable to be read');
    if (fileContentNullCheck(fileString))
      console.log(file,' exists but is empty');
    else {
      console.log(file,' exists and contains data');
      fileData = JSON.parse(fileString);
    }

    resolve(fileData);
  });
});

   

const writeDataToFile = async (file,data) => new Promise(resolve => {

  let fileString = JSON.stringify(data);
    
  fs.writeFile(file, fileString, err => {
    if(err) console.log(file,'was not able to be written to');
    resolve(data);
  });

});



const createFoldersAndFilesForPair = async (pair) => new Promise(resolve => {

  let dir = './server/data/Assets/'+pair;

  checkIfFolderExists(dir)
    .then(result => {
    
      let priceFile = dir+'/price.json';
      let indicatorFile = dir+'/indicator.json';
      let scoreFile = dir+'/score.json';
      let files = [priceFile,indicatorFile,scoreFile];
      
      files.map(async file => checkIfFileExists(file));

      resolve(files);
  });

});



const getIndicatorDescriptionData = async (title=null) =>new Promise(resolve => {
  
  let file = './server/data/Indicators/indicator-data.json';

  checkIfFileExists(file);
  
  let indicatorData =  readDataFromFile(file);

  // if indicator title is given, then only get that indicator
  if(title) indicatorData = {title:indicatorData[title]};
  
  resolve(indicatorData);
});



const keys = (obj) => Object.keys(obj);



// iterate thru raw score values and assign normalized scores for a signal in an indicator
const getNormalizedSignalScores = (scoreData,indicator,signal) => {

  // start raw data => normalized data

  let dates = [];
  let normalizedScores = [];
  
  keys(scoreData).map(date=>{
    let rawValue = scoreData[date][indicator][signal]['Raw'];

    if(rawValue !==undefined && !isNaN(rawValue)){
      dates.push(date);
      normalizedScores.push(rawValue);
    }
  });

  let ratio = getMax(normalizedScores) / 100;

  for (let i=0; i<normalizedScores.length; i++) {
    scoreData[dates[i]][indicator][signal]['Normalized'] = Math.round(normalizedScores[i] / ratio);
  }

  return scoreData;
};



// compile all signal scores to a final adjusted score for a single indiciator
const getFinalAdjustedIndicatorScores = (tempScoreData,indicator) => {

  keys(tempScoreData).map(date => {

    let signalList = Object.keys(tempScoreData[date][indicator]);
    let rawScores = [];
    let normalizedScores = [];

    signalList.map(signalTitle=>{
      let signal = tempScoreData[date][indicator][signalTitle];
      rawScores.push(signal['Raw']);
      normalizedScores.push(signal['Normalized']);
    });
  
    let normalizedScoresSum = getSum(normalizedScores);
    let numScores = normalizedScores.length;
    let totalPossibleScore = numScores * 100;
    let finalAdjustedScore = getAvg(normalizedScores);

    tempScoreData[date][indicator]['Total'] = {
      "Normalized Scores Sum" : normalizedScoresSum,
      "Number Scores" : numScores,
      "Total Possible Score" : totalPossibleScore,
      "Final Adjusted Score" : finalAdjustedScore
    };

  });

  return tempScoreData;
};



const getRawSignalScores = (indicatorData,scoreData,indicator,signal,entryTitle,innerScoreFunction) => {

  keys(indicatorData).map(date => {

    let entry = indicatorData[date][indicator];

    let score = innerScoreFunction(date,entry,indicator,signal,entryTitle);

    checkIfEntryCreated(scoreData,date);
    checkIfEntryCreated(scoreData[date],indicator);
    checkIfEntryCreated(scoreData[date][indicator],signal);

    scoreData[date][indicator][signal]['Raw'] = score;
  });            

  return getNormalizedSignalScores(scoreData,indicator,signal);
};



app.post('/api/testing', (req, res) => {

  const buildPriceResponse = async (file,data) => new Promise(resolve => {

    let asset = pairToAsset(req.body.pair);

    checkIfFileExists(file).then( status => {
      readDataFromFile(file).then(fileData => {
        fetchAlphaVantageData(asset,fileData).then(urlData =>{

          Object.keys(data).map(date => urlData[date]=data[date]);
          let sortedData = sortDataObject(urlData);
          writeDataToFile(file,sortedData);
          resolve(sortedData);

        });
      });
    });
  });
  



  const buildIndicatorResponse = async (file,priceData) => new Promise(resolve => {

    console.log('build indicator response function start');

    checkIfFileExists(file).then( result => {
      readDataFromFile(file).then(fileData => {
        fetchFearAndGreedData().then(fearAndGreedData => {
  
          dataObject = {};

          Object.keys(fearAndGreedData).map(date => 
            dataObject[date] = {'Fear And Greed' : {'Value':fearAndGreedData[date]['Fear And Greed']}}
          );
          
          // dates is a list of dates from oldest to newest
          let dateList = Object.keys(dataObject).reverse();
          let closeList = [];
          let openList = [];
          let highList = [];
          let lowList = [];
          let volatilityList = [];
  
          dateList.map(date => {
            if(priceData[date]!==undefined){

              let open = priceData[date]['Open'];
              let close = priceData[date]['Close'];
              let high = priceData[date]['High'];
              let low = priceData[date]['Low'];
    
              let openCloseMovement = getPercentMovement(open, close);
    
              let highLowMovement = openCloseMovement>=0 ? 
                getPercentMovement(open,high) : getPercentMovement(open,low);
              
              dataObject[date]['Volatility'] = { 
                'Open Close': openCloseMovement,
                'High Low': highLowMovement,
              };
    
              dataObject[date]['Volume'] = {'Volume' : priceData[date]['Volume']};
    
              closeList.push(close);
              openList.push(open);
              highList.push(high);
              lowList.push(low);
              volatilityList.push(highLowMovement);
            }
            
          });

          let sortedDataObject = sortDataObject(dataObject);
          let reducedDataObject = reduceDataObject(sortedDataObject);

          dateList = Object.keys(reducedDataObject).reverse();

          getSMAFromData(50,dateList,closeList); // 50 day sma
          getSMAFromData(140,dateList,closeList); // 20 week sma for bull market support band
          getSMAFromData(200,dateList,closeList); // 200 day sma
          getSMAFromData(350,dateList,closeList); // 50 week sma
          getEMAFromData(12,dateList,closeList); // 12 day ema for macd
          getEMAFromData(26,dateList,closeList); // 26 day ema for macd
          getEMAFromData(147,dateList,closeList); // 21 week ema for bull market support band
          getStochOscFromData(5,dateList,closeList,highList,lowList); // 5 day stoch osc
          getMACDFromData(12,26,9,dateList); // 12 day / 26 day macd
          getRSIFromData(14,dateList,closeList); // 2 week rsi
          getStochRSIFromData(14,dateList); // 2 week stoch rsi
          getRVIFromData(10,openList,closeList,lowList,highList,dateList); // 100 day rvi 
          getSMAForVolatility(21,dateList,volatilityList); // 3 week long term volatility
  
          console.log('build indicator response function end');

          writeDataToFile(file,sortedDataObject); // write complete data to the file
          resolve(reducedDataObject); // resolve promise w reduced data
        });
      });
    });
  });


  // INCOMPLETE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const buildScoreResponse = async (file,priceData,indicatorData) => new Promise(resolve => {

    checkIfFileExists(file).then( result => {

      readDataFromFile(file).then(fileData => {
        // begin merging file data and request body data
      
        getIndicatorDescriptionData().then(descriptionData=>{
                
          let scoreData = {};

          Object.keys(priceData).map(date => scoreData[date] = {});
          
          // get scores for different indicators
          scoreData = getScoreForFearAndGreed(priceData,indicatorData,scoreData,descriptionData);
          scoreData = getScoreForVolatility(priceData,indicatorData,scoreData,descriptionData);

          scoreData = sortDataObject(scoreData);
          
          writeDataToFile(file,scoreData);
          resolve(scoreData);

        });
      

        const getScoreForFearAndGreed = (priceData,indicatorData,scoreData,descriptionData) => {

          const getOverboughtOversoldScore = (date,entry,indicator,signal,entryTitle) =>{
            let fearAndGreedIndex = entry[entryTitle];
            let dist = fearAndGreedIndex - 50;
            let amp = Math.abs(dist) >= 25 ? 5 : 1;
            let score = dist * amp ;
            return score;
          };

          const indicator = 'Fear And Greed';
          const OverboughtOversold = 'Overbought / Oversold Levels';

          let tempScoreData = {};

          tempScoreData = getRawSignalScores(
            indicatorData,scoreData,indicator,OverboughtOversold,'Value',getOverboughtOversoldScore);  
        
          tempScoreData = getFinalAdjustedIndicatorScores(tempScoreData,indicator);
      
          return _.merge(scoreData,tempScoreData);
        };


        
          const getPreviousDates = (dates,currentDate,period) => {
          

           let datesReverse = dates; 
           let truncatedDates = [];
              datesReverse.map((date,i) => {

              if(date === currentDate){
                let adjustedPeriod = dates.length<period ? dates.length : period;
               // console.log(dates.slice(i-adjustedPeriod,i));
               truncatedDates = datesReverse.slice(i,i+adjustedPeriod);
              }
              
            });
         //  console.log(currentDate, truncatedDates);
             return truncatedDates;
          };

          const getCenterlineMomentum = (dates,indicator,entryTitle,tolerance) => {
            //console.log(dates);
            let momentumList = [];
            
            dates.map(date => {
              if(indicatorData[date][indicator]!==undefined && indicatorData[date][indicator][entryTitle]!== undefined){

                 let signalValue = indicatorData[date][indicator][entryTitle];
               //  console.log(date, signalValue);
                if(signalValue>tolerance)momentumList.push(1);
                else if(signalValue<tolerance*-1)momentumList.push(-1);
                else momentumList.push(0);
              }
              
            });
            return momentumList;

          };
          
          


        const getScoreForVolatility = (priceData,indicatorData,scoreData,descriptionData) => {

          // positive negative signal line values
          // positive values for negative signal line values with multiplier above dist abs 10
          const getSignalLineValueScore = (date,entry,indicator,signal,entryTitle) => {
            let value = entry[entryTitle];
            let amp = Math.abs(value) >= 12 ? 2 : 1;
            let score = value * amp;
            return score;
          };

          // flash crashes and flash pumps
          // positive values for negative volatility values with multiplier w volatility below -10%
          const getFlashCrashPumpScore = (date,entry,indicator,signal,entryTitle) =>{
            let value = entry[entryTitle];
            let amp = Math.abs(value) >= 12 ? 5 : 1;
            //amp = Math.abs(value) >= 15 ? 4 : amp;
            let score = value * amp;
            return score;
          };

        



          // signal line values centreline crosses
          // positive values signal line cross from negative to positive. multiplier for crosses that happened in the past 3 days.
          const getSignalLineCenterlineScore = (date,entry,indicator,signal,entryTitle) =>{
            
            let value = entry[entryTitle];

            //console.log(entryTitle);
            let dates = Object.keys(indicatorData);
            //console.log(dates);
            //console.log(date, getPreviousDates(dates,date,7));
            let previousDates = getPreviousDates(dates,date,4);
           // console.log(previousDates);
            let centerlineMomentumList = getCenterlineMomentum(previousDates,indicator,entryTitle,1.5);

            

            let currentMomentum = centerlineMomentumList[0];

            let momentumChanges = [];

            centerlineMomentumList.map(momentum => {
              if(momentumChanges.length===0 || momentumChanges[momentumChanges.length-1]!==momentum)
                momentumChanges.push(momentum);

            })

            



           // console.log(date,momentumChanges);

            let uptrend = [1];
            let downtrend = [-1];
            let downtrendTest = [0,-1];
            let uptrendTest = [0,1];
            let newUptrend = [1,0,-1];
            let newDowntrend = [1,0,-1];


            let isMomentumNewUptrend = (
              1===momentumChanges[0] && 
              0===momentumChanges[1] &&
              -1===momentumChanges[2] );

          
            let isMomentumNewDowntrend = (
              -1===momentumChanges[0] && 
              0===momentumChanges[1] &&
              1===momentumChanges[2] );

/*
let isMomentumNewUptrend = (
  1===momentumChanges[0] && 
  0===momentumChanges[1] );


let isMomentumNewDowntrend = (
  -1===momentumChanges[0] && 
  0===momentumChanges[1] );
*/

             // console.log(isMomentumNewUptrend);

            let isNewTrend = isMomentumNewDowntrend || isMomentumNewUptrend;

            let amp = -1 * (isNewTrend? 8 : 1);
            let score = (isNewTrend? 20+value : value);

            //console.log(date,value,amp,score);
            return score;
          };
       
          const indicator = 'Volatility';
          const SignalLineValue = 'Signal Line Above / Below Zero';
          const FlashCrashPump = 'Flash Crashes / Pumps';
          const SignalLineCenterline = 'Signal Line Centerline Crosses';

          let tempScoreData = {};

          tempScoreData = getRawSignalScores(
            indicatorData,scoreData,indicator,SignalLineValue,'Signal',getSignalLineValueScore);  
 
         
          tempScoreData = getRawSignalScores(
            indicatorData,scoreData,indicator,FlashCrashPump,'High Low',getFlashCrashPumpScore);  
   
          tempScoreData = getRawSignalScores(
            indicatorData,scoreData,indicator,SignalLineCenterline,'Signal',getSignalLineCenterlineScore);  
      
          tempScoreData = getFinalAdjustedIndicatorScores(tempScoreData,indicator);
      
          return _.merge(scoreData,tempScoreData);
        };
      });
    });
  });


  const apiCall = async (req,res) => {

    console.log('start api call function');

    let pair = req.body.pair;
    let data = req.body.data;

    let dataObj = {};
    
    data.map(entry => {
      let timestamp = entry[0]*1000; // time in ms\

      let momentDate = moment(timestamp).utc();
      let date = momentDate.format('YYYY')+'-'+momentDate.format('M')+'-'+momentDate.format('D');

      dataObj[date]= {
        'Open' : entry[3],
        'High' : entry[2],
        'Low' : entry[1],
        'Close' : entry[4],
        'Volume' : entry[5],
      };

    })

    createFoldersAndFilesForPair(pair).then(files => {

      let priceFile = files[0];
      let indicatorFile = files[1];
      let scoreFile = files[2]; 
     
      buildPriceResponse(priceFile,dataObj).then(priceObj => {

        buildIndicatorResponse(indicatorFile,priceObj).then(indicatorObj => {
          buildScoreResponse(scoreFile,priceObj,indicatorObj).then(scoreObj => {

            let responseObj = {};

            responseObj['pair'] = pair;
            responseObj['prices'] = priceObj;
            responseObj['indicators'] = indicatorObj;
            responseObj['scores'] = scoreObj;

            console.log('About to send the final response to the client.');

            res.json({ message: responseObj });
          });
          
        
        });
      });
    });
  };

  apiCall(req,res);
}); 



app.get('/api/get/indicators/description', (req, res) => {
  getIndicatorDescriptionData().then(data => res.json({ message: data }));
}); 



app.get('/api', (req, res) => res.json({ message: 'Hello from server!' })); 

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'))); 

console.log('Server: Attempt to start server on port 3001');

app.listen(PORT, () => console.log(`Server: Nice\nServer: Listening on ${PORT}`));

/*
1300 1258 883 853 819 896 1128

todo:

rewrite indicator functions to be able to function indepentenly 

move functions into a util file

determine scoring system for:
price
volatility
RSI
Stoch
StochRSI
MACD
RVI
Fear And Greed

Sync indicators to text sections

Create Overall Dashboard

Fix rounding errors on charts for small value coins. 0.0005 shows up as 0.00
*/