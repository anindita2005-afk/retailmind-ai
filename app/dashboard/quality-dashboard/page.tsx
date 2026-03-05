import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import DashboardHeader from "@/components/dashboard/header"
import QualityDashboardClient from "@/components/dashboard/quality-dashboard-client"

export default async function QualityDashboardPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    const userId = session.id

    const [
        billsRes,
        productsRes,
        analysesRes
    ] = await Promise.all([
        db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Bills`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": userId } })),
        db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}Products`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": userId } })),
        db.send(new QueryCommand({ TableName: `${TABLE_PREFIX}MarketAnalyses`, KeyConditionExpression: "user_id = :u", ExpressionAttributeValues: { ":u": userId } }))
    ]);

    const billRows = (billsRes.Items || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const productRows = productsRes.Items || [];
    const analysisRows = (analysesRes.Items || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let billItemRows: any[] = [];
    for (const b of billRows) {
        const itemsRes = await db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}BillItems`,
            KeyConditionExpression: "bill_id = :b",
            ExpressionAttributeValues: { ":b": b.id }
        }));
        billItemRows = billItemRows.concat(itemsRes.Items || []);
    }

    // --- KPI Computations ---
    const totalTasks = billRows.length             // Total bills = total tasks
    const totalSamples = billItemRows.length        // Each line item = a sample
    const defects = billRows.filter((b) => b.status === "cancelled").length  // Cancelled = defect/failure
    const fatalErrors = productRows.filter((p) => Number(p.stock_qty) === 0).length // Out-of-stock = fatal
    const paidBills = billRows.filter((b) => b.status === "paid").length
    const qualityScore = totalTasks > 0
        ? Math.round(((totalTasks - defects - fatalErrors) / totalTasks) * 100)
        : 100

    // Products with margin info (cost vs price)
    const productsWithMargin = productRows.map((p) => {
        const price = Number(p.price)
        const cost = Number(p.cost_price ?? 0)
        const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null
        return { name: p.name as string, category: p.category as string, price, cost, stock: Number(p.stock_qty), margin }
    }).sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0)).slice(0, 8)

    // Category quality breakdown
    const categoryMap = new Map<string, { tasks: number; defects: number }>()
    for (const a of analysisRows) {
        const cat = (a.category as string) || "General"
        const prev = categoryMap.get(cat) ?? { tasks: 0, defects: 0 }
        categoryMap.set(cat, { tasks: prev.tasks + 1, defects: prev.defects })
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, d]) => ({
        category: cat,
        tasks: d.tasks,
        defects: d.defects,
        score: d.tasks > 0 ? Math.round(((d.tasks - d.defects) / d.tasks) * 100) : 100,
    }))

    // Monthly trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyMap: Record<string, any> = {};
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const m = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const key = d.toISOString().substring(0, 7);
        monthlyMap[key] = { month: m, key, totalTasks: 0, completed: 0, defects: 0, pending: 0 };
    }

    billRows.forEach(b => {
        const d = new Date(b.created_at);
        if (d >= sixMonthsAgo) {
            const key = d.toISOString().substring(0, 7);
            if (monthlyMap[key]) {
                monthlyMap[key].totalTasks++;
                if (b.status === "paid") monthlyMap[key].completed++;
                if (b.status === "cancelled") monthlyMap[key].defects++;
                if (b.status === "draft") monthlyMap[key].pending++;
            }
        }
    });

    const monthlyQualityRows = Object.values(monthlyMap).sort((a: any, b: any) => a.key.localeCompare(b.key));

    const monthly = monthlyQualityRows.map((r) => ({
        month: r.month as string,
        totalTasks: Number(r.totalTasks),
        completed: Number(r.completed),
        defects: Number(r.defects),
        pending: Number(r.pending),
        score: Number(r.totalTasks) > 0
            ? Math.round(((Number(r.totalTasks) - Number(r.defects)) / Number(r.totalTasks)) * 100)
            : 100,
    }))

    // Recent analysis queries as "audit log"
    const recentAnalyses = analysisRows.slice(0, 6).map((a) => ({
        query: a.query as string,
        category: (a.category as string) || "General",
        date: new Date(a.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    }))

    const kpis = { totalTasks, totalSamples, defects, fatalErrors, qualityScore, paidBills }

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <DashboardHeader
                title="Quality Dashboard"
                subtitle="Real-time quality metrics computed from your actual business operations"
            />
            <main className="flex-1 overflow-y-auto p-6">
                <QualityDashboardClient
                    kpis={kpis}
                    monthly={monthly}
                    productsWithMargin={productsWithMargin}
                    categoryBreakdown={categoryBreakdown}
                    recentAnalyses={recentAnalyses}
                    totalProducts={productRows.length}
                    totalAnalyses={analysisRows.length}
                />
            </main>
        </div>
    )
}
