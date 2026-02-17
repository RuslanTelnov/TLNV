'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export const OnboardingTour = () => {
    useEffect(() => {
        const hasCompletedTour = localStorage.getItem('hasCompletedVelvetoTour')

        if (!hasCompletedTour) {
            const driverObj = driver({
                showProgress: true,
                steps: [
                    {
                        element: '#tour-logo',
                        popover: {
                            title: 'Добро пожаловать в VELVETO!',
                            description: 'Это ваша главная панель управления автоматизацией маркетплейсов.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-kaspi',
                        popover: {
                            title: 'Заказы Kaspi',
                            description: 'Здесь вы можете отслеживать новые заказы и управлять ими в режиме реального времени.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-tools',
                        popover: {
                            title: 'Инструменты управления',
                            description: 'Генерация контента через ИИ, управление номенклатурами WB и МойСклад.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-analytics',
                        popover: {
                            title: 'Аналитика',
                            description: 'ABC/XYZ анализ и мониторинг топовых товаров для принятия верных бизнес-решений.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-settings',
                        popover: {
                            title: 'Настройки',
                            description: 'Здесь можно настроить ключи API и параметры системы.',
                            side: "left",
                            align: 'center'
                        }
                    }
                ],
                nextBtnText: 'Далее',
                prevBtnText: 'Назад',
                doneBtnText: 'Готово',
                onDestroyStarted: () => {
                    localStorage.setItem('hasCompletedVelvetoTour', 'true')
                    driverObj.destroy()
                }
            })

            const timer = setTimeout(() => {
                driverObj.drive()
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [])

    return null
}
