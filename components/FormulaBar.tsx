"use client"

interface FormulaBarProps {
    activeCellId: string
    rawValue: string
    onChange: (value: string) => void
    onCommit: () => void
}

export default function FormulaBar({ activeCellId, rawValue, onChange, onCommit }: FormulaBarProps) {
    return (
        <div className="h-10 flex-shrink-0 flex items-center border-b border-gray-200 bg-white">
            <div className="w-16 h-full flex items-center justify-center border-r border-white/[0.08] flex-shrink-0">
                <span className="text-gray-400 text-xs font-mono">{activeCellId}</span>
            </div>

            <input
                value={rawValue}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onCommit()
                }}
                className="flex-1 h-full px-3 bg-transparent text-gray-800 text-xs font-mono outline-none placeholder-gray-300"
                placeholder="Enter a value or formula"
            />
        </div>
    )
}