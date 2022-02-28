import React, { useState, useEffect, useRef } from "react";

import { createChart } from 'lightweight-charts';

import * as charts from '../scripts/charts'; 
import * as utils from '../scripts/utils';

import './../styles/comp-chart.scss';

export default function Chart(props) {

    const chartId = 'chart';

    const [data, setData] = useState(props.data);
    const [price, setPrice] = useState(props.price);
    const [indicators, setIndicators] = useState(props.indicators);
    const [labelsMarkup, setLabelsMarkup] = useState(null);

    let chart = useRef(null);
    let series = useRef(null);
    let margins = useRef(null);

    useEffect(() => {
  
        setData(props.data);
        setPrice(props.price);
        setIndicators(props.indicators);

        // return if data is null or charts were made
        if (!price || !data || Object.keys(data).length===0) return;

        if(!series.current){
            // initial chart load
            chart.current = createChart(chartId, charts.getChartConfig(chartId));
            updateSeries();
        }
        else{

            if(props.data['symbol']!==data['symbol'] || !areListsEqual(props.indicators, indicators)){
                // either asset or indicator has changed
                /*
                let message = props.data['symbol']===data['symbol'] ? 
                    ('change indicators for '+data['symbol'] ) :
                    ('change pair: '+data['symbol']+' -> '+props.data['symbol']);
    
                console.log(message);
                */
                Object.keys(series.current).map(title => chart.current.removeSeries(series.current[title]));
               
                setLabelsMarkup(null); // remove labels
                updateSeries();
            }
            else{
                // candle price has changed
                let isPrice = props.indicators.indexOf('Price')!==-1;
                let isHeikin = props.indicators.indexOf('Heikin Ashi')===-1;
                
                if(!isPrice && !isHeikin) return;
    
                let candleTitle = isPrice? 'Price' : 'Heikin Ashi';
                let indicatorData = props.data['data'];
                let today = Object.keys(indicatorData)[0];
                let todayCandle = indicatorData[today][candleTitle];
                let updatedCandleData = getUpdatedCandle(todayCandle,today,props.price);
               
                series.current[candleTitle+' Candles'].update(updatedCandleData);
            }
        }
     
        return () => {};

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);
    

    const addLabels = () => {
        let titles = props.indicators;
        let chartHeight = document.querySelector('#'+chartId).offsetHeight;

        let labels = Object.keys(margins.current).map(i => {
            let style = {
                'top' : ((margins.current[i]['topSpace']*chartHeight)+(parseInt(i)===0?15:0))+'px',
                'left' : '15px',
            };

            return(
                <div className="chart-label" key={"margin-"+i} style={style}>
                    {parseInt(i)===titles.length?'Scores' : titles[i]}
                </div>
            ); 
        });        
      
        setLabelsMarkup(labels);
    };


    const updateSeries = () => {
        let SeriesAndMargins = charts.addIndicators(chart.current,props.data,props.indicators);
        series.current = SeriesAndMargins['Series'];
        margins.current = SeriesAndMargins['Margins'];
        
        addLabels();

        window.addEventListener('resize', event=>{
            setLabelsMarkup(null); // remove labels
            addLabels();
        },true);
    };


    const areListsEqual = (list1,list2) => {
        if(list1.length!==list2.length) return false;
        let boolList = list1.map((item,i)=>list1[i]===list2[i]);
        return boolList.indexOf(false)===-1;
    };


    const getUpdatedCandle = (candle,date,price) => ({
        'close': price,
        'high': candle.High,
        'low': candle.Low,
        'open': candle.Open,
        'time': {
            'year': utils.getYear(date),
            'month': utils.getMonth(date),
            'day': utils.getDay(date),
        }
    });


    const getComponent = () => (
        <div className="component chart">
            <div className="chart-panel" id={chartId}>{labelsMarkup}</div>
        </div>
    );

    return getComponent();
}