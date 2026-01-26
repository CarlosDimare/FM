
import { Tactic, Position } from "../types";

export interface RealClubDef {
   name: string;
   short: string;
   pCol: string;
   sCol: string;
   stadium: string;
   rep: number;
}

export const ARG_PRIMERA: RealClubDef[] = [
    { name: "River Plate", short: "RIV", pCol: "bg-white", sCol: "text-red-600", stadium: "Mas Monumental", rep: 9000 },
    { name: "Boca Juniors", short: "BOC", pCol: "bg-blue-900", sCol: "text-yellow-400", stadium: "La Bombonera", rep: 8950 },
    { name: "Independiente", short: "IND", pCol: "bg-red-700", sCol: "text-white", stadium: "Libertadores de América", rep: 8200 },
    { name: "Racing Club", short: "RAC", pCol: "bg-sky-300", sCol: "text-white", stadium: "El Cilindro", rep: 8300 },
    { name: "San Lorenzo", short: "SLO", pCol: "bg-blue-900", sCol: "text-red-600", stadium: "Pedro Bidegain", rep: 8100 },
    { name: "Estudiantes LP", short: "EST", pCol: "bg-red-600", sCol: "text-white", stadium: "UNO", rep: 7900 },
    { name: "Vélez Sarsfield", short: "VEL", pCol: "bg-white", sCol: "text-blue-800", stadium: "José Amalfitani", rep: 7800 },
    { name: "Rosario Central", short: "CEN", pCol: "bg-blue-800", sCol: "text-yellow-400", stadium: "Gigante de Arroyito", rep: 7600 },
    { name: "Newell's Old Boys", short: "NOB", pCol: "bg-red-600", sCol: "text-black", stadium: "Marcelo Bielsa", rep: 7550 },
    { name: "Talleres", short: "TAL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Mario Kempes", rep: 7500 },
    { name: "Belgrano", short: "BEL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Julio César Villagra", rep: 7200 },
    { name: "Argentinos Jrs", short: "ARG", pCol: "bg-red-600", sCol: "text-white", stadium: "Diego A. Maradona", rep: 7100 },
    { name: "Lanús", short: "LAN", pCol: "bg-red-900", sCol: "text-white", stadium: "La Fortaleza", rep: 7150 },
    { name: "Huracán", short: "HUR", pCol: "bg-white", sCol: "text-red-600", stadium: "Tomás A. Ducó", rep: 7000 },
    { name: "Gimnasia LP", short: "GEL", pCol: "bg-white", sCol: "text-blue-900", stadium: "El Bosque", rep: 6900 },
    { name: "Banfield", short: "BAN", pCol: "bg-green-600", sCol: "text-white", stadium: "Florencio Sola", rep: 6800 },
    { name: "Unión", short: "UNI", pCol: "bg-red-600", sCol: "text-white", stadium: "15 de Abril", rep: 6600 },
    { name: "Colón", short: "COL", pCol: "bg-red-600", sCol: "text-black", stadium: "Cementerio de los Elefantes", rep: 6700 }, // Included as recent relevancy
    { name: "Defensa y Justicia", short: "DYJ", pCol: "bg-green-600", sCol: "text-yellow-400", stadium: "Tito Tomaghello", rep: 6900 },
    { name: "Atlético Tucumán", short: "ATU", pCol: "bg-sky-300", sCol: "text-white", stadium: "José Fierro", rep: 6500 },
    { name: "Godoy Cruz", short: "GOD", pCol: "bg-blue-600", sCol: "text-white", stadium: "Malvinas Argentinas", rep: 6500 },
    { name: "Tigre", short: "TIG", pCol: "bg-blue-800", sCol: "text-red-600", stadium: "José Dellagiovanna", rep: 6400 },
    { name: "Platense", short: "PLA", pCol: "bg-white", sCol: "text-amber-900", stadium: "Ciudad de Vicente López", rep: 6200 },
    { name: "Sarmiento", short: "SAR", pCol: "bg-green-500", sCol: "text-white", stadium: "Eva Perón", rep: 6000 },
    { name: "Central Córdoba", short: "CCO", pCol: "bg-black", sCol: "text-white", stadium: "Madre de Ciudades", rep: 5900 },
    { name: "Barracas Central", short: "BAR", pCol: "bg-red-600", sCol: "text-white", stadium: "Claudio Tapia", rep: 5800 },
    { name: "Instituto", short: "INS", pCol: "bg-red-600", sCol: "text-white", stadium: "Monumental de Alta Córdoba", rep: 6300 },
    { name: "Riestra", short: "RIE", pCol: "bg-black", sCol: "text-white", stadium: "Guillermo Laza", rep: 5500 }
];

