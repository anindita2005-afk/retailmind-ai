/**
 * RetailMind RAG Engine
 * ─────────────────────
 * AWS-native Retrieval-Augmented Generation using DynamoDB as the knowledge base.
 * No vector database needed — your data is already structured.
 *
 * Flow:
 *   1. detectIntents()  — keyword analysis of user message → list of intents
 *   2. fetchContext()   — parallel DynamoDB queries for each intent
 *   3. buildRAGContext() — returns a rich context string injected into the AI prompt
 */

import { db, TABLE_PREFIX } from "./dynamodb"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"

// ── Intent types ─────────────────────────────────────────────────────────────
type Intent = "inventory" | "sales" | "orders" | "financial" | "products_detail" | "general"

// ── Intent Detection — keyword-based NLU ─────────────────────────────────────
export function detectIntents(message: string): Intent[] {
    const m = message.toLowerCase()
    const intents = new Set<Intent>()

    // Inventory / stock signals
    if (/\b(stock|inventory|product|item|sku|quantity|qty|unit|reorder|low stock|out of stock|available|storage|warehouse)\b/.test(m))
        intents.add("inventory")

    // Sales / revenue signals
    if (/\b(sale|sold|revenue|earning|income|turnover|best sell|top sell|profit|performance|how much did I make|how many did I sell)\b/.test(m))
        intents.add("sales")

    // Financial / GST signals
    if (/\b(gst|tax|margin|financial|summary|total|monthly|weekly|daily|growth|loss|net|gross|invoice|subtotal|balance|cashflow)\b/.test(m))
        intents.add("financial")

    // Orders / customer orders signals
    if (/\b(order|pending|fulfil|confirm|deliver|shipment|customer order|store order|online order|dispatch)\b/.test(m))
        intents.add("orders")

    // Bills / invoices signals  
    if (/\b(bill|invoice|paid|draft|cancel|receipt|client|customer)\b/.test(m)) {
        intents.add("sales")   // bills data is in the sales context
        intents.add("financial")
    }

    // Product detail signals
    if (/\b(category|brand|price|cost|gst rate|profit margin|markup|which product|what product|product list|all product)\b/.test(m))
        intents.add("products_detail")

    return intents.size > 0 ? Array.from(intents) : ["general"]
}

// ── Context Fetchers ──────────────────────────────────────────────────────────

