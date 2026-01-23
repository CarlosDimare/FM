import React from 'react';

/**
 * FM Industrial Steel Design System
 * Focus: High contrast, technical gray tones, zero white/blue backgrounds.
 */

export const FMBox: React.FC<{ 
    title?: React.ReactNode; 
    children: React.ReactNode; 
    className?: string; 
    noPadding?: boolean;
    headerRight?: React.ReactNode;
}> = ({ title, children, className = "", noPadding = false, headerRight }) => {
    return (
        <div className={`bg-slate-200 border border-slate-500 rounded-sm shadow-md flex flex-col ${className}`}>
            {title && (
                <div className="bg-gradient-to-b from-slate-300 to-slate-400 border-b border-slate-500 px-2 py-1 flex justify-between items-center shrink-0 h-8">
                    <span className="text-slate-950 font-black text-[11px] uppercase tracking-tight">{title}</span>
                    {headerRight && <div>{headerRight}</div>}
                </div>
            )}
            <div className={`flex-1 overflow-hidden ${noPadding ? '' : 'p-2'}`}>
                {children}
            </div>
        </div>
    );
};

export const FMButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'vacation' }> = ({ 
    className = "", variant = 'primary', children, ...props 
}) => {
    let baseStyles = "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm border shadow-sm active:translate-y-px transition-all flex items-center justify-center gap-2";
    let variantStyles = "";
    
    switch(variant) {
        case 'primary': 
            variantStyles = "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-950 text-white hover:from-black hover:to-slate-900";
            break;
        case 'secondary':
            variantStyles = "bg-gradient-to-b from-slate-100 to-slate-300 border-slate-500 text-slate-950 hover:from-slate-200 hover:to-slate-400";
            break;
        case 'danger':
            variantStyles = "bg-gradient-to-b from-red-600 to-red-800 border-red-900 text-white hover:from-red-700 hover:to-red-900";
            break;
        case 'vacation':
            variantStyles = "bg-gradient-to-b from-orange-500 to-orange-600 border-orange-700 text-white hover:from-orange-600 hover:to-orange-700";
            break;
    }

    return (
        <button className={`${baseStyles} ${variantStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} {...props}>
            {children}
        </button>
    );
};

export const FMTable: React.FC<{
    headers: string[];
    children: React.ReactNode;
    colWidths?: string[];
}> = ({ headers, children, colWidths }) => {
    return (
        <div className="w-full h-full overflow-x-auto overflow-y-auto bg-slate-200 custom-scroll">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                <thead className="sticky top-0 bg-slate-300 z-10 text-[9px] uppercase font-black text-slate-800 shadow-sm border-b border-slate-500">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-2 py-2 bg-slate-400/20 whitespace-nowrap" style={{ width: colWidths?.[i] }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-400 text-[11px]">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const FMTableCell: React.FC<{ children: React.ReactNode; className?: string; isNumber?: boolean }> = ({ children, className = "", isNumber }) => (
    <td className={`px-2 py-1.5 whitespace-nowrap ${isNumber ? 'font-mono text-slate-950 font-bold' : 'text-slate-950 font-bold'} ${className}`}>
        {children}
    </td>
);
