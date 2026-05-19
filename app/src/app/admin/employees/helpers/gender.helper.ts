/**
 * Helper para manejar las traducciones y conversiones de género
 */

export const GENDER_LABELS: { [key: string]: string } = {
    'MALE': 'Masculino',
    'FEMALE': 'Femenino',
    'OTHER': 'Otro'
};

export function getGenderLabel(gender: string | null | undefined): string {
    if (!gender) return '-';
    return GENDER_LABELS[gender] || gender;
}

export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' }
];
