# ¿A dónde van mis átomos de Carbono? (Daily Carbon Balance Simulator)

Este proyecto es una herramienta pedagógica interactiva diseñada para ayudar a los estudiantes de biología y química a comprender el flujo de materia y energía en el cuerpo humano, centrándose específicamente en el ciclo del átomo de carbono a nivel individual.

## 🌟 Propósito Educativo

La aplicación desmitifica el proceso de "perder peso" y "ganar energía", mostrando físicamente cómo los átomos de carbono que ingerimos en los alimentos (carbohidratos, grasas, proteínas) son procesados por el metabolismo celular y finalmente exhalados como CO₂ o retenidos en el cuerpo.

## 🚀 Características Principales

- **🌍 Bilingüe:** Soporte completo para Español e Inglés con un solo clic.
- **🌓 Modo Oscuro/Claro:** Interfaz moderna y adaptable diseñada con Tailwind CSS.
- **📊 Visualización de Datos Avanzada:** 
  - Gráficos de flujo de carbono (Ingreso vs. Oxidación).
  - Gráficos de gasto energético y balance acumulado.
  - Tabla de datos detallada con desglose por hora.
- **🧬 Modelos Moleculares:** Exploración visual de la composición de carbono en glucosa, aminoácidos y ácidos grasos.
- **🔄 Animación del Ciclo de Krebs:** Una representación didáctica paso a paso de cómo la glucosa se transforma en energía (ATP) y CO₂.
- **🚶 Simulador de Actividades:** Cálculo de oxidación de carbono basado en valores MET (Equivalente Metabólico) y peso corporal.
- **📝 Desafíos de Aprendizaje:** Retos interactivos que combinan insights de toda la experiencia para fomentar el pensamiento crítico.
- **📤 Exportación de Datos:**
  - **CSV Completo:** Exporta el resumen de resultados, la actividad horaria y todos los eventos metabólicos registrados.
  - **Reporte PDF:** Genera un documento profesional con todas las gráficas y tablas de datos.

## 📖 Conceptos Científicos Aplicados

### 1. Conservación de la Materia
La masa no desaparece; se transforma de comida sólida a gas exhalado (CO₂). El balance neto de carbono determina si el cuerpo retiene materia (aumento de peso) o utiliza sus reservas (pérdida de peso).

### 2. Fracciones de Carbono (C-Fractions)
El simulador utiliza proporciones estándar de carbono por masa para las biomoléculas:
- **Carbohidratos:** ~40% Carbono (basado en Glucosa C₆H₁₂O₆).
- **Proteínas:** ~53% Carbono (promedio de aminoácidos).
- **Grasas:** ~77% Carbono (basado en ácidos grasos de cadena larga).

### 3. Equivalente Metabólico (MET)
La energía gastada se calcula mediante la fórmula:
`Energía (kcal) = MET * Peso (kg) * Tiempo (h)`
Luego, esta energía se traduce a gramos de carbono oxidado utilizando una constante de eficiencia metabólica (~9.59 kcal por gramo de C oxidado).

### 4. Estequiometría del CO₂
Por cada gramo de carbono oxidado, se producen aproximadamente **3.67g de CO₂** (relación de masas moleculares 44/12).

## 🛠️ Stack Tecnológico

- **Framework:** React 18 con TypeScript.
- **Estilos:** Tailwind CSS (v4).
- **Animaciones:** Framer Motion (motion/react).
- **Iconos:** Lucide React.
- **Gráficos:** Recharts.
- **Exportación:** html2canvas y jsPDF.

## 👨‍🏫 Instrucciones de Uso

1. **Configura tus parámetros:** Ingresa tu peso y ajusta las constantes si es necesario.
2. **Registra tu comida:** Agrega lo que has comido durante el día. Puedes usar los presets de comida caribeña y snacks.
3. **Registra tus actividades:** Asegúrate de completar las 24 horas del día para un balance preciso.
4. **Analiza los resultados:** Observa las gráficas de flujo y el balance acumulado.
5. **Explora la ciencia:** Haz clic en los modelos moleculares o inicia la animación del Ciclo de Krebs.
6. **Exporta:** Descarga tus datos en CSV o PDF para un análisis posterior o entrega de tareas.

---

## ✍️ Créditos
Diseñado y desarrollado por **Rafik Neme** en Google AI Studio como recurso educativo para el curso de Biología.
