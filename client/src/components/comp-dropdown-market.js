import React, { useState, useEffect } from "react";
import './../styles/comp-dropdown.scss';
import * as utils from '../scripts/utils'; 

export default function DropdownMarket(props) {

  const componentId = 'dropdown-market';
  const defaultClass = 'component dropdown '+componentId+' ';
  const activeClass = 'active ';

  const [data, setData] = useState(props.data);
  const [isActive, setIsActive] = useState(false);
  const [componentClass, setComponentClass] = useState(defaultClass);

  useEffect(() => {

    setData(props.data);
    
    document.addEventListener('click', handleClickOutside.bind(this), true);
    
    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);
  
  const handleClickOutside = e => {
    if (!document.getElementById(componentId).contains(e.target)) 
      toggleExpand(false);
  };

  const toggleExpand = (state=null) => setExpand(state!==null?state:!isActive);

  const setExpand = (state) => {
    setComponentClass(defaultClass+(state?activeClass:''));
    setIsActive(state);
  };

  const getTextGroup = (header,value,change=null) => {
    let textChange = change?<span className={"change "+utils.getPercentChangeColor(change)}>{utils.round(change)}%</span>:null;
    return (
      <p>
        <span className="header">{header}: </span>
        <span className="value">{value}</span>
        {textChange}
      </p>
    );
  }

  const getComponent = () => {

    if(!data)
      return (<div className={defaultClass} id={componentId}><p>Data is loading</p></div>);
    
    let globalData = data;
    let totalMarketCap = globalData['total market cap'];
    let altMarketCap = globalData['alt market cap'];
    let btcDom = globalData['btc dominance'];
    let btcDomChange = globalData['btc dominance change'];
    let ethDom = globalData['eth dominance'];
    let ethDomChange = globalData['eth dominance change'];
    
    let textSection = 
      <div className='text-section'>
        {getTextGroup('Total Market Cap','$'+utils.shortenNumber(totalMarketCap))}
        {getTextGroup('Alt Market Cap','$'+utils.shortenNumber(altMarketCap))}
        {getTextGroup('BTC Dominance',utils.round(btcDom)+'%',btcDomChange)}
        {getTextGroup('ETH Dominance',utils.round(ethDom)+'%',ethDomChange)}
        {getTextGroup('Next Update',utils.getTimeUntilTomorrow())}
      </div>;

    let bodySection = 
      <div className="body-section">
        {textSection}
      </div>;

    let headerSection = 
      <div className="header-section" onClick={(() => toggleExpand())}>
        <h1>Market Data</h1>  
        <span className="material-icons icon">{isActive?'expand_more':'expand_less'}</span>
      </div>;

    return (
      <div className={componentClass} id={componentId}>
        {bodySection}
        {headerSection}
      </div>
    );
  };

  return getComponent();
}