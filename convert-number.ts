export function convertNumberToWords(amount: number) {
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (amount === 0) return "Zero";
  let numStr = amount.toString();
  let [rupees, paise] = numStr.split('.');
  function getWords(numValue: number): string {
    let str = "";
    if (numValue > 9999999) { str += getWords(Math.floor(numValue / 10000000)) + " Crore "; numValue %= 10000000; }
    if (numValue > 99999) { str += getWords(Math.floor(numValue / 100000)) + " Lakh "; numValue %= 100000; }
    if (numValue > 999) { str += getWords(Math.floor(numValue / 1000)) + " Thousand "; numValue %= 1000; }
    if (numValue > 99) { str += getWords(Math.floor(numValue / 100)) + " Hundred "; numValue %= 100; }
    if (numValue > 0) {
      if (numValue < 20) str += words[numValue] + " ";
      else { str += tens[Math.floor(numValue / 10)] + " "; if (numValue % 10 > 0) str += words[numValue % 10] + " "; }
    }
    return str.trim();
  }
  let result = getWords(parseInt(rupees));
  if (paise && parseInt(paise) > 0) {
      let p = parseInt((paise + '00').substring(0, 2));
      result += " and " + getWords(p) + " Paise";
  }
  return result + " Only";
}
