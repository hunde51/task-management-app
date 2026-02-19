import type { HTMLInputTypeAttribute } from "react";

import { cn } from "../../utils/cn";

type SharedProps = {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
};

type InputProps = SharedProps & {
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
};

type TextAreaProps = SharedProps & {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
};

type SelectOption = {
  label: string;
  value: string | number;
};

type SelectProps = SharedProps & {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
};

export function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  error,
  helperText,
  autoComplete,
}: InputProps) {
  return (
    <div className={cn("ui-field", error && "ui-field-error")}> 
      <div className="ui-field-control">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder=" "
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && <p className="ui-field-message">{error}</p>}
      {!error && helperText && <p className="ui-field-helper">{helperText}</p>}
    </div>
  );
}

export function FormTextArea({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  rows = 4,
  error,
  helperText,
}: TextAreaProps) {
  return (
    <div className={cn("ui-field", error && "ui-field-error")}> 
      <div className="ui-field-control">
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          rows={rows}
          placeholder=" "
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && <p className="ui-field-message">{error}</p>}
      {!error && helperText && <p className="ui-field-helper">{helperText}</p>}
    </div>
  );
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  error,
  helperText,
}: SelectProps) {
  return (
    <div className={cn("ui-field", "ui-field-select", error && "ui-field-error")}> 
      <label htmlFor={id} className="ui-select-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="ui-field-message">{error}</p>}
      {!error && helperText && <p className="ui-field-helper">{helperText}</p>}
    </div>
  );
}
