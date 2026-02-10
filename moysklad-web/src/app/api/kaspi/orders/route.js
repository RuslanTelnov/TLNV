import { NextResponse } from 'next/server'

const BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
const WB_STORE_ID = "6c721ced-f052-11f0-0a80-03a50013dad7"

export async function GET() {
    const LOGIN = process.env.MOYSKLAD_LOGIN
    const PASSWORD = process.env.MOYSKLAD_PASSWORD

    if (!LOGIN || !PASSWORD) {
        return NextResponse.json({ error: "Missing MoySklad credentials" }, { status: 500 })
    }

    const authHeader = `Basic ${Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64')}`

    try {
        const url = `${BASE_URL}/entity/customerorder?limit=100&order=created,desc&expand=positions,positions.assortment,state,store`

        const response = await fetch(url, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            return NextResponse.json({ error: `MS API Error: ${response.status}` }, { status: response.status })
        }

        const data = await response.json()
        const orders = data.rows || []

        const formattedOrders = orders
            .filter(order => {
                const code = (order.code || '').toLowerCase()
                const extCode = (order.externalCode || '').toLowerCase()
                const description = (order.description || '').toLowerCase()
                return code.includes('kaspi') || extCode.includes('kaspi') || description.includes('kaspi')
            })
            .map(order => {
                // Identify warehouse
                const storeHref = order.store?.meta?.href || ''
                const warehouse = storeHref.includes(WB_STORE_ID) ? "PP1" : "OTHER"

                // Extract customer name
                let customerName = "Kaspi Customer"
                if (order.description && order.description.includes("Покупатель:")) {
                    try {
                        const parts = order.description.split("Покупатель:")
                        customerName = parts[1].split(",")[0].trim()
                    } catch (e) { }
                }

                // Format entries
                const entries = (order.positions?.rows || []).map(pos => ({
                    name: pos.assortment?.name || 'Unknown Product',
                    quantity: parseInt(pos.quantity || 0),
                    sku: pos.assortment?.article || pos.assortment?.code || 'N/A'
                }))

                return {
                    id: order.id,
                    code: order.name, // Kaspi ID is usually in the "Name" field in MS
                    creation_date: order.created,
                    status: order.state?.name || 'UNKNOWN',
                    total_price: (order.sum || 0) / 100.0,
                    customer_name: customerName,
                    warehouse: warehouse,
                    entries: entries
                }
            })

        return NextResponse.json(formattedOrders)

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error while fetching orders' }, { status: 500 })
    }
}
