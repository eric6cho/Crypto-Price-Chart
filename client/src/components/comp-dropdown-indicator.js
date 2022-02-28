import React, { useState, useEffect } from "react";
import EntryIndicator from "./comp-entry-indicator";
import './../styles/comp-dropdown.scss';

export default function IndicatorList(props) {

  const componentId = 'dropdown-indicator';
  const defaultClass = 'component dropdown '+componentId+' ';
  const activeClass = 'active ';

  const [isActive, setIsActive] = useState(false);
  const [summaryText, setSummaryText] = useState(null);
  const [componentClass, setComponentClass] = useState(defaultClass);

  useEffect(() => {
    
    setSummaryText(getSummaryText());

    document.addEventListener('click', handleClickOutside.bind(this), true);

    return () => {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.activeIndicators]);


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


  const getSummaryText = () => {
      let titles = !props.activeIndicators ? [] : props.activeIndicators;
      let length = titles.length;
      if(length===0) return 'None'
      else if(length===1) return titles[0];
      else if(length===2) return titles[0]+' and '+titles[1];
      else return titles[0]+', '+titles[1]+', and '+(length-2)+' more'; 
  };


  const getComponent = () => {
    if(!props.data) return (
      <div className={defaultClass} id={componentId}>
        <div className="display"></div>
      </div>
    );

    let summarySection = 
      <div className="text-section">
        <p>{summaryText}</p>
      </div>;

    let listValueSection = 
      <div className="list-section">
        { Object.keys(props.data).map(value => 
          <EntryIndicator 
            key={'indicator-entry-'+value}
            isActiveChart={(props.activeIndicators).includes(value)}
            title={value}
            data={props.data[value]} 
            handleSelect={props.handleSelect}
          />
        )}
      </div>;

    let bodySection = 
      <div className="body-section">
        {summarySection}
        {listValueSection}
      </div>;

    let headerSection = 
      <div className="header-section" onClick={(() => toggleDropdown())}>
        <h1>Indicators</h1>  
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