async function fetchInventoryContext(userId: string): Promise<string> {
    const res = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Products`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
    }))

    const products = res.Items || []
    if (!products.length) return "INVENTORY: No products found in your inventory."

    const totalStockValue = products.reduce((s, p) =>
        s + (Number(p.price || 0) * Number(p.stock_qty || 0)), 0)
    const totalCostValue = products.reduce((s, p) =>
        s + (Number(p.cost_price || 0) * Number(p.stock_qty || 0)), 0)

    const lowStock = products.filter(p => Number(p.stock_qty) > 0 && Number(p.stock_qty) <= 10)
        .sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty))
    const outOfStock = products.filter(p => Number(p.stock_qty) <= 0)
    const inStock = products.filter(p => Number(p.stock_qty) > 10)

    // Category breakdown
    const catMap: Record<string, number> = {}
    products.forEach(p => {
        const cat = p.category || "Uncategorised"
        catMap[cat] = (catMap[cat] || 0) + 1
    })

    const lines: string[] = [
        `=== LIVE INVENTORY DATA (${new Date().toLocaleDateString("en-IN")}) ===`,
        `Total Products: ${products.length}`,
        `In Stock (healthy): ${inStock.length}`,
        `Low Stock (≤10 units): ${lowStock.length}`,
        `Out of Stock: ${outOfStock.length}`,
        `Total Stock Value (at selling price): ₹${totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Total Stock Value (at cost): ₹${totalCostValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        "",
        "--- Category Breakdown ---",
        ...Object.entries(catMap).map(([cat, count]) => `  ${cat}: ${count} products`),
    ]

    if (outOfStock.length) {
        lines.push("", "--- OUT OF STOCK (requires immediate reorder) ---")
        outOfStock.slice(0, 15).forEach(p =>
            lines.push(`  ❌ ${p.name} | Category: ${p.category || "N/A"} | Cost: ₹${p.cost_price || "N/A"} | Price: ₹${p.price}`)
        )
    }

    if (lowStock.length) {
        lines.push("", "--- LOW STOCK ALERT (≤10 units) ---")
        lowStock.slice(0, 15).forEach(p =>
            lines.push(`  ⚠️  ${p.name} | Stock: ${p.stock_qty} units | Price: ₹${p.price} | Category: ${p.category || "N/A"}`)
        )
    }

    lines.push("", "--- All Products ---")
    products.slice(0, 40).forEach(p =>
        lines.push(`  • ${p.name} | Qty: ${p.stock_qty} | Price: ₹${p.price} | Cost: ₹${p.cost_price || "N/A"} | GST: ${p.gst_rate || 18}% | Unit: ${p.unit || "pcs"} | Category: ${p.category || "N/A"}`)
    )

    return lines.join("\n")
}

async function fetchSalesContext(userId: string): Promise<string> {
    const billsRes = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Bills`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
    }))

    const bills = (billsRes.Items || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    if (!bills.length) return "SALES: No bills found."

    const paid = bills.filter(b => b.status === "paid")
    const draft = bills.filter(b => b.status === "draft")
    const cancelled = bills.filter(b => b.status === "cancelled")

    const totalRevenue = paid.reduce((s, b) => s + Number(b.total || 0), 0)
    const totalGST = paid.reduce((s, b) => s + Number(b.gst_amount || 0), 0)
    const totalSubtotal = paid.reduce((s, b) => s + Number(b.subtotal || 0), 0)
    const avgOrder = paid.length ? totalRevenue / paid.length : 0

    // Monthly breakdown (last 6 months)
    const monthlyMap: Record<string, { revenue: number; count: number }> = {}
    paid.forEach(b => {
        const key = new Date(b.created_at).toLocaleString("en-IN", { month: "short", year: "numeric" })
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, count: 0 }
        monthlyMap[key].revenue += Number(b.total || 0)
        monthlyMap[key].count++
    })

    // Unique customers
    const customers = new Set(paid.map(b => b.customer_name).filter(Boolean))

    // Top customers
    const customerRevMap: Record<string, number> = {}
    paid.forEach(b => {
        const c = b.customer_name || "Unknown"
        customerRevMap[c] = (customerRevMap[c] || 0) + Number(b.total || 0)
    })
    const topCustomers = Object.entries(customerRevMap)
        .sort(([, a], [, b]) => b - a).slice(0, 5)

    const lines: string[] = [
        `=== LIVE SALES & REVENUE DATA (${new Date().toLocaleDateString("en-IN")}) ===`,
        `Total Bills: ${bills.length} (Paid: ${paid.length} | Draft: ${draft.length} | Cancelled: ${cancelled.length})`,
        `Total Revenue (paid bills): ₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Total GST Collected: ₹${totalGST.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Net Revenue (excl. GST): ₹${totalSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Average Order Value: ₹${avgOrder.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Unique Customers: ${customers.size}`,
        "",
        "--- Monthly Revenue Breakdown ---",
        ...Object.entries(monthlyMap)
            .slice(-6)
            .map(([m, v]) => `  ${m}: ₹${v.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${v.count} bills)`),
        "",
        "--- Top 5 Customers by Revenue ---",
        ...topCustomers.map(([name, rev]) =>
            `  ${name}: ₹${rev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`),
        "",
        "--- Recent 10 Paid Bills ---",
        ...paid.slice(0, 10).map(b =>
            `  • ${b.customer_name || "N/A"} | ₹${Number(b.total).toLocaleString("en-IN")} | ${new Date(b.created_at).toLocaleDateString("en-IN")} | Bill ID: ${b.id?.slice(0, 8)}`
        ),
    ]

    return lines.join("\n")
}

async function fetchProductSalesContext(userId: string): Promise<string> {
    // Fetch all bills first to get their items
    const billsRes = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Bills`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
    }))

    const paidBills = (billsRes.Items || []).filter(b => b.status === "paid")
    if (!paidBills.length) return ""

    // Aggregate product sales across all paid bill items in parallel
    const productSalesMap: Record<string, { name: string; revenue: number; units: number; category: string }> = {}

    const itemResults = await Promise.all(
        paidBills.slice(0, 50).map(b => // cap at 50 bills to avoid timeout
            db.send(new QueryCommand({
                TableName: `${TABLE_PREFIX}BillItems`,
                KeyConditionExpression: "bill_id = :b",
                ExpressionAttributeValues: { ":b": b.id },
            }))
        )
    )

    itemResults.forEach(res => {
        ; (res.Items || []).forEach(item => {
            const k = item.product_id || item.name
            if (!productSalesMap[k]) productSalesMap[k] = { name: item.name, revenue: 0, units: 0, category: item.category || "N/A" }
            productSalesMap[k].revenue += Number(item.amount || 0)
            productSalesMap[k].units += Number(item.quantity || item.qty || 0)
        })
    })

    const ranked = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)

    if (!ranked.length) return ""

    const lines = [
        "--- Top Selling Products (by revenue) ---",
        ...ranked.slice(0, 15).map((p, i) =>
            `  ${i + 1}. ${p.name} | Revenue: ₹${p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })} | Units Sold: ${p.units}`
        ),
    ]

    return lines.join("\n")
}

async function fetchOrdersContext(userId: string): Promise<string> {
    const res = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}StoreOrders`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
    }))

    const orders = (res.Items || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    if (!orders.length) return "ORDERS: No store orders found."

    const pending = orders.filter(o => o.status === "pending")
    const confirmed = orders.filter(o => o.status === "confirmed")
    const fulfilled = orders.filter(o => o.status === "fulfilled")
    const cancelled = orders.filter(o => o.status === "cancelled")

    const activeRevenue = orders
        .filter(o => o.status !== "cancelled")
        .reduce((s, o) => s + Number(o.total_amount || 0), 0)

    const lines: string[] = [
        `=== LIVE STORE ORDERS DATA (${new Date().toLocaleDateString("en-IN")}) ===`,
        `Total Orders: ${orders.length}`,
        `Pending (needs action): ${pending.length}`,
        `Confirmed (in progress): ${confirmed.length}`,
        `Fulfilled: ${fulfilled.length}`,
        `Cancelled: ${cancelled.length}`,
        `Total Order Revenue (active): ₹${activeRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]

    if (pending.length) {
        lines.push("", "--- ⚠️ Pending Orders (action required) ---")
        pending.slice(0, 10).forEach(o => {
            lines.push(`  • Order #${o.id?.slice(0, 8)} | Customer: ${o.customer_name} | ₹${o.total_amount} | Placed: ${new Date(o.created_at).toLocaleDateString("en-IN")}`)
            if (o.phone) lines.push(`    Phone: ${o.phone}`)
            if (o.address) lines.push(`    Address: ${o.address}`)
        })
    }

    if (confirmed.length) {
        lines.push("", "--- Confirmed Orders (in progress) ---")
        confirmed.slice(0, 5).forEach(o =>
            lines.push(`  • #${o.id?.slice(0, 8)} | ${o.customer_name} | ₹${o.total_amount} | ${new Date(o.created_at).toLocaleDateString("en-IN")}`)
        )
    }

    lines.push("", "--- Recent 10 Orders ---")
    orders.slice(0, 10).forEach(o => {
        lines.push(`  • #${o.id?.slice(0, 8)} | ${o.customer_name} | ₹${o.total_amount} | ${o.status.toUpperCase()} | ${new Date(o.created_at).toLocaleDateString("en-IN")}`)
        const items = (o.items || []) as any[]
        if (items.length) {
            lines.push(`    Items: ${items.map((i: any) => `${i.name} ×${i.quantity}`).join(", ")}`)
        }
    })

    return lines.join("\n")
}

