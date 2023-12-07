import { ServerRespond } from './DataStreamer';

export interface Row {
  price_abc: number,
  price_def: number,
  ratio: number,
  timestamp: Date,
  upper_bound: number,
  lower_bound: number,
  trigger_alert: number | undefined,
 
}


export class DataManipulator {
  // add a variable to maintain this historical
  private static historicalRatios: number[] = [];

  static generateRow(serverRespond: ServerRespond[]): Row {
    // Calculate the average of priceABC and priceDEF
    const priceABC = (serverRespond[0].top_ask.price + serverRespond[0].top_bid.price) / 2;
    const priceDEF = (serverRespond[1].top_ask.price + serverRespond[1].top_bid.price) / 2;
    const ratio = priceABC / priceDEF;

    // Add the current ratio to the history
    this.historicalRatios.push(ratio);

    // Keep the history for the last 12 months 
    if (this.historicalRatios.length > 12) {
      this.historicalRatios.shift(); // Remove the oldest value
    }
    
    // Calculate the 12-month moving average
    const twelveMonthsAverage = this.calculateMovingAverage(this.historicalRatios);
  
    const upperBound = twelveMonthsAverage * 1.05;
    const lowerBound = twelveMonthsAverage * 0.99;
    return {
      price_abc: priceABC,
      price_def: priceDEF,
      ratio,
      timestamp: serverRespond[0].timestamp > serverRespond[1].timestamp ? 
        serverRespond[0].timestamp : serverRespond[1].timestamp,
      upper_bound: upperBound,
      lower_bound: lowerBound,
      trigger_alert: (ratio > upperBound || ratio < lowerBound) ? ratio : undefined,
    };
}

private static calculateMovingAverage(data: number[]): number {
  // Calculate the sum of all values in the history
  const sum = data.reduce((acc, value) => acc + value, 0);

  // Calculate the average
  const average = sum / data.length;

  return average;
}
}
