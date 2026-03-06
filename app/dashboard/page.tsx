import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import DashboardHeader from "@/components/dashboard/header"
import DashboardOverview from "@/components/dashboard/overview"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const uid = session.id

  let productsRes, billsRes, analysesRes, profileRes;
  try {
    [productsRes, billsRes, analysesRes, profileRes] = await Promise.all([
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Products`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Bills`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}MarketAnalyses`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": uid } })),
      db.send(new GetCommand({ TableName: `${TABLE_PREFIX}BusinessProfiles`, Key: { user_id: uid } }))
    ]);
  } catch (err: any) {
    console.error("Dashboard DDB Error:", err);
    return (
      <div className="flex-1 overflow-auto p-8 bg-zinc-950 text-red-400 font-mono text-sm leading-relaxed">
        <h1 className="text-xl font-bold text-red-500 mb-4">Database Connection Failed</h1>
        <p className="mb-4">
          The Next.js server components could not securely access DynamoDB. If you deployed to AWS Amplify, you must provide your AWS credentials (MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY) as Environment Variables in the Amplify Console.
        </p>
        <div className="bg-zinc-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-red-900/50">
          {err.name}: {err.message}
        </div>
      </div>
    );
  }

  const products = productsRes.Items || [];
  const bills = billsRes.Items || [];

  // Fetch all bill items safely
  let allBillItems: any[] = [];

  try {
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
  } catch (err: any) {
    console.error("Dashboard BillItems DDB Error:", err);
  }

  const analyses = analysesRes.Items || [];
  const profile = profileRes.Item;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => (Number(p.stock_qty) || 0) <= 5);
  const lowStock = lowStockProducts.length;

  const paidBills = bills.filter((b) => b.status === "paid")
  const revenue = paidBills.reduce((s, b) => s + (Number(b.total) || 0), 0)

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
  const todayBillsList = bills.filter(b => String(b.created_at || "").startsWith(today) || String(b.bill_date || "").startsWith(today));
  const todayPaidBills = todayBillsList.filter(b => b.status === "paid");
  const todayRevenue = todayPaidBills.reduce((s, b) => s + (Number(b.total) || 0), 0)

  const sortedBills = [...bills].sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0));
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
        if (b.status === "paid") monthlyMap[key].revenue += (Number(b.total) || 0);
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

  const initialStats = {
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
    businessName: String(profile?.business_name ?? session.business_name ?? "Your Business"),
    displayId: String(session.display_id ?? "RIQ-0000"),
    gstNumber: String(profile?.gst_number ?? ""),
    recentBills: recentBills.map((b) => {
      const d = new Date(b.created_at as string);
      const safeDate = isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      return {
        id: String(b.id).split('-')[0].substring(0, 8),
        customer: String(b.customer_name),
        total: Number(b.total),
        status: String(b.status),
        date: safeDate,
      };
    }),
    lowStockItems: lowStockItems.map((p) => ({
      name: String(p.name),
      stock: Number(p.stock_qty),
      unit: String(p.unit),
    })),
    monthly: monthly.map((r: any) => ({
      month: String(r.month),
      revenue: Number(r.revenue),
      profit: Number(r.profit),
      bills: Number(r.bills),
    })),
    fetchedAt: new Date().toISOString(),
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader title="Dashboard" subtitle={`Welcome back, ${initialStats.businessName}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <DashboardOverview initialStats={initialStats} />
      </main>
    </div>
  )
}
