import React, { useRef } from "react";
import { Line } from "react-chartjs-2";

export default function Dashboard({ price, data }) {

    const opts = {
        tooltips: {
            intersect: false,
            mode: "index"
        },
        responsive: true,
        maintainAspectRatio: false
    };

    if (price === "0.00") return <h2>please select a currency pair</h2>;
    
    console.log(data,opts)

    if(Object.keys(data)===null || Object.keys(data).length===0){
        console.log('yonk'); 
        return <div>LOL get rekt</div>;
    }

    return (
        <div className="dashboard">
        <h2>{`$${price}`}</h2>

       
        </div>
    );
}