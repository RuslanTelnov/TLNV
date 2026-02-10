import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

export async function GET() {
    try {
        const scriptPath = path.join(process.cwd(), 'automation/moysklad/get_ms_kaspi_orders.py')
        const pythonPath = 'python3' // Assume python3 is in path

        const { stdout, stderr } = await execPromise(`${pythonPath} ${scriptPath}`)

        if (stderr && !stdout) {
            console.error('Python Error:', stderr)
            return NextResponse.json({ error: 'Failed to fetch orders from script' }, { status: 500 })
        }

        try {
            const data = JSON.parse(stdout)
            return NextResponse.json(data)
        } catch (e) {
            console.error('JSON Parse Error:', e, stdout)
            return NextResponse.json({ error: 'Invalid data format from script' }, { status: 500 })
        }
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error while fetching orders' }, { status: 500 })
    }
}
