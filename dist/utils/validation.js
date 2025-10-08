"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidName = exports.isValidAge = exports.calculateAge = exports.isValidEmail = exports.sanitizeString = void 0;
const validator_1 = __importDefault(require("validator"));
// Sanitización básica contra XSS
const sanitizeString = (input) => {
    if (typeof input !== 'string')
        return '';
    return validator_1.default.escape(input.trim());
};
exports.sanitizeString = sanitizeString;
// Validar email
const isValidEmail = (email) => {
    return validator_1.default.isEmail(email);
};
exports.isValidEmail = isValidEmail;
// Calcular edad desde fecha de nacimiento
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
exports.calculateAge = calculateAge;
// Validar rango de edad
const isValidAge = (age) => {
    return age >= 0 && age <= 100;
};
exports.isValidAge = isValidAge;
// Validar nombre (solo letras, espacios, acentos, guiones)
const isValidName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
};
exports.isValidName = isValidName;
//# sourceMappingURL=validation.js.map