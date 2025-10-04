
import validator from 'validator';

// Sanitización básica contra XSS
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim());
};

// Validar email
export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

// Calcular edad desde fecha de nacimiento
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Validar rango de edad
export const isValidAge = (age: number): boolean => {
  return age >= 0 && age <= 100;
};

// Validar nombre (solo letras, espacios, acentos, guiones)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};