/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Info, 
  Activity, 
  Utensils, 
  Scale, 
  Wind, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  RefreshCcw,
  PlayCircle,
  AlertCircle,
  Sun,
  Moon,
  Languages,
  BookOpen,
  X,
  Zap,
  Download,
  FileText,
  FileDown,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---

interface Meal {
  id: string;
  name: string;
  carbs: number;
  fat: number;
  protein: number;
  time?: number; // Hour of the day (0-23)
}

interface ActivityItem {
  id: string;
  name: string;
  met: number;
  hours: number;
  startTime?: number; // Hour of the day (0-23)
}

// --- Constants ---

const CARBON_FRACTIONS = {
  carbs: 0.40,
  protein: 0.53,
  fat: 0.77
};

const CO2_C_RATIO = 3.67; // 44 / 12

const TRANSLATIONS = {
  es: {
    title: "Balance Diario de Carbono",
    subtitle: "Esta aplicación estima, de forma educativa, cuántos átomos de carbono entran por la comida, cuántos se oxidan durante las actividades diarias y cuánto CO₂ podría producirse.",
    regularDay: "Día Regular",
    restDay: "Día de Descanso",
    reset: "Reiniciar",
    modelNote: "Modelo didáctico: No usar como herramienta clínica o nutricional. Los resultados son aproximaciones para aprender sobre metabolismo y balance de materia.",
    yourParams: "Tus Parámetros",
    weight: "Peso Corporal (kg)",
    kcalPerGC: "kcal por gramo de C oxidado",
    carbonFractions: "Fracciones de Carbono Usadas",
    carbs: "Carbohidratos",
    protein: "Proteínas",
    fat: "Grasas",
    clickMolecules: "Haz clic para ver modelos moleculares",
    foodLog: "Registro de Comida",
    addMeal: "Agregar comida",
    name: "Nombre",
    carbsG: "Carbs (g)",
    fatG: "Grasas (g)",
    protG: "Prot (g)",
    carbonG: "Carbono (g)",
    suggestions: "Sugerencias:",
    seeMore: "Ver más...",
    activityLog: "Registro de Actividades",
    addActivity: "Agregar actividad",
    activity: "Actividad",
    met: "MET",
    hours: "Horas",
    energyKcal: "Energía (kcal)",
    hoursRegistered: "Horas registradas:",
    missingHours: "Te faltan {n} horas por registrar.",
    extraHours: "Has registrado {n} horas de más.",
    fullDay: "Día completo registrado.",
    metabolicSummary: "Resumen Metabólico",
    carbonIngested: "Carbono Ingerido",
    energyUsed: "Energía Usada",
    carbonOxidized: "Carbono Oxidado",
    estimatedCO2: "CO₂ Estimado",
    netCarbonBalance: "Balance Neto de Carbono",
    balancePositive: "Hoy ingresó más carbono del que se oxidó",
    balanceNegative: "Hoy se oxidó más carbono del que ingresó",
    balanceNeutral: "Hoy el balance estuvo cerca del equilibrio",
    visualization: "Balance",
    ingested: "Ingerido",
    oxidized: "Oxidado",
    balance: "Balance",
    matterFlow: "Flujo de Materia",
    food: "Comida",
    cellularMetabolism: "Metabolismo Celular",
    retained: "Retenido",
    deficit: "Déficit",
    molecularMeaning: "¿Qué significa esto molecularmente?",
    whatDoesThisMean: "¿Qué significa esto?",
    foodIsMatter: "La comida es materia",
    foodIsMatterDesc: "Los carbohidratos, grasas y proteínas son moléculas orgánicas construidas sobre un esqueleto de átomos de carbono. Al comer, estamos incorporando \"piezas de construcción\" y combustible.",
    bondsAndEnergy: "Enlaces y Energía",
    bondsAndEnergyDesc: "Los enlaces químicos entre los átomos de carbono almacenan energía. El metabolismo rompe estos enlaces (catabolismo) para liberar esa energía y usarla en tus actividades.",
    cellularRespiration: "Respiración Celular",
    cellularRespirationDesc: "Cuando las moléculas se oxidan completamente para obtener energía, el carbono se combina con el oxígeno que respiras para formar CO₂.",
    exhaleCarbon: "Exhalar Carbono",
    exhaleCarbonDesc: "Respirar no es solo mover aire; es el proceso por el cual eliminas físicamente los átomos de carbono que una vez fueron parte de tu comida. ¡Literalmente pierdes peso al exhalar!",
    theBalance: "El Balance",
    theBalanceDesc: "Si ingieres más carbono del que oxidas (superávit), tu cuerpo tiene materia sobrante que puede almacenar (como glucógeno o grasa), lo que se traduce en un aumento de peso. Si oxidas más del que ingieres (déficit), tu cuerpo debe usar sus reservas, lo que resulta en pérdida de peso. Subir o bajar de peso es, en esencia, una relación entre cuántos carbonos entran a tu cuerpo y cuántos salen.",
    basalMetabolism: "Metabolismo Basal",
    basalMetabolismDesc: "Incluso durmiendo o estudiando, tus células están \"quemando\" carbono para mantenerte vivo, bombear sangre y pensar.",
    designedBy: "Diseñado por {n} en Google AI Studio para el curso de Biología.",
    footer: "Diseñado por Rafik Neme en Google AI Studio para el curso de Biología.",
    kcalHelpTitle: "¿Qué es kcal/g C?",
    kcalHelpIntro: "Este valor representa cuánta energía (kcal) se libera cuando tu cuerpo oxida un gramo de carbono de las biomoléculas.",
    kcalHelpOrigin: "¿De dónde viene?",
    kcalHelpOriginDesc: "Se calcula dividiendo la densidad energética de una molécula (kcal/g) entre su contenido de carbono (g C/g):",
    kcalHelpCarbs: "Carbohidratos: 4 kcal/g ÷ 0.40 g C/g = 10.0 kcal/g C",
    kcalHelpFats: "Grasas: 9 kcal/g ÷ 0.77 g C/g = 11.7 kcal/g C",
    kcalHelpProteins: "Proteínas: 4 kcal/g ÷ 0.53 g C/g = 7.5 kcal/g C",
    kcalHelpAverage: "El valor por defecto (10.5) es un promedio ponderado para una dieta mixta.",
    kcalHelpChanges: "¿Qué tanto cambia?",
    kcalHelpChangesDesc: "Este valor fluctúa según el 'combustible' que tu cuerpo esté usando:",
    kcalHelpRest: "En reposo/ayuno: Quemas más grasa (valor cercano a 11.5).",
    kcalHelpExercise: "Ejercicio intenso: Quemas más glucosa (valor cercano a 10.0).",
    kcalHelpKetosis: "Cetosis: Alta oxidación de grasas (el valor sube).",
    kcalHelpStarvation: "Inanición: Oxidación de proteínas (el valor baja hacia 7.5).",
    foodSuggestions: "Sugerencias de Comida",
    activitySuggestions: "Sugerencias de Actividades",
    molecularModelsTitle: "Modelos Moleculares y Carbono",
    molecularModelsDesc: "Cada biomolécula tiene una proporción distinta de carbono. Aquí puedes ver dónde se encuentran estos átomos (C) y cómo se organizan sus enlaces.",
    carbohydrates: "Carbohidratos",
    glucose: "Glucosa",
    carbsDesc: "La glucosa (C₆H₁₂O₆) tiene una estructura de anillo. El 40% de su masa es carbono. Sus enlaces C-H y C-C son la fuente primaria de energía rápida para la célula.",
    cyclicStructure: "Estructura cíclica estable",
    easyToBreak: "Enlaces fáciles de romper para obtener ATP",
    oxidizesToCO2: "Se oxida completamente a CO₂ y H₂O",
    proteins: "Proteínas",
    aminoAcid: "Aminoácido",
    proteinsDesc: "Los aminoácidos contienen un carbono alfa central unido a un grupo amino (N) y un carboxilo (C=O). En promedio, el 53% de su masa es carbono.",
    characteristicSkeleton: "Esqueleto N-C-C característico",
    nitrogenRemoval: "El nitrógeno debe eliminarse (urea) antes de oxidar el carbono",
    structuralFunction: "Función estructural y catalítica (enzimas)",
    lipids: "Grasas",
    fattyAcid: "Ácido Graso",
    lipidsDesc: "Las grasas son cadenas largas de hidrocarburos. Son muy densas en carbono (77%), lo que las convierte en el almacén de energía más eficiente.",
    longChains: "Cadenas largas saturadas de hidrógeno",
    moreBonds: "Muchos más enlaces C-H para oxidar",
    doubleEnergy: "Liberan más del doble de energía por gramo que los carbs",
    highEnergyBonds: "Enlaces C-C de Alta Energía",
    understood: "Entendido",
    explanation1: "1. La comida es materia: Los carbohidratos, grasas y proteínas son moléculas orgánicas construidas sobre un esqueleto de átomos de carbono. Al comer, estamos incorporando \"piezas de construcción\" y combustible.",
    explanation2: "2. Enlaces y Energía: Los enlaces químicos entre los átomos de carbono almacenan energía. El metabolismo rompe estos enlaces (catabolismo) para liberar esa energía y usarla en tus actividades.",
    explanation3: "3. Respiración Celular: Cuando las moléculas se oxidan completamente para obtener energía, el carbono se combina con el oxígeno que respiras para formar CO₂.",
    explanation4: "4. Exhalar Carbono: Respirar no es solo mover aire; es el proceso por el cual eliminas físicamente los átomos de carbono que una vez fueron parte de tu comida. ¡Literalmente pierdes peso al exhalar!",
    explanation5: "5. El Balance: Si ingieres más carbono del que oxidas (superávit), tu cuerpo tiene materia sobrante que puede almacenar (como glucógeno o grasa), lo que se traduce en un aumento de peso. Si oxidas más del que ingieres (déficit), tu cuerpo debe usar sus reservas, lo que resulta en pérdida de peso. Subir o bajar de peso es, en esencia, una relación entre cuántos carbonos entran a tu cuerpo y cuántos salen.",
    explanation6: "6. Metabolismo Basal: Incluso durmiendo o estudiando, tus células están \"quemando\" carbono para mantenerte vivo, bombear sangre y pensar.",
    challengesTitle: "Desafíos de Aprendizaje",
    challenge1: "¿Cómo cambiaría tu balance si reemplazaras una 'Arepa de huevo' por un 'Jugo de fruta' manteniendo la misma actividad?",
    challenge2: "Si decides bailar intensamente por 2 horas, ¿cuántos gramos adicionales de carbono deberías ingerir para mantener el equilibrio?",
    challenge3: "Explica por qué las grasas (77% C) producen más CO₂ por gramo oxidado que los carbohidratos (40% C).",
    challenge4: "Balance Global: Si hoy tienes un balance positivo de 50g de C y mañana duermes 8 horas (Metabolismo Basal), ¿cuánto de ese carbono oxidarás solo por respirar mientras duermes?",
    challenge5: "Transformación de la Materia: Rastrea el camino de un átomo de carbono desde un trozo de pan (Carbohidrato) hasta la atmósfera. ¿En qué moléculas se convierte?",
    challenge6: "Densidad Energética: ¿Por qué el simulador muestra una liberación de energía (kcal) mucho mayor al oxidar 10g de Grasa que 10g de Carbohidratos, y cómo se relaciona esto con el CO₂ producido?",
    gameplayInstructions: "Instrucciones",
    howToPlay: "Cómo funciona: El simulador rastrea el flujo de átomos de carbono en tu cuerpo. Los carbonos entran con la comida y salen al exhalar CO₂ durante el metabolismo celular.",
    registrationTitle: "Registro de datos",
    registrationDesc: "1. Ingresa tu peso y parámetros. 2. Registra tus comidas (entrada de C). 3. Registra tus actividades (salida de C). Asegúrate de completar las 24 horas para un balance preciso.",
    graphsTitle: "Visualización de gráficas",
    graphsDesc: "En la sección de resultados, podrás ver gráficas de flujo de carbono, gasto energético y balance acumulado hora por hora.",
    downloadTitle: "Descarga de información",
    downloadDesc: "Puedes exportar tus datos en formato CSV para análisis detallado o generar un reporte en PDF con todas las gráficas y resúmenes.",
    splashTitle: "Bienvenido al Simulador de Balance de Carbono",
    startGame: "Comenzar",
    viewResults: "Ver Resultados",
    krebsTitle: "Ciclo de Krebs en Acción",
    krebsDesc: "Observa cómo la glucosa se transforma en energía (ATP) y CO₂.",
    backToLog: "Volver al Registro",
    krebsStages: {
      s0: "Glucosa (C₆)",
      s1: "Glucólisis: Partición en 2 Piruvatos (C₃)",
      s2: "Descarboxilación: Formación de Acetil-CoA (C₂)",
      s3: "Ciclo de Krebs: Formación de Citrato (C₆)",
      s4: "Oxidación: Formación de α-Cetoglutarato (C₅)",
      s5: "Oxidación: Formación de Succinil-CoA (C₄)",
      s6: "Regeneración de Oxaloacetato (C₄) y ATP",
      desc0: "La glucosa entra a la célula como combustible principal.",
      desc1: "La cadena de 6 carbonos se rompe a la mitad, liberando energía inicial.",
      desc2: "Un carbono se libera como CO₂. El resto se une a la Coenzima A.",
      desc3: "El grupo acetilo se une al oxaloacetato para iniciar el ciclo.",
      desc4: "Se rompe un enlace C-C, liberando CO₂ y electrones de alta energía.",
      desc5: "Otro carbono se oxida a CO₂, generando más poder reductor.",
      desc6: "Se produce ATP y se recupera la molécula inicial para repetir el ciclo."
    },
    categories: {
      'Desayunos': 'Desayunos',
      'Almuerzos': 'Almuerzos',
      'Acompañamientos': 'Acompañamientos',
      'Snacks y Comida Rápida': 'Snacks y Comida Rápida',
      'Bebidas': 'Bebidas',
      'Básicas': 'Básicas',
      'Académicas': 'Académicas',
      'Transporte': 'Transporte',
      'Física': 'Física',
      'Ocio': 'Ocio',
      'Domésticas': 'Domésticas',
      'Caribe': 'Caribe'
    },
    downloadCSV: "Descargar CSV",
    downloadImage: "Descargar Imagen",
    downloadPDF: "Descargar PDF",
    loadExampleData: "Cargar datos de ejemplo",
    journeyTitle: "El Viaje del Átomo de Carbono",
    journeySubtitle: "Sigue el rastro de la materia desde tu plato hasta la atmósfera.",
    simulationView: "Simulación",
    journeyView: "Viaje del Carbono",
    dailyFlow: "Flujo Diario de Carbono y Energía",
    carbonFlow: "Flujo de Carbono (g C)",
    energyFlow: "Gasto Energético (kcal)",
    energyAndBalance: "Gasto Energético y Balance Acumulado",
    dataTable: "Tabla de Datos",
    hour: "Hora",
    time: "Hora",
    input: "Entrada (C)",
    output: "Salida (C)",
    energy: "Energía (kcal)",
    cumulativeBalance: "Balance Acumulado (C)",
    journeySteps: {
      s1: "Ingestión: La comida como materia",
      desc1: "Todo lo que comes (carbohidratos, grasas y proteínas) está compuesto por átomos de carbono. Al masticar y tragar, incorporas estos bloques de construcción orgánicos a tu organismo.",
      s2: "Digestión y absorción",
      desc2: "El sistema digestivo descompone las macromoléculas en unidades más pequeñas (como glucosa, ácidos grasos y aminoácidos), que pueden atravesar la pared intestinal y entrar al torrente sanguíneo.",
      s3: "Transporte celular",
      desc3: "La sangre distribuye estas moléculas ricas en carbono a todas las células del cuerpo, desde los músculos hasta el cerebro.",
      s4: "Respiración celular (mitocondria)",
      desc4: "Dentro de la mitocondria, las moléculas orgánicas son degradadas progresivamente. Los enlaces entre átomos de carbono se reorganizan y liberan energía, que se captura en forma de ATP.\n\nEn este proceso, los átomos de carbono terminan combinándose con oxígeno (O₂) para formar dióxido de carbono (CO₂).",
      s5: "Exhalación: el carbono sale del cuerpo",
      desc5: "El CO₂ es transportado por la sangre de regreso a los pulmones y se elimina al exhalar.\n\nAsí, una parte importante de la masa de la comida que ingeriste abandona tu cuerpo en forma de gas.",
    }
  },
  en: {
    title: "Daily Carbon Balance",
    subtitle: "This application estimates, for educational purposes, how many carbon atoms enter through food, how many are oxidized during daily activities, and how much CO₂ might be produced.",
    regularDay: "Regular Day",
    restDay: "Rest Day",
    reset: "Reset",
    modelNote: "Educational model: Not for clinical or nutritional use. Results are approximations to learn about metabolism and matter balance.",
    yourParams: "Your Parameters",
    weight: "Body Weight (kg)",
    kcalPerGC: "kcal per gram of C oxidized",
    carbonFractions: "Carbon Fractions Used",
    carbs: "Carbohydrates",
    protein: "Proteins",
    fat: "Fats",
    clickMolecules: "Click to see molecular models",
    foodLog: "Food Log",
    addMeal: "Add meal",
    name: "Name",
    carbsG: "Carbs (g)",
    fatG: "Fats (g)",
    protG: "Prot (g)",
    carbonG: "Carbon (g)",
    suggestions: "Suggestions:",
    seeMore: "See more...",
    activityLog: "Activity Log",
    addActivity: "Add activity",
    activity: "Activity",
    met: "MET",
    hours: "Hours",
    energyKcal: "Energy (kcal)",
    hoursRegistered: "Hours registered:",
    missingHours: "You have {n} hours left to register.",
    extraHours: "You have registered {n} extra hours.",
    fullDay: "Full day registered.",
    metabolicSummary: "Metabolic Summary",
    carbonIngested: "Carbon Ingested",
    energyUsed: "Energy Used",
    carbonOxidized: "Carbon Oxidized",
    estimatedCO2: "Estimated CO₂",
    netCarbonBalance: "Net Carbon Balance",
    balancePositive: "Today more carbon entered than was oxidized",
    balanceNegative: "Today more carbon was oxidized than entered",
    balanceNeutral: "Today the balance was close to equilibrium",
    visualization: "Balance",
    ingested: "Ingested",
    oxidized: "Oxidized",
    balance: "Balance",
    matterFlow: "Matter Flow",
    food: "Food",
    cellularMetabolism: "Cellular Metabolism",
    retained: "Retained",
    deficit: "Deficit",
    molecularMeaning: "What does this mean molecularly?",
    whatDoesThisMean: "What does this mean?",
    foodIsMatter: "Food is matter",
    foodIsMatterDesc: "Carbohydrates, fats, and proteins are organic molecules built on a skeleton of carbon atoms. By eating, we are incorporating \"building blocks\" and fuel.",
    bondsAndEnergy: "Bonds and Energy",
    bondsAndEnergyDesc: "Chemical bonds between carbon atoms store energy. Metabolism breaks these bonds (catabolism) to release that energy and use it in your activities.",
    cellularRespiration: "Cellular Respiration",
    cellularRespirationDesc: "When molecules are completely oxidized for energy, carbon combines with the oxygen you breathe to form CO₂.",
    exhaleCarbon: "Exhaling Carbon",
    exhaleCarbonDesc: "Breathing is not just moving air; it is the process by which you physically remove carbon atoms that were once part of your food. You literally lose weight by exhaling!",
    theBalance: "The Balance",
    theBalanceDesc: "If you ingest more carbon than you oxidize (surplus), your body has leftover matter it can store (as glycogen or fat), which translates to weight gain. If you oxidize more than you ingest (deficit), your body must use its reserves, resulting in weight loss. Gaining or losing weight is, in essence, a relationship between how many carbons enter your body and how many leave.",
    basalMetabolism: "Basal Metabolism",
    basalMetabolismDesc: "Even while sleeping or studying, your cells are \"burning\" carbon to keep you alive, pump blood, and think.",
    designedBy: "Designed by {n} in Google AI Studio for the Biology course.",
    footer: "Designed by Rafik Neme in Google AI Studio for the Biology course.",
    kcalHelpTitle: "What is kcal/g C?",
    kcalHelpIntro: "This value represents how much energy (kcal) is released when your body oxidizes one gram of carbon from biomolecules.",
    kcalHelpOrigin: "Where does it come from?",
    kcalHelpOriginDesc: "It is calculated by dividing the energy density of a molecule (kcal/g) by its carbon content (g C/g):",
    kcalHelpCarbs: "Carbohydrates: 4 kcal/g ÷ 0.40 g C/g = 10.0 kcal/g C",
    kcalHelpFats: "Fats: 9 kcal/g ÷ 0.77 g C/g = 11.7 kcal/g C",
    kcalHelpProteins: "Proteínas: 4 kcal/g ÷ 0.53 g C/g = 7.5 kcal/g C",
    kcalHelpAverage: "The default value (10.5) is a weighted average for a mixed diet.",
    kcalHelpChanges: "How does it change?",
    kcalHelpChangesDesc: "This value fluctuates depending on the 'fuel' your body is using:",
    kcalHelpRest: "At rest/fasting: You burn more fat (value closer to 11.5).",
    kcalHelpExercise: "Intense exercise: You burn more glucose (value closer to 10.0).",
    kcalHelpKetosis: "Ketosis: High fat oxidation (value rises).",
    kcalHelpStarvation: "Starvation: Protein oxidation (value drops towards 7.5).",
    foodSuggestions: "Food Suggestions",
    activitySuggestions: "Activity Suggestions",
    molecularModelsTitle: "Molecular Models and Carbon",
    molecularModelsDesc: "Each biomolecule has a different proportion of carbon. Here you can see where these atoms (C) are located and how their bonds are organized.",
    carbohydrates: "Carbohydrates",
    glucose: "Glucose",
    carbsDesc: "Glucose (C₆H₁₂O₆) has a ring structure. 40% of its mass is carbon. Its C-H and C-C bonds are the primary source of fast energy for the cell.",
    cyclicStructure: "Stable cyclic structure",
    easyToBreak: "Easy-to-break bonds to obtain ATP",
    oxidizesToCO2: "Completely oxidizes to CO₂ and H₂O",
    proteins: "Proteins",
    aminoAcid: "Amino Acid",
    proteinsDesc: "Amino acids contain a central alpha carbon bonded to an amino group (N) and a carboxyl group (C=O). On average, 53% of its mass is carbon.",
    characteristicSkeleton: "Characteristic N-C-C skeleton",
    nitrogenRemoval: "Nitrogen must be removed (urea) before oxidizing carbon",
    structuralFunction: "Structural and catalytic function (enzymes)",
    lipids: "Fats",
    fattyAcid: "Fatty Acid",
    lipidsDesc: "Fats are long hydrocarbon chains. They are very carbon-dense (77%), making them the most efficient energy store.",
    longChains: "Long hydrogen-saturated chains",
    moreBonds: "Many more C-H bonds to oxidize",
    doubleEnergy: "Release more than double the energy per gram than carbs",
    highEnergyBonds: "High Energy C-C Bonds",
    understood: "Understood",
    explanation1: "1. Food is matter: Carbohydrates, fats, and proteins are organic molecules built on a skeleton of carbon atoms. By eating, we are incorporating \"building blocks\" and fuel.",
    explanation2: "2. Bonds and Energy: Chemical bonds between carbon atoms store energy. Metabolism breaks these bonds (catabolism) to release that energy and use it in your activities.",
    explanation3: "3. Cellular Respiration: When molecules are completely oxidized for energy, carbon combines with the oxygen you breathe to form CO₂.",
    explanation4: "4. Exhaling Carbon: Breathing is not just moving air; it is the process by which you physically remove carbon atoms that were once part of your food. You literally lose weight by exhaling!",
    explanation5: "5. The Balance: If you ingest more carbon than you oxidize (surplus), your body has leftover matter it can store (as glycogen or fat), which translates to weight gain. If you oxidize more than you ingest (deficit), your body must use its reserves, resulting in weight loss. Gaining or losing weight is, in essence, a relationship between how many carbons enter your body and how many leave.",
    explanation6: "6. Basal Metabolism: Even while sleeping or studying, your cells are \"burning\" carbon to keep you alive, pump blood, and think.",
    challengesTitle: "Learning Challenges",
    challenge1: "How would your balance change if you replaced an 'Arepa de huevo' with a 'Fruit juice' while maintaining the same activity?",
    challenge2: "If you decide to dance intensely for 2 hours, how many additional grams of carbon should you ingest to maintain balance?",
    challenge3: "Explain why fats (77% C) produce more CO₂ per gram oxidized than carbohydrates (40% C).",
    challenge4: "Global Balance: If you have a positive carbon balance of 50g today, and you decide to sleep 8 hours tomorrow (Basal Metabolism), how much of that carbon will you oxidize just by breathing while sleeping?",
    challenge5: "Matter Transformation: Trace the path of a carbon atom from a piece of bread (Carbohydrate) to the atmosphere. What molecules does it become along the way?",
    challenge6: "Energy Density: Why does the simulator show a much larger energy release (kcal) when you oxidize 10g of Fat compared to 10g of Carbohydrates, and how does this relate to the CO₂ produced?",
    gameplayInstructions: "Instructions",
    howToPlay: "How it works: The simulator tracks the flow of carbon atoms in your body. Carbons enter with food and leave when exhaling CO₂ during cellular metabolism.",
    registrationTitle: "Data Registration",
    registrationDesc: "1. Enter your weight and parameters. 2. Register your meals (C input). 3. Register your activities (C output). Make sure to complete all 24 hours for an accurate balance.",
    graphsTitle: "Graph Visualization",
    graphsDesc: "In the results section, you can see graphs of carbon flow, energy expenditure, and cumulative balance hour by hour.",
    downloadTitle: "Download Information",
    downloadDesc: "You can export your data in CSV format for detailed analysis or generate a PDF report with all graphs and summaries.",
    splashTitle: "Welcome to the Carbon Balance Simulator",
    startGame: "Start",
    viewResults: "View Results",
    krebsTitle: "Krebs Cycle in Action",
    krebsDesc: "Watch how glucose transforms into energy (ATP) and CO₂.",
    backToLog: "Back to Log",
    krebsStages: {
      s0: "Glucose (C₆)",
      s1: "Glycolysis: Splitting into 2 Pyruvates (C₃)",
      s2: "Decarboxylation: Acetyl-CoA Formation (C₂)",
      s3: "Krebs Cycle: Citrate Formation (C₆)",
      s4: "Oxidation: α-Ketoglutarate Formation (C₅)",
      s5: "Oxidation: Succinyl-CoA Formation (C₄)",
      s6: "Oxaloacetate Regeneration (C₄) and ATP",
      desc0: "Glucose enters the cell as the primary fuel source.",
      desc1: "The 6-carbon chain breaks in half, releasing initial energy.",
      desc2: "One carbon is released as CO₂. The rest binds to Coenzyme A.",
      desc3: "The acetyl group joins oxaloacetate to start the cycle.",
      desc4: "A C-C bond breaks, releasing CO₂ and high-energy electrons.",
      desc5: "Another carbon is oxidized to CO₂, generating more reducing power.",
      desc6: "ATP is produced, and the initial molecule is recovered to repeat the cycle."
    },
    categories: {
      'Desayunos': 'Breakfasts',
      'Almuerzos': 'Lunches',
      'Acompañamientos': 'Sides',
      'Snacks y Comida Rápida': 'Snacks & Fast Food',
      'Bebidas': 'Drinks',
      'Básicas': 'Basic',
      'Académicas': 'Academic',
      'Transporte': 'Transport',
      'Física': 'Physical',
      'Ocio': 'Leisure',
      'Domésticas': 'Domestic',
      'Caribe': 'Caribbean'
    },
    downloadCSV: "Download CSV",
    downloadImage: "Download Image",
    downloadPDF: "Download PDF",
    loadExampleData: "Load example data",
    journeyTitle: "The Journey of the Carbon Atom",
    journeySubtitle: "Trace the path of matter from your plate to the atmosphere.",
    simulationView: "Simulation",
    journeyView: "Carbon Journey",
    dailyFlow: "Daily Carbon and Energy Flow",
    carbonFlow: "Carbon Flow (g C)",
    energyFlow: "Energy Expenditure (kcal)",
    energyAndBalance: "Energy Expenditure & Cumulative Balance",
    dataTable: "Data Table",
    hour: "Hour",
    time: "Time",
    input: "Input (C)",
    output: "Output (C)",
    energy: "Energy (kcal)",
    cumulativeBalance: "Cumulative Balance (C)",
    journeySteps: {
      s1: "Ingestion: Food as Matter",
      desc1: "Everything you eat (carbohydrates, fats, and proteins) is composed of carbon atoms. By chewing and swallowing, you incorporate these organic building blocks into your body.",
      s2: "Digestion and Absorption",
      desc2: "The digestive system breaks down macromolecules into smaller units (such as glucose, fatty acids, and amino acids), which can pass through the intestinal wall and enter the bloodstream.",
      s3: "Cellular Transport",
      desc3: "Blood distributes these carbon-rich molecules to all cells in the body, from muscles to the brain.",
      s4: "Cellular Respiration (Mitochondria)",
      desc4: "Inside the mitochondria, organic molecules are progressively degraded. The bonds between carbon atoms are rearranged and release energy, which is captured in the form of ATP.\n\nIn this process, carbon atoms end up combining with oxygen (O₂) to form carbon dioxide (CO₂).",
      s5: "Exhalation: Carbon Leaves the Body",
      desc5: "CO₂ is transported by the blood back to the lungs and eliminated upon exhaling.\n\nThus, a significant part of the mass of the food you ingested leaves your body in the form of gas.",
    }
  }
};

