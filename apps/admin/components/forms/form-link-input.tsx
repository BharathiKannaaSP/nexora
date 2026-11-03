"use client"

import { Plus, Trash2 } from "lucide-react"
import { ControllerRenderProps } from "react-hook-form"

import { Button } from "@nexora/ui/components/button"
import { Input } from "@nexora/ui/components/input"

import { FieldConfig } from "../forms/form-types"

interface Props {
  fieldConfig: FieldConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
}

const MAX_LINKS = 5

const LinksInput = ({ field, fieldConfig }: Props) => {
  const links: string[] = Array.isArray(field.value) ? field.value : [""]

  const updateLink = (index: number, value: string) => {
    const updated = [...links]
    updated[index] = value
    field.onChange(updated)
  }

  const addLink = () => {
    if (links.length >= MAX_LINKS) return
    field.onChange([...links, ""])
  }

  const removeLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index)
    field.onChange(updated.length ? updated : [])
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={link}
            placeholder={fieldConfig.placeholder ?? "https://example.com"}
            disabled={fieldConfig.disabled}
            onChange={(e) => updateLink(index, e.target.value)}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeLink(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      {links.length < MAX_LINKS && (
        <Button
          type="button"
          variant="secondary"
          onClick={addLink}
          className="w-fit"
        >
          <Plus className="mr-2 size-4" />
          Add Link
        </Button>
      )}
    </div>
  )
}

export default LinksInput
