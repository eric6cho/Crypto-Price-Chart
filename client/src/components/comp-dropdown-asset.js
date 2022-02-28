import React, { useState, useEffect } from "react";
import EntryAsset from "./comp-entry-asset";
import './../styles/comp-dropdown.scss';
import * as utils from '../scripts/utils'; 

export default function DropdownAsset(props) {

  const componentId = 'dropdown-asset';
  const defaultClass = 'component dropdown '+componentId+' ';
  const activeClass = 'active ';

  const [isActive, setIsActive] = useState(false);
  const [componentClass, setComponentClass] = useState(defaultClass);
  const [filteredCurrencyData, setFilteredCurrencyData] = useState(props.data);
  const [isShowLiveChart, setIsShowLiveChart] = useState(true);
  const [isShowHistoricalChart, setIsShowHistoricalChart] = useState(true);
  const [isShowMetadata, setIsShowMetadata] = useState(true);

  useEffect(() => {

    document.addEventListener('click', handleClickOutside.bind(this), true);

    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickOutside = e => {
    let comp = document.getElementById(componentId);
    if(!comp) return;
    if(!comp.contains(e.target)) toggleDropdown(false);
  };

  const toggleDropdown = (state=null) => {
    let newState = state!==null?state:!isActive;
    setComponentClass(defaultClass+(newState?activeClass:''));
    setIsActive(newState);
  };

  const filterCurrencyData = (isLive,isHistorical,isGeneral) => {

    let filteredData = {};

    if(isLive&&isHistorical&&isGeneral) filteredData =  props.data;
    else if(isLive||isHistorical||isGeneral) 
      Object.keys(props.data).forEach(asset=>{
        let sources = props.data[asset]['sources'];
      
        // first line: check chart filter. second line: check metadata filter
        let isPassFilters = 
          ((isLive||isHistorical)&&(sources['alphavantage']!==undefined||sources['coinbase']!==undefined))||
          ((isGeneral)&&(sources['coinmarketcap']!==undefined||sources['coinmarketcap']!==undefined));

        if(isPassFilters) filteredData[asset]=props.data[asset];
      });

    setIsShowLiveChart(isLive);
    setIsShowHistoricalChart(isHistorical);
    setIsShowMetadata(isGeneral);
    setFilteredCurrencyData(filteredData);
  };

  const getComponent = () => {
    if(!props.data || !props.currency) return (
      <div className={defaultClass} id={componentId}>
        <div className="display"></div>
      </div>
    );

    let currency = props.currency;
    let title = currency['name']? (currency['name']+' ('+currency['symbol']+')'):currency['symbol'] ;
    let iconUrl = currency['iconUrl'];
    let price = props.price;
    let rank = currency['rank'];
    let marketCap = utils.shortenNumber(currency['market cap']);
    let priceChange = utils.round(currency['24h price change percentage']);
    let priceColor = utils.getPercentChangeColor(priceChange);
    let circulatingSupply = utils.shortenNumber(currency['circulating supply']);
    let totalSupply = utils.shortenNumber(currency['total supply']);
    let lastUpdated = currency['last updated'];
    let liveChart = currency['sources']['coinbase'];

    let assetHeader = 
      <div className="asset-section">
        <h2>{iconUrl?<img src={iconUrl} className="asset-icon" alt="icons"/>:''}{title}<span className="price">${price?price:'N/A'}</span></h2>
      </div>;

    let textSection = rank!==-1?
      <div className="text-section">
        <p>Rank: {rank?rank:'N/A'}</p>
        <p>Market Cap: {marketCap?marketCap:'N/A'}</p>
        <p>24hr Price Change: <span className={priceColor}>{priceChange}%</span></p>
        <p>Circulating Supply: {circulatingSupply?circulatingSupply:'N/A'}</p>
        <p>Total Supply: {totalSupply?totalSupply:'N/A'}</p>
        <p>Last Updated: {lastUpdated}</p>
        <p>Live Chart: <span className={liveChart?'green':''}>{liveChart?'On':'Off'}</span></p>
      </div>:'';

    let filterSection = 
      <div className="filter-section">
        <h3>Filters:</h3>
        <div className={"filter "+(isShowLiveChart?'active':'')} 
          onClick={()=>filterCurrencyData(!isShowLiveChart,isShowHistoricalChart,isShowMetadata)}>
          <span className="icon material-icons green">bar_chart</span>
          <span className="label">View Live Chart</span>
        </div>
        <div className={"filter "+(isShowHistoricalChart?'active':'')} 
          onClick={()=>filterCurrencyData(isShowLiveChart,!isShowHistoricalChart,isShowMetadata)}>
          <span className="icon material-icons">bar_chart</span>
          <span className="label">View Historical Chart</span>
        </div>
        <div className={"filter "+(isShowMetadata?'active':'')} 
          onClick={()=>filterCurrencyData(isShowLiveChart,isShowHistoricalChart,!isShowMetadata)}>
          <span className="icon material-icons">notes</span>
          <span className="label">View Metadata</span>
        </div> 
      </div>;

      let listValueSection = 
        <div className="list-section">
          { Object.keys(filteredCurrencyData).map(value => 
              <EntryAsset 
                key={'asset-entry'+value}
                data={filteredCurrencyData[value]} 
                isActive={props.currency['symbol']===value}
                isShowLiveChart={isShowLiveChart}
                isShowHistoricalChart={isShowHistoricalChart}
                isShowMetadata={isShowMetadata}
                handleSelect={props.handleSelect}
              />
          )}
        </div>;

      let bodySection = 
       <div className="body-section">
          {assetHeader}
          {textSection}
          {filterSection}
          {listValueSection}
        </div>;

      let headerSection = 
        <div className="header-section" onClick={(() => toggleDropdown())}>
          <h1>Select Asset</h1>  
          <span className="material-icons icon">{isActive? 'expand_less':'expand_more'}</span>
        </div>;

    return (
      <div className={componentClass} id={componentId}>
          {headerSection}
          {bodySection}
      </div>
    );
  };

  return getComponent();
}