"use client"

import { CellMap } from "@/types";
import { useState, useCallback } from "react";
import { computeCell } from "@/lib/formulaParser";

interface UseSheetReturn {
    cells: CellMap
    updateCell: (cellId: string, raw: string) => void
    getCellDisplay: (cellId: string, isFocused: boolean) => string
    loadCells: (initialCells: CellMap) => void
}

export function useSheet() {
    const [cells, setCells] = useState<CellMap>({})
    // Called once when the sheet loads from Firestore
    // Sets the initial cell state and computes all formulas
    const loadCells = useCallback((initialCells: CellMap) => {
        setCells(initialCells)
    }, [])
    // Called every time a cell value changes
    // Updates that cell AND recomputes any other cells that have formulas
    const updateCell = useCallback((cellId: string, raw: string) => {
        setCells((prev) => {
            const next = { ...prev }

            if (raw === "") {
                // Delete empty cells to save memory since they dont exist in the mao
                delete next[cellId]
            } else {
                // Store both raw and computed value for each cell
                next[cellId] = { raw, computed: computeCell(raw, prev) }
            }
            // Recompute all other cells that have a formula
            // since they might depend on the updated cell
            Object.keys(next).forEach((id) => {
                if (id !== cellId && next[id].raw.startsWith("=")) {
                    next[id] = { ...next[id], computed: computeCell(next[id].raw, next) }
                }
            })

            return next
        })
    }, [])
    // Returns the value to display in the cell: 
    // either the raw input (if focused) or the computed value (if not focused)
    const getCellDisplay = useCallback(
        (cellId: string, isFocused: boolean): string => {
            if (isFocused) return cells?.[cellId]?.raw ?? ""
            return cells?.[cellId]?.computed ?? ""
        }, 
        [cells]
    )

    return {
        cells,
        updateCell,
        getCellDisplay,
        loadCells
    }
}