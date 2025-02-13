import ccxt from "ccxt";
import moment from "moment";

const exchange = new ccxt.binance();
let balance = 1000;
let cryptoBalance = 0;
const feeRate = 0.001;
let totalCryptoCost = 0;
let totalCryptoBought = 0;
let buyAgainPrice = 0;
let buyMultiplier = 1; // Mua giảm dần khi giá giảm liên tục
let sellPortion = 0.5; // Bán 50% khi đạt mức lợi nhuận
let priceHistory = [];

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

const coin = "LAYER";

const trade = async () => {
  setInterval(async () => {
    const currentTicker = formatTicker(
      await exchange.fetchOHLCV(`${coin}/USDT`, "1m", undefined, 1)
    );
    const currentPrice = currentTicker[0].close;
    priceHistory.push(currentPrice);
    if (priceHistory.length > 10) priceHistory.shift(); // Lưu 10 giá gần nhất
    const avgCryptoPrice =
      totalCryptoBought > 0 ? totalCryptoCost / totalCryptoBought : 0;
    const profitPrice = (avgCryptoPrice * (1 + feeRate)) / (1 - feeRate);

    console.log(
      `Current Price: ${currentPrice.toFixed(6)}, Balance: ${balance.toFixed(
        2
      )} USDT, ${coin}: ${cryptoBalance.toFixed(
        6
      )}, Avg ${coin} Price: ${avgCryptoPrice.toFixed(
        2
      )}, Profit Price: ${profitPrice.toFixed(6)}`
    );

    // Mua vào khi chưa có và giá thấp hơn hoặc bằng giá mua trước đó
    if (
      cryptoBalance === 0 &&
      balance >= 100 &&
      ((buyAgainPrice !== 0 && currentPrice <= buyAgainPrice) ||
        buyAgainPrice === 0)
    ) {
      const usdtBuy = 100 * buyMultiplier;
      const cryptoBuy = (usdtBuy * (1 - feeRate)) / currentPrice;

      totalCryptoCost += usdtBuy;
      totalCryptoBought += cryptoBuy;
      balance -= usdtBuy;
      cryptoBalance += cryptoBuy;

      console.log(
        `✅ Bought ${cryptoBuy.toFixed(6)} ${coin} at ${currentPrice}`
      );
    } else if (cryptoBalance > 0) {
      // Bán dần khi giá tăng liên tục
      if (currentPrice >= profitPrice) {
        const sellAmount = sellPortion > 0.5 ? cryptoBalance * sellPortion:cryptoBalance;
        const usdtSell = sellAmount * currentPrice * (1 - feeRate);
        balance += usdtSell;
        cryptoBalance -= sellAmount;

        console.log(
          `🔴 Sold ${sellAmount.toFixed(6)} ${coin} at ${currentPrice}`
        );

        // Nếu đã bán hết thì reset
        if (cryptoBalance === 0) {
          totalCryptoCost = 0;
          totalCryptoBought = 0;
          buyAgainPrice = currentPrice * 0.997;
          buyMultiplier = 1; // Reset hệ số mua lại
        }
      }
      // Trung bình giá xuống khi giá giảm liên tục
      else if (currentPrice <= avgCryptoPrice * 0.996 && balance >= 100) {
        const usdtBuy = 100 * buyMultiplier;
        const cryptoBuy = (usdtBuy * (1 - feeRate)) / currentPrice;

        totalCryptoCost += usdtBuy;
        totalCryptoBought += cryptoBuy;
        balance -= usdtBuy;
        cryptoBalance += cryptoBuy;

        console.log(
          `✅ Averaged Down: Bought ${cryptoBuy.toFixed(
            6
          )} ${coin} at ${currentPrice}`
        );

        buyMultiplier *= 0.9; // Giảm hệ số mua nếu giá tiếp tục giảm
      }
    }

    console.log(
      `After Trade: Balance: ${balance.toFixed(
        2
      )} USDT, ${coin}: ${cryptoBalance.toFixed(6)} if sell now: ${
        balance + cryptoBalance * currentPrice * (1 - feeRate)
      }`
    );
  }, 4000);
};

trade();
