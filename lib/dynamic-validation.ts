import { z } from "zod";

const phoneRegex = /^(0[1-9]\d{8,11}|\+62\d{8,13})$/;

export type DynamicFieldDef = {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
};

/**
 * Generate a Zod validation schema dynamically from form field definitions.
 */
export function generateZodSchema(fields: DynamicFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    switch (field.type) {
      case "text":
      case "longtext":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib diisi`)
          : z.string().optional().default("");
        break;

      case "number":
        shape[field.fieldId] = field.required
          ? z.coerce.number({ message: `${field.label} harus berupa angka` })
          : z.coerce.number().optional();
        break;

      case "phone":
        shape[field.fieldId] = field.required
          ? z.string().regex(phoneRegex, "Format nomor HP tidak valid")
          : z.string().regex(phoneRegex, "Format nomor HP tidak valid").optional().or(z.literal(""));
        break;

      case "select":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib dipilih`)
          : z.string().optional().default("");
        break;

      case "multiselect":
        shape[`${field.fieldId}[]`] = z.array(z.string()).optional().default([]);
        break;

      case "date":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib diisi`)
          : z.string().optional().default("");
        break;

      case "location":
        shape[`${field.fieldId}_lat`] = z.string().optional();
        shape[`${field.fieldId}_lng`] = z.string().optional();
        break;

      case "photo":
        shape[field.fieldId] = z.any().optional();
        break;

      default:
        shape[field.fieldId] = z.string().optional().default("");
    }
  }

  return z.object(shape);
}
