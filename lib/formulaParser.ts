import { CellMap } from "@/types";
import { exp } from "firebase/firestore/pipelines";

export function computeCell(raw: string, cells: CellMap, computing: Set<string> = new Set()): string {
    // No formula, return as is
    if (!raw.startsWith("=")) return raw;
    // Strip the leading '=' and trim whitespace
    let expr = raw.slice(1).trim().toUpperCase();

    // Helper funciton for expanding cell range like A1:B2 into A1, A2, B1, B2
    const expandRange = (start: string, end: string): string[] => {
        const startCol = start.match(/[A-Z]+/)?.[0] || ""
        const startRow = parseInt(start.match(/\d+/)?.[0] || "0")
        const endCol = end.match(/[A-Z]+/)?.[0] || ""
        const endRow = parseInt(end.match(/\d+/)?.[0] || "0")

        const cells: string[] = []
        for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
            const col = String.fromCharCode(c)
            for (let row = startRow; row <= endRow; row++) {
                cells.push(`${col}${row}`)
            }
        }

        return cells
    }
    // expanding SUM ranges into their computed sum
    expr = expr.replace(/([A-Z]+[0-9]+):([A-Z]+[0-9]+)/g, (_, start, end) => {
        const cellIds = expandRange(start, end)
        const sum = cellIds.reduce((total, cellId) => {
            // Recursively compute each cell in the range
            const val = parseFloat(computeCell(cells[cellId]?.raw ?? "0", cells, new Set([...computing, cellId])))
            return total + (isNaN(val) ? 0 : val)
        }, 0)
        return String(sum)
    })
    // Resolving remaining cell references
    expr = expr.replace(/[A-Z]+\d+/g, (cellId) => {
        // If cell is already being computed, we have a circular reference
        if (computing.has(cellId)) return "#CIRC"

        const cellRaw = cells[cellId]?.raw ?? "0"
        // Recursively compute the referenced cell
        // Passing a new Set with the current cell added to track the computation path
        const result = computeCell(cellRaw, cells, new Set([...computing, cellId]))
        // If referenced cell has an error, propagate it
        if (result.startsWith("#")) return result

        return result
    })
    // If any error occurred during cell reference, return the error
    if (expr.includes("#CIRC")) return "#CIRC"
    if (expr.includes("#ERROR")) return "#ERROR"
    if (expr.includes("#DIV/0!")) return "#DIV/0!"
    if (expr.includes("#VALUE")) return "#VALUE"

    try {
        // Function() is safer than eval() as it runs in strict mode
        const result = Function(`"use strict"; return (${expr})`)()

        if (result === null || result === undefined) return "#ERROR"
        if (typeof result === "boolean") return String(result)
        if (!isFinite(result)) return "#DIV/0!"
        if (isNaN(result)) return "#ERROR"
        // Round to 10 decimal places to avoid floating point issues
        return String(Math.round(result * 1e10) / 1e10)
    } catch {
        return "#ERROR"
    }
}