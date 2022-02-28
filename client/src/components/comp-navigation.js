import React, { useState, useEffect } from "react";
import DropdownAsset from "./comp-dropdown-asset";
import DropdownMarket from "./comp-dropdown-market";
import Dropdownindicator from "./comp-dropdown-indicator";
import './../styles/comp-navigation.scss';

export default function Navigation(props) {

  const componentId = 'navigation';
  const defaultClass = 'component '+componentId+' ';
  const activeClass = 'active ';

  const [isActive, setIsActive] = useState(false);
  const [componentClass, setComponentClass] = useState(defaultClass);

  useEffect(() => {

    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  


  const toggleExpand = (state=null) => setExpand(state!==null?state:!isActive);

  const setExpand = (state) => {
    setComponentClass(defaultClass+(state?activeClass:''));
    setIsActive(state);
  };

  const getComponent = () => {

    let assetSection = 
      <DropdownAsset
        data={props.currencyData}
        currency={props.activeCurrency}
        price={props.currentPrice} 
        handleSelect={props.handleAssetSelect} 
      />;

    let indicatorSection = 
      <Dropdownindicator
        data={props.indicatorData}
        activeIndicators={props.activeIndicators}
        handleSelect={props.handleIndicatorSelect}
      />;

    let marketSection = 
      <DropdownMarket 
        data={props.globalData}
      />;


    let bodySection = 
    <div className="nav-body-section">
      {assetSection}
      {indicatorSection}
      {marketSection}
    </div>;

    let headerSection = 
      <div className="nav-header-section" onClick={(() => toggleExpand())}>
        <h1>Menu</h1>  
        <span className="material-icons icon">{isActive?'expand_more':'expand_less'}</span>
      </div>;

    return (
      <div className={componentClass}>
        {bodySection}
        {headerSection}
      </div>
    );
  }

  return getComponent();
}