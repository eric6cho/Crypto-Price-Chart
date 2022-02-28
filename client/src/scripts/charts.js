import { CrosshairMode,LineStyle } from 'lightweight-charts';

const RSI = 'RSI';
const MA = 'MA';
const VOLATILITY = 'Volatility';
const RVI = 'RVI';
const MACD = 'MACD';
const STOCH = 'Stoch';
const STOCHRSI = 'StochRSI';
const FEARANDGREED = 'Fear And Greed';
const HEIKINASHI = 'Heikin Ashi';
const PRICE = 'Price';
const VOLUME = 'Volume';

const transparent = 'rgba(0,0,0,0)';
const white = 'rgba(255, 255, 255, 1)';
const greenBar = 'rgba(30,185,130,1)';
const redBar = 'rgba(255,100,90,1)';
const greenBar1 = 'rgba(40,185,140,0.35)';
const redBar1 =  'rgba(255,110,100,0.35)';

const signalColor = 'rgba(200, 110, 50, 1)'; // orange line
const indicatorColor = 'rgba(110, 155, 255, 1)'; // blue line
const boundaryColor = 'rgba(180,90,255,0.35)'; // purple line
const histogramColor = 'rgba(250,150,255,0.3)';; // purple bar
const sma50DayColor = 'rgba(70, 120, 170, 0.7)'; // blue color
const sma200DayColor = 'rgba(80, 170, 130, 0.7)'; // green line
const sma350DayColor = 'rgba(255, 80, 70, 0.7)'; // red line
const supportBandColor = 'rgba(170, 170, 80, 0.7)'; // yellow line


// start config functions

const getHorizontalLineConfig = (margins,index='1',value =0) => ({
    color: boundaryColor,
    price: value,
    lineWidth: 1,
    axisLabelVisible:false,
    priceScaleId: index,
    scaleMargins: margins,
    lineStyle: LineStyle.Solid,
});


export const getupdatedConfig = (id) => ({ 
    width: document.getElementById(id).offsetWidth, 
    height: document.getElementById(id).offsetHeight,
});


export const getChartConfig = (id) => ({
    width: document.getElementById(id).innerWidth,
    height: document.getElementById(id).innerHeight,
    layout: {
        backgroundColor: transparent,
        textColor: white,
    },
    grid: {
        vertLines: { color: transparent },
        horzLines: { color: transparent },
    },
    crosshair: { mode: CrosshairMode.Normal },
    priceScale: { borderColor: transparent },
    timeScale: {
        borderColor: transparent,
        fixLeftEdge:true,
        fixRightEdge:true,
        minBarSpacing:3,
    },
});


export const getCandlestickConfig = (margins,index='0',precision=2) => ({
    upColor: greenBar,
    borderUpColor: greenBar,
    wickUpColor: greenBar,
    downColor: redBar,
    borderDownColor: redBar,
    wickDownColor: redBar,
    priceLineVisible: false,
    priceScaleId: index,
    priceFormat: {
        type: PRICE,
        precision: precision,
    },
    scaleMargins: margins,
});


export const getSeriesConfig = ( margins,index='0',color=white, thickness=2, isVolume=false) => ({
    color: color,
    lineWidth: thickness,
    priceLineVisible: false,
    priceScaleId: index,
    scaleMargins: margins,
    priceFormat: { type: isVolume ? VOLUME : PRICE },
});

// end config functions


// start data mapping functions

export const getCandleStickData = (data,title,precision) => {
    let parsedDates = Object.keys(data).filter(date => data[date][title]!==undefined);

    let parsedData = parsedDates.map(date => {
        let value = data[date][title];
        return {
            time : date,
            open : parseFloat(value['Open']),
            high : parseFloat(value['High']),
            low : parseFloat(value['Low']),
            close : parseFloat(value['Close']),
        }
    });

    return parsedData.filter(d => d).reverse();
};


export const getData = (data, title, entry, isMultiColorHistogram=false) => {
    let parsedDates = Object.keys(data).filter(date => data[date][title]!==undefined && data[date][title][entry]!==undefined);

    let parsedData = parsedDates.map(date => {
        let value = data[date][title];
        return {
            time : date,
            value : parseFloat(value[entry]),
            color: isMultiColorHistogram? (value[entry]>=0 ? greenBar1 : redBar1) : histogramColor
        };
    });
    
    return parsedData.filter(d => d).reverse();
};

// end data mapping functions


// start other functions

export const addResizeListener = (chart,id) => {
    window.addEventListener("resize",() => chart.applyOptions(getupdatedConfig(id)),false);
    
    // apply time scale
    let periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 5);

    let periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 2);

    chart.timeScale().setVisibleRange({
        from: (periodStart).getTime() / 1000,
        to: (periodEnd).getTime() / 1000,
    });
};


const getPrecision = data =>{
    let decimalPoints = Object.keys(data).map(date => {
        let closeStr = data[date]['Price']['Close'].toString();
        let decimalIndex = closeStr.indexOf('.');
        let decimalLength = decimalIndex === -1 ? 2 : closeStr.substring(decimalIndex+1).length;
        return decimalLength;
    });

    return Math.max.apply(Math, decimalPoints);
};


