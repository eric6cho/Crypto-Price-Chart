import { CrosshairMode } from 'lightweight-charts';

export const RSI = 'RSI';
export const SMA = 'SMA';
export const EMA = 'EMA';
export const RVI = 'RVI';
export const MACD = 'MACD';
export const STOCH = 'Stoch';
export const STOCHRSI = 'StochRSI';
export const FEARANDGREED = 'Fear And Greed';

// grid background
export const transparent = 'rgba(0,0,0,0)';

// white text
export const white = 'rgba(255, 255, 255, 1)';

// line colors
export const purpleLine = 'rgba(180,90,255,0.5)';
export const orangeLine = 'rgba(232, 141, 77, 0.7)';
export const blueLine = 'rgba(80,135,255, 0.7)';
export const whiteLine = 'rgba(255,255,255,0.7)';
export const yellowLine = 'rgba(250, 250, 122, 0.7)';
export const greenLine = 'rgba(4, 250, 122, 0.7)';
export const redLine = 'rgba(255,100,90,0.7)';


// bar colors
export const blueBar = 'rgba(80,135,255,0.5)';
export const orangeBar = 'rgba(232, 141, 77,0.5)';
export const purpleBar = 'rgba(180,90,255,0.35)';
export const greenBar = 'rgba(30,185,130,1)';
export const redBar = 'rgba(255,100,90,1)';
export const greenBar1 = 'rgba(30,185,130,0.7)';
export const redBar1 =  'rgba(255,100,90,0.7)';
export const greenBar2 = 'rgba(30,185,130,0.35)';
export const redBar2 =  'rgba(255,100,90,0.35)';

let signalColor = orangeLine;
let indicatorColor = blueLine;
let boundaryColor = purpleLine;
let histogramColor = purpleBar;
let sma50DayColor = blueLine;
let sma200DayColor = greenLine;
let sma350DayColor = redLine;

let supportBandColor = yellowLine;



// start config functions

const topScaleMargins = {
    top: 0.05,
    bottom: 0.5,
};

const midScaleMargins = {
    top: 0.55,
    bottom: 0.25,
};

const bottomScaleMargins = {
    top: 0.8,
    bottom: 0.02,
};

const horizontalLineConfig = {
    color: boundaryColor,
    lineWidth: 1,
    priceLineVisible: false,
    

    crosshairMarkerRadius: 1,
    priceScaleId: '1',
    priceFormat: {
        type: 'price',
    },
    scaleMargins: midScaleMargins,
};

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
        vertLines: {
            color: transparent,
        },
        horzLines: {
            color: transparent,
        },
    },
    crosshair: {
        mode: CrosshairMode.Normal,
    },
    priceScale: {
        borderColor: transparent,
    },
    timeScale: {
        borderColor: transparent,
        fixLeftEdge:true,
        fixRightEdge:true,
        minBarSpacing:3,
    },
});

export const getCandlestickConfig = (precision=2) => ({
    upColor: greenBar1,
    borderUpColor: greenBar1,
    wickUpColor: greenBar1,
    downColor: redBar1,
    borderDownColor: redBar1,
    wickDownColor: redBar1,
    priceLineVisible: false,
    priceScaleId: '0',
    priceFormat: {
        type: 'price',
        precision: precision,
    },
    
    scaleMargins: topScaleMargins,
});

export const getLineConfig = (color=white, thickness=1) => ({
    color: color,
    lineWidth: thickness,
    priceLineVisible: false,
    
    priceScaleId: '0',
    scaleMargins: topScaleMargins,
});

export const getBottomLineConfig = (color=white, thickness=1) => ({
    color: color,
    lineWidth: thickness,
    priceLineVisible: false,
    priceScaleId: '1',
    priceFormat: {
        type: 'price',
    },
    scaleMargins: midScaleMargins,
});


export const getVolumeHistogramConfig = (color=blueBar) => ({
    color: color,
    priceLineVisible: false,
    priceScaleId: '1',
    priceFormat: {
        type: 'volume',
    },
    scaleMargins: midScaleMargins,
});

export const getScoreHistogramConfig = (color=blueBar) => ({
    color: color,
    priceLineVisible: false,
    priceScaleId: '2', 
    priceFormat: {
        type: 'price',
    },
    scaleMargins: bottomScaleMargins,
    priceRange: {
        minValue: -100,
        maxValue: 100,
    },
});

// end config functions


// start data mapping functions


