
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
        <div className={`bg-[#e8ece8] border border-[#a0b0a0] rounded-sm shadow-md flex flex-col ${className}`}>
            {title && (
                <div className="border-b border-[#a0b0a0] px-2 py-1 flex justify-between items-center shrink-0 h-8" 
                     style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
                    <span className="text-[#1a1a1a] font-bold text-[11px] tracking-tight uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</span>
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
    let baseStyles = "px-3 py-1.5 text-[10px] font-bold tracking-wide rounded-[2px] border shadow-sm active:translate-y-px transition-all flex items-center justify-center gap-2 uppercase";
    let variantStyles = "";
    
    switch(variant) {
        case 'primary': 
            variantStyles = "bg-gradient-to-b from-[#3a4a3a] to-[#1a2a1a] border-[#0a1a0a] text-white hover:brightness-110";
            break;
        case 'secondary':
            variantStyles = "bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border-[#a0b0a0] text-[#1a1a1a] hover:brightness-95";
            break;
        case 'danger':
            variantStyles = "bg-gradient-to-b from-[#c04040] to-[#802020] border-[#601010] text-white hover:brightness-110";
            break;
        case 'vacation':
            variantStyles = "bg-gradient-to-b from-[#e0a040] to-[#b07020] border-[#805010] text-white hover:brightness-110";
            break;
    }

    return (
        <button className={`${baseStyles} ${variantStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} style={{ fontFamily: 'Verdana, sans-serif' }} {...props}>
            {children}
        </button>
    );
};

export const FMTable: React.FC<{
    headers: string[];
    children: React.ReactNode;
    colWidths?: string[];
    onHeaderClick?: (index: number) => void;
}> = ({ headers, children, colWidths, onHeaderClick }) => {
    return (
        <div className="w-full h-full overflow-x-auto overflow-y-auto bg-white custom-scroll">
            <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-10 text-[10px] font-bold text-[#1a1a1a] shadow-sm border-b border-[#8c9c8c]"
                       style={{ 
                           background: 'linear-gradient(to bottom, #dbe6db 0%, #aabdaa 100%)',
                           fontFamily: 'Verdana, sans-serif'
                       }}>
                    <tr>
                        {headers.map((h, i) => (
                            <th 
                                key={i} 
                                className={`px-2 py-1.5 whitespace-nowrap border-r border-[#9caea0]/50 last:border-0 uppercase tracking-tighter ${onHeaderClick ? 'cursor-pointer hover:bg-[#9caea0]/40 select-none' : ''}`} 
                                style={{ width: colWidths?.[i] }}
                                onClick={() => onHeaderClick && onHeaderClick(i)}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const FMTableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { isNumber?: boolean }> = ({ children, className = "", isNumber, ...props }) => (
    <td className={`px-2 py-1 whitespace-nowrap border-b border-[#e0e0e0] ${isNumber ? 'font-mono' : 'font-normal'} ${className}`} {...props}>
        {children}
    </td>
);
