'use client';

import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: number;
    total: number;
    color: 'green' | 'blue' | 'yellow' | 'red' | 'indigo';
    icon: 'check' | 'progress' | 'clock' | 'blocked' | 'chart';
    subtitle?: string;
}

const COLOR_MAP = {
    green:  { bg: 'bg-green-50',  icon: 'bg-green-500',  text: 'text-green-700',  bar: 'bg-green-500' },
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-700',   bar: 'bg-blue-500' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-700', bar: 'bg-yellow-500' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-500',    text: 'text-red-700',    bar: 'bg-red-500' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-700', bar: 'bg-indigo-500' }
};

const ICONS = {
    check: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    ),
    progress: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    clock: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    blocked: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
    chart: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    )
};

export function KpiCard({ title, value, total, color, icon, subtitle }: KpiCardProps) {
    const c = COLOR_MAP[color];
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className={cn('card p-5', c.bg)}>
            <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
                    {ICONS[icon]}
                </div>
                <span className={cn('text-xs font-medium', c.text)}>{pct}%</span>
            </div>
            <div className={cn('text-3xl font-bold mb-0.5', c.text)}>{value}</div>
            <div className="text-sm font-medium text-gray-700">{title}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
            {total > 0 && (
                <div className="mt-3 w-full bg-white bg-opacity-60 rounded-full h-1.5">
                    <div
                        className={cn('h-1.5 rounded-full transition-all', c.bar)}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}
