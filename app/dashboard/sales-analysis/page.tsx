import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import SalesAnalysisClient from "@/components/dashboard/sales-analysis-client"

export default async function SalesAnalysisPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = session.id

  const billsRes = await db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Bills`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": userId } }));
  const productsRes = await db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Products`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": userId } }));

  const bills = (billsRes.Items || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const products = productsRes.Items || [];

  let billItems: any[] = [];
  for (const b of bills) {
    const bItems = await db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}BillItems`, KeyConditionExpression: "bill_id = :b", ExpressionAttributeValues: { ":b": b.id } }));
    billItems = billItems.concat((bItems.Items || []).map(i => {
      const product = products.find(p => p.id === i.product_id);
      return {
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        amount: i.amount,
        created_at: b.created_at,
        status: b.status,
        cost_price: product?.cost_price || 0,
        category: product?.category || "Uncategorised"
      }
    }));
  }

  // Compute KPIs
  const totalRevenue = bills.reduce((s, b) => b.status === "paid" ? s + Number(b.total) : s, 0)
  const totalBills = bills.length
  const paidBills = bills.filter((b) => b.status === "paid").length
  const draftBills = bills.filter((b) => b.status === "draft").length
  const cancelledBills = bills.filter((b) => b.status === "cancelled").length
  const avgOrderValue = paidBills > 0 ? totalRevenue / paidBills : 0
  const totalUnits = billItems.reduce((s, i) => i.status === "paid" ? s + Number(i.quantity) : s, 0)
  const totalCost = billItems.reduce((s, i) => i.status === "paid" ? s + (Number(i.quantity) * Number(i.cost_price || Number(i.unit_price) * 0.75)) : s, 0)
  const totalGst = bills.reduce((s, b) => b.status === "paid" ? s + Number(b.gst_amount) : s, 0)
  const marginPercentage = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

  const customers = bills.filter((b) => b.status === "paid" && b.customer_name).map(b => b.customer_name as string)
  const uniqueCustomers = new Set(customers).size
  const customerLTV = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0

  const stats = {
    totalRevenue,
    totalBills,
    paidBills,
    draftBills,
    cancelledBills,
    avgOrderValue,
    totalUnits,
    totalGst,
    totalProducts: products.length,
    marginPercentage,
    customerLTV
  }

  // Monthly
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyMap: Record<string, any> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const m = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const key = d.toISOString().substring(0, 7);
    monthlyMap[key] = { month: m, key, revenue: 0, billCount: 0, paidCount: 0 };
  }

  bills.forEach(b => {
    const d = new Date(b.created_at);
    if (d >= sixMonthsAgo) {
      const key = d.toISOString().substring(0, 7);
      if (monthlyMap[key]) {
        monthlyMap[key].billCount++;
        if (b.status === "paid") {
          monthlyMap[key].paidCount++;
          monthlyMap[key].revenue += Number(b.total || 0);
        }
      }
    }
  });

  const monthly = Object.values(monthlyMap).sort((a: any, b: any) => a.key.localeCompare(b.key)).map(m => ({
    month: m.month,
    revenue: m.revenue,
    billCount: m.billCount,
    paidCount: m.paidCount
  }));

  // Top Products
  const topProductMap: Record<string, any> = {};
  billItems.filter(i => i.status === "paid").forEach(i => {
    if (!topProductMap[i.product_name]) {
      topProductMap[i.product_name] = { name: i.product_name, revenue: 0, units: 0 };
    }
    topProductMap[i.product_name].revenue += Number(i.amount || 0);
    topProductMap[i.product_name].units += Number(i.quantity || 0);
  });

  const topProducts = Object.values(topProductMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

  // By Category
  const categoryMap: Record<string, any> = {};
  billItems.filter(i => i.status === "paid").forEach(i => {
    const cat = i.category || "Uncategorised";
    if (!categoryMap[cat]) categoryMap[cat] = { category: cat, revenue: 0, units: 0 };
    categoryMap[cat].revenue += Number(i.amount || 0);
    categoryMap[cat].units += Number(i.quantity || 0);
  });

  const byCategory = Object.values(categoryMap).sort((a: any, b: any) => b.revenue - a.revenue);

  const recentBills = bills.slice(0, 8).map((b) => ({
    billNumber: b.id.split('-')[0].substring(0, 8) || "Bill",
    customer: b.customer_name as string,
    total: Number(b.total),
    status: b.status as string,
    date: new Date(b.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  }))

  // All bills for the daily chart (ISO date so the client can bucket by day reliably)
  const allBillsForChart = bills.map((b) => ({
    total: Number(b.total),
    status: b.status as string,
    date: (b.created_at as string).split("T")[0], // ISO YYYY-MM-DD
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#090e0c]">
      <main className="flex-1 overflow-y-auto w-full">
        <SalesAnalysisClient
          stats={stats}
          monthly={monthly}
          topProducts={topProducts}
          byCategory={byCategory}
          recentBills={recentBills}
          allBillsForChart={allBillsForChart}
        />
      </main>
    </div>
  )
}