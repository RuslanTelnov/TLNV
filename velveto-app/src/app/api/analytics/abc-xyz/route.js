import { NextResponse } from 'next/server'

const BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

export const dynamic = 'force-dynamic';

export async function GET() {
    const LOGIN = process.env.MOYSKLAD_LOGIN
    const PASSWORD = process.env.MOYSKLAD_PASSWORD

    if (!LOGIN || !PASSWORD) {
        return NextResponse.json({ error: "Missing MoySklad credentials" }, { status: 500 })
    }

    const authHeader = `Basic ${Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64')}`

    try {
        // Fetch last 500 orders for better statistics
        const url = `${BASE_URL}/entity/customerorder?limit=500&order=created,desc&search=kaspi&expand=positions,positions.assortment`

        const response = await fetch(url, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            next: { revalidate: 3600 } // Cache for 1 hour for analytics
        })

        if (!response.ok) {
            const errText = await response.text();
            console.error('MS API Error:', errText);
            return NextResponse.json({ error: `MS API Error: ${response.status}` }, { status: response.status })
        }

        const data = await response.json()
        const orders = data.rows || []

        const productStats = {}

        orders.forEach(order => {
            const positions = order.positions?.rows || []
            const date = order.created.split(' ')[0]

            positions.forEach(pos => {
                const sku = pos.assortment?.article || pos.assortment?.code || 'N/A'
                const name = pos.assortment?.name || 'Unknown'
                const price = (pos.price || 0) / 100
                const qty = pos.quantity || 0
                const revenue = price * qty

                if (!productStats[sku]) {
                    productStats[sku] = {
                        sku,
                        name,
                        revenue: 0,
                        quantity: 0,
                        orders: 0,
                        salesDays: new Set()
                    }
                }

                productStats[sku].revenue += revenue
                productStats[sku].quantity += qty
                productStats[sku].orders += 1
                productStats[sku].salesDays.add(date)
            })
        })

        const products = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)

        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
        let cumulativeRevenue = 0

        // Assign ABC
        products.forEach(p => {
            cumulativeRevenue += p.revenue
            const ratio = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0
            if (ratio <= 80) p.abc = 'A'
            else if (ratio <= 95) p.abc = 'B'
            else p.abc = 'C'
        })

        // Assign XYZ (simplified)
        products.forEach(p => {
            const daysCount = p.salesDays.size
            if (daysCount > 10) p.xyz = 'X'
            else if (daysCount > 3) p.xyz = 'Y'
            else p.xyz = 'Z'

            // Clean up Set for JSON
            delete p.salesDays
        })

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalOrders: orders.length,
                totalProducts: products.length
            },
            products
        })

    } catch (error) {
        console.error('Analytics API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
