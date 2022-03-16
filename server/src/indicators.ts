import tulind from "tulind";

export const indicators = {
  sma(input, options) {
    return new Promise((resolve, reject) => {
      const list: number[] = input.close
      const prelength = list.length
      if (list.length < options.period) {
        list.length = options.period
        list.fill(list[prelength-1], prelength, options.period)
      }
      tulind.indicators.sma.indicator([[...list]], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  zlema(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.zlema.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  wma(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.wma.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  willr(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.willr.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  wcprice(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.wcprice.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [], function(err, results) {
        resolve(results)
      })
    })
  },
  wad(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.wad.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [], function(err, results) {
        resolve(results)
      })
    })
  },
  vwma(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.vwma.indicator([
        input.close.slice(-options.period),
        input.volume.slice(-options.period)
      ], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  vhf(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.vhf.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  var(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.var.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  ultosc(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.ultosc.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [
        options.shortPeriod,
        options.mediumPeriod,
        options.longPeriod
      ], function(err, results) {
        resolve(results)
      })
    })
  },
  typprice(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.typprice.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [], function(err, results) {
        resolve(results)
      })
    })
  },
  trix(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.trix.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  trima(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.trima.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  tr(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.tr.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [], function(err, results) {
        resolve(results)
      })
    })
  },
  tema(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.tema.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  sum(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.sum.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  stochrsi(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.stochrsi.indicator([input.close.slice(-options.period)], [options.period], function(err, results) {
        resolve(results)
      })
    })
  },
  stoch(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.stoch.indicator([
        input.high.slice(-options.period),
        input.low.slice(-options.period),
        input.close.slice(-options.period)
      ], [
        options.kPeriod,
        options.kSlowingPeriod,
        options.dPeriod
      ], function(err, results) {
        resolve(results)
      })
    })
  },
  stderr(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.stderr.indicator([
        input.close.slice(-options.period)
      ], [
        options.period
      ], function(err, results) {
        resolve(results)
      })
    })
  },
  stddev(input, options) {
    return new Promise((resolve, reject) => {
      tulind.indicators.stddev.indicator([
        input.close.slice(-options.period)
      ], [
        options.period
      ], function(err, results) {
        resolve(results)
      })
    })
  },
}
