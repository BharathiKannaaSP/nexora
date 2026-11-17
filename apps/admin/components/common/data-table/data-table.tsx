"use client"

import {
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"
import type { ReactNode } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nexora/ui/components/table"
import { cn } from "@nexora/ui/lib/utils"

export const dataTableFeatures = tableFeatures({})
export type DataTableFeatures = typeof dataTableFeatures
export type DataTableColumn<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData
>

/** Column helper typed for DataTable. */
export const createDataTableColumns = <TData extends RowData>() =>
  createColumnHelper<DataTableFeatures, TData>()

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  getRowId: (row: TData) => string
  /** Classes per column id, e.g. { actions: "w-24 text-end" }. */
  columnClassNames?: Record<string, string>
  /** Shown in place of rows when `data` is empty. */
  emptyState?: ReactNode
  /** Dims the rows while new data loads. */
  pending?: boolean
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  columnClassNames = {},
  emptyState,
  pending = false,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: (row) => getRowId(row),
  })
  const rows = table.getRowModel().rows

  return (
    <div
      aria-busy={pending || undefined}
      className={cn(
        "overflow-x-auto rounded-lg border transition-opacity",
        pending && "opacity-60"
      )}
    >
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  scope="col"
                  className={cn(
                    "px-4 text-xs font-medium text-muted-foreground",
                    columnClassNames[header.column.id]
                  )}
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length}>{emptyState}</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-4 py-4",
                      columnClassNames[cell.column.id]
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
