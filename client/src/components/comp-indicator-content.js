import React, { useState, useEffect, useRef } from "react";
import IndicatorChart from "./comp-indicator-chart";
import * as charts from './../scripts/charts'; 
import './../styles/comp-indicator.scss';

export default function Indicator(props) {

  const [data, setData] = React.useState(null);
  const [currentData, setCurrentData] = useState({});
  const [title, setTitle] = React.useState(null);
  const [classes, setClasses] = React.useState(null);
  const [chartId, setChartId] = React.useState(null);
  const [indicators, setIndicators] = React.useState(null);
  const [descriptionMarkup, setDescriptionMarkup] = React.useState(null);
  const [IndicatorTextMarkup, setIndicatorTextMarkup] = React.useState(null);

  let first = useRef(false);

  const getTextSubsection = (title, innerMarkup) => (
    <div className={"text-subsection "+title}>
      <h3 className="title-3">{title}</h3>
      {innerMarkup}
    </div>
  );

  useEffect(() => {

      //console.log(props.title,'indicator on init'  );

      setTitle(props.title);
      setClasses('component indicator '+(props.title?props.title:'')+' '+(props.classes?props.classes:''));
      setIndicators(props.title === 'Price' ? [props.title,'SMA','EMA'] : [props.title]);
      setChartId(props.title + '-chart-container');
      
      first.current = true;

      let indicatorData = props.indicatorData.Indicators;
      
      Object.keys(indicatorData).map(title=>{
        if(title===props.title){

          setDescriptionMarkup([
            getTextSubsection('Description',<p>{indicatorData[title]['Description']}</p>),
            getTextSubsection('Notes',<p>{indicatorData[title]['Notes']}</p>),
            getTextSubsection('Interpretation',<p>{indicatorData[title]['Interpretation']}</p>)
          ]);
       
          let indicatorObject = indicatorData[title]['Signals'];
          
          setIndicatorTextMarkup(
            Object.keys(indicatorObject).map(title => 
              <div className="indicator-entry">
                <h4 className="title-4">{title}</h4>
                <p>{indicatorObject[title]}</p>
              </div>
            ));
  
        }
      });
      
      first.current = true;
  
    return () => {};

  }, [props.classes, props.data, props.indicatorData, props.title, title]);
  
  useEffect(() => {

    if (!first.current) return;
    
    //console.log(props.title,'indicator on change'  );
    //console.log(props.currentData.price);

    setData(props.data);
    setCurrentData(props.currentData);

  }, [props.currentData, props.data, props.title]);

  const getTextSection = () => {
  
    let sampleEntryValue = ( 
      <div className="entry-value">
        <h4 className="title-4 entry">Indicator 1</h4>
        <p className="numerical-value value">100</p>
      </div>
    );


    let sampleSummary = (
      <div>
        {sampleEntryValue}
        {sampleEntryValue}
        {sampleEntryValue}
      </div>
    );

    return (
      <div className="text-section"> 
          {getTextSubsection('Summary', sampleSummary)}
          {descriptionMarkup}
          {getTextSubsection('Signals', IndicatorTextMarkup)} 
      </div>
    );
  };

  const getVisualSection = () => {
 

    let defaultFunction = () => console.log('bruh what the heck');
    
    let fcn = defaultFunction;

    
    if(title==='Price') fcn = charts.addIndicatorSMA;
    if(title==='Volatility') fcn = charts.addVolatility;
    if(title==='RSI') fcn = charts.addIndicatorRSI;
    if(title==='RVI') fcn = charts.addIndicatorRVI;
    if(title==='MACD') fcn = charts.addIndicatorMACD;
    if(title==='Stoch') fcn = charts.addIndicatorStoch;
    if(title==='StochRSI') fcn = charts.addIndicatorStochRSI;
    if(title==='Fear And Greed') fcn = charts.addFearAndGreed;


    return (
      <div className="visual-section">
        <div className="graph-view" id={chartId}></div> 
        <IndicatorChart asset={props.asset} data={props.data} currentData={props.currentData} chartId={chartId} indicatorFcn={fcn} chartType={title}/>
      </div>
    );
  };

  const getComponent = () => {
    //if(!data || !title || !indicators || !classes || !chartId){ 
      if(!data || !title || !classes || !chartId){ 
      return (
        <div className='component indicator' id={title}>
           <div className="text-section"> 
            <div className="text-subsection summary">
              <h3 className="title-3">Summary</h3>
              <p>Data for this indicator is being loaded. Please wait.</p>
            </div>
          </div>
        </div>
      );
    }
 
    return (
      <div className={classes} id={title}>
        <div className="indicator-title">
          <h2 className="title-2 text-section-title component-title">{title}</h2>
        </div>
          {getVisualSection()}
          {getTextSection()}
      </div>
    );
  };

  return getComponent();
}