const getTopMargin = (indicatorLength) => {
    let bottomSpacing = 0.2;
    if(indicatorLength >2) bottomSpacing = 0.4;
    if(indicatorLength >4) bottomSpacing = 0.5;
    if(indicatorLength >7) bottomSpacing = 0.7;
    
    return {
        topSpace:0,
        top: 0.01,
        bottom: bottomSpacing,
    };
};


const getScaleMarginsFull = (indicators,index) => {
    let length  = indicators.length;
    let margins = getTopMargin(length);
  
    if(index===0 ) return margins;
  
    let topSpacing = 0.04;
    let remainingSpace = margins['bottom'];
    let indicatorSpace = remainingSpace / (length-1);

    let top = (1 - remainingSpace) + (indicatorSpace * (index - 1)) + topSpacing;

    return {
        topSpace : top - topSpacing,
        top: top,
        bottom: remainingSpace - (indicatorSpace * (index )),
    };
};


export const addIndicators = (chart,fullData,selectedIndicators) => {


    const getPriceSeries = (margins,index) => {   
        let SMA350LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma350DayColor,2));
        SMA350LineSeries.setData(getData(data, MA, '350 Day SMA'));
    
        let SMA200LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma200DayColor,2));
        SMA200LineSeries.setData(getData(data, MA, '200 Day SMA'));
        
        let SMA140LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,supportBandColor,2));
        SMA140LineSeries.setData(getData(data, MA, '140 Day SMA'));
        
        let EMA147LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,supportBandColor,2));
        EMA147LineSeries.setData(getData(data, MA, '147 Day EMA'));
        
        let SMA50LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma50DayColor,2));
        SMA50LineSeries.setData(getData(data, MA, '50 Day SMA'));
    
        let candleSeries = chart.addCandlestickSeries(getCandlestickConfig(margins,index));
        candleSeries.setData(getCandleStickData(data,PRICE,getPrecision(data)));
        
        seriesObject['Series']['Price 50 Day SMA'] = SMA50LineSeries;
        seriesObject['Series']['Price 140 Day SMA'] = SMA140LineSeries;
        seriesObject['Series']['Price 200 Day SMA'] = SMA200LineSeries;
        seriesObject['Series']['Price 350 Day SMA'] = SMA350LineSeries;
        seriesObject['Series']['Price 147 Day EMA'] = EMA147LineSeries;
        seriesObject['Series']['Price Candles'] = candleSeries;
        seriesObject['Margins'][index] = margins;
    };


    const getHeikinAshiSeries = (margins,index) => {
        let SMA350LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma350DayColor,2));
        SMA350LineSeries.setData(getData(data, MA, '350 Day SMA'));
    
        let SMA200LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma200DayColor,2));
        SMA200LineSeries.setData(getData(data, MA, '200 Day SMA'));
        
        let SMA140LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,supportBandColor,2));
        SMA140LineSeries.setData(getData(data, MA, '140 Day SMA'));
        
        let EMA147LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,supportBandColor,2));
        EMA147LineSeries.setData(getData(data, MA, '147 Day EMA'));
        
        let SMA50LineSeries = chart.addLineSeries(getSeriesConfig(margins,index,sma50DayColor,2));
        SMA50LineSeries.setData(getData(data, MA, '50 Day SMA'));
    
        let candleSeries = chart.addCandlestickSeries(getCandlestickConfig(margins,index));
        candleSeries.setData(getCandleStickData(data,HEIKINASHI,getPrecision(data)));
        
        seriesObject['Series']['Heikin Ashi 50 Day SMA'] = SMA50LineSeries;
        seriesObject['Series']['Heikin Ashi 140 Day SMA'] = SMA140LineSeries;
        seriesObject['Series']['Heikin Ashi 200 Day SMA'] = SMA200LineSeries;
        seriesObject['Series']['Heikin Ashi 350 Day SMA'] = SMA350LineSeries;
        seriesObject['Series']['Heikin Ashi 147 Day EMA'] = EMA147LineSeries;
        seriesObject['Series']['Heikin Ashi Candles'] = candleSeries;
        seriesObject['Margins'][index] = margins;
    };


    const getVolumeSeries = (margins,index) => {
        let volumeSeries = chart.addHistogramSeries(getSeriesConfig(margins,index,histogramColor,1,true));
        volumeSeries.setData(getData(data,'Volume','Value'));
        
        seriesObject['Series']['Volume'] = volumeSeries;
        seriesObject['Margins'][index] = margins;
    };


    const getVolatilitySeries = (margins,index) => {
        let volatilityHistogramSeries = chart.addHistogramSeries(getSeriesConfig(margins,index,histogramColor,1,true));
        volatilityHistogramSeries.setData(getData(data,VOLATILITY,'High Low',true));

        let signalLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        signalLineSeries.setData(getData(data,VOLATILITY,'Signal'));

        let boundaryValues = [-20,-12,0,12,20];
        addBoundaryLines(signalLineSeries,boundaryValues,margins,index);

        seriesObject['Series']['Volatility High Low'] = volatilityHistogramSeries;
        seriesObject['Series']['Volatility Signal'] = signalLineSeries;
        seriesObject['Margins'][index] = margins;
    };
 

    const getRSISeries = (margins,index) => {
        let RSILineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        RSILineSeries.setData(getData(data, '14 Day RSI', RSI));

        let boundaryValues = [20,30,50,70,80];
        addBoundaryLines(RSILineSeries,boundaryValues,margins,index);

        seriesObject['Series']['RSI Value'] = RSILineSeries;
        seriesObject['Margins'][index] = margins;
    };

   
    const getStochSeries = (margins,index) => {
        let signalLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,signalColor,2));
        signalLineSeries.setData(getData(data, '5 Day Stoch', 'StochSlowD'));

        let stochLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        stochLineSeries.setData(getData(data, '5 Day Stoch', 'StochSlowK'));
    
        let boundaryValues = [20,30,50,70,80];
        addBoundaryLines(stochLineSeries,boundaryValues,margins,index);
        
        seriesObject['Series']['Stoch Value'] = stochLineSeries;
        seriesObject['Series']['Stoch Signal'] = signalLineSeries;
        seriesObject['Margins'][index] = margins;
    };
   

    const getStochRSISeries = (margins,index) => {
        let signalLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,signalColor,2));
        signalLineSeries.setData(getData(data, '14 Day StochRSI', 'StochRSISlowD'));

        let stochRSILineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        stochRSILineSeries.setData(getData(data, '14 Day StochRSI', 'StochRSISlowK'));

        let boundaryValues = [20,30,50,70,80];
        addBoundaryLines(stochRSILineSeries,boundaryValues,margins,index);

        seriesObject['Series']['StochRSI Value'] = stochRSILineSeries;
        seriesObject['Series']['StochRSI Signal'] = signalLineSeries;
        seriesObject['Margins'][index] = margins;
    };
    

    const getMACDSeries = (margins,index) => {
        let histogramSeries = chart.addHistogramSeries(getSeriesConfig(margins,index,histogramColor));
        histogramSeries.setData(getData(data,'26 Day MACD','Histogram',true));
    
        let signalLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,signalColor,2));
        signalLineSeries.setData(getData(data, '26 Day MACD', 'Signal'));
    
        let MACDLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        MACDLineSeries.setData(getData(data, '26 Day MACD', MACD));
    
        seriesObject['Series']['MACD Value'] = MACDLineSeries;
        seriesObject['Series']['MACD Signal'] = signalLineSeries;
        seriesObject['Series']['MACD Histogram'] = histogramSeries;
        seriesObject['Margins'][index] = margins;
    };
    

    const getRVISeries = (margins,index) => {
        let signalLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,signalColor,2));
        signalLineSeries.setData(getData(data, '10 Day RVI', 'Signal'));
    
        let RVILineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        RVILineSeries.setData(getData(data, '10 Day RVI', RVI));
    
        let boundaryValues = [0];
        addBoundaryLines(RVILineSeries,boundaryValues,margins,index);
      
        seriesObject['Series']['RVI Value'] = RVILineSeries;
        seriesObject['Series']['RVI Signal'] = signalLineSeries;
        seriesObject['Margins'][index] = margins;
    };
    

    const getFearAndGreedSeries = (margins,index) => {
        let fearAndGreedLineSeries = chart.addLineSeries(getSeriesConfig(margins,index,indicatorColor,2));
        fearAndGreedLineSeries.setData(getData(data, 'Fear and Greed', 'Value'));
    
        let boundaryValues = [15,50,85];
        addBoundaryLines(fearAndGreedLineSeries,boundaryValues,margins,index);
    
        seriesObject['Series']['Fear And Greed Value'] = fearAndGreedLineSeries;
        seriesObject['Margins'][index] = margins;
    };


    const getSeries = (indicator,margins,index) => {
        if(indicator===PRICE) getPriceSeries(margins,index);
        else if(indicator===HEIKINASHI) getHeikinAshiSeries(margins,index);
        else if(indicator===VOLUME) getVolumeSeries(margins,index);
        else if(indicator===VOLATILITY) getVolatilitySeries(margins,index);
        else if(indicator===RSI) getRSISeries(margins,index);
        else if(indicator===STOCH) getStochSeries(margins,index);
        else if(indicator===STOCHRSI) getStochRSISeries(margins,index);
        else if(indicator===MACD) getMACDSeries(margins,index);
        else if(indicator===RVI) getRVISeries(margins,index);
        else if(indicator===FEARANDGREED) getFearAndGreedSeries(margins,index);
    };


    let data = fullData['data'];
    let margins = {top:0.02,bottom:0.5};
    let seriesObject = {};
    seriesObject['Series'] = {};
    seriesObject['Margins'] = {};

    selectedIndicators.forEach((indicator,index) => {
        margins = getScaleMarginsFull(selectedIndicators,index);
        getSeries(indicator, margins,index); // change for iteration
    });

    addResizeListener(chart,"chart");
 
    return seriesObject;
};


export const addBoundaryLines = (series,values,margins,index) => 
    values.map(value => series.createPriceLine(getHorizontalLineConfig(margins,index,value)));