const FOOD_PRESETS = [
  { name: 'Arepa de huevo', carbs: 25, fat: 15, protein: 7 },
  { name: 'Arroz con pollo', carbs: 40, fat: 10, protein: 20 },
  { name: 'Empanada', carbs: 20, fat: 10, protein: 4 },
  { name: 'Jugo de fruta', carbs: 25, fat: 0, protein: 0 },
  { name: 'Salchipapa', carbs: 30, fat: 25, protein: 12 },
];

const FOOD_CATEGORIES: Record<string, Omit<Meal, 'id'>[]> = {
  'Desayunos': [
    { name: 'Arepa de huevo', carbs: 25, fat: 15, protein: 7 },
    { name: 'Arepa de queso', carbs: 25, fat: 10, protein: 8 },
    { name: 'Arepa con mantequilla', carbs: 25, fat: 8, protein: 3 },
    { name: 'Huevo perico', carbs: 2, fat: 10, protein: 12 },
    { name: 'Huevo frito', carbs: 0.6, fat: 10, protein: 6 },
    { name: 'Pan con queso', carbs: 20, fat: 8, protein: 7 },
    { name: 'Pan con mantequilla', carbs: 15, fat: 7, protein: 3 },
    { name: 'Calentado (arroz + fríjol)', carbs: 45, fat: 12, protein: 15 },
    { name: 'Yuca cocida con queso', carbs: 35, fat: 8, protein: 6 },
    { name: 'Bollo limpio', carbs: 30, fat: 1, protein: 2 },
    { name: 'Bollo de yuca', carbs: 40, fat: 1, protein: 2 },
    { name: 'Bollo de mazorca', carbs: 35, fat: 5, protein: 4 },
    { name: 'Queso costeño (50g)', carbs: 1, fat: 12, protein: 10 },
    { name: 'Avena casera (vaso)', carbs: 30, fat: 4, protein: 5 },
    { name: 'Chocolate caliente', carbs: 25, fat: 8, protein: 6 },
    { name: 'Café con leche', carbs: 12, fat: 5, protein: 4 },
    { name: 'Milo con leche', carbs: 25, fat: 6, protein: 5 },
  ],
  'Almuerzos': [
    { name: 'Arroz blanco (100g)', carbs: 28, fat: 0.3, protein: 2.7 },
    { name: 'Arroz con pollo', carbs: 40, fat: 10, protein: 20 },
    { name: 'Arroz con coco', carbs: 45, fat: 12, protein: 4 },
    { name: 'Arroz con lentejas', carbs: 35, fat: 5, protein: 10 },
    { name: 'Arroz con fríjoles', carbs: 40, fat: 6, protein: 12 },
    { name: 'Pollo guisado', carbs: 5, fat: 12, protein: 25 },
    { name: 'Pollo frito', carbs: 10, fat: 20, protein: 22 },
    { name: 'Carne asada', carbs: 0, fat: 15, protein: 25 },
    { name: 'Pescado frito (Mojarra)', carbs: 5, fat: 18, protein: 20 },
    { name: 'Lentejas (plato)', carbs: 25, fat: 5, protein: 12 },
    { name: 'Fríjoles (plato)', carbs: 30, fat: 8, protein: 15 },
    { name: 'Sancocho (plato)', carbs: 35, fat: 15, protein: 18 },
  ],
  'Acompañamientos': [
    { name: 'Patacón (1 unidad)', carbs: 20, fat: 8, protein: 1 },
    { name: 'Tajadas de plátano maduro', carbs: 25, fat: 10, protein: 1 },
    { name: 'Papa frita (porción)', carbs: 30, fat: 15, protein: 3 },
    { name: 'Papa cocida', carbs: 20, fat: 0.1, protein: 2 },
    { name: 'Yuca frita', carbs: 40, fat: 12, protein: 1 },
    { name: 'Yuca cocida', carbs: 35, fat: 0.1, protein: 1 },
    { name: 'Aguacate (1/2)', carbs: 4, fat: 15, protein: 2 },
    { name: 'Ensalada simple', carbs: 5, fat: 2, protein: 1 },
  ],
  'Snacks y Comida Rápida': [
    { name: 'Empanada', carbs: 20, fat: 10, protein: 4 },
    { name: 'Carimañola', carbs: 25, fat: 12, protein: 5 },
    { name: 'Papa rellena', carbs: 35, fat: 15, protein: 8 },
    { name: 'Dedito de queso', carbs: 20, fat: 12, protein: 6 },
    { name: 'Pastel de pollo', carbs: 30, fat: 18, protein: 10 },
    { name: 'Chorizo', carbs: 2, fat: 20, protein: 12 },
    { name: 'Salchipapa', carbs: 30, fat: 25, protein: 12 },
    { name: 'Hamburguesa', carbs: 40, fat: 25, protein: 20 },
    { name: 'Perro caliente', carbs: 35, fat: 20, protein: 12 },
    { name: 'Pizza (porción)', carbs: 30, fat: 12, protein: 12 },
    { name: 'Sandwich', carbs: 25, fat: 10, protein: 12 },
    { name: 'Chocorramo', carbs: 45, fat: 20, protein: 5 },
    { name: 'Papas de paquete', carbs: 25, fat: 15, protein: 2 },
  ],
  'Bebidas': [
    { name: 'Agua', carbs: 0, fat: 0, protein: 0 },
    { name: 'Jugo de fruta (azucarado)', carbs: 25, fat: 0, protein: 0 },
    { name: 'Gaseosa (vaso)', carbs: 30, fat: 0, protein: 0 },
    { name: 'Té frío', carbs: 20, fat: 0, protein: 0 },
    { name: 'Energizante', carbs: 30, fat: 0, protein: 0 },
  ]
};

