const calculateEMA = (prices, period) => {
  if (prices.length < period) return null;

  const k = 2 / (period + 1); // Hệ số làm mịn EMA
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period; // SMA ban đầu

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
};

const predictTrend = (ticker) => {
  if (ticker.length < 12) {
    throw new Error("Ticker data must have at least 12 entries.");
  }

  // Lấy giá đóng cửa của 100 nến
  const closePrices = ticker.map((t) => t.close);

  // Tính EMA(10)
  const ema10 = calculateEMA(closePrices, 10);
  if (ema10 === null) {
    throw new Error("Not enough data to calculate EMA.");
  }

  // Lấy giá đóng cửa của 3 nến cuối cùng
  const lastClose = closePrices[closePrices.length - 3]; // Nến dùng để dự đoán
  const nextClose1 = closePrices[closePrices.length - 2]; // Nến thứ 1 sau đó
  const nextClose2 = closePrices[closePrices.length - 1]; // Nến thứ 2 sau đó

  // Xác định xu hướng dự đoán
  const prediction = lastClose > ema10 ? "up" : "down";

  // Kiểm tra xem ít nhất 1 trong 2 nến tiếp theo có đúng xu hướng không
  const actual1 = nextClose1 > lastClose ? "up" : "down";
  const actual2 = nextClose2 > nextClose1 ? "up" : "down";
  const correct = prediction === actual1 || prediction === actual2;

  console.log(`Prediction: ${prediction}, Next1: ${actual1}, Next2: ${actual2}, Correct: ${correct}`);

  return { prediction, correct };
};

export { predictTrend };
