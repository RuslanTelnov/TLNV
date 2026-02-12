import { NextResponse } from 'next/server'

const BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const LOGIN = process.env.MOYSKLAD_LOGIN
    const PASSWORD = process.env.MOYSKLAD_PASSWORD

    if (!LOGIN || !PASSWORD) {
        return NextResponse.json({ error: "Missing MoySklad credentials" }, { status: 500 })
    }

    const authHeader = `Basic ${Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64')}`

    try {
        let allOrders = []
        let offset = 0
        const limit = 100
        let hasMore = true
        let totalCount = 0

        // Correct pagination and filtering for MoySklad
        let filterParts = []
        if (from) filterParts.push(`created>=${from} 00:00:00`)
        if (to) filterParts.push(`created<=${to} 23:59:59`)

        const filterStr = filterParts.length > 0 ? `&filter=${encodeURIComponent(filterParts.join(';'))}` : ''

        while (hasMore) {
            const url = `${BASE_URL}/entity/customerorder?limit=${limit}&offset=${offset}&order=created,desc&search=kaspi&expand=positions,positions.assortment${filterStr}`

            const response = await fetch(url, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            })

            if (!response.ok) {
                const errText = await response.text()
                console.error(`MS API Error at offset ${offset}:`, response.status, errText)
                throw new Error(`MoySklad API error: ${response.status}`)
            }

            const data = await response.json()
            const rows = data.rows || []
            allOrders = [...allOrders, ...rows]
            totalCount = data.meta.size

            // Safety cap at 2000 orders to prevent Vercel timeout (10s/30s)
            // 2000 orders with expansions is a lot of data
            if (rows.length < limit || allOrders.length >= 2000 || allOrders.length >= totalCount) {
                hasMore = false
            } else {
                offset += limit
            }
        }

        const productStats = {}

        allOrders.forEach(order => {
            const positions = order.positions?.rows || []
            const date = order.created ? order.created.split(' ')[0] : 'Unknown'

            positions.forEach(pos => {
                const assortment = pos.assortment
                if (!assortment) return

                const sku = assortment.article || assortment.code || assortment.id
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
        // Calculate based on the date range provided or a default 30 days
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
                totalInMS: totalCount,
                dateRange: { from, to }
            },
            products
        })

    } catch (error) {
        console.error('Analytics API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