const ACTIVITY_PRESETS = [
  { name: 'Asistir a clase', met: 1.8 },
  { name: 'Estudiar', met: 1.3 },
  { name: 'Caminar', met: 3.5 },
  { name: 'Bailar', met: 5.0 },
  { name: 'Gimnasio', met: 5.5 },
];

const ACTIVITY_CATEGORIES: Record<string, Omit<ActivityItem, 'id' | 'hours'>[]> = {
  'Básicas': [
    { name: 'Dormir', met: 0.95 },
    { name: 'Despertarse / Rutina', met: 2.0 },
    { name: 'Comer', met: 1.5 },
    { name: 'Ducharse', met: 2.0 },
    { name: 'Descansar / Sentado', met: 1.3 },
  ],
  'Académicas': [
    { name: 'Asistir a clase', met: 1.8 },
    { name: 'Estudiar en casa', met: 1.3 },
    { name: 'Estudiar en biblioteca', met: 1.3 },
    { name: 'Hacer tareas', met: 1.5 },
    { name: 'Trabajo en computador', met: 1.5 },
    { name: 'Trabajo de laboratorio', met: 2.3 },
    { name: 'Trabajo de campo', met: 3.5 },
  ],
  'Transporte': [
    { name: 'Caminar', met: 3.0 },
    { name: 'Caminar rápido', met: 4.5 },
    { name: 'Ir en bicicleta', met: 5.5 },
    { name: 'Conducir moto', met: 2.5 },
    { name: 'Conducir carro', met: 2.0 },
    { name: 'Ir en bus / Transmetro', met: 1.3 },
  ],
  'Física': [
    { name: 'Gimnasio', met: 5.5 },
    { name: 'Correr', met: 8.0 },
    { name: 'Trotar', met: 6.0 },
    { name: 'Jugar fútbol', met: 7.0 },
    { name: 'Jugar baloncesto', met: 6.5 },
    { name: 'Bailar', met: 5.0 },
  ],
  'Ocio': [
    { name: 'Salir con amigos', met: 2.0 },
    { name: 'Ver TV / Películas', met: 1.0 },
    { name: 'Redes sociales / Videojuegos', met: 1.0 },
    { name: 'Ir a fiestas', met: 4.0 },
  ],
  'Domésticas': [
    { name: 'Cocinar', met: 2.5 },
    { name: 'Lavar platos', met: 2.0 },
    { name: 'Barrer / Trapear', met: 3.5 },
    { name: 'Lavar ropa', met: 2.5 },
    { name: 'Ir al mercado', met: 2.5 },
  ],
  'Caribe': [
    { name: 'Ir a la playa (relax)', met: 2.0 },
    { name: 'Caminar por el malecón', met: 3.5 },
    { name: 'Fútbol en la playa', met: 8.0 },
    { name: 'Bailar (fiesta)', met: 6.0 },
  ]
};

const INITIAL_MEALS: Meal[] = [];

const INITIAL_ACTIVITIES: ActivityItem[] = [];

