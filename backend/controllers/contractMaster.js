const fetch = require("node-fetch");

const CONTRACT_BASE =
    "https://v2api.aliceblueonline.com/restpy/static/contract_master/V2";

const EXCHANGES = ["NSE", "BSE", "NFO", "MCX"];

let instruments = [];

async function loadContracts() {
    console.log("Downloading contract master...");

    for (const exch of EXCHANGES) {
        const res = await fetch(`${CONTRACT_BASE}/${exch}`);
        const json = await res.json();

        const key = Object.keys(json)[0];
        const list = json[key];

        instruments.push(...list);
        console.log(`${exch}: ${list.length}`);
    }

    console.log("Total instruments:", instruments.length);
}

function search(q) {
    q = q.toLowerCase();
    return instruments
        .filter(
            (i) =>
                i.trading_symbol.toLowerCase().includes(q) ||
                i.symbol?.toLowerCase().includes(q)
        )
        .slice(0, 25);
}

module.exports = {
    loadContracts,
    search,
};