export const getScoreData = (data,indicator) => {

    let parsedData = Object.keys(data).map(date => {
        

        let score = 100 - Math.floor(Math.random() * 200);
        
        if(data[date][indicator] !== undefined && data[date][indicator]['Total'] !== undefined)
            score = data[date][indicator]['Total']['Final Adjusted Score'];
        
        return {
            time:date,
            value:score,
            color:getScoreColor(score),
        };
      });

    return reverseList(parsedData);
};


export const getVolatilityData = (data,type) => {
    let parsedData = Object.keys(data).map(date => {
        
        let value = data[date]['Volatility'][type];

        let color = value>=0 ? greenBar2 : redBar2;

        return {
            time:date,
            value:value,
            color:color,
        };
      });

    return reverseList(parsedData);
};

export const getHorizontalLineData = (data,value) => {
    let parsedData = Object.keys(data).map(date => {
        return {
            time : date,
            value : value,
        };
    });

    return reverseList(parsedData);
};

export const getCandleStickData = (data) => {
    let parsedData = Object.keys(data).map(date => {
    
        //let priceData = data[date]['Indicators']['Price']['Daily'];
        let priceData = data[date];
       
        return {
            time : date,
            open : parseFloat(priceData['Open']),
            high : parseFloat(priceData['High']),
            low : parseFloat(priceData['Low']),
            close : parseFloat(priceData['Close']),
        };
    });

    return reverseList(parsedData);
};

export const getData = (data, period, type, entry) => {
    
    //let parsedData = Object.keys(data).reverse().map(date => {
      
        let parsedData = Object.keys(data).map(date => {
            let value = -1;
            let indicators = data[date];
            let title = period ? period+' Day '+type : type;

            //console.log(date,title,indicators[title]);
            if(indicators[title] !== undefined)
                value = indicators[title][entry];
            
            return {
                time : date,
                value : parseFloat(value),
            };
        
    
    });

    parsedData = parsedData.filter(d => d.value !== -1);
    
    return reverseList(parsedData);
};

// end data mapping functions


// start other functions

export const getScoreColor = (score) => {
    if(score < 75 && score > -75) 
        return score>0 ? greenBar2 : redBar2;
    return score>0 ? greenBar : redBar;
};

export const chartNullCheck = (data,chart,chartId) => {
    let chartDiv = document.getElementById(chartId);
    return (chart || !chartDiv || !data || data==={} || Object.keys(data).length===0);
};

export const addResizeListener = (chart,id) => {
    window.addEventListener(
        "resize", 
        () => chart.applyOptions(getupdatedConfig(id)), 
        false
    );

    applyTimeScale(chart);
};

export const applyTimeScale = (chart) => {
    let periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 5);

    let periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 2);

    chart.timeScale().setVisibleRange({
        from: (periodStart).getTime() / 1000,
        to: (periodEnd).getTime() / 1000,
    });
};

export const reverseList = list => {
    let reversedList = [];
    list.forEach(e => reversedList.unshift(e));
    return reversedList;
};

// end other functions

export const addDefaultGraphsToChart = (chart,data) => {
    
    // place price graph at the top of the chart
    let priceCandleSeries = chart.addCandlestickSeries(getCandlestickConfig());
    priceCandleSeries.setData(getCandleStickData(data));

    // place scores at the bottom of the chart
    let scoreSeries = chart.addHistogramSeries(getScoreHistogramConfig());        
    scoreSeries.setData(getScoreData(data));

    return priceCandleSeries;
};

// indicator functions

export const addIndicatorSMA = (chart,data) => { 

    let SMA50LineSeries = chart.addLineSeries(getLineConfig(sma50DayColor,1));
    SMA50LineSeries.setData(getData(data, 50, SMA, SMA));

    let SMA200LineSeries = chart.addLineSeries(getLineConfig(sma200DayColor,1));
    SMA200LineSeries.setData(getData(data, 200, SMA, SMA));

    let SMA350LineSeries = chart.addLineSeries(getLineConfig(sma350DayColor,1));
    SMA350LineSeries.setData(getData(data, 350, SMA, SMA));

    let SMA140LineSeries = chart.addLineSeries(getLineConfig(supportBandColor,1));
    SMA140LineSeries.setData(getData(data, 140, SMA, SMA));
    
    let EMA147LineSeries = chart.addLineSeries(getLineConfig(supportBandColor,1));
    EMA147LineSeries.setData(getData(data, 147, EMA, EMA));

    let volumeSeries = chart.addHistogramSeries(getVolumeHistogramConfig(histogramColor));
    volumeSeries.setData(getData(data,null,'Volume','Volume'));

    /*
    line series for 50 SMA
    line series for 140 SMA
    line series for 200 SMA
    line series for 147 EMA
    histogram series for Volume
    */
   
    return {
        '50 Day SMA' : SMA50LineSeries,
        '140 Day SMA' : SMA140LineSeries,
        '200 Day SMA' : SMA200LineSeries,
        '147 Day EMA' : EMA147LineSeries,
        'Volume' : volumeSeries
    };
};