const EXAMPLES = {
  regular: {
    name: 'Día Regular',
    weight: 70,
    meals: [
      { id: '1', name: 'Arepa de huevo + Café', carbs: 37, fat: 20, protein: 11, time: 7 },
      { id: '2', name: 'Almuerzo: Arroz con pollo', carbs: 40, fat: 10, protein: 20, time: 13 },
      { id: '3', name: 'Snack: Empanada', carbs: 20, fat: 10, protein: 4, time: 16 },
      { id: '4', name: 'Cena: Pan con queso', carbs: 20, fat: 8, protein: 7, time: 20 },
    ],
    activities: [
      { id: '1', name: 'Dormir', met: 0.95, hours: 7, startTime: 23 },
      { id: '2', name: 'Asistir a clase', met: 1.8, hours: 6, startTime: 7 },
      { id: '3', name: 'Estudiar', met: 1.3, hours: 4, startTime: 14 },
      { id: '4', name: 'Caminar (campus)', met: 3.5, hours: 1, startTime: 13 },
      { id: '5', name: 'Transporte (bus)', met: 1.3, hours: 2, startTime: 18 },
      { id: '6', name: 'Rutina casa', met: 2.0, hours: 4, startTime: 20 },
    ]
  },
  descanso: {
    name: 'Día de Descanso',
    weight: 70,
    meals: [
      { id: '1', name: 'Calentado', carbs: 45, fat: 12, protein: 15, time: 9 },
      { id: '2', name: 'Almuerzo: Sancocho', carbs: 35, fat: 15, protein: 18, time: 14 },
      { id: '3', name: 'Fruta', carbs: 20, fat: 0, protein: 1, time: 17 },
      { id: '4', name: 'Cena ligera', carbs: 15, fat: 5, protein: 10, time: 20 },
    ],
    activities: [
      { id: '1', name: 'Dormir', met: 0.95, hours: 10, startTime: 22 },
      { id: '2', name: 'Ver TV / Películas', met: 1.0, hours: 6, startTime: 10 },
      { id: '3', name: 'Redes sociales', met: 1.0, hours: 4, startTime: 16 },
      { id: '4', name: 'Cocinar', met: 2.5, hours: 2, startTime: 13 },
      { id: '5', name: 'Caminar suave', met: 2.0, hours: 2, startTime: 20 },
    ]
  }
};

// --- Components ---

// --- Krebs Animation Component ---

