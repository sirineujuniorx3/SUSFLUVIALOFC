
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const formatDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    // Adjust for timezone issues if the date string doesn't have timezone info
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'Data inválida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Normalizes any date input to a YYYY-MM-DD string.
 * Handles Date objects, ISO strings, and YYYY-MM-DD strings.
 * NOTE: For strings with 'T' (ISO), it splits by 'T' to get the date part.
 * This preserves "Local ISO" dates (e.g. 2023-11-20T10:00) correctly.
 */
export const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    
    // 1. If it's already a simple YYYY-MM-DD string, return it
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }

    // 2. If it's an ISO string with time (e.g., 2023-11-20T10:00), split it
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
        return dateInput.split('T')[0];
    }

    // 3. Try to create a Date object
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;

    // 4. Return YYYY-MM-DD from the Date object (using local time)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Compares two dates ignoring time.
 * Returns true if they refer to the same day.
 */
export const compareDates = (date1, date2) => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1 && d2 && d1 === d2;
};
