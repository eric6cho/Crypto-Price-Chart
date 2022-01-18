import React, { useState, useEffect, useRef } from "react";
import { createChart } from 'lightweight-charts';
import * as charts from './../scripts/charts'; 
import * as dates from './../scripts/dates';

export default function IndicatorChart(props) {

    const [chart, setChart] = React.useState(null);
    const [data, setData] = React.useState(props.data);
    const [asset, setAsset] = React.useState(null);

    const addIndicatorToChart = (addIndicator,chart,data) => addIndicator(chart,data);

    const getPrecision = data =>{
        let decimalPoints = Object.keys(data).map(date => {
            let closeStr = data[date]['Close'].toString();
            
                let decimalIndex = closeStr.indexOf('.');
                let decimalLength = decimalIndex === -1 ? 2 : closeStr.substring(decimalIndex+1).length;
            
                console.log(decimalLength)
                return decimalLength;
        });
console.log(Math.max.apply(Math, decimalPoints))
        return Math.max.apply(Math, decimalPoints);
    };

    let first = useRef(false);
    let priceCandleSeries = useRef(null);
    let scoreSeries = useRef(null);
    let indicatorSeries = useRef(null);

    useEffect(() => {
  
        let chartId = props.chartId;
        let priceData = props.data.prices;
        let indicatorData = props.data.indicators;
        let scoreData = props.data.scores;

        // null checks
        if(charts.chartNullCheck(priceData,chart,chartId)) return;

        let primaryChart = createChart(chartId, charts.getChartConfig(chartId));

        indicatorSeries.current = addIndicatorToChart(props.indicatorFcn, primaryChart,indicatorData);
    
        // place price graph at the top of the chart
        priceCandleSeries.current = primaryChart.addCandlestickSeries(charts.getCandlestickConfig());
        priceCandleSeries.current.setData(charts.getCandleStickData(priceData,getPrecision(priceData)));



        console.log(props.chartType);
        console.log(scoreData);

        // place scores at the bottom of the chart
        scoreSeries.current = primaryChart.addHistogramSeries(charts.getScoreHistogramConfig());        
        scoreSeries.current.setData(charts.getScoreData(scoreData,props.chartType));

        charts.addResizeListener(primaryChart,chartId);

        setChart(primaryChart);
        setAsset(props.data.pair);
        setData(props.data);

        first.current = true;

        return () => {};

    }, [chart, props.data, props.chartId, props.indicatorFcn, props.currentData, props.chartType]);

    useEffect(() => {
        
        if (!first.current) return;

        // null checks
        if(!props.data || !props.currentData || !indicatorSeries.current) return;
       
        let priceData = props.data.prices;
        let scoreData = props.data.scores;

        if(props.data.pair!==data.pair && props.data.pair && data.pair){
            
            console.log('change pair from', data.pair,'to',props.data.pair);
            
            priceCandleSeries.current.setData(charts.getCandleStickData(priceData,getPrecision(priceData)));



            scoreSeries.current.setData(charts.getScoreData(scoreData,props.chartType));

            let indicatorData = props.data.indicators; 
            
            Object.keys(indicatorSeries.current).map(title => {
                chart.removeSeries(indicatorSeries.current[title]);
            });
                
            indicatorSeries.current = addIndicatorToChart(props.indicatorFcn, chart, indicatorData);
        }
        else{
            
            let mostRecentData = priceData[Object.keys(priceData)[0]];
            let mostRecentDate = Object.keys(priceData)[0];

            let updatedCandleData = {
                'close': mostRecentData.Close,
                'high': mostRecentData.High,
                'low': mostRecentData.Low,
                'open': mostRecentData.Open,
                'time': {
                    'year': dates.getYear(mostRecentDate),
                    'month': dates.getMonth(mostRecentDate),
                    'day': dates.getDay(mostRecentDate),
                }
            }

            priceCandleSeries.current.update(updatedCandleData);
        }
         
        setAsset(props.data.pair);
        setData(props.data);

    }, [props.data, props.chartId, props.asset, asset, data, props.currentData, props.indicatorFcn, chart, props.chartType]);

    return null;
}