const KrebsAnimation = ({ onComplete, t, language, theme }: { onComplete: () => void, t: any, language: string, theme: string }) => {
  const [stage, setStage] = useState(0);

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 4000), // Glycolysis
      setTimeout(() => setStage(2), 8000), // Link Reaction
      setTimeout(() => setStage(3), 12000), // Citrate
      setTimeout(() => setStage(4), 16000), // alpha-KG
      setTimeout(() => setStage(5), 20000), // Succinyl
      setTimeout(() => setStage(6), 24000), // Regeneration
      setTimeout(() => onComplete(), 28000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Carbon count based on stage
  const carbonCount = stage === 0 ? 6 : stage === 1 ? 3 : stage === 2 ? 2 : stage === 3 ? 6 : stage === 4 ? 5 : 4;

  // Helper for carbon atom with decorations
  const CarbonAtom = ({ id, color = "bg-emerald-500", size = "w-12 h-12 md:w-16 md:h-16", text = "C" }: { id: string, color?: string, size?: string, text?: string, key?: any }) => (
    <motion.div 
      layoutId={id}
      key={id}
      className={`${size} ${color} rounded-full shadow-lg border-2 border-white flex items-center justify-center text-lg md:text-xl font-black text-white relative`}
    >
      {text}
      {/* Decorations (H and O atoms) */}
      <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full border border-stone-200 flex items-center justify-center text-[6px] md:text-[8px] font-bold text-stone-800 shadow-sm">H</div>
      <div className="absolute -bottom-1 -left-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full border border-white flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white shadow-sm">O</div>
    </motion.div>
  );

  return (
    <div className={`fixed inset-0 z-[200] ${theme === 'dark' ? 'bg-stone-950' : 'bg-stone-50'} flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-500`}>
      <div className="max-w-6xl w-full text-center space-y-4 md:space-y-8 relative flex flex-col h-full justify-center">
        
        {/* Skip Button */}
        <button 
          onClick={onComplete}
          className={`absolute top-0 right-0 z-[210] px-4 py-2 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-400' : 'bg-black/5 hover:bg-black/10 border-black/10 text-stone-600'} rounded-full text-xs font-bold transition-colors flex items-center gap-2`}
        >
          {t('viewResults')} <ChevronRight className="w-4 h-4" />
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1 md:space-y-2"
        >
          <div className={`inline-block px-3 py-0.5 md:px-4 md:py-1 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/5 border-emerald-500/10'} rounded-full mb-1`}>
            <p className={`text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]`}>Simulación Molecular Detallada</p>
          </div>
          <h2 className={`text-2xl md:text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-stone-900'} tracking-tighter`}>
            {t('krebsTitle')}
          </h2>
          <p className={`${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} text-sm md:text-lg max-w-2xl mx-auto line-clamp-2 md:line-clamp-none`}>
            {t('krebsDesc')}
          </p>
        </motion.div>

        {/* Animation Container */}
        <div className={`relative h-[350px] md:h-[520px] w-full flex items-center justify-center ${theme === 'dark' ? 'bg-stone-900/20 border-white/5' : 'bg-stone-200/50 border-black/5'} rounded-[2rem] md:rounded-[3rem] border backdrop-blur-sm shadow-inner overflow-hidden`}>
          
          {/* Mitochondria Background Details */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-500">
              <path fill="currentColor" d="M100,20 C150,20 180,60 180,100 C180,140 150,180 100,180 C50,180 20,140 20,100 C20,60 50,20 100,20 Z" />
              <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M40,100 Q60,60 100,100 T160,100" />
              <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M40,120 Q60,80 100,120 T160,120" />
              <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M40,80 Q60,40 100,80 T160,80" />
            </svg>
          </motion.div>

          {/* Carbon Counter Floating */}
          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
            <motion.div 
              key={carbonCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-2 md:px-6 md:py-3 ${theme === 'dark' ? 'bg-stone-950/80 border-stone-800' : 'bg-white/80 border-stone-200'} rounded-xl md:rounded-2xl border flex items-center gap-2 md:gap-3 shadow-2xl backdrop-blur-md`}
            >
              <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <p className={`${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} font-bold uppercase tracking-widest text-[10px] md:text-xs`}>
                {language === 'es' ? 'Carbonos' : 'Carbons'}: <span className="text-emerald-400 text-lg md:text-2xl font-black">{carbonCount}</span>
              </p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {/* Stage 0: Glucose (C6) */}
            {stage === 0 && (
              <motion.div 
                key="glucose"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="flex flex-col items-center gap-6 md:gap-12"
              >
                <div className="flex items-center gap-1 md:gap-2 scale-75 md:scale-100">
                  {[...Array(6)].map((_, i) => (
                    <React.Fragment key={i}>
                      <CarbonAtom id={`c-${i}`} />
                      {i < 5 && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className={`w-3 md:w-6 h-1 ${theme === 'dark' ? 'bg-white/40' : 'bg-black/20'} origin-left`} />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-center px-4">
                  <p className="text-emerald-400 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s0')}</p>
                  <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc0')}</p>
                </div>
              </motion.div>
            )}

            {/* Stage 1: Glycolysis Splitting */}
            {stage === 1 && (
              <motion.div 
                key="glycolysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-10 md:gap-20"
              >
                <div className="flex flex-col md:flex-row gap-10 md:gap-40 scale-75 md:scale-100">
                  {[0, 1].map((group) => (
                    <motion.div 
                      key={group}
                      initial={{ y: group === 0 ? -50 : 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex flex-col items-center gap-4 md:gap-8"
                    >
                      <div className="flex items-center gap-1 md:gap-2">
                        {[0, 1, 2].map((i) => (
                          <React.Fragment key={i}>
                            <CarbonAtom id={`c-${group * 3 + i}`} color="bg-emerald-400" size="w-12 h-12 md:w-14 md:h-14" />
                            {i < 2 && <div className={`w-3 md:w-4 h-1 ${theme === 'dark' ? 'bg-white/30' : 'bg-black/15'}`} />}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-emerald-300 font-black text-[10px] md:text-sm uppercase tracking-[0.2em]">Piruvato (C₃)</p>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center px-4">
                  <p className="text-emerald-300 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s1')}</p>
                  <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc1')}</p>
                </div>
              </motion.div>
            )}

            {/* Stage 2: Link Reaction (Pyruvate -> Acetyl-CoA) */}
            {stage === 2 && (
              <motion.div 
                key="link-reaction"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 md:gap-12"
              >
                <div className="flex items-center gap-4 md:gap-6 scale-90 md:scale-100">
                  <div className="flex items-center gap-1 md:gap-2">
                    {[0, 1].map((i) => (
                      <React.Fragment key={i}>
                        <CarbonAtom id={`c-${i}`} color="bg-amber-500" />
                        {i === 0 && <div className={`w-4 md:w-6 h-1 ${theme === 'dark' ? 'bg-white/40' : 'bg-black/20'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                  <motion.div 
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={`px-4 py-2 md:px-8 md:py-4 ${theme === 'dark' ? 'bg-stone-800 text-white border-white' : 'bg-stone-100 text-stone-900 border-stone-300'} rounded-2xl md:rounded-3xl border-2 text-sm md:text-lg font-black shadow-2xl`}
                  >CoA</motion.div>
                </div>
                
                {/* CO2 Detaching Visual */}
                <motion.div 
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: 150, y: -150, opacity: 0, scale: 0.5, rotate: 180 }}
                  transition={{ duration: 4, ease: "anticipate" }}
                  className="absolute flex flex-col items-center"
                >
                  <div className={`w-10 h-10 md:w-14 md:h-14 bg-blue-500 rounded-full border-2 ${theme === 'dark' ? 'border-white' : 'border-stone-200'} flex items-center justify-center text-sm md:text-lg font-black text-white shadow-[0_0_30px_rgba(59,130,246,0.6)]`}>C</div>
                  <div className="mt-2 px-3 py-0.5 bg-blue-900/50 rounded-full text-blue-300 font-black text-[8px] md:text-xs uppercase tracking-widest">CO₂ Liberado</div>
                </motion.div>

                <div className="text-center px-4">
                  <p className="text-amber-400 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s2')}</p>
                  <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc2')}</p>
                </div>
              </motion.div>
            )}

            {/* Stage 3-6: The Cycle Proper */}
            {stage >= 3 && (
              <motion.div 
                key="krebs-cycle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center"
              >
                {/* Rotating Glow Background */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[1px] md:border-[2px] border-dashed border-emerald-500/20 rounded-full"
                />
                
                <AnimatePresence mode="wait">
                  {/* Stage 3: Citrate Formation */}
                  {stage === 3 && (
                    <motion.div 
                      key="citrate"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4 md:gap-8"
                    >
                      <div className="grid grid-cols-3 gap-2 md:gap-3 scale-75 md:scale-100">
                        {[...Array(6)].map((_, i) => (
                          <CarbonAtom 
                            key={i} 
                            id={i < 2 ? `c-${i}` : `ox-${i-2}`} 
                            size="w-10 h-10 md:w-14 md:h-14"
                          />
                        ))}
                      </div>
                      <div className="text-center px-4">
                        <p className="text-emerald-400 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s3')}</p>
                        <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc3')}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Stage 4: alpha-Ketoglutarate */}
                  {stage === 4 && (
                    <motion.div 
                      key="alpha-kg"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4 md:gap-8"
                    >
                      <div className="flex gap-2 md:gap-3 scale-75 md:scale-100">
                        {/* 5 carbons remain in the cycle */}
                        {[0, 1].map(i => <CarbonAtom key={`c-${i}`} id={`c-${i}`} color="bg-emerald-400" size="w-10 h-10 md:w-14 md:h-14" />)}
                        {[0, 1, 2].map(i => <CarbonAtom key={`ox-${i}`} id={`ox-${i}`} color="bg-emerald-400" size="w-10 h-10 md:w-14 md:h-14" />)}
                      </div>
                      
                      {/* CO2 Leaving (ox-3 leaves) */}
                      <motion.div 
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: 150, y: -120, opacity: 0, rotate: 90 }}
                        transition={{ duration: 4 }}
                        className="absolute flex flex-col items-center"
                      >
                        <CarbonAtom id="ox-3" color="bg-blue-500" size="w-8 h-8 md:w-12 md:h-12" />
                        <div className="mt-1 text-blue-400 font-black text-[8px] md:text-xs">CO₂</div>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                        className="absolute -right-10 md:-right-32 top-0 px-3 py-1 md:px-4 md:py-2 bg-purple-500 rounded-lg md:rounded-xl text-white font-black text-[8px] md:text-xs shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                      >+ NADH</motion.div>

                      <div className="text-center px-4">
                        <p className="text-emerald-300 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s4')}</p>
                        <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc4')}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Stage 5: Succinyl-CoA */}
                  {stage === 5 && (
                    <motion.div 
                      key="succinyl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4 md:gap-8"
                    >
                      <div className="grid grid-cols-2 gap-2 md:gap-4 scale-75 md:scale-100">
                        {/* 4 carbons remain (ox-0, ox-1, ox-2, c-0) */}
                        <CarbonAtom id="c-0" color="bg-emerald-300" size="w-10 h-10 md:w-14 md:h-14" />
                        {[0, 1, 2].map(i => <CarbonAtom key={`ox-${i}`} id={`ox-${i}`} color="bg-emerald-300" size="w-10 h-10 md:w-14 md:h-14" />)}
                      </div>
                      
                      {/* CO2 Leaving (c-1 leaves) */}
                      <motion.div 
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: -150, y: -120, opacity: 0, rotate: -90 }}
                        transition={{ duration: 4 }}
                        className="absolute flex flex-col items-center"
                      >
                        <CarbonAtom id="c-1" color="bg-blue-500" size="w-8 h-8 md:w-12 md:h-12" />
                        <div className="mt-1 text-blue-400 font-black text-[8px] md:text-xs">CO₂</div>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                        className="absolute -left-10 md:-left-32 top-0 px-3 py-1 md:px-4 md:py-2 bg-purple-500 rounded-lg md:rounded-xl text-white font-black text-[8px] md:text-xs shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                      >+ NADH</motion.div>

                      <div className="text-center px-4">
                        <p className="text-emerald-200 font-black text-xl md:text-3xl uppercase tracking-[0.3em]">{t('krebsStages.s5')}</p>
                        <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc5')}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Stage 6: Regeneration */}
                  {stage === 6 && (
                    <motion.div 
                      key="regeneration"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-6 md:gap-10"
                    >
                      <div className="grid grid-cols-2 gap-2 md:gap-4 scale-75 md:scale-100">
                        {/* Oxaloacetate regenerated (4 carbons) */}
                        {[0, 1, 2, 3].map((i) => (
                          <CarbonAtom 
                            key={i}
                            id={`ox-${i}`}
                            color={theme === 'dark' ? 'bg-stone-700' : 'bg-stone-300'}
                            size="w-10 h-10 md:w-16 md:h-16"
                          />
                        ))}
                      </div>
                      
                      {/* Energy Burst Visuals */}
                      <div className="absolute -bottom-10 md:-bottom-20 flex gap-4 md:gap-8 scale-75 md:scale-100">
                        <motion.div 
                          initial={{ scale: 0, y: 30 }}
                          animate={{ scale: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          <div className={`w-14 h-14 md:w-20 md:h-20 bg-amber-400 rounded-2xl md:rounded-3xl flex items-center justify-center ${theme === 'dark' ? 'text-stone-950' : 'text-stone-900'} font-black text-sm md:text-xl shadow-[0_0_40px_rgba(251,191,36,0.6)]`}>ATP</div>
                          <p className="text-amber-500 text-[8px] md:text-xs font-black mt-2 md:mt-3 tracking-widest">ENERGÍA</p>
                        </motion.div>
                        <motion.div 
                          initial={{ scale: 0, y: 30 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-14 h-14 md:w-20 md:h-20 bg-purple-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white font-black text-sm md:text-xl shadow-[0_0_40px_rgba(168,85,247,0.6)]">NADH</div>
                          <p className="text-purple-500 text-[8px] md:text-xs font-black mt-2 md:mt-3 tracking-widest">PODER</p>
                        </motion.div>
                      </div>

                      <div className="text-center px-4">
                        <p className={`${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} font-black text-xl md:text-3xl uppercase tracking-[0.3em]`}>{t('krebsStages.s6')}</p>
                        <p className="text-emerald-500 mt-1 font-black text-[10px] md:text-sm animate-pulse uppercase">Oxaloacetato Regenerado</p>
                        <p className={`${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'} mt-1 md:text-lg font-medium max-w-xs md:max-w-none`}>{t('krebsStages.desc6')}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Timeline */}
        <div className="max-w-3xl mx-auto w-full px-4 mb-4">
          <div className={`relative h-1.5 md:h-2 ${theme === 'dark' ? 'bg-stone-900 border-white/5' : 'bg-stone-200 border-black/5'} rounded-full overflow-hidden border`}>
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: `${(stage / 6) * 100}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 md:mt-4">
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full border md:border-2 transition-all duration-500 ${stage >= s ? 'bg-emerald-500 border-emerald-400 scale-125 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : (theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-300 border-stone-200')}`} />
                <span className={`text-[8px] md:text-[10px] mt-1 md:mt-2 font-black uppercase tracking-tighter transition-colors duration-500 ${stage >= s ? 'text-emerald-400' : (theme === 'dark' ? 'text-stone-600' : 'text-stone-400')}`}>
                  {s === 0 ? 'Start' : s === 6 ? 'End' : `S${s}`}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [weight, setWeight] = useState<number>(70);
  const [kcalPerGC, setKcalPerGC] = useState<number>(10.5);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isMoleculeModalOpen, setIsMoleculeModalOpen] = useState(false);
  const [isKcalHelpOpen, setIsKcalHelpOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'simulation' | 'journey'>('simulation');
  
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    input: true,
    output: true,
    cumulative: true,
    energy: true
  });

  const toggleSeries = (e: any) => {
    const { dataKey } = e;
    setVisibleSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };
  const [showSplash, setShowSplash] = useState(true);
  const [showChallenges, setShowChallenges] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const pdfDataSummaryRef = useRef<HTMLDivElement>(null);
  const carbonChartRef = useRef<HTMLDivElement>(null);
  const energyChartRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<HTMLDivElement>(null);
  const dataTableRef = useRef<HTMLDivElement>(null);

  const downloadCSV = () => {
    try {
      setIsDownloading('csv');
      
      const isEs = language === 'es';
      
      // Section 1: Summary
      const summaryHeaders = [isEs ? "Resumen de Resultados" : "Results Summary"];
      const summarySubHeaders = [isEs ? "Concepto" : "Concept", isEs ? "Valor" : "Value", isEs ? "Unidad" : "Unit"];
      const summaryRows = [
        [t('carbonIngested'), carbonIngested.toFixed(2), "g C"],
        [t('energyUsed'), energyUsedKcal.toFixed(2), "kcal"],
        [t('carbonOxidized'), carbonOxidized.toFixed(2), "g C"],
        [t('estimatedCO2'), co2Produced.toFixed(2), "g CO2"],
        [t('netCarbonBalance'), carbonBalance.toFixed(2), "g C"],
      ];

      // Section 2: Hourly Data
      const hourlyHeaders = ["", isEs ? "Actividad Metabólica por Hora" : "Hourly Metabolic Activity"];
      const hourlySubHeaders = [isEs ? "Hora" : "Hour", isEs ? "Ingreso (g C)" : "Input (g C)", isEs ? "Gasto (g C)" : "Output (g C)", isEs ? "Energía (kcal)" : "Energy (kcal)", isEs ? "Balance Acumulado (g C)" : "Cumulative Balance (g C)"];
      const hourlyRows = hourlyChartData.map(d => [
        d.time,
        d.input.toFixed(2),
        d.output.toFixed(2),
        d.energy.toFixed(2),
        d.cumulative.toFixed(2)
      ]);

      // Section 3: Metabolic Events (Table)
      const eventsHeaders = ["", isEs ? "Eventos Metabólicos" : "Metabolic Events"];
      const eventsSubHeaders = [isEs ? "Nombre" : "Name", isEs ? "Tipo" : "Type", isEs ? "Hora" : "Time", isEs ? "Valor" : "Value", isEs ? "Carbono/Energía" : "Carbon/Energy"];
      
      const mealRows = meals.map(meal => [
        meal.name,
        isEs ? "Comida" : "Meal",
        `${meal.time}:00`,
        `${meal.carbs}g carbs`,
        `${(meal.carbs * CARBON_FRACTIONS.carbs + meal.fat * CARBON_FRACTIONS.fat + meal.protein * CARBON_FRACTIONS.protein).toFixed(1)}g C`
      ]);

      const activityRows = activities.map(act => [
        act.name,
        isEs ? "Actividad" : "Activity",
        `${act.startTime}:00`,
        `${act.met} MET`,
        `${(act.met * weight * act.hours).toFixed(0)} kcal`
      ]);

      const csvContent = [
        summaryHeaders.join(","),
        summarySubHeaders.join(","),
        ...summaryRows.map(row => row.join(",")),
        "",
        hourlyHeaders.join(","),
        hourlySubHeaders.join(","),
        ...hourlyRows.map(row => row.join(",")),
        "",
        eventsHeaders.join(","),
        eventsSubHeaders.join(","),
        ...mealRows.map(row => row.join(",")),
        ...activityRows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `carbon_balance_full_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    } finally {
      setIsDownloading(null);
    }
  };

  const downloadPDF = async () => {
    try {
      setIsDownloading('pdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const addSectionToPDF = async (ref: React.RefObject<HTMLDivElement>, title: string, isFirstPage = false) => {
        if (!ref.current) return;
        if (!isFirstPage) pdf.addPage();
        
        pdf.setFontSize(18);
        pdf.setTextColor(40, 40, 40);
        pdf.text(title, margin, 20);
        
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: theme === 'dark' ? '#0c0a09' : '#fafaf9',
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
        
        let finalImgHeight = imgHeight;
        if (finalImgHeight > pageHeight - 40) {
          finalImgHeight = pageHeight - 40;
        }

        pdf.addImage(imgData, 'PNG', margin, 30, contentWidth, finalImgHeight);
      };

      await addSectionToPDF(pdfDataSummaryRef, t('metabolicSummary'), true);
      await addSectionToPDF(carbonChartRef, t('carbonFlow'));
      await addSectionToPDF(energyChartRef, t('energyAndBalance'));
      await addSectionToPDF(visualizationRef, t('visualization'));
      await addSectionToPDF(dataTableRef, t('dataTable'));

      pdf.save(`carbon_balance_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(language === 'es' ? "Error al generar el PDF. Por favor, intenta de nuevo." : "Error generating PDF. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };
  const [showInstructions, setShowInstructions] = useState(false);
  const [showResultsPage, setShowResultsPage] = useState(false);
  const [isAnimatingKrebs, setIsAnimatingKrebs] = useState(false);

  const t = (key: keyof typeof TRANSLATIONS['es']) => TRANSLATIONS[language][key] as any;
  const tc = (category: string) => (TRANSLATIONS[language].categories as any)[category] || category;

  // --- Calculations ---

  const carbonIngested = useMemo(() => {
    return meals.reduce((acc, meal) => {
      const carbs = Number(meal.carbs) || 0;
      const protein = Number(meal.protein) || 0;
      const fat = Number(meal.fat) || 0;
      const c = (carbs * CARBON_FRACTIONS.carbs) + 
                (protein * CARBON_FRACTIONS.protein) + 
                (fat * CARBON_FRACTIONS.fat);
      return acc + c;
    }, 0);
  }, [meals]);

  const energyUsedKcal = useMemo(() => {
    const w = Number(weight) || 0;
    return activities.reduce((acc, act) => {
      const met = Number(act.met) || 0;
      const hours = Number(act.hours) || 0;
      return acc + (met * w * hours);
    }, 0);
  }, [activities, weight]);

  const carbonOxidized = useMemo(() => {
    return energyUsedKcal / kcalPerGC;
  }, [energyUsedKcal, kcalPerGC]);

  const co2Produced = useMemo(() => {
    return carbonOxidized * CO2_C_RATIO;
  }, [carbonOxidized]);

  const carbonBalance = carbonIngested - carbonOxidized;
  const totalHours = activities.reduce((acc, act) => acc + act.hours, 0);

  // --- Handlers ---

  const addMeal = () => {
    setMeals([...meals, { id: Date.now().toString(), name: 'Nueva comida', carbs: 0, fat: 0, protein: 0, time: 12 }]);
  };

  const updateMeal = (id: string, field: keyof Meal, value: string | number) => {
    let finalValue = value;
    if (field === 'carbs' || field === 'fat' || field === 'protein') {
      const n = Number(value);
      finalValue = isNaN(n) ? 0 : Math.max(0, n);
    } else if (field === 'time') {
      const n = Number(value);
      finalValue = isNaN(n) ? 12 : Math.min(23, Math.max(0, Math.floor(n)));
    }
    setMeals(meals.map(m => m.id === id ? { ...m, [field]: finalValue } : m));
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const addActivity = () => {
    setActivities([...activities, { id: Date.now().toString(), name: 'Nueva actividad', met: 1, hours: 0, startTime: 12 }]);
  };

  const updateActivity = (id: string, field: keyof ActivityItem, value: string | number) => {
    let finalValue = value;
    if (field === 'hours') {
      const n = Number(value);
      finalValue = isNaN(n) ? 0 : Math.min(24, Math.max(0, n));
    } else if (field === 'startTime') {
      const n = Number(value);
      finalValue = isNaN(n) ? 12 : Math.min(23, Math.max(0, Math.floor(n)));
    } else if (field === 'met') {
      const n = Number(value);
      finalValue = isNaN(n) ? 1 : Math.max(0, n);
    }
    setActivities(activities.map(a => a.id === id ? { ...a, [field]: finalValue } : a));
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const loadExample = (type: keyof typeof EXAMPLES) => {
    const example = EXAMPLES[type];
    setWeight(example.weight);
    setMeals(example.meals);
    setActivities(example.activities);
  };

  const resetApp = () => {
    setWeight(70);
    setKcalPerGC(10.5);
    setMeals([]);
    setActivities([]);
  };

  const handleViewResults = () => {
    setIsAnimatingKrebs(true);
  };

  const onAnimationComplete = () => {
    setIsAnimatingKrebs(false);
    setShowResultsPage(true);
  };

  // --- Chart Data ---
  const chartData = [
    { name: t('ingested'), valor: parseFloat(carbonIngested.toFixed(1)), fill: '#10b981' },
    { name: t('oxidized'), valor: parseFloat(carbonOxidized.toFixed(1)), fill: '#f59e0b' },
    { name: t('balance'), valor: parseFloat(carbonBalance.toFixed(1)), fill: carbonBalance >= 0 ? '#3b82f6' : '#ef4444' }
  ];

  const hourlyChartData = useMemo(() => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      time: `${i}:00`,
      input: 0,
      output: 0,
      energy: 0,
      cumulative: 0
    }));

    // Add meals
    meals.forEach(meal => {
      const carbs = Number(meal.carbs) || 0;
      const protein = Number(meal.protein) || 0;
      const fat = Number(meal.fat) || 0;
      
      const c = (carbs * CARBON_FRACTIONS.carbs) + 
                (protein * CARBON_FRACTIONS.protein) + 
                (fat * CARBON_FRACTIONS.fat);
      const hour = Math.min(23, Math.max(0, Math.floor(Number(meal.time) || 0)));
      if (data[hour]) data[hour].input += c;
    });

    // Add activities
    activities.forEach(act => {
      const met = Number(act.met) || 0;
      const hours = Math.min(24, Math.max(0, Number(act.hours) || 0));
      const startTime = Math.min(23, Math.max(0, Math.floor(Number(act.startTime) || 0)));
      
      const hourlyEnergy = (met * weight);
      const hourlyCarbon = kcalPerGC > 0 ? hourlyEnergy / kcalPerGC : 0;
      
      for (let i = 0; i < hours; i++) {
        const hour = (startTime + i) % 24;
        if (data[hour]) {
          data[hour].output += hourlyCarbon;
          data[hour].energy += hourlyEnergy;
        }
      }
    });

    // Calculate cumulative
    let currentBalance = 0;
    data.forEach(h => {
      currentBalance += (h.input - h.output);
      h.cumulative = parseFloat(currentBalance.toFixed(1));
      h.input = parseFloat(h.input.toFixed(1));
      h.output = parseFloat(h.output.toFixed(1));
      h.energy = parseFloat(h.energy.toFixed(1));
    });

    return data;
  }, [meals, activities, weight, kcalPerGC]);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900 p-4 md:p-8 transition-colors duration-300">
        
        <AnimatePresence>
          {showSplash && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 opacity-10 dark:opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_50%)]"></div>
              </div>
              
              <div className="max-w-2xl w-full text-center space-y-10 relative z-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-stone-900 dark:text-white tracking-tighter mb-6 leading-tight">
                    {t('title')}
                  </h1>
                  <p className="text-stone-600 dark:text-stone-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                    {t('splashTitle')}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <button 
                    onClick={() => setShowSplash(false)}
                    className="group relative px-8 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <PlayCircle /> {t('startGame')}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowInstructions(true)}
                    className="px-8 py-5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-bold text-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-all border border-stone-200 dark:border-stone-700 active:scale-95 shadow-sm"
                  >
                    {t('gameplayInstructions')}
                  </button>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-center gap-6 pt-4"
                >
                  <button 
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} 
                    className="text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-2 transition-colors font-medium"
                  >
                    <Languages size={20} /> {language === 'es' ? 'English' : 'Español'}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnimatingKrebs && (
            <KrebsAnimation onComplete={onAnimationComplete} t={t} language={language} theme={theme} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResultsPage && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 z-[150] bg-stone-50 dark:bg-stone-950 overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">{t('metabolicSummary')}</h2>
                    <p className="text-stone-500">{t('subtitle')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={downloadCSV}
                      disabled={isDownloading !== null}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      title={t('downloadCSV')}
                    >
                      {isDownloading === 'csv' ? <RefreshCcw className="animate-spin" size={18} /> : <FileText size={18} />}
                      <span className="hidden sm:inline">{t('downloadCSV')}</span>
                    </button>
                    <button 
                      onClick={downloadPDF}
                      disabled={isDownloading !== null}
                      className="flex-1 md:flex-none px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      title={t('downloadPDF')}
                    >
                      {isDownloading === 'pdf' ? <RefreshCcw className="animate-spin" size={18} /> : <FileDown size={18} />}
                      <span className="hidden sm:inline">{t('downloadPDF')}</span>
                    </button>
                    <button 
                      onClick={() => setShowResultsPage(false)}
                      className="flex-1 md:flex-none px-4 py-2 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw size={18} /> <span className="hidden sm:inline">{t('backToLog')}</span>
                    </button>
                  </div>
                </header>

                <div className="space-y-8 p-1">
                  {/* Hidden div for PDF Data Summary */}
                  <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div ref={pdfDataSummaryRef} className="p-10 bg-white text-stone-900 w-[800px] space-y-8">
                      <div className="border-b-2 border-emerald-500 pb-4">
                        <h1 className="text-3xl font-bold text-stone-800">{t('metabolicSummary')}</h1>
                        <p className="text-stone-500">{new Date().toLocaleDateString()}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('carbonIngested')}</p>
                          <p className="text-4xl font-bold text-emerald-700">{carbonIngested.toFixed(1)} g C</p>
                        </div>
                        
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">{t('energyUsed')}</p>
                          <p className="text-4xl font-bold text-amber-700">{energyUsedKcal.toFixed(0)} kcal</p>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">{t('carbonOxidized')}</p>
                          <p className="text-4xl font-bold text-amber-700">{carbonOxidized.toFixed(1)} g C</p>
                        </div>

                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">{t('estimatedCO2')}</p>
                          <p className="text-4xl font-bold text-blue-700">{co2Produced.toFixed(1)} g CO₂</p>
                        </div>
                      </div>

                      <div className={`p-8 rounded-2xl border-2 ${
                        carbonBalance > 5 ? 'bg-emerald-600 text-white border-emerald-700' : 
                        carbonBalance < -5 ? 'bg-amber-600 text-white border-amber-700' : 
                        'bg-stone-600 text-white border-stone-700'
                      }`}>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">{t('netCarbonBalance')}</p>
                        <p className="text-5xl font-bold">{carbonBalance.toFixed(1)} g C</p>
                        <p className="mt-3 text-lg font-medium opacity-90">
                          {carbonBalance > 5 ? t('balancePositive') : 
                           carbonBalance < -5 ? t('balanceNegative') : 
                           t('balanceNeutral')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Resumen metabólico */}
                  <section ref={summaryRef} className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('carbonIngested')}</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{carbonIngested.toFixed(1)} <span className="text-sm font-normal">g C</span></p>
                      </div>
                      
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('energyUsed')}</p>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{energyUsedKcal.toFixed(0)} <span className="text-sm font-normal">kcal</span></p>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('carbonOxidized')}</p>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{carbonOxidized.toFixed(1)} <span className="text-sm font-normal">g C</span></p>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Wind size={14} className="text-blue-600 dark:text-blue-400" />
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('estimatedCO2')}</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{co2Produced.toFixed(1)} <span className="text-sm font-normal">g CO₂</span></p>
                      </div>

                      <div className={`p-6 rounded-xl border transition-colors ${
                        carbonBalance > 5 ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700' : 
                        carbonBalance < -5 ? 'bg-amber-600 dark:bg-amber-700 text-white border-amber-700' : 
                        'bg-stone-600 dark:bg-stone-700 text-white border-stone-700'
                      }`}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">{t('netCarbonBalance')}</p>
                        <p className="text-4xl font-bold">{carbonBalance.toFixed(1)} <span className="text-lg font-normal">g C</span></p>
                        <p className="mt-2 text-sm font-medium opacity-90">
                          {carbonBalance > 5 ? t('balancePositive') : 
                           carbonBalance < -5 ? t('balanceNegative') : 
                           t('balanceNeutral')}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Gráfica de Flujo de Carbono */}
                  <div ref={carbonChartRef} className="lg:col-span-2 p-4 md:p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                    <h3 className="text-xs md:text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4 md:mb-6">{t('carbonFlow')}</h3>
                    <div className="h-[300px] md:h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#292524' : '#e7e5e4'} />
                          <XAxis 
                            dataKey="time" 
                            fontSize={9} 
                            tick={{ fill: theme === 'dark' ? '#78716c' : '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            interval={window.innerWidth < 768 ? 3 : 1}
                          />
                          <YAxis 
                            fontSize={9} 
                            tick={{ fill: theme === 'dark' ? '#78716c' : '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'g C', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#a8a29e' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1c1917' : '#ffffff',
                              borderColor: theme === 'dark' ? '#44403c' : '#e7e5e4',
                              borderRadius: '12px',
                              fontSize: '11px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={40} 
                            iconType="circle" 
                            onClick={toggleSeries}
                            wrapperStyle={{ fontSize: '10px', paddingBottom: '10px', cursor: 'pointer' }}
                          />
                          <Bar dataKey="input" name={t('input')} fill="#10b981" radius={[4, 4, 0, 0]} hide={!visibleSeries.input} />
                          <Bar dataKey="output" name={t('output')} fill="#f59e0b" radius={[4, 4, 0, 0]} hide={!visibleSeries.output} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center mt-2 italic">
                      {language === 'es' ? '* Haz clic en la leyenda para ocultar/mostrar' : '* Click on the legend to hide/show'}
                    </p>
                  </div>

                  {/* Gráfica de Gasto Energético y Balance Acumulado */}
                  <div ref={energyChartRef} className="lg:col-span-2 p-4 md:p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                    <h3 className="text-xs md:text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4 md:mb-6">{t('energyAndBalance')}</h3>
                    <div className="h-[300px] md:h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#292524' : '#e7e5e4'} />
                          <XAxis 
                            dataKey="time" 
                            fontSize={9} 
                            tick={{ fill: theme === 'dark' ? '#78716c' : '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            interval={window.innerWidth < 768 ? 3 : 1}
                          />
                          <YAxis 
                            yAxisId="left"
                            fontSize={9} 
                            tick={{ fill: theme === 'dark' ? '#78716c' : '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'g C', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#3b82f6' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            fontSize={9} 
                            tick={{ fill: theme === 'dark' ? '#78716c' : '#a8a29e' }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'kcal', angle: 90, position: 'insideRight', fontSize: 10, fill: '#ef4444' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1c1917' : '#ffffff',
                              borderColor: theme === 'dark' ? '#44403c' : '#e7e5e4',
                              borderRadius: '12px',
                              fontSize: '11px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={40} 
                            iconType="circle" 
                            onClick={toggleSeries}
                            wrapperStyle={{ fontSize: '10px', paddingBottom: '10px', cursor: 'pointer' }}
                          />
                          <Line yAxisId="left" type="monotone" dataKey="cumulative" name={t('cumulativeBalance')} stroke="#3b82f6" strokeWidth={3} dot={false} hide={!visibleSeries.cumulative} />
                          <Line yAxisId="right" type="monotone" dataKey="energy" name={t('energy')} stroke="#ef4444" strokeWidth={2} dot={false} hide={!visibleSeries.energy} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center mt-2 italic">
                      {language === 'es' ? '* Haz clic en la leyenda para ocultar/mostrar' : '* Click on the legend to hide/show'}
                    </p>
                  </div>

                  {/* Visualizaciones */}
                  <section ref={visualizationRef} className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
                    <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">{t('visualization')}</h2>
                    
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#292524' : '#f1f5f9'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme === 'dark' ? '#a8a29e' : '#64748b' }} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: theme === 'dark' ? '#a8a29e' : '#64748b' }}
                            label={{ value: 'g C', angle: -90, position: 'insideLeft', fontSize: 12, fill: theme === 'dark' ? '#a8a29e' : '#64748b' }}
                          />
                          <Tooltip 
                            cursor={{ fill: theme === 'dark' ? '#1c1917' : '#f8fafc' }}
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              backgroundColor: theme === 'dark' ? '#1c1917' : '#ffffff',
                              color: theme === 'dark' ? '#f5f5f4' : '#1c1917'
                            }}
                          />
                          <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Diagrama de Flujo Simple */}
                    <div className="mt-8 space-y-4">
                      <h3 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{t('matterFlow')}</h3>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-center font-bold text-sm">
                          {t('food')} ({carbonIngested.toFixed(0)}g C)
                        </div>
                        <div className="h-4 w-0.5 bg-stone-200 dark:bg-stone-800"></div>
                        <div className="w-full p-3 bg-stone-800 dark:bg-stone-700 text-white rounded-lg text-center font-bold text-sm">
                          {t('cellularMetabolism')}
                        </div>
                        <div className="flex w-full gap-2">
                          <div className="flex-1 flex flex-col items-center">
                            <div className="h-4 w-0.5 bg-stone-200 dark:bg-stone-800"></div>
                            <div className="w-full p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-center font-bold text-xs">
                              CO₂ ({co2Produced.toFixed(0)}g)
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className="h-4 w-0.5 bg-stone-200 dark:bg-stone-800"></div>
                            <div className="w-full p-3 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-center font-bold text-xs">
                              {carbonBalance >= 0 ? `${t('retained')} (${carbonBalance.toFixed(0)}g)` : `${t('deficit')} (${Math.abs(carbonBalance).toFixed(0)}g)`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Tabla de Datos */}
                  <section ref={dataTableRef} className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-x-auto">
                    <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">{t('dataTable')}</h2>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className="py-3 font-bold text-stone-500">{t('name')}</th>
                          <th className="py-3 font-bold text-stone-500">{t('time')}</th>
                          <th className="py-3 font-bold text-stone-500">{t('carbsG')} / MET</th>
                          <th className="py-3 font-bold text-stone-500">{t('carbonG')} / kcal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meals.map(meal => (
                          <tr key={meal.id} className="border-b border-stone-50 dark:border-stone-800/50">
                            <td className="py-3 text-stone-700 dark:text-stone-300">{meal.name}</td>
                            <td className="py-3 text-stone-500">{meal.time}:00</td>
                            <td className="py-3 text-stone-500">{meal.carbs}g</td>
                            <td className="py-3 text-emerald-600 font-medium">{(meal.carbs * CARBON_FRACTIONS.carbs + meal.fat * CARBON_FRACTIONS.fat + meal.protein * CARBON_FRACTIONS.protein).toFixed(1)}g C</td>
                          </tr>
                        ))}
                        {activities.map(act => (
                          <tr key={act.id} className="border-b border-stone-50 dark:border-stone-800/50">
                            <td className="py-3 text-stone-700 dark:text-stone-300">{act.name}</td>
                            <td className="py-3 text-stone-500">{act.startTime}:00</td>
                            <td className="py-3 text-stone-500">{act.met} MET</td>
                            <td className="py-3 text-amber-600 font-medium">{(act.met * weight * act.hours).toFixed(0)} kcal</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </div>

                {/* Modo Explicación Didáctica - Movido a Resultados */}
                <section className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <button 
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-stone-800 dark:text-stone-100 font-bold text-xl">
                      <Info className="text-emerald-600 dark:text-emerald-400" />
                      <h2>{t('molecularMeaning')}</h2>
                    </div>
                    {showExplanation ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-8 pt-0 prose prose-stone dark:prose-invert max-w-none text-stone-600 dark:text-stone-400 space-y-4 border-t border-stone-100 dark:border-stone-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            <div className="space-y-4">
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">1. {t('foodIsMatter')}:</strong> {t('foodIsMatterDesc')}
                              </p>
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">2. {t('bondsAndEnergy')}:</strong> {t('bondsAndEnergyDesc')}
                              </p>
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">3. {t('cellularRespiration')}:</strong> {t('cellularRespirationDesc')}
                              </p>
                            </div>
                            <div className="space-y-4">
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">4. {t('exhaleCarbon')}:</strong> {t('exhaleCarbonDesc')}
                              </p>
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">5. {t('theBalance')}:</strong> {t('theBalanceDesc')}
                              </p>
                              <p>
                                <strong className="text-stone-800 dark:text-stone-200">6. {t('basalMetabolism')}:</strong> {t('basalMetabolismDesc')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto space-y-8">
        
        {/* SECCIÓN 1: Encabezado */}
        <header className="space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
                {t('title')}
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex flex-col gap-3 items-center md:items-end">
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
                  title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button 
                  onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all text-sm font-bold"
                >
                  <Languages size={20} /> {language === 'es' ? 'EN' : 'ES'}
                </button>
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                  title={t('gameplayInstructions')}
                >
                  <Info size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-end items-center">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">{t('loadExampleData')}:</span>
                <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-lg gap-1">
                  <button 
                    onClick={() => loadExample('regular')}
                    className="px-3 py-1.5 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-md shadow-sm text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                  >
                    {t('regularDay')}
                  </button>
                  <button 
                    onClick={() => loadExample('descanso')}
                    className="px-3 py-1.5 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-md shadow-sm text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-all"
                  >
                    {t('restDay')}
                  </button>
                </div>
                <button 
                  onClick={resetApp}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-900 dark:hover:bg-stone-600 transition-colors shadow-sm text-sm font-medium"
                >
                  <RefreshCcw size={18} /> {t('reset')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 flex items-start gap-3 rounded-r-lg">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800 dark:text-amber-200 italic">
              <strong>{t('modelNote').split(':')[0]}:</strong> {t('modelNote').split(':')[1]}
            </p>
          </div>

          {/* Selector de Vista */}
          <div className="flex justify-center md:justify-start">
            <div className="inline-flex p-1 bg-stone-200 dark:bg-stone-800 rounded-xl">
              <button
                onClick={() => setViewMode('simulation')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  viewMode === 'simulation' 
                    ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                <Activity size={18} />
                {t('simulationView')}
              </button>
              <button
                onClick={() => setViewMode('journey')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  viewMode === 'journey' 
                    ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                <Wind size={18} />
                {t('journeyView')}
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {viewMode === 'simulation' ? (
            <motion.main 
              key="simulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Columna Izquierda: Parámetros y Comida */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* SECCIÓN 2: Parámetros del estudiante */}
                <section className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-4 text-stone-800 dark:text-stone-100 font-semibold">
                    <Scale size={20} />
                    <h2>{t('yourParams')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('weight')}</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setWeight(isNaN(n) ? 0 : Math.max(0, n));
                        }}
                        className="w-full p-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('kcalPerGC')}</label>
                        <button 
                          onClick={() => setIsKcalHelpOpen(true)}
                          className="text-stone-400 hover:text-emerald-500 transition-colors"
                          title={t('whatDoesThisMean')}
                        >
                          <HelpCircle size={14} />
                        </button>
                      </div>
                      <input 
                        type="number" 
                        step="0.1"
                        value={kcalPerGC} 
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setKcalPerGC(isNaN(n) ? 10.5 : Math.max(0.1, n));
                        }}
                        className="w-full p-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div 
                    onClick={() => setIsMoleculeModalOpen(true)}
                    className="mt-6 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t('carbonFractions')}</h3>
                      <Info size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-stone-700 dark:text-stone-300">
                      <div><span className="font-semibold">{t('carbs')}:</span> 40%</div>
                      <div><span className="font-semibold">{t('protein')}:</span> 53%</div>
                      <div><span className="font-semibold">{t('fat')}:</span> 77%</div>
                    </div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2 italic group-hover:text-emerald-500">{t('clickMolecules')}</p>
                  </div>
                </section>

                {/* SECCIÓN 3: Registro de comida */}
                <section className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-semibold">
                      <Utensils size={20} />
                      <h2>{t('foodLog')}</h2>
                    </div>
                    <button 
                      onClick={addMeal}
                      className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      title={t('addMeal')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-500 text-xs uppercase tracking-wider font-bold">
                          <th className="pb-3 px-2">{t('time')}</th>
                          <th className="pb-3 px-2">{t('name')}</th>
                          <th className="pb-3 px-2">{t('carbsG')}</th>
                          <th className="pb-3 px-2">{t('fatG')}</th>
                          <th className="pb-3 px-2">{t('protG')}</th>
                          <th className="pb-3 px-2">{t('carbonG')}</th>
                          <th className="pb-3 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {meals.map((meal) => {
                          const c = (meal.carbs * CARBON_FRACTIONS.carbs) + 
                                    (meal.protein * CARBON_FRACTIONS.protein) + 
                                    (meal.fat * CARBON_FRACTIONS.fat);
                          return (
                            <tr key={meal.id} className="border-b border-stone-50 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group">
                              <td className="py-3 px-2">
                                <input 
                                  type="number" 
                                  min="0"
                                  max="23"
                                  value={meal.time ?? 12} 
                                  onChange={(e) => updateMeal(meal.id, 'time', Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 w-12 font-mono text-stone-500 dark:text-stone-400 text-xs"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input 
                                  type="text" 
                                  value={meal.name} 
                                  onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 w-full font-medium text-stone-800 dark:text-stone-200"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input 
                                  type="number" 
                                  value={meal.carbs} 
                                  onChange={(e) => updateMeal(meal.id, 'carbs', Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 w-16 text-stone-800 dark:text-stone-200"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input 
                                  type="number" 
                                  value={meal.fat} 
                                  onChange={(e) => updateMeal(meal.id, 'fat', Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 w-16 text-stone-800 dark:text-stone-200"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input 
                                  type="number" 
                                  value={meal.protein} 
                                  onChange={(e) => updateMeal(meal.id, 'protein', Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 w-16 text-stone-800 dark:text-stone-200"
                                />
                              </td>
                              <td className="py-3 px-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {c.toFixed(1)}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <button 
                                  onClick={() => removeMeal(meal.id)}
                                  className="text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase py-2">{t('suggestions')}</span>
                    {FOOD_PRESETS.map(preset => (
                      <button 
                        key={preset.name}
                        onClick={() => setMeals([...meals, { ...preset, id: Date.now().toString() }])}
                        className="text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 px-3 py-1 rounded-full transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsFoodModalOpen(true)}
                      className="text-xs bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full transition-colors font-bold"
                    >
                      {t('seeMore')}
                    </button>
                  </div>
                </section>

                {/* SECCIÓN 4: Registro de actividades */}
                <section className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-semibold">
                      <Activity size={20} />
                      <h2>{t('activityLog')}</h2>
                    </div>
                    <button 
                      onClick={addActivity}
                      className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                      title={t('addActivity')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-500 text-xs uppercase tracking-wider font-bold">
                          <th className="pb-3 px-2">{t('time')}</th>
                          <th className="pb-3 px-2">{t('activity')}</th>
                          <th className="pb-3 px-2">{t('met')}</th>
                          <th className="pb-3 px-2">{t('hours')}</th>
                          <th className="pb-3 px-2">{t('energyKcal')}</th>
                          <th className="pb-3 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {activities.map((act) => (
                          <tr key={act.id} className="border-b border-stone-50 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group">
                            <td className="py-3 px-2">
                              <input 
                                type="number" 
                                min="0"
                                max="23"
                                value={act.startTime ?? 12} 
                                onChange={(e) => updateActivity(act.id, 'startTime', Number(e.target.value))}
                                className="bg-transparent border-none focus:ring-0 w-12 font-mono text-stone-500 dark:text-stone-400 text-xs"
                              />
                            </td>
                            <td className="py-3 px-2">
                              <input 
                                type="text" 
                                value={act.name} 
                                onChange={(e) => updateActivity(act.id, 'name', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 w-full font-medium text-stone-800 dark:text-stone-200"
                              />
                            </td>
                            <td className="py-3 px-2">
                              <input 
                                type="number" 
                                step="0.1"
                                value={act.met} 
                                onChange={(e) => updateActivity(act.id, 'met', Number(e.target.value))}
                                className="bg-transparent border-none focus:ring-0 w-16 text-stone-800 dark:text-stone-200"
                              />
                            </td>
                            <td className="py-3 px-2">
                              <input 
                                type="number" 
                                step="0.5"
                                value={act.hours} 
                                onChange={(e) => updateActivity(act.id, 'hours', Number(e.target.value))}
                                className="bg-transparent border-none focus:ring-0 w-16 text-stone-800 dark:text-stone-200"
                              />
                            </td>
                            <td className="py-3 px-2 font-mono text-amber-600 dark:text-amber-400 font-bold">
                              {(act.met * weight * act.hours).toFixed(0)}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <button 
                                onClick={() => removeActivity(act.id)}
                                className="text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${Math.abs(totalHours - 24) < 0.1 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{t('hoursRegistered')} {totalHours.toFixed(1)} / 24</p>
                        {totalHours < 24 && <p className="text-xs text-amber-600 dark:text-amber-400">{t('missingHours').replace('{n}', (24 - totalHours).toFixed(1))}</p>}
                        {totalHours > 24 && <p className="text-xs text-red-600 dark:text-red-400">{t('extraHours').replace('{n}', (totalHours - 24).toFixed(1))}</p>}
                        {Math.abs(totalHours - 24) < 0.1 && <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('fullDay')}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_PRESETS.map(preset => (
                        <button 
                          key={preset.name}
                          onClick={() => setActivities([...activities, { ...preset, id: Date.now().toString(), hours: 1 }])}
                          className="text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 px-3 py-1 rounded-full transition-colors shadow-sm"
                        >
                          + {preset.name}
                        </button>
                      ))}
                      <button 
                        onClick={() => setIsActivityModalOpen(true)}
                        className="text-xs bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full transition-colors font-bold shadow-sm"
                      >
                        {t('seeMore')}
                      </button>
                    </div>
                  </div>
                </section>

              </div>

              {/* Columna Derecha: Botón de Resultados */}
              <div className="space-y-8">
                <section className="bg-white dark:bg-stone-900 p-8 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Activity size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('metabolicSummary')}</h2>
                    <p className="text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                      {Math.abs(totalHours - 24) < 0.1 
                        ? "¡Día completo! Ya puedes ver el análisis de tu balance de carbono."
                        : "Registra las 24 horas del día para obtener un análisis preciso de tu metabolismo."}
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleViewResults}
                    disabled={Math.abs(totalHours - 24) > 0.1}
                    className={`w-full py-4 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg ${
                      Math.abs(totalHours - 24) < 0.1 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20 active:scale-95' 
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <PlayCircle /> {t('viewResults')}
                  </button>

                  {Math.abs(totalHours - 24) > 0.1 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      {t('missingHours').replace('{n}', (24 - totalHours).toFixed(1))}
                    </p>
                  )}
                </section>
              </div>
            </motion.main>
          ) : (
            <motion.div 
              key="journey"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 py-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">{t('journeyTitle')}</h2>
                <p className="text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">{t('journeySubtitle')}</p>
              </div>

              <div className="relative max-w-4xl mx-auto px-4">
                <div className="space-y-16">
                  {[1, 2, 3, 4, 5].map((step, idx) => {
                    const Icon = [Utensils, Activity, RefreshCcw, Zap, Wind][idx];
                    
                    return (
                      <motion.div 
                        key={step}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-6 max-w-2xl mx-auto"
                      >
                        <div className="text-center space-y-6">
                          <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{(t('journeySteps') as any)[`s${step}`]}</h3>
                          
                          {((t('journeySteps') as any)[`desc${step}`] as string).split('\n\n').map((para, pIdx, arr) => (
                            <React.Fragment key={pIdx}>
                              <p className="text-lg text-stone-600 dark:text-stone-400 leading-relaxed">{para}</p>
                              {pIdx < arr.length - 1 && (
                                <div className="flex justify-center py-4">
                                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                                    <Icon className="text-emerald-500" size={24} strokeWidth={2} />
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {idx < 4 && (
                          <div className="flex justify-center py-8">
                            <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-xl">
                              <Icon className="text-emerald-500" size={32} strokeWidth={2} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setViewMode('simulation')}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                >
                  {t('understood')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center py-8 text-stone-400 dark:text-stone-600 text-sm space-y-2">
          <p>{t('designedBy').replace('{n}', 'Rafik Neme')}</p>
        </footer>
        </div>

        {/* MODALES DE SUGERENCIAS */}
        <AnimatePresence>
          {isFoodModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <Utensils className="text-emerald-600 dark:text-emerald-400" /> {t('foodSuggestions')}
                  </h2>
                  <button onClick={() => setIsFoodModalOpen(false)} className="text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                  {Object.entries(FOOD_CATEGORIES).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-800 pb-2">{category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map(item => (
                          <button 
                            key={item.name}
                            onClick={() => {
                              setMeals([...meals, { ...item, id: Date.now().toString() }]);
                              setIsFoodModalOpen(false);
                            }}
                            className="text-left p-3 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                          >
                            <p className="font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{item.name}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-500">C: {item.carbs}g | G: {item.fat}g | P: {item.protein}g</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Modal: Kcal/g C Help */}
      {isKcalHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800"
          >
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('kcalHelpTitle')}</h2>
              </div>
              <button 
                onClick={() => setIsKcalHelpOpen(false)}
                className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <p className="text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                {t('kcalHelpIntro')}
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  {t('kcalHelpOrigin')}
                </h3>
                <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                  <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                    {t('kcalHelpOriginDesc')}
                  </p>
                  <div className="grid gap-3 font-mono text-sm text-stone-700 dark:text-stone-300">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800">
                      <span>{t('kcalHelpCarbs')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800">
                      <span>{t('kcalHelpFats')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800">
                      <span>{t('kcalHelpProteins')}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-2">
                    {t('kcalHelpAverage')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  {t('kcalHelpChanges')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t('kcalHelpRest')}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('kcalHelpRest')}</p>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t('kcalHelpExercise')}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('kcalHelpExercise')}</p>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t('kcalHelpKetosis')}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('kcalHelpKetosis')}</p>
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t('kcalHelpStarvation')}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('kcalHelpStarvation')}</p>
                  </div>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 italic text-center pt-2">
                  {t('kcalHelpChangesDesc')}
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button 
                onClick={() => setIsKcalHelpOpen(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                {t('understood')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isMoleculeModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20">
                  <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
                    <Scale className="text-emerald-600 dark:text-emerald-400" /> {t('molecularModelsTitle')}
                  </h2>
                  <button onClick={() => setIsMoleculeModalOpen(false)} className="text-emerald-400 dark:text-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-12">
                  <div className="text-center max-w-2xl mx-auto">
                    <p className="text-stone-600 dark:text-stone-400">
                      {t('molecularModelsDesc')}
                    </p>
                  </div>

                  {/* Carbohidrato */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-2xl flex justify-center">
                      <svg viewBox="0 0 200 200" className="w-48 h-48">
                        {/* Glucosa simplificada */}
                        <polygon points="100,40 150,70 150,130 100,160 50,130 50,70" fill="none" stroke="#10b981" strokeWidth="3" />
                        <circle cx="100" cy="40" r="8" fill="#10b981" /> <text x="95" y="44" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <circle cx="150" cy="70" r="8" fill="#10b981" /> <text x="145" y="74" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <circle cx="150" cy="130" r="8" fill="#10b981" /> <text x="145" y="134" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <circle cx="100" cy="160" r="8" fill="#10b981" /> <text x="95" y="164" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <circle cx="50" cy="130" r="8" fill="#10b981" /> <text x="45" y="134" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <circle cx="50" cy="70" r="8" fill="#10b981" /> <text x="45" y="74" fill="white" fontSize="10" fontWeight="bold">C</text>
                        {/* Grupos OH simplificados */}
                        <line x1="150" y1="70" x2="180" y2="50" stroke="#94a3b8" strokeWidth="2" />
                        <text x="182" y="52" fill="#64748b" fontSize="10">OH</text>
                      </svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{t('carbohydrates')} ({t('glucose')})</h3>
                      <p className="text-stone-600 dark:text-stone-400 text-sm">
                        {t('carbsDesc')}
                      </p>
                      <ul className="text-xs text-stone-500 dark:text-stone-500 space-y-1 list-disc pl-4">
                        <li>{t('cyclicStructure')}</li>
                        <li>{t('easyToBreak')}</li>
                        <li>{t('oxidizesToCO2')}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Proteína */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-2xl flex justify-center order-last md:order-first">
                      <svg viewBox="0 0 200 100" className="w-full h-32">
                        {/* Enlace peptídico simplificado */}
                        <line x1="20" y1="50" x2="50" y2="50" stroke="#3b82f6" strokeWidth="3" />
                        <circle cx="50" cy="50" r="8" fill="#3b82f6" /> <text x="45" y="54" fill="white" fontSize="10" fontWeight="bold">N</text>
                        
                        <line x1="50" y1="50" x2="80" y2="50" stroke="#10b981" strokeWidth="3" />
                        <circle cx="80" cy="50" r="8" fill="#10b981" /> <text x="75" y="54" fill="white" fontSize="10" fontWeight="bold">C</text>
                        
                        <line x1="80" y1="50" x2="110" y2="50" stroke="#10b981" strokeWidth="3" />
                        <circle cx="110" cy="50" r="8" fill="#10b981" /> <text x="105" y="54" fill="white" fontSize="10" fontWeight="bold">C</text>
                        <line x1="110" y1="50" x2="110" y2="20" stroke="#ef4444" strokeWidth="3" />
                        <circle cx="110" cy="20" r="6" fill="#ef4444" /> <text x="107" y="24" fill="white" fontSize="8">O</text>

                        <line x1="110" y1="50" x2="140" y2="50" stroke="#3b82f6" strokeWidth="3" />
                        <circle cx="140" cy="50" r="8" fill="#3b82f6" /> <text x="135" y="54" fill="white" fontSize="10" fontWeight="bold">N</text>
                      </svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">{t('proteins')} ({t('aminoAcid')})</h3>
                      <p className="text-stone-600 dark:text-stone-400 text-sm">
                        {t('proteinsDesc')}
                      </p>
                      <ul className="text-xs text-stone-500 dark:text-stone-500 space-y-1 list-disc pl-4">
                        <li>{t('characteristicSkeleton')}</li>
                        <li>{t('nitrogenRemoval')}</li>
                        <li>{t('structuralFunction')}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Grasa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-2xl flex justify-center">
                      <svg viewBox="0 0 200 100" className="w-full h-32">
                        {/* Cadena de ácido graso simplificada */}
                        <polyline points="20,60 40,40 60,60 80,40 100,60 120,40 140,60 160,40 180,60" fill="none" stroke="#f59e0b" strokeWidth="4" />
                        {[20,40,60,80,100,120,140,160,180].map((x, i) => (
                          <circle key={i} cx={x} cy={i % 2 === 0 ? 60 : 40} r="6" fill="#10b981" />
                        ))}
                        <text x="100" y="85" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">{t('highEnergyBonds')}</text>
                      </svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400">{t('lipids')} ({t('fattyAcid')})</h3>
                      <p className="text-stone-600 dark:text-stone-400 text-sm">
                        {t('lipidsDesc')}
                      </p>
                      <ul className="text-xs text-stone-500 dark:text-stone-500 space-y-1 list-disc pl-4">
                        <li>{t('longChains')}</li>
                        <li>{t('moreBonds')}</li>
                        <li>{t('doubleEnergy')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-center">
                  <button 
                    onClick={() => setIsMoleculeModalOpen(false)}
                    className="px-8 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                  >
                    {t('understood')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {isActivityModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <Activity className="text-amber-600 dark:text-amber-400" /> {t('activitySuggestions')}
                  </h2>
                  <button onClick={() => setIsActivityModalOpen(false)} className="text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                  {Object.entries(ACTIVITY_CATEGORIES).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-800 pb-2">{category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map(item => (
                          <button 
                            key={item.name}
                            onClick={() => {
                              setActivities([...activities, { ...item, id: Date.now().toString(), hours: 1 }]);
                              setIsActivityModalOpen(false);
                            }}
                            className="text-left p-3 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                          >
                            <p className="font-bold text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">{item.name}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-500">MET: {item.met}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {showChallenges && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <BookOpen className="text-emerald-600 dark:text-emerald-400" /> {t('challengesTitle')}
                  </h2>
                  <button onClick={() => setShowChallenges(false)} className="text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((num, idx) => {
                      const ChallengeIcon = [Utensils, Activity, Zap, Wind, Scale, RefreshCcw][idx];
                      return (
                        <div key={num} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-4 items-start">
                          <div className="p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-emerald-100 dark:border-emerald-800 shrink-0">
                            <ChallengeIcon className="text-emerald-600 dark:text-emerald-400" size={20} strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                              {language === 'es' ? `Desafío ${num}` : `Challenge ${num}`}
                            </p>
                            <p className="text-stone-700 dark:text-stone-300 italic text-sm">"{t(`challenge${num}` as any)}"</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="p-6 border-t border-stone-100 dark:border-stone-800 shrink-0">
                  <button 
                    onClick={() => setShowChallenges(false)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    {t('understood')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showInstructions && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <Info className="text-blue-600 dark:text-blue-400" /> {t('gameplayInstructions')}
                  </h2>
                  <button onClick={() => setShowInstructions(false)} className="text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="space-y-6 text-stone-600 dark:text-stone-400">
                    <div className="space-y-2">
                      <p className="font-bold text-stone-800 dark:text-stone-200 text-lg">{t('howToPlay')}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-stone-800 dark:text-stone-200">{t('registrationTitle')}</p>
                      <p className="leading-relaxed">{t('registrationDesc')}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-stone-800 dark:text-stone-200">{t('graphsTitle')}</p>
                      <p className="leading-relaxed">{t('graphsDesc')}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-stone-800 dark:text-stone-200">{t('downloadTitle')}</p>
                      <p className="leading-relaxed">{t('downloadDesc')}</p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm">
                      <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">
                        {language === 'es' ? 'Consejos para el éxito:' : 'Tips for success:'}
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>{language === 'es' ? 'Completa las 24 horas del día para un balance preciso.' : 'Complete all 24 hours of the day for an accurate balance.'}</li>
                        <li>{language === 'es' ? 'Usa los ejemplos predefinidos para ver diferentes estilos de vida.' : 'Use predefined examples to see different lifestyles.'}</li>
                        <li>{language === 'es' ? 'Observa cómo el CO₂ cambia según la intensidad de la actividad.' : 'Observe how CO₂ changes based on activity intensity.'}</li>
                        <li>{language === 'es' ? 'Explora la sección de "Qué significa esto molecularmente" para profundizar.' : 'Explore the "What does this mean molecularly" section to go deeper.'}</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 text-sm">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                        {language === 'es' ? 'Desafíos de Aprendizaje:' : 'Learning Challenges:'}
                      </p>
                      <p className="mb-2">{language === 'es' ? 'Pon a prueba tu conocimiento con estos retos:' : 'Test your knowledge with these challenges:'}</p>
                      <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li>{t('challenge1')}</li>
                        <li>{t('challenge2')}</li>
                        <li>{t('challenge3')}</li>
                      </ul>
                      <button 
                        onClick={() => {
                          setShowInstructions(false);
                          setShowChallenges(true);
                        }}
                        className="mt-3 text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        {language === 'es' ? 'Ver todos los desafíos' : 'See all challenges'} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-stone-100 dark:border-stone-800 shrink-0">
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    {t('understood')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