export const addIndicatorRSI = (chart,data) => {

    let boundaryValues = [20,30,50,70,80];
    addBoundaryLines(chart,data,boundaryValues);

    let RSILineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    RSILineSeries.setData(getData(data, 14, RSI, RSI));

    /*
    line series for RSI
    */

    return {
        'RSI' : RSILineSeries
    };
};

export const addIndicatorRVI = (chart,data) => {
   
    let boundaryValues = [0];
    addBoundaryLines(chart,data,boundaryValues);

    let signalLineSeries = chart.addLineSeries(getBottomLineConfig(signalColor,1));
    signalLineSeries.setData(getData(data, 10, RVI, 'Signal'));

    let RVILineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    RVILineSeries.setData(getData(data, 10, RVI, RVI));

    /*
    line series for RVI
    line series for signal line
    */
    
    return {
        'RVI' : RVILineSeries,
        'Signal' : signalLineSeries,
    };
};

export const addIndicatorMACD = (chart,data) => {
    let histogramSeries = chart.addHistogramSeries(getVolumeHistogramConfig(histogramColor));
    histogramSeries.setData(getData(data,26,MACD,'Histogram'));

    let signalLineSeries = chart.addLineSeries(getBottomLineConfig(signalColor,1));
    signalLineSeries.setData(getData(data, 26, MACD, 'Signal'));

    let MACDLineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    MACDLineSeries.setData(getData(data, 26, MACD, MACD));

    /*
    line series for MACD
    line series for signal line
    histogram series for MACD histogram
    */

    return {
        'MACD' : MACDLineSeries,
        'Signal' : signalLineSeries,
        'Histogram' : histogramSeries
    };
};



export const addIndicatorStoch = (chart,data) => {

    let boundaryValues = [20,30,50,70,80];
    addBoundaryLines(chart,data,boundaryValues);

    let signalLineSeries = chart.addLineSeries(getBottomLineConfig(signalColor,1));
    signalLineSeries.setData(getData(data, 5, STOCH, 'StochSlowD'));

    let stochLineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    stochLineSeries.setData(getData(data, 5, STOCH, 'StochSlowK'));
  
    /*
    line series for Stoch
    line series for signal line
    */

    return {
        'Stoch' : stochLineSeries,
        'Signal' : signalLineSeries
    };
};

export const addIndicatorStochRSI = (chart,data) => {
    
    let boundaryValues = [20,30,50,70,80];
    addBoundaryLines(chart,data,boundaryValues);

    let signalLineSeries = chart.addLineSeries(getBottomLineConfig(signalColor,1));
    signalLineSeries.setData(getData(data, 14, STOCHRSI, 'stochRSISlowD'));

    let stochRSILineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    stochRSILineSeries.setData(getData(data, 14, STOCHRSI, 'stochRSISlowK'));
 
    /*
    line series for StochRSI
    line series for signal line
    */

    return {
        'StochRSI' : stochRSILineSeries,
        'Signal' : signalLineSeries
    };
};

export const addFearAndGreed = (chart,data) => { 
    
    let boundaryValues = [15,50,85];
    addBoundaryLines(chart,data,boundaryValues);

    let fearAndGreedLineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    fearAndGreedLineSeries.setData(getData(data, null, FEARANDGREED, 'Value'));
 
    /*
    line series for Fear And Greed
    */

    return {
        'Fear And Greed' : fearAndGreedLineSeries,
    };
};


export const addVolatility = (chart,data) => {

    let boundaryValues = [-20,-12,0,12,20];
    addBoundaryLines(chart,data,boundaryValues);

    let volatilityHistogramSeries = chart.addHistogramSeries(getBottomLineConfig(orangeBar,1));
    volatilityHistogramSeries.setData(getVolatilityData(data, 'High Low'));

    
    let signalLineSeries = chart.addLineSeries(getBottomLineConfig(indicatorColor,2));
    signalLineSeries.setData(getVolatilityData(data, 'Signal'));

    /*
    histogram series for high low volatility
    line series for signal line 
    */

    return {
        'High Low' : volatilityHistogramSeries,
        'Signal' : signalLineSeries,
    };
};


export const addBoundaryLines = (chart,data,values) => {
    values.map(value => {
        let boundaryLineSeries = chart.addLineSeries(horizontalLineConfig);
        boundaryLineSeries.setData(getHorizontalLineData(data, value));
    });
};


