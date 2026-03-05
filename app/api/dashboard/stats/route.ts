import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const uid = session.id

    const [
      productsRes,
      billsRes,
      analysesRes,
      profileRes
    ] = await Promise.all([
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Products`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Bills`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}MarketAnalyses`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new GetCommand({ TableName: `${TABLE_PREFIX}BusinessProfiles`, Key: { user_id: uid } }))
    ]);

    const products = productsRes.Items || [];
    const bills = billsRes.Items || [];
    // Fetch all bill items
    let allBillItems: any[] = [];

    for (const bill of bills) {
      const itemsRes = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}BillItems`,
        KeyConditionExpression: "bill_id = :b",
        ExpressionAttributeValues: { ":b": bill.id }
      }));
      const items = (itemsRes.Items || []).map(i => ({
        ...i,
        bill_status: bill.status,
        bill_date: bill.created_at
      }));
      allBillItems = allBillItems.concat(items);
    }
    const analyses = analysesRes.Items || [];
    const profile = profileRes.Item;

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => (Number(p.stock_qty) || 0) <= 5);
    const lowStock = lowStockProducts.length;

    const paidBills = bills.filter((b) => b.status === "paid")
    const revenue = paidBills.reduce((s, b) => s + Number(b.total ?? 0), 0)

    // Total Profit (paid bills only, ignore GST)
    const totalProfit = allBillItems
      .filter(item => item.bill_status === "paid")
      .reduce((sum, item) => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return sum;

        const sellingPrice = Number(item.price) || 0;
        const costPrice = Number(product.cost_price) || 0;
        const qty = Number(item.qty) || 0;

        return sum + ((sellingPrice - costPrice) * qty);
      }, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayBillsList = bills.filter(b => b.created_at?.startsWith(today) || b.bill_date?.startsWith(today));
    const todayPaidBills = todayBillsList.filter(b => b.status === "paid");
    const todayRevenue = todayPaidBills.reduce((s, b) => s + Number(b.total ?? 0), 0)

    const sortedBills = [...bills].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recentBills = sortedBills.slice(0, 5);
    const lowStockItems = [...lowStockProducts].sort((a, b) => (Number(a.stock_qty) || 0) - (Number(b.stock_qty) || 0)).slice(0, 5);

    // Monthly
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyMap: Record<string, any> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const m = d.toLocaleString('default', { month: 'short' });
      const y = d.getFullYear();
      const key = `${y}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: m, key, revenue: 0, bills: 0, profit: 0 };
    }

    bills.forEach(b => {
      const d = new Date(b.created_at);
      if (d >= sixMonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].bills++;
          if (b.status === "paid") monthlyMap[key].revenue += Number(b.total || 0);
        }
      }
    });

    // Add monthly profit
    allBillItems.forEach(item => {
      if (item.bill_status !== "paid") return;

      const d = new Date(item.bill_date);
      if (d >= sixMonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          const product = products.find(p => p.id === item.product_id);
          if (!product) return;

          const sellingPrice = Number(item.price) || 0;
          const costPrice = Number(product.cost_price) || 0;
          const qty = Number(item.qty) || 0;

          monthlyMap[key].profit += (sellingPrice - costPrice) * qty;
        }
      }
    });

    const monthly = Object.values(monthlyMap).sort((a: any, b: any) => a.key.localeCompare(b.key));

    return NextResponse.json({
      products: totalProducts,
      lowStock: lowStock,
      paidBills: paidBills.length,
      draftBills: bills.filter((b) => b.status === "draft").length,
      cancelledBills: bills.filter((b) => b.status === "cancelled").length,
      totalBills: bills.length,
      revenue,
      totalProfit,
      analyses: analyses.length,
      todayRevenue: todayRevenue,
      todayBills: todayBillsList.length,
      businessName: profile?.business_name ?? session.business_name ?? "Your Business",
      displayId: session.display_id ?? "RIQ-0000",
      gstNumber: profile?.gst_number ?? "",
      recentBills: recentBills.map((b) => ({
        id: b.id,
        customer: b.customer_name,
        total: Number(b.total),
        status: b.status,
        date: new Date(b.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      })),
      lowStockItems: lowStockItems.map((p) => ({
        name: p.name,
        stock: Number(p.stock_qty),
        unit: p.unit,
      })),
      monthly: monthly.map((r: any) => ({
        month: r.month,
        revenue: Number(r.revenue),
        profit: Number(r.profit),
        bills: Number(r.bills),
      })),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[GET /api/dashboard/stats]", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
