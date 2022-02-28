
require('dotenv').config();

const server = require('./scripts/serverUtil.js');
const path = require('path');
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build'))); 

app.post('/api/data/currency', (req, res) => server.sendChartData(req,res)); 
app.get('/api/data/global', (req, res) => server.sendGlobalData(req,res));
app.get('/api/metadata/indicators', (req, res) => server.sendIndicatorMetadata(req,res));
app.get('/api/metadata/currency', (req, res) => server.sendCurrencyMetadata(req,res));
app.get('/api', (req, res) => res.json({ message: 'Hello from server!' })); 
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'))); 

console.log('Server: Attempt to start server on port 3001');

app.listen(PORT, () => console.log(`Server: Listening on ${PORT}. Nice`));

/*
  index.js defines api paths and calls helper functions in serverUtils.js based on incoming api calls.
  index.js does not contain any logic for retrieving/parsing/packaging/sending data.

  Resources:
  Alpha Vantage API Docs: https://www.alphavantage.co/documentation/
  Coinbase Pro API Docs: https://developers.coinbase.com/docs/exchange/
  CoinMarketCap API Docs: https://coinmarketcap.com/api/documentation/v1/
  Coingecko API Docs: https://www.coingecko.com/en/api/documentation
  Fear And Greed API Docs: https://alternative.me/crypto/fear-and-greed-index/
  Lightweight Charts API Docs: https://tradingview.github.io/lightweight-charts/
  Google Material Icons: https://fonts.google.com/icons
  CSS Gradient Generator: https://cssgradient.io/
  Heroku Deployed App: https://crypto-risk-react.herokuapp.com/
*/