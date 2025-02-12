import ccxt from "ccxt";
import moment from "moment";
import { predictTrend } from "./predict.js";

const exchange = new ccxt.binance();
let tickers = [];
let totalPredictions = 0;
let correctPredictions = 0;

// Định dạng dữ liệu ticker
const formatTicker = (ticker) => {
  return ticker.map((t) => ({
    timestamp: moment(t[0]).format("YYYY-MM-DD HH:mm:ss"),
    low: t[1],
    high: t[2],
    open: t[3],
    close: t[4],
    volume: t[5],
  }));
};

// Kiểm tra dự đoán có đúng không
const checkPrediction = (tickers) => {
  const { prediction, correct } = predictTrend(tickers.slice(0, 100));

  return {
    prediction,
    actual: correct ? prediction : prediction === "up" ? "down" : "up",
    correct,
  };
};

// Cập nhật tỷ lệ dự đoán chính xác
const updateAccuracy = (result) => {
  totalPredictions++;
  if (result.correct) correctPredictions++;
  const accuracy = ((correctPredictions / totalPredictions) * 100).toFixed(2);
  console.log(
    `Prediction: ${result.prediction}, Actual: ${result.actual}, Correct: ${result.correct}`
  );
  console.log(`Current Accuracy: ${accuracy}% after ${totalPredictions} predictions\n`);
};

const main = async () => {
  console.log("Fetching initial data...");
  tickers = await exchange.fetchOHLCV("ETH/USDT", "1m", undefined, 100);
  tickers = formatTicker(tickers);

  console.log(tickers.map(t => t.close));

  console.log("Processing historical predictions...");
  // for (let i = 0; i <= tickers.length - 101; i++) {
  //   const result = checkPrediction(tickers.slice(i, i + 101));
  //   updateAccuracy(result);
  // }

  // Chạy interval mỗi 1 phút để cập nhật dự đoán mới
  // setInterval(async () => {
  //   try {
  //     console.log("Fetching new ticker...");
  //     const newTicker = await exchange.fetchOHLCV("ETH/USDT", "1m", undefined, 1);
  //     const formattedNewTicker = formatTicker(newTicker)[0];

  //     tickers.push(formattedNewTicker);
  //     if (tickers.length > 1000) tickers.shift(); // Giữ tối đa 1000 phần tử

  //     if (tickers.length >= 101) {
  //       const result = checkPrediction(tickers.slice(-101));
  //       updateAccuracy(result);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching new ticker:", error);
  //   }
  // }, 60000);
};

main();
