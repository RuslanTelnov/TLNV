import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const status = {
        supabase: 'checking',
        moysklad: 'checking',
        wildberries: 'checking',
        kaspi: 'checking'
    };

    // 1. Check Supabase
    try {
        const { error } = await supabase.from('wb_search_results').select('id').limit(1);
        status.supabase = error ? 'error' : 'ok';
    } catch (e) {
        status.supabase = 'error';
    }

    // 2. Check MoySklad (Auth)
    try {
        const login = process.env.MOYSKLAD_LOGIN;
        const password = process.env.MOYSKLAD_PASSWORD;
        const auth = Buffer.from(`${login}:${password}`).toString('base64');

        const msRes = await fetch('https://api.moysklad.ru/api/remap/1.2/entity/product?limit=1', {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        status.moysklad = msRes.ok ? 'ok' : 'error';
    } catch (e) {
        status.moysklad = 'error';
    }

    // 3. Check Wildberries (Public Ping)
    try {
        // WB often blocks backend requests, so we might need a simpler check or accept 'unknown'
        // Let's try to fetch a public page head
        const wbRes = await fetch('https://www.wildberries.ru', { method: 'HEAD', cache: 'no-store' });
        // 403 is common for bots, but means it's alive. 5xx is bad.
        status.wildberries = (wbRes.status < 500) ? 'ok' : 'error';
    } catch (e) {
        // Fetch failure usually means network or total block
        status.wildberries = 'warning';
    }

    // 4. Check Kaspi (Public Ping)
    try {
        const kaspiRes = await fetch('https://kaspi.kz/shop/c/categories/', {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        status.kaspi = (kaspiRes.status < 500) ? 'ok' : 'error';
    } catch (e) {
        status.kaspi = 'warning';
    }

    return NextResponse.json(status);
}
