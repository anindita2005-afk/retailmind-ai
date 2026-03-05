import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { NextRequest, NextResponse } from "next/server"
import { networkInterfaces } from "os"

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()?.toLowerCase() || ""

  // Fetch Products
  const productsRes = await db.send(new QueryCommand({
    TableName: `${TABLE_PREFIX}Products`,
    KeyConditionExpression: "user_id = :u",
    ExpressionAttributeValues: { ":u": session.id }
  }));
  let products = productsRes.Items || [];

  if (query) {
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  }

  // Fetch Bills and their Items to aggregate data
  const billsRes = await db.send(new QueryCommand({
    TableName: `${TABLE_PREFIX}Bills`,
    KeyConditionExpression: "user_id = :u",
    ExpressionAttributeValues: { ":u": session.id }
  }));
  const bills = billsRes.Items || [];

  let allBillItems: any[] = [];
  for (const bill of bills) {
    const itemsRes = await db.send(new QueryCommand({
      TableName: `${TABLE_PREFIX}BillItems`,
      KeyConditionExpression: "bill_id = :b",
      ExpressionAttributeValues: { ":b": bill.id }
    }));
    const items = (itemsRes.Items || []).map(i => ({ ...i, bill_date: bill.created_at }));
    allBillItems = allBillItems.concat(items);
  }

  const enhancedProducts = products.map(p => {
    const pItems = allBillItems.filter(i => i.product_id === p.id);

    const total_sold = pItems.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0);
    }, 0);

    // Revenue WITHOUT GST
    const total_revenue = pItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + (price * qty);
    }, 0);

    // PROFIT (ignore GST)
    const total_profit = pItems.reduce((sum, item) => {
      const sellingPrice = Number(item.price) || 0;
      const costPrice = Number(p.cost_price) || 0;
      const qty = Number(item.qty) || 0;

      return sum + ((sellingPrice - costPrice) * qty);
    }, 0);

    const bill_count = new Set(pItems.map(i => i.bill_id)).size;

    return {
      ...p,
      total_sold,
      total_revenue,
      total_profit,
      bill_count
    };
  }).sort((a, b) => b.total_sold - a.total_sold);

  const overall_profit = enhancedProducts.reduce((sum, p: any) => {
    return sum + (Number(p.total_profit) || 0);
  }, 0);

  // Monthly Sales
  const monthlySalesMap: Record<string, any> = {};
  const productIds = enhancedProducts.map((p: any) => p.id);

  for (const item of allBillItems) {
    if (!productIds.includes(item.product_id)) continue;

    const date = new Date(item.bill_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

    const key = `${item.product_id}_${monthKey}`;
    if (!monthlySalesMap[key]) {
      monthlySalesMap[key] = {
        product_id: item.product_id,
        month: monthName,
        month_key: monthKey,
        qty_sold: 0,
        revenue: 0
      };
    }
    monthlySalesMap[key].qty_sold += Number(item.qty) || 0;
    monthlySalesMap[key].revenue += Number(item.amount) || 0;
  }

  const monthlySales = Object.values(monthlySalesMap).sort((a: any, b: any) => a.month_key.localeCompare(b.month_key));

  return NextResponse.json({
    products: enhancedProducts,
    monthlySales,
    overall_profit,
    networkIp: getLocalIp()
  })
}
