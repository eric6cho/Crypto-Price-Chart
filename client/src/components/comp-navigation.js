import React from "react";
import AssetSelector from "./comp-asset-selector";
import './../styles/comp-navigation.scss';

export default function Navigation(props) {

  const [appTitle, setAppTitle] = React.useState(null);
  const [indicatorTitles, setIndicatorTitles] = React.useState(null);

  React.useEffect(() => {

    setAppTitle(props.appTitle);
    setIndicatorTitles(props.indicatorTitles);

  },[props.appTitle,props.indicatorTitles]);

  const getAssetSelector = () => {
    return props.assetSelector;
  };

  const getTextSection = () => {
    
    let titleSections = indicatorTitles.map(title => (
      <a className="title-section" href={'#'+title}>
        <div className="indicator-bar"></div>
        <h4>{title}</h4>
      </a>
    ));

    return (
      <div className="text-section"> 
        <h1>{appTitle}</h1>
        {titleSections}
      </div>
    );
  };

  const getComponent = () => {
    if(!indicatorTitles || !appTitle) 
      return (<div className="text-section"></div>);

    return (
    <div className="navigation">
      {getTextSection()}
      {getAssetSelector()}
    </div>);
  };

  return getComponent();
}