import React, { useState, useEffect } from "react";
import './../styles/comp-entry.scss';
import * as utils from '../scripts/utils'; 

export default function EntryAsset(props) {

  const componentId = 'entry-asset-'+props.data['symbol'];
  const defaultClass = 'component entry entry-asset ';
  const activeClass = 'active ';

  const [isActive, setIsActive] = useState(props.isActive);
  const [componentClass, setComponentClass] = useState(defaultClass);

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
    

  const handleClick = (title,type=null) => {
    toggleDropdown();
    if(!type || type==='chart') props.handleSelect(title);
  };

  
  const getComponent = () => {
    
    let data = props.data;

    let symbol = data['symbol'];
    let price = data['price'];
    let rank = data['rank'];
    let lastUpdated = data['last updated'];
    let marketCap = utils.shortenNumber(data['market cap']);
    let priceChange = utils.round(data['24h price change percentage']);
    let priceColor = utils.getPercentChangeColor(priceChange);
    let circulatingSupply = utils.shortenNumber(data['circulating supply']);
    let totalSupply = utils.shortenNumber(data['total supply']);

    let sources = data['sources'];
    let isAV = sources['alphavantage']!==undefined;
    let isCB = sources['coinbase']!==undefined;
    let isCMC = sources['coinmarketcap']!==undefined;
    let isCG = sources['coingecko']!==undefined;

    let iconClass = "icon material-icons ";
    let greenIconClass = iconClass+'green';
    let notesIcon = isCMC||isCG?'notes':'';
    let barIcon = isAV||isCB?'bar_chart':'';

    let textIcon = <span className={iconClass} onClick={()=>handleClick(symbol,'text')}>{notesIcon}</span>;
    let chartIcon = <span className={iconClass} onClick={()=>handleClick(symbol,'chart')}>{barIcon}</span>;
    let liveChartIcon = <span className={greenIconClass} onClick={()=>handleClick(symbol,'chart')}>{barIcon}</span>;

    textIcon = props.isShowMetadata?textIcon:'';
    chartIcon = props.isShowHistoricalChart?chartIcon:'';
    liveChartIcon = props.isShowLiveChart?liveChartIcon:'';

    if(props.isShowLiveChart&&isCB) chartIcon=liveChartIcon;

    let headerSection = 
      <div className="entry-header-section" onClick={() => handleClick(symbol)}>
        <span className="rank">{rank!==-1?rank:'---'}</span>  
        <span className="symbol">{symbol}</span>  
        {price?
          <span className="price">${price<0.01?price:utils.round(price)}<span className={priceColor}>{priceChange}%</span></span> :
          <span className="price">---<span>---</span></span>
        } 
      </div>;

    let dataSection = 
      <div className="entry-text-section">
        <p>Price: ${price?price:'N/A'} <span className={priceColor}>{priceChange}%</span></p>
        <p>Market Cap: {marketCap?marketCap:'N/A'}</p>
        <p>Circulating Supply: {circulatingSupply?circulatingSupply:'N/A'}</p>
        <p>Total Supply: {totalSupply?totalSupply:'N/A'}</p>
        <p>Last Updated: {lastUpdated}</p>
      </div>;

    let iconSection = 
      <div className="entry-icon-section">
        {chartIcon}
        {textIcon}
      </div>;

    return (
      <div className={componentClass} id={componentId}>
        {headerSection}
        {dataSection}
        {iconSection}
      </div>
    );

  };

  return getComponent();
}