async function fetchFinancialContext(userId: string): Promise<string> {
    // Combines bills + orders for total financial picture
    const [billsRes, ordersRes] = await Promise.all([
        db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}Bills`,
            KeyConditionExpression: "user_id = :u",
            ExpressionAttributeValues: { ":u": userId },
        })),
        db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}StoreOrders`,
            KeyConditionExpression: "user_id = :u",
            ExpressionAttributeValues: { ":u": userId },
        })),
    ])

    const paidBills = (billsRes.Items || []).filter(b => b.status === "paid")
    const activeOrders = (ordersRes.Items || []).filter(o => o.status !== "cancelled")

    const billRevenue = paidBills.reduce((s, b) => s + Number(b.total || 0), 0)
    const billGST = paidBills.reduce((s, b) => s + Number(b.gst_amount || 0), 0)
    const orderRevenue = activeOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
    const totalRevenue = billRevenue + orderRevenue

    // Weekly breakdown (last 4 weeks)
    const weeklyMap: Record<string, number> = {}
    const now = Date.now()
    paidBills.forEach(b => {
        const daysAgo = Math.floor((now - new Date(b.created_at).getTime()) / 86400000)
        if (daysAgo <= 28) {
            const week = `Week ${Math.floor(daysAgo / 7) + 1} ago`
            weeklyMap[week] = (weeklyMap[week] || 0) + Number(b.total || 0)
        }
    })

    const lines = [
        `=== FINANCIAL SUMMARY (${new Date().toLocaleDateString("en-IN")}) ===`,
        `Total Revenue (bills + orders): ₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `  From Paid Bills: ₹${billRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `  From Store Orders: ₹${orderRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `GST Collected: ₹${billGST.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Net Revenue (after GST): ₹${(billRevenue - billGST).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Total Paid Bills: ${paidBills.length}`,
        `Total Active Orders: ${activeOrders.length}`,
        "",
        "--- Weekly Revenue (last 4 weeks from bills) ---",
        ...Object.entries(weeklyMap).map(([w, rev]) =>
            `  ${w}: ₹${rev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`),
    ]

    return lines.join("\n")
}

// ── Main RAG Orchestrator ─────────────────────────────────────────────────────
export async function buildRAGContext(message: string, userId: string): Promise<string> {
    const intents = detectIntents(message)

    if (intents.includes("general") && intents.length === 1) return ""

    const usedIntents = new Set(intents)
    const contextParts: string[] = []

    // Run all needed fetches in parallel for speed
    const tasks: Promise<void>[] = []

    if (usedIntents.has("inventory") || usedIntents.has("products_detail")) {
        tasks.push(
            fetchInventoryContext(userId)
                .then(ctx => { if (ctx) contextParts.push(ctx) })
                .catch(e => console.error("[RAG] inventory fetch failed:", e))
        )
    }

    if (usedIntents.has("sales") || usedIntents.has("financial")) {
        tasks.push(
            fetchSalesContext(userId)
                .then(ctx => { if (ctx) contextParts.push(ctx) })
                .catch(e => console.error("[RAG] sales fetch failed:", e)),
            fetchProductSalesContext(userId)
                .then(ctx => { if (ctx) contextParts.push(ctx) })
                .catch(e => console.error("[RAG] product sales fetch failed:", e))
        )
    }

    if (usedIntents.has("financial")) {
        tasks.push(
            fetchFinancialContext(userId)
                .then(ctx => { if (ctx) contextParts.push(ctx) })
                .catch(e => console.error("[RAG] financial fetch failed:", e))
        )
    }

    if (usedIntents.has("orders")) {
        tasks.push(
            fetchOrdersContext(userId)
                .then(ctx => { if (ctx) contextParts.push(ctx) })
                .catch(e => console.error("[RAG] orders fetch failed:", e))
        )
    }

    await Promise.all(tasks)

    if (!contextParts.length) return ""

    return [
        "=".repeat(60),
        "RETRIEVED BUSINESS CONTEXT (from your live DynamoDB database)",
        "Use this real data to answer the user's question accurately.",
        "=".repeat(60),
        "",
        contextParts.join("\n\n"),
        "",
        "=".repeat(60),
        "Answer based on the above real data. Be specific with numbers.",
        "=".repeat(60),
    ].join("\n")
}
