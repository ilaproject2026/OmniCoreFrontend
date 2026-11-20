import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PHONE_REGION,
  findCountryForInternationalNumber,
  getPhoneCountry,
  PHONE_COUNTRIES,
} from '../../config/countryCallingCodes';
import { cn } from '../../lib/utils';

interface PhoneNumberInputProps {
  label: string;
  value: string;
  onChange: (internationalPhone: string) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  id?: string;
  autoComplete?: string;
}

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const readPhoneValue = (value: string, fallbackRegion = DEFAULT_PHONE_REGION) => {
  const digits = digitsOnly(value);
  if (value.trim().startsWith('+')) {
    const matchedCountry = findCountryForInternationalNumber(value);
    if (matchedCountry) {
      return {
        region: matchedCountry.region,
        localDigits: digits.slice(matchedCountry.callingCode.length, matchedCountry.callingCode.length + 10),
      };
    }
  }
  return { region: fallbackRegion, localDigits: digits.slice(0, 10) };
};

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  helperText = 'Enter exactly 10 digits. Country code is added automatically.',
  id,
  autoComplete = 'tel-national',
}) => {
  const inputId = id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const initial = readPhoneValue(value);
  const [region, setRegion] = useState(initial.region);
  const [localDigits, setLocalDigits] = useState(initial.localDigits);
  const [touched, setTouched] = useState(false);
  const lastEmittedValue = useRef<string | null>(null);
  const currentRegion = useRef(region);
  const currentOnChange = useRef(onChange);
  currentRegion.current = region;
  currentOnChange.current = onChange;
  const hasInvalidLength = localDigits.length > 0 && localDigits.length !== 10;
  const validationMessage = hasInvalidLength ? 'Enter exactly 10 digits, without the country code.' : '';

  useEffect(() => {
    if (lastEmittedValue.current !== null && value === lastEmittedValue.current) {
      lastEmittedValue.current = null;
      return;
    }
    const parsed = readPhoneValue(value, currentRegion.current);
    setRegion(parsed.region);
    setLocalDigits(parsed.localDigits);
    if (parsed.localDigits.length === 10) {
      const normalized = `+${getPhoneCountry(parsed.region).callingCode}${parsed.localDigits}`;
      if (value !== normalized) {
        lastEmittedValue.current = normalized;
        currentOnChange.current(normalized);
      }
    }
  }, [value]);

  const emitPhone = (nextRegion: string, nextDigits: string) => {
    const nextCountry = getPhoneCountry(nextRegion);
    const internationalPhone = nextDigits.length === 10
      ? `+${nextCountry.callingCode}${nextDigits}`
      : '';
    lastEmittedValue.current = internationalPhone;
    onChange(internationalPhone);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = digitsOnly(event.target.value).slice(0, 10);
    setLocalDigits(nextDigits);
    setTouched(false);
    emitPhone(region, nextDigits);
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRegion = event.target.value;
    setRegion(nextRegion);
    setTouched(false);
    emitPhone(nextRegion, localDigits);
  };

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}{required && <span aria-hidden="true" className="ml-1 text-rose-400">*</span>}
      </label>
      <div className={cn(
        'flex min-w-0 overflow-hidden rounded-lg border bg-[#0f172a]/90 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
        touched && validationMessage ? 'border-red-500' : 'border-slate-700',
        disabled && 'opacity-50'
      )}>
        <select
          aria-label={`${label} country calling code`}
          value={region}
          onChange={handleCountryChange}
          disabled={disabled}
          className="max-w-[38%] border-r border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-200 outline-none sm:max-w-[30%]"
        >
          {PHONE_COUNTRIES.map((option) => (
            <option key={option.region} value={option.region}>
              {option.region} +{option.callingCode}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={localDigits}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          maxLength={10}
          pattern="[0-9]{10}"
          title="Enter exactly 10 digits without the country code."
          placeholder="10-digit number"
          aria-invalid={touched && Boolean(validationMessage)}
          aria-describedby={`${inputId}-hint${touched && validationMessage ? ` ${inputId}-error` : ''}`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      {touched && validationMessage ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-red-400">{validationMessage}</p>
      ) : (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