export const ARG_NACIONAL: RealClubDef[] = [
    { name: "Ferro Carril Oeste", short: "FCO", pCol: "bg-green-700", sCol: "text-white", stadium: "Arq. Etcheverri", rep: 5800 },
    { name: "Chacarita Jrs", short: "CHA", pCol: "bg-red-600", sCol: "text-black", stadium: "San Martín", rep: 5900 },
    { name: "Quilmes", short: "QUI", pCol: "bg-white", sCol: "text-blue-900", stadium: "Centenario", rep: 5800 },
    { name: "San Martín (T)", short: "SMT", pCol: "bg-red-600", sCol: "text-white", stadium: "La Ciudadela", rep: 6100 },
    { name: "San Martín (SJ)", short: "SMJ", pCol: "bg-green-800", sCol: "text-black", stadium: "Hilario Sánchez", rep: 5600 },
    { name: "All Boys", short: "ALL", pCol: "bg-white", sCol: "text-black", stadium: "Islas Malvinas", rep: 5500 },
    { name: "Atlanta", short: "ATL", pCol: "bg-blue-800", sCol: "text-yellow-400", stadium: "Don León Kolbowsky", rep: 5400 },
    { name: "Almirante Brown", short: "ALM", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Fragata Sarmiento", rep: 5500 },
    { name: "Nueva Chicago", short: "NCH", pCol: "bg-green-600", sCol: "text-black", stadium: "República de Mataderos", rep: 5600 },
    { name: "Dep. Morón", short: "MOR", pCol: "bg-white", sCol: "text-red-600", stadium: "Nuevo Francisco Urbano", rep: 5300 },
    { name: "Temperley", short: "TEM", pCol: "bg-sky-400", sCol: "text-white", stadium: "Alfredo Beranger", rep: 5200 },
    { name: "Los Andes", short: "LAN", pCol: "bg-red-600", sCol: "text-white", stadium: "Eduardo Gallardón", rep: 5100 },
    { name: "Aldosivi", short: "ALD", pCol: "bg-green-500", sCol: "text-yellow-400", stadium: "José María Minella", rep: 5700 },
    { name: "Patronato", short: "PAT", pCol: "bg-red-600", sCol: "text-black", stadium: "Presbítero Grella", rep: 5600 },
    { name: "Gimnasia (J)", short: "GEJ", pCol: "bg-sky-300", sCol: "text-white", stadium: "23 de Agosto", rep: 5400 },
    { name: "Estudiantes RC", short: "ERC", pCol: "bg-sky-400", sCol: "text-white", stadium: "Antonio Candini", rep: 5300 },
    { name: "Agropecuario", short: "AGR", pCol: "bg-green-700", sCol: "text-red-600", stadium: "Ofelia Rosenzuaig", rep: 5000 },
    { name: "Alvarado", short: "ALV", pCol: "bg-blue-900", sCol: "text-white", stadium: "José María Minella", rep: 5100 },
    { name: "Brown (A)", short: "BRO", pCol: "bg-sky-300", sCol: "text-black", stadium: "Lorenzo Arandilla", rep: 4900 },
    { name: "Def. de Belgrano", short: "DEF", pCol: "bg-red-600", sCol: "text-black", stadium: "Juan Pasquale", rep: 5200 }
];

export const CONT_CLUBS: RealClubDef[] = [
    // Brazil
    { name: "Flamengo", short: "FLA", pCol: "bg-red-700", sCol: "text-black", stadium: "Maracanã", rep: 9300 },
    { name: "Palmeiras", short: "PAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Allianz Parque", rep: 9200 },
    { name: "São Paulo", short: "SAO", pCol: "bg-white", sCol: "text-red-600", stadium: "Morumbi", rep: 9000 },
    { name: "Santos", short: "SAN", pCol: "bg-white", sCol: "text-black", stadium: "Vila Belmiro", rep: 8800 },
    { name: "Corinthians", short: "COR", pCol: "bg-white", sCol: "text-black", stadium: "Neo Química Arena", rep: 8900 },
    { name: "Grêmio", short: "GRE", pCol: "bg-sky-500", sCol: "text-black", stadium: "Arena do Grêmio", rep: 8700 },
    { name: "Internacional", short: "INT", pCol: "bg-red-600", sCol: "text-white", stadium: "Beira-Rio", rep: 8700 },
    { name: "Fluminense", short: "FLU", pCol: "bg-red-800", sCol: "text-green-700", stadium: "Maracanã", rep: 8600 },
    { name: "Atlético Mineiro", short: "CAM", pCol: "bg-black", sCol: "text-white", stadium: "Arena MRV", rep: 8800 },
    { name: "Botafogo", short: "BOT", pCol: "bg-black", sCol: "text-white", stadium: "Nilton Santos", rep: 8500 },
    // Uruguay
    { name: "Peñarol", short: "PEN", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Campeón del Siglo", rep: 8200 },
    { name: "Nacional", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Gran Parque Central", rep: 8100 },
    // Chile
    { name: "Colo-Colo", short: "COL", pCol: "bg-white", sCol: "text-black", stadium: "Monumental David Arellano", rep: 7800 },
    { name: "U. de Chile", short: "UCH", pCol: "bg-blue-800", sCol: "text-white", stadium: "Nacional de Chile", rep: 7600 },
    // Colombia
    { name: "Atl. Nacional", short: "ATN", pCol: "bg-green-600", sCol: "text-white", stadium: "Atanasio Girardot", rep: 7900 },
    { name: "Millonarios", short: "MIL", pCol: "bg-blue-700", sCol: "text-white", stadium: "El Campín", rep: 7500 },
    { name: "Junior", short: "JUN", pCol: "bg-red-600", sCol: "text-white", stadium: "Metropolitano", rep: 7400 },
    // Paraguay
    { name: "Olimpia", short: "OLI", pCol: "bg-white", sCol: "text-black", stadium: "Manuel Ferreira", rep: 7700 },
    { name: "Cerro Porteño", short: "CER", pCol: "bg-red-700", sCol: "text-blue-800", stadium: "La Nueva Olla", rep: 7600 },
    { name: "Libertad", short: "LIB", pCol: "bg-black", sCol: "text-white", stadium: "Dr. Nicolás Leoz", rep: 7400 },
    // Ecuador
    { name: "LDU Quito", short: "LDU", pCol: "bg-white", sCol: "text-red-700", stadium: "Rodrigo Paz Delgado", rep: 7800 },
    { name: "Ind. del Valle", short: "IDV", pCol: "bg-black", sCol: "text-blue-600", stadium: "Banco Guayaquil", rep: 8000 },
    { name: "Barcelona SC", short: "BSC", pCol: "bg-yellow-400", sCol: "text-red-600", stadium: "Monumental Banco Pichincha", rep: 7700 },
    // Peru
    { name: "Universitario", short: "UNI", pCol: "bg-red-100", sCol: "text-red-800", stadium: "Monumental U", rep: 7200 },
    { name: "Sporting Cristal", short: "CRI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Alberto Gallardo", rep: 7100 },
    { name: "Alianza Lima", short: "ALI", pCol: "bg-blue-900", sCol: "text-white", stadium: "Alejandro Villanueva", rep: 7200 },
    // Bolivia
    { name: "Bolívar", short: "BOL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Hernando Siles", rep: 6800 },
    { name: "The Strongest", short: "STR", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Hernando Siles", rep: 6700 },
    // Venezuela
    { name: "Caracas FC", short: "CFC", pCol: "bg-red-700", sCol: "text-white", stadium: "Olímpico de la UCV", rep: 6000 },
    { name: "Dep. Táchira", short: "TAC", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Pueblo Nuevo", rep: 6000 }
];

export const CONT_CLUBS_TIER2: RealClubDef[] = [
    // Brazil
    { name: "Athletico PR", short: "CAP", pCol: "bg-red-700", sCol: "text-black", stadium: "Ligga Arena", rep: 8400 },
    { name: "Fortaleza", short: "FOR", pCol: "bg-blue-700", sCol: "text-red-600", stadium: "Castelão", rep: 8300 },
    { name: "Cruzeiro", short: "CRU", pCol: "bg-blue-700", sCol: "text-white", stadium: "Mineirão", rep: 8200 },
    { name: "Vasco da Gama", short: "VAS", pCol: "bg-white", sCol: "text-black", stadium: "São Januário", rep: 8100 },
    { name: "Bahia", short: "BAH", pCol: "bg-blue-600", sCol: "text-red-600", stadium: "Fonte Nova", rep: 7900 },
    // Chile
    { name: "U. Católica", short: "UCA", pCol: "bg-white", sCol: "text-blue-800", stadium: "San Carlos", rep: 7400 },
    { name: "Cobreloa", short: "COB", pCol: "bg-orange-500", sCol: "text-white", stadium: "Zorros del Desierto", rep: 6800 },
    { name: "Huachipato", short: "HUA", pCol: "bg-blue-900", sCol: "text-black", stadium: "CAP", rep: 6500 },
    { name: "Palestino", short: "PAL", pCol: "bg-red-600", sCol: "text-green-700", stadium: "La Cisterna", rep: 6400 },
    // Uruguay
    { name: "Defensor Sp.", short: "DEF", pCol: "bg-purple-700", sCol: "text-white", stadium: "Luis Franzini", rep: 6900 },
    { name: "Danubio", short: "DAN", pCol: "bg-white", sCol: "text-black", stadium: "Jardines del Hipódromo", rep: 6800 },
    { name: "Liverpool (U)", short: "LIV", pCol: "bg-blue-900", sCol: "text-black", stadium: "Belvedere", rep: 6600 },
    // Colombia
    { name: "Ind. Medellín", short: "DIM", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Atanasio Girardot", rep: 7200 },
    { name: "América Cali", short: "AME", pCol: "bg-red-600", sCol: "text-white", stadium: "Pascual Guerrero", rep: 7300 },
    { name: "Dep. Cali", short: "CAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Palmaseca", rep: 7100 },
    { name: "Santa Fe", short: "SFE", pCol: "bg-red-600", sCol: "text-white", stadium: "El Campín", rep: 7000 },
    // Paraguay
    { name: "Guaraní", short: "GUA", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Rogelio Livieres", rep: 6800 },
    { name: "Nacional (P)", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Arsenio Erico", rep: 6500 },
    // Ecuador
    { name: "Emelec", short: "EME", pCol: "bg-blue-700", sCol: "text-slate-400", stadium: "George Capwell", rep: 7400 },
    { name: "El Nacional", short: "ELN", pCol: "bg-red-600", sCol: "text-blue-500", stadium: "Atahualpa", rep: 6700 },
    // Peru
    { name: "Melgar", short: "MEL", pCol: "bg-red-700", sCol: "text-black", stadium: "UNSA", rep: 6900 },
    { name: "Cienciano", short: "CIE", pCol: "bg-red-600", sCol: "text-white", stadium: "Garcilaso", rep: 6600 },
    // Bolivia
    { name: "Wilstermann", short: "WIL", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Félix Capriles", rep: 6400 },
    { name: "Oriente P.", short: "ORI", pCol: "bg-green-600", sCol: "text-white", stadium: "Tahuichi", rep: 6300 }
];

export const WORLD_BOSSES: RealClubDef[] = [
   { name: "Real Madrid", short: "RMD", pCol: "bg-white", sCol: "text-slate-900", stadium: "Santiago Bernabéu", rep: 9800 },
   { name: "Man Blue", short: "MCI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Etihad", rep: 9700 },
   { name: "Bayern Munchen", short: "BAY", pCol: "bg-red-700", sCol: "text-white", stadium: "Allianz Arena", rep: 9600 }
];

// Grid Logic Recap: 
// 0=GK
// Row 1 (Def): 1=DL, 2=DCL, 3=DC, 4=DCR, 5=DR
// Row 2 (DM): 6-10
// Row 3 (Mid): 11-15 (11=ML, 15=MR)
// Row 4 (AM): 16-20
// Row 5 (Att): 21-25
// Row 6 (ST): 26-30
export const TACTIC_PRESETS: Tactic[] = [
   { id: '4-4-2', name: '4-4-2 Clásica', positions: [0, 1, 2, 4, 5, 11, 12, 14, 15, 27, 29] },
   { id: '4-3-3', name: '4-3-3 Ofensiva', positions: [0, 1, 2, 4, 5, 8, 12, 14, 19, 20, 26] },
   { id: '4-2-3-1', name: '4-2-3-1 Doble Pivote', positions: [0, 1, 2, 4, 5, 8, 10, 17, 19, 20, 26] },
   { id: '3-5-2', name: '3-5-2 Carrileros', positions: [0, 2, 3, 4, 11, 15, 8, 12, 14, 27, 29] },
   { id: '5-4-1', name: '5-4-1 Muro Defensivo', positions: [0, 1, 2, 3, 4, 5, 12, 14, 11, 15, 26] }
];

export const NAMES_DB = {
    firstNames: ["Juan", "Carlos", "Diego", "Luis", "Sergio", "Pablo", "Matías", "Lucas", "Enzo", "Lautaro", "Julián", "Franco", "Nicolás", "Facundo", "Federico", "Santiago", "Tomás", "Ignacio", "Agustín", "Ezequiel", "Gabriel", "Maxi", "Rodrigo", "Leandro", "Cristian", "Martín", "Gonzalo", "Alan", "Brian", "Kevin"],
    lastNames: ["García", "Rodríguez", "González", "Fernández", "López", "Díaz", "Martínez", "Pérez", "Romero", "Sánchez", "Gómez", "Torres", "Ruiz", "Alvarez", "Moyano", "Rojas", "Gutiérrez", "Giménez", "Castro", "Ortiz", "Silva", "Nuñez", "Cabrera", "Morales", "Ríos", "Godoy", "Acosta", "Medina", "Herrera", "Sosa"]
};

export const STAFF_NAMES = {
    names: ["Marcelo", "Ramón", "Carlos", "Miguel", "Gustavo", "Eduardo", "Ricardo", "Gabriel", "Sebastián", "Diego", "Lionel", "Gerardo", "Jorge"],
    surnames: ["Gallardo", "Bianchi", "Bilardo", "Menotti", "Bielsa", "Russo", "Alfaro", "Domínguez", "Milito", "Simeone", "Scaloni", "Martino", "Almirón"]
};

export const POS_DEFINITIONS = {
    GK: [Position.GK],
    DEF: [Position.SW, Position.DC, Position.DRC, Position.DLC, Position.DR, Position.DL],
    DM: [Position.DM, Position.DMC, Position.DMR, Position.DML],
    MID: [Position.MC, Position.MCL, Position.MCR, Position.ML, Position.MR],
    ATT: [Position.AM, Position.AMC, Position.AMR, Position.AML, Position.ST, Position.STC, Position.STR, Position.STL]
};
