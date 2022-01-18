import React, { useState, useEffect, useRef } from "react";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import './../styles/comp-indicator.scss';

export default function AssetSelector(props) {

  const [dropdownListOpen, setDropdownListOpen] = React.useState(null);
  const [dropdownValueClasses, setDropdownValueClasses] = React.useState(null);
  const [dropdownListClasses, setDropdownListClasses] = React.useState(null);

  useEffect(() => {
    
    setDropdownListOpen(false);
    setDropdownListClasses('value-list');
    setDropdownValueClasses('selected-value');
    document.addEventListener('click', handleClickOutside.bind(this), true);

    return () => {};

  }, []);

  const toggleDropdown = () => {
    setDropdownListClasses('value-list '+(!dropdownListOpen ? 'active' : ''));
    setDropdownValueClasses('selected-value '+(!dropdownListOpen ? 'active' : ''));
    setDropdownListOpen(!dropdownListOpen);
  };

  const handleClickOutside = e => {
    let component = document.getElementById('asset-selector');
    if (component.contains(e.target)) return;
    setDropdownListClasses('value-list');
    setDropdownValueClasses('selected-value');
    setDropdownListOpen(false);
  };

  const formatPrice = price => {
    if(!price || price===undefined) return;
    let priceString = price.toString();
    let decimalindex = priceString.indexOf('.');

    if(decimalindex===-1 || decimalindex===priceString.length-1)
        return '$'+parseFloat(price).toFixed(2);
    
    return '$'+price;
  }

  const formatPair = pair => {
      return pair;
  };

  const getDropdownValue = (value,i) => (
    <div className="value" key={i} onClick={props.handleSelect}>{formatPair(value.id)}</div>
  );


  const getPrice = price => 
    price === undefined ? (
      <div className="row-2">
        <p>Price is loading</p>
      </div>
    ):(
      <div className="row-2">
          <h2>{formatPrice(props.currentData.price)}</h2>
          <p>0.00%</p>
      </div>
    );


  const getComponent = () => {
    
    return (
        <div className="component asset-selector" id="asset-selector">
            <div onClick={((e) => toggleDropdown(e, props.data))}>
                <div className={dropdownValueClasses}> 
                    <div className="icon-container">
                        {dropdownListOpen?<KeyboardArrowDownIcon/>:<KeyboardArrowUpIcon/>}
                    </div>
                    <div className="row-1">
                        <h2>{formatPair(props.pair)}</h2>
                    </div>
                    {getPrice(props.currentData.price)}
                    <div className={dropdownListClasses}>
                        {props.currencies.map((value, i) => getDropdownValue(value,i))}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return getComponent();
}