"use client"

import { useState, useRef } from "react"
import { CellMap } from "@/types"
import { useSheet } from "@/hooks/useSheet"

interface GridProps {
    docId: string
    setSaveStatus: (status: "saved" | "saving" | "error") => void
    activeCell: string
    setActiveCell: (cellId: string) => void
    setActiveCellRaw: (raw: string) => void
}

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

export default function Grid({ setSaveStatus, activeCell, setActiveCell, setActiveCellRaw }: GridProps) {
    const [rowCount, setRowCount] = useState(100)
    const [focusedCell, setFocusedCell] = useState<string | null>(null)
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
    const { cells, updateCell, getCellDisplay } = useSheet()

    const ROWS = Array.from({ length: rowCount }, (_, i) => i + 1)

    const getCellId = (col: string, row: number) => `${col}${row}`

    const handleFocus = (cellId: string) => {
        setFocusedCell(cellId)
        setActiveCell(cellId)
        setActiveCellRaw(cells[cellId]?.raw ?? "")
    }

    const handleChange = (cellId: string, value: string) => {
        updateCell(cellId, value)
        setActiveCellRaw(value)
    }

    const handleBlur = (cellId: string) => {
        setFocusedCell(null)
        // Firebase sync wired in Phase 4
        setSaveStatus("saved")
    }

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        col: string,
        row: number
    ) => {
        const colIndex = COLUMNS.indexOf(col)

        const moveTo = (nextCol: string, nextRow: number) => {
            if (nextRow < 1 || nextRow > rowCount) return
            if (!COLUMNS.includes(nextCol)) return
            const nextId = getCellId(nextCol, nextRow)
            inputRefs.current[nextId]?.focus()
        }

        switch (e.key) {
            case "Enter":
                e.preventDefault()
                moveTo(col, row + 1)
                break
            case "Tab":
                e.preventDefault()
                if (colIndex < COLUMNS.length - 1) {
                    moveTo(COLUMNS[colIndex + 1], row)
                }
                break
            case "ArrowUp":
                e.preventDefault()
                moveTo(col, row - 1)
                break
            case "ArrowDown":
                e.preventDefault()
                moveTo(col, row + 1)
                break
            case "ArrowLeft":
                if ((e.target as HTMLInputElement).selectionStart === 0) {
                    e.preventDefault()
                    moveTo(COLUMNS[colIndex - 1], row)
                }
                break
            case "ArrowRight":
                const input = e.target as HTMLInputElement
                if (input.selectionStart === input.value.length) {
                    e.preventDefault()
                    moveTo(COLUMNS[colIndex + 1], row)
                }
                break
            case "Escape":
                e.preventDefault()
                inputRefs.current[getCellId(col, row)]?.blur()
                break
        }
    }

    return (
        <div className="h-full overflow-auto bg-white select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="border-collapse table-fixed">
                <thead className="sticky top-0 z-20">
                    <tr>
                        <th className="w-10 min-w-10 h-7 bg-[#f8f9fa] border-r border-b border-gray-200 sticky left-0 z-30" />
                        {COLUMNS.map((col) => (
                            <th
                                key={col}
                                className="w-24 min-w-24 h-7 bg-[#f8f9fa] border-r border-b border-gray-200 text-xs font-medium text-gray-500 text-center"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {ROWS.map((row) => (
                        <tr key={row}>
                            <td className="w-10 min-w-10 h-7 bg-[#f8f9fa] border-r border-b border-gray-200 text-xs text-gray-400 text-center sticky left-0 z-10">
                                {row}
                            </td>

                            {COLUMNS.map((col) => {
                                const cellId = getCellId(col, row)
                                const isActive = activeCell === cellId
                                const isFocused = focusedCell === cellId
                                const displayValue = getCellDisplay(cellId, isFocused)

                                return (
                                    <td
                                        key={cellId}
                                        className={`relative w-24 min-w-24 h-7 border-r border-b border-gray-200 p-0
                                        ${isActive ? "outline outline-blue-500 -outline-offset-1 z-10" : ""}
                                        `}
                                    >
                                        <input
                                            ref={(el) => { inputRefs.current[cellId] = el }}
                                            value={displayValue}
                                            onFocus={() => handleFocus(cellId)}
                                            onChange={(e) => handleChange(cellId, e.target.value)}
                                            onBlur={() => handleBlur(cellId)}
                                            onKeyDown={(e) => handleKeyDown(e, col, row)}
                                            className="w-full h-full px-1 text-xs font-mono text-gray-800 bg-transparent outline-none"
                                        />
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex items-center justify-center py-3 border-t border-gray-200">
                <button
                    onClick={() => setRowCount((prev) => prev + 100)}
                    className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 px-4 py-1.5 rounded transition-colors"
                >
                    + Add 100 more rows
                </button>
            </div>
        </div>
    )
}