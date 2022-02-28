import React, { useState, useEffect } from "react";
import './../styles/comp-entry.scss';

export default function EntryIndicator(props) {

  const componentId = 'entry-indicator-'+(props.title).toLowerCase().replaceAll(' ','-');
  const defaultClass = 'component entry entry-indicator ';
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
    if(type==='text')toggleDropdown();
    if(type==='chart')props.handleSelect(title);
  };


  const getIndicatorText = () => 
    Object.keys(props.data).map(title => 
      (title==='Metadata')?null:
        <div key={'indicator-text-'+title} className="text-subsection-1">
          <h3>{title}</h3>
          {
            (title!=='Signals') ? 
              <p>{props.data[title]}</p> :

              Object.keys(props.data[title]).map(signal=>
                <div key={'indicator-'+title+'-'+signal} className='text-subsection-2'>
                  <h4>{signal}</h4>
                  <p>{props.data[title][signal]}</p>
                </div>
              )
          }
        </div>
    );


  const getComponent = () => {
    let title = props.title;
    let iconClasses = 'icon material-icons ';
    let chartIconText = props.isActiveChart?'remove':'add';
    let chartIcon = <span className={iconClasses} onClick={() => handleClick(title,'chart')}>{chartIconText}</span>;
    let expandIcon = <span className={iconClasses} onClick={() => handleClick(title,'text')}>notes</span>;

    let headerSection = 
      <div className="entry-header-section" onClick={() => handleClick(title,'chart')}>
        <h4>{title}</h4>
      </div>;

    let dataSection = 
      <div className="entry-text-section">
        {getIndicatorText()}
      </div>;

    let iconSection = 
      <div className="entry-icon-section">
          {chartIcon}
          {expandIcon}
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