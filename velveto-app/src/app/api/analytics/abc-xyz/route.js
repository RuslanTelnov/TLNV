import { NextResponse } from 'next/server'

const BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

export const dynamic = 'force-dynamic'

export async function GET() {
    const LOGIN = process.env.MOYSKLAD_LOGIN
    const PASSWORD = process.env.MOYSKLAD_PASSWORD

    if (!LOGIN || !PASSWORD) {
        return NextResponse.json({ error: "Missing MoySklad credentials" }, { status: 500 })
    }

    const authHeader = `Basic ${Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64')}`

    try {
        // We will fetch 3 pages of 100 orders each to get a good sample size (300 orders)
        // This is more reliable than asking for 500 at once which might skip expansions
        let allOrders = []
        const pagesToFetch = 3

        for (let i = 0; i < pagesToFetch; i++) {
            const offset = i * 100
            const url = `${BASE_URL}/entity/customerorder?limit=100&offset=${offset}&order=created,desc&search=kaspi&expand=positions,positions.assortment`

            const response = await fetch(url, {
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                next: { revalidate: 3600 }
            })

            if (!response.ok) {
                console.error(`MS API Error on page ${i}:`, response.status)
                break
            }

            const data = await response.json()
            const rows = data.rows || []
            if (rows.length === 0) break
            allOrders = [...allOrders, ...rows]
        }

        const productStats = {}

        allOrders.forEach(order => {
            // MoySklad can return positions differently if not fully expanded or empty
            const positions = order.positions?.rows || []
            const date = order.created ? order.created.split(' ')[0] : 'Unknown'

            positions.forEach(pos => {
                // Ensure we have assortment data
                const assortment = pos.assortment
                if (!assortment) return

                const sku = assortment.article || assortment.code || 'N/A'
                const name = assortment.name || 'Unknown'
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

        // Assign XYZ
        products.forEach(p => {
            const daysCount = p.salesDays.size
            if (daysCount > 10) p.xyz = 'X'
            else if (daysCount > 3) p.xyz = 'Y'
            else p.xyz = 'Z'

            delete p.salesDays
        })

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalOrders: allOrders.length,
                totalProducts: products.length,
                fetchedPages: pagesToFetch
            },
            products
        })

    } catch (error) {
        console.error('Analytics API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
