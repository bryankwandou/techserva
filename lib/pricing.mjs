// Shared by the build, the browser and the PDF generator.
const HIGH = new Set('USD EUR GBP CHF AUD CAD JPY NZD SEK NOK DKK ISK ILS SAR HKD TWD KRW AWG BSD'.split(' '));
const MID = new Set('CNY BRL MXN TRY PLN CZK HUF RON BGN MYR THB ZAR RSD KZT BAM MKD ALL GEL AMD AZN MUR FJD JMD CRC BWP SZL LSL'.split(' '));
export const factorOf = c => (HIGH.has(c) ? 1 : MID.has(c) ? 0.7 : 0.45);

export function nice(v) {
  if (v <= 0) return 0;
  const m = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.ceil(v / m - 1e-9) * m;
}
// Indonesia pays the listed IDR price. Everywhere else starts from the USD base.
export const usdBase = idr => nice((idr * 5) / 16000);

export function priceIn(idr, currency, rates) {
  if (currency === 'IDR') return { amount: idr, currency };
  const rate = rates?.[currency];
  if (currency === 'USD' || !rate) return { amount: usdBase(idr), currency: 'USD' };
  return { amount: nice(usdBase(idr) * factorOf(currency) * rate), currency };
}

export function formatPrice({ amount, currency }, locale = 'en') {
  const opts = { style: 'currency', currency, maximumFractionDigits: 0 };
  try { return new Intl.NumberFormat(locale, opts).format(amount); }
  catch { return new Intl.NumberFormat('en', opts).format(amount); }
}
export const daysFor = idr => (idr <= 500000 ? 3 : idr <= 2000000 ? 7 : idr <= 5000000 ? 14 : idr <= 15000000 ? 30 : 45);
