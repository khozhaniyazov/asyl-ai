import { forwardRef } from "react";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Kazakhstan phone input with auto-formatting.
 * Stores raw digits with +7 prefix, displays as +7 (7XX) XXX-XXXX.
 */
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const formatDisplay = (raw: string): string => {
      // raw is like "+77001234567" or partial
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 0) return "";
      if (digits.length <= 1) return `+${digits}`;
      if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
      if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      let digits = input.replace(/\D/g, "");
      
      // Auto-prefix with 7 for Kazakhstan
      if (digits.length > 0 && digits[0] !== "7") {
        digits = "7" + digits;
      }
      
      // Cap at 11 digits (7 + 10)
      digits = digits.slice(0, 11);
      
      const raw = digits.length > 0 ? `+${digits}` : "";
      onChange(raw);
    };

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={formatDisplay(value)}
        onChange={handleChange}
        placeholder="+7 (7XX) XXX-XXXX"
        {...props}
        className={className}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
export default PhoneInput;
