import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@nexora/ui/components/accordion"
import { Checkbox } from "@nexora/ui/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nexora/ui/components/table"
import { cn } from "@nexora/ui/lib/utils"
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { memo, useMemo } from "react"
import { ControllerRenderProps } from "react-hook-form"
import { FieldConfig, PermissionMatrixConfig, SelectOption } from "./form-types"

type PermissionValue = Record<string, Record<string, string[]> | undefined>
type GroupPermissions = Record<string, string[]>

const features = tableFeatures({})
const columnHelper = createColumnHelper<typeof features, SelectOption>()
const MODULE_COLUMN_ID = "module"

/**
 * An accordion item per group (e.g. a country), each holding a table with a
 * row per module and a column per action, plus a header checkbox that ticks
 * the whole column. The value is { [group]: { [module]: action[] } }; errors
 * come per group, e.g. errors.permissions.IN.
 */
export const PermissionMatrixField = memo(function PermissionMatrixField({
  field,
  fieldConfig,
  labelId,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  fieldConfig: FieldConfig
  labelId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any
}) {
  const matrix = fieldConfig.permissionMatrix
  const firstGroup = matrix?.groups[0]
  if (!matrix || !firstGroup) return null
  const value: PermissionValue = field.value ?? {}

  return (
    <div role="group" aria-labelledby={labelId} className="min-w-0">
      {/* The first group starts open; several can be open at once. */}
      <Accordion multiple defaultValue={[firstGroup.value]} className="gap-3">
        {matrix.groups.map((group) => {
          const groupValue = value[group.value] ?? {}
          const selectedCount = matrix.modules.filter(
            ({ value: module }) => (groupValue[module]?.length ?? 0) > 0
          ).length
          const groupError: string | undefined = error?.[group.value]?.message

          return (
            <AccordionItem
              key={group.value}
              value={group.value}
              className={cn(
                "rounded-lg border not-last:border-b",
                groupError && "border-destructive"
              )}
            >
              <AccordionTrigger className="items-center p-4 hover:no-underline">
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{group.label}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-normal text-emerald-700 dark:text-emerald-400">
                    {matrix.selectedCountLabel(selectedCount)}
                  </span>
                </span>
              </AccordionTrigger>

              {/* Outside the panel so it shows even when the group is closed. */}
              {groupError && (
                <p role="alert" className="px-4 pb-2 text-sm text-destructive">
                  {groupError}
                </p>
              )}

              <AccordionContent className="border-t pb-0">
                <GroupTable
                  matrix={matrix}
                  group={group}
                  groupValue={groupValue}
                  disabled={fieldConfig.disabled}
                  onChange={(next) =>
                    field.onChange({ ...value, [group.value]: next })
                  }
                />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
})

/** One group's modules × actions table. */
function GroupTable({
  matrix,
  group,
  groupValue,
  disabled,
  onChange,
}: {
  matrix: PermissionMatrixConfig
  group: SelectOption
  groupValue: GroupPermissions
  disabled?: boolean
  onChange: (next: GroupPermissions) => void
}) {
  const columns = useMemo(() => {
    // A module's actions with one ticked or unticked, kept in the columns'
    // order rather than the order they were ticked.
    const withAction = (module: string, action: string, checked: boolean) => {
      const current = groupValue[module] ?? []
      return matrix.actions
        .map(({ value: item }) => item)
        .filter((item) => (item === action ? checked : current.includes(item)))
    }

    return columnHelper.columns([
      columnHelper.display({
        id: MODULE_COLUMN_ID,
        header: matrix.moduleColumnLabel,
        cell: ({ row }) => {
          const { icon: Icon, label, description } = row.original
          return (
            <span className="flex items-center gap-3">
              {Icon && (
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              )}
              <span className="flex flex-col">
                <span className="font-medium">{label}</span>
                {description && (
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </span>
            </span>
          )
        },
      }),
      ...matrix.actions.map((action) =>
        columnHelper.display({
          id: action.value,
          header: () => {
            const ticked = matrix.modules.filter(({ value: module }) =>
              groupValue[module]?.includes(action.value)
            ).length

            return (
              <label className="flex items-center justify-center gap-2">
                <Checkbox
                  checked={ticked === matrix.modules.length}
                  indeterminate={ticked > 0 && ticked < matrix.modules.length}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange(
                      Object.fromEntries(
                        matrix.modules.map(({ value: module }) => [
                          module,
                          withAction(module, action.value, checked),
                        ])
                      )
                    )
                  }
                />
                {action.label}
              </label>
            )
          },
          cell: ({ row }) => {
            const module = row.original
            return (
              <div className="flex justify-center">
                <Checkbox
                  aria-label={`${group.label}: ${module.label}, ${action.label}`}
                  checked={
                    groupValue[module.value]?.includes(action.value) ?? false
                  }
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...groupValue,
                      [module.value]: withAction(
                        module.value,
                        action.value,
                        checked
                      ),
                    })
                  }
                />
              </div>
            )
          },
        })
      ),
    ])
  }, [matrix, group, groupValue, disabled, onChange])

  const table = useTable({ features, columns, data: matrix.modules })

  return (
    <Table>
      <TableHeader className="bg-muted/40">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                scope="col"
                className={cn(
                  "px-4 text-xs text-muted-foreground",
                  header.column.id !== MODULE_COLUMN_ID && "text-center"
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
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) =>
              // The module column names the row, so it's a row header.
              cell.column.id === MODULE_COLUMN_ID ? (
                <TableHead
                  key={cell.id}
                  scope="row"
                  className="px-4 py-2 font-normal whitespace-normal"
                >
                  <table.FlexRender cell={cell} />
                </TableHead>
              ) : (
                <TableCell key={cell.id} className="px-4 py-2">
                  <table.FlexRender cell={cell} />
                </TableCell>
              )
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
