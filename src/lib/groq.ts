import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Agregamos este console.log para ver qué está leyendo Vite realmente
console.log("LLAVE DE GROQ LEÍDA:", apiKey ? "Sí hay llave" : "UNDEFINED - Vite no la ve");

export const groq = new Groq({
  apiKey: apiKey || 'llave-falsa-para-que-no-explote-el-build', 
  dangerouslyAllowBrowser: true 
});