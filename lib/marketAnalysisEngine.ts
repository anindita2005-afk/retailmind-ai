import { fetchProductPrices, computeMedian } from "@/lib/productPriceService"

export async function runMarketAnalysis(
  query: string,
  category?: string
) {
  const marketProducts = await fetchProductPrices(query)

  if (!marketProducts.length) {
    return {
      product_overview: {
        name: query,
        description: "No live pricing found",
        category: category || "General"
      },
      price_analysis: null,
      buy_links: [],
      platform_links: []
    }
  }

  const prices = marketProducts
    .filter(p => p.price > 0)
    .map(p => p.price)
    .sort((a, b) => a - b)

  const min = prices[0] || 0
  const max = prices[prices.length - 1] || 0
  const average = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0
  const median = computeMedian(prices)

  const data: any = {
    product_overview: {
      name: query,
      description: "Live real-time pricing from authorized Indian marketplaces",
      category: category || "General"
    },
    price_analysis: {
      min,
      max,
      average,
      median,
      wholesale_price: Math.round(min * 0.7),
      retail_price: median,
      online_price: min,
      currency: "INR",
      real_time_data: true
    }
  }

  data.buy_links = marketProducts.slice(0, 8).map(p => {
    let hostname = ""
    try { hostname = new URL(p.link).hostname } catch { }

    return {
      store: p.platformName,
      url: p.link,
      directUrl: true,
      price: p.price,
      product_name: p.product_name,
      rating: p.rating,
      variant: null,
      category: p.platformCategory,
      isTrusted: p.isTrusted,
      favicon: hostname
        ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
        : ""
    }
  })

  data.platform_links = data.buy_links

  return data
}