const fs = require('fs');
const request = require('request');
const moment= require('moment');
const d = require('./dataUtil.js');

// end file and url variable and function definitions

const assetFolder = './server/data/assets';
const indicatorMetadataFile = './server/data/metadata/indicator-data.json';
const currencyAVFile = './server/data/metadata/currencies-alphavantage.csv';
const currencyCBFile = './server/data/metadata/currencies-coinbase.json';
const currencyMetadataFile = './server/data/metadata/currencies-all.json';
const globalMetadataFile = './server/data/metadata/global-data.json';
const fearAndGreedURL = `https://api.alternative.me/fng/?limit=1095&date_format=kr`;
const currencyCGURL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
const currencyCMCURL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?CMC_PRO_API_KEY=${process.env.API_KEY_CMC}`;
const globalMetadataURL = `https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest?CMC_PRO_API_KEY=${process.env.API_KEY_CMC}`;

const getAssetFile = asset => assetFolder+'/'+asset.toLowerCase()+'-data.json';

const getCurrencyAVURL = symbol => `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_Daily&symbol=${symbol}&market=USD&apikey=apikey=${process.env.API_KEY_ALPHA_VANTAGE}`;


const checkIfFolderExists = async dir => new Promise(resolve => {
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
  resolve(true);
});


const checkIfFileExists = async file => new Promise(resolve => 
  fs.stat(file, (err, stat) => resolve(!err))
);


const createFoldersAndFilesForAsset = async asset => new Promise(resolve => {
  let file = getAssetFile(asset);
  checkIfFolderExists(assetFolder).then( 
    checkIfFileExists(file).then(resolve(file))
  )
});


const getUrlData = async url => new Promise (resolve => 
  request.get(url, (error, response, body) => resolve(JSON.parse(body))));


const getFileData = async (file,isJson=true) => new Promise (resolve => 
  checkIfFileExists(file).then(result =>
    readDataFromFile(file,isJson).then(fileData => 
      resolve(fileData)
    )
  )
);

const readDataFromFile = async (file,isJson=true) => new Promise(resolve => {
  
  const fileNullCheck = file => (!file || file===undefined || file.length==0 || file=='{}');
  
  let fileData = null;
  console.log('Reading file: ',file);
  fs.readFile(file, 'utf8', (err, fileString) => {
    if (!err && !fileNullCheck(fileString)) 
      fileData = isJson ? JSON.parse(fileString) : fileString;
    resolve(fileData);
  });
});


const writeDataToFile = async (file,data) => new Promise(resolve => 
  fs.writeFile(file, JSON.stringify(data), err => resolve(data))
);

// end file and url variable and function definitions


// start api call helper function definitions

const getChartData = async (req,res) => new Promise(resolve => {
  
  const resolveData = (data) => {
    console.log('Sending chart data as a response');
    resolve(data);
  };

  const pairToAsset = pair => pair.substring(0,pair.indexOf('-'));

  let asset = pairToAsset(req.body.pair);
  
  createFoldersAndFilesForAsset(asset).then(file => {
    getCurrencyMetadata(req).then(metadata=>{
  
      let sources = metadata[asset]['sources'];
      let isValidSources = sources['coinbase']!==undefined || sources['alphavantage']!==undefined;
      let cbData = req.body.data;
  
      if(!isValidSources) resolve(null);
      else{
        getFileData(file).then(fileData => {
          getUrlData(getCurrencyAVURL(asset)).then(avData =>{
            getUrlData(fearAndGreedURL).then(greedData => {      
           
              let data = d.getFinalChartData(fileData,greedData,avData,cbData);
              let reducedData = d.reduceChartData(data);
              let responseObj = {};
              responseObj['data'] = reducedData;
              responseObj['symbol'] = asset;
              responseObj['live'] = sources['coinbase']!==undefined;
  
              writeDataToFile(file,data); // write complete data to the file
              resolveData(responseObj); // resolve promise w reduced data
            });
          });
        });
      }
    });
  });
});


const getGlobalData = async (req,res) => new Promise(resolve => {

  const resolveData = (data) => {
    console.log('Sending global data as a response');
    resolve(data);
  };

  checkIfFileExists(globalMetadataFile).then( result => {
    readDataFromFile(globalMetadataFile).then(fileData => {

      let isFileEmpty = (!fileData || fileData.length===0 || Object.keys(fileData).length===0);
      let isFileUpdated = false;

      if(!isFileEmpty){
        let lastUpdated = moment(fileData['last updated']).utc().format('YYYY-MM-DD');
        let today = moment().utc().format('YYYY-MM-DD');
        isFileUpdated = lastUpdated===today;
      }

      if(isFileEmpty || !isFileUpdated){
        console.log('Global data needs to be updated');
        
        getUrlData(globalMetadataURL).then(data => {
          let parsedData = d.getFinalGlobalData(data);
          writeDataToFile(globalMetadataFile,parsedData); // write complete data to the file
          resolveData(parsedData);
        });
      }
      else resolveData(fileData);
    });
  });
});


const getCurrencyMetadata = async (req,res) => new Promise(resolve => {

  const resolveData = (data) => {
    console.log('Sending currency metadata as a response');
    resolve(data);
  };

  getFileData(currencyMetadataFile).then(fileData=>{
  
    let isFileEmpty = (!fileData || Object.keys(fileData).length===0);
    let today = moment().format('YYYY-MM-DD');

    // is retrieved file is not empty, and btc last updated is today, then reutrn the file data as is
    if(!isFileEmpty && fileData['BTC']['last updated']!==undefined && fileData['BTC']['last updated']===today){
      console.log('currency metadata is up to date');
      resolve(fileData);
    }
    else{
      console.log('currency metadata needs to be updated');
      
      getFileData(currencyAVFile,false).then(avData=>
        getFileData(currencyCBFile).then(cbData=>
          getUrlData(currencyCMCURL).then(cmcData=>
            getUrlData(currencyCGURL).then(cgData=>{
              let compiledData = d.getFinalCurrencyMetadata(avData,cbData,cmcData,cgData);
              writeDataToFile(currencyMetadataFile,compiledData);
              resolveData(compiledData);
            })
          ) 
        )
      );
    }
  });
});


const getIndicatorMetadata = async (req,res) => new Promise(resolve => {

  const resolveData = (data) => {
    console.log('Sending indicator metadata as a response');
    resolve(data);
  };

  getFileData(indicatorMetadataFile).then(fileData=>resolveData(fileData));
});

// end api call helper function definitions


// start serverUtil class definition

let serverUtil = class {
  sendChartData=(req,res)=>getChartData(req,res).then(data=>res.json({message:data}));

  sendGlobalData=(req,res)=>getGlobalData(req,res).then(data=>res.json({message:data}));

  sendIndicatorMetadata=(req,res)=>getIndicatorMetadata(req,res).then(data=>res.json({message:data}));

  sendCurrencyMetadata=(req,res)=>getCurrencyMetadata(req,res).then(data=>res.json({message:data}));
}

module.exports = new serverUtil();

/*
  serverUtil.js is meant to be a helper class for the api routing in index.js

  It allows api calls to be one liners that call serverutils

  serverUtils is responsible for:
    accessing and retrieving data from requests, files, and urls
    packaging parsed data into responses
    writing updated data to files
    sending packaged responses to the client

  serverUtils is not responsible for:
    processing / parsing data
    generating new data in charts
*/

// end serverUtil class definition