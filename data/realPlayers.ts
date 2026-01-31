
import { Position } from "../types";

export interface RealPlayerDef {
  name: string;
  photo?: string;
  clubShort: string;
  position: string;
  nationality: string;
  age: number;
  ca: number;
  pa: number;
}

export const REAL_PLAYERS_DB: RealPlayerDef[] = [
  // === BOCA JUNIORS (BOC) - Plantel 2026 ===
  {
    name: "Cristian Medina",
    clubShort: "BOC",
    position: "MC",
    nationality: "Argentina",
    age: 23,
    ca: 148,
    pa: 165,
    photo: "https://cdn.soccerwiki.org/images/player/43217.png"
  },
  {
    name: "Edinson Cavani",
    clubShort: "BOC",
    position: "ST",
    nationality: "Uruguay",
    age: 39,
    ca: 132,
    pa: 135,
    photo: "https://cdn.soccerwiki.org/images/player/1321.png"
  },
  {
    name: "Marcos Rojo",
    clubShort: "BOC",
    position: "DC",
    nationality: "Argentina",
    age: 36,
    ca: 130,
    pa: 130,
    photo: "https://cdn.soccerwiki.org/images/player/12544.png"
  },
  {
    name: "Leandro Brey",
    clubShort: "BOC",
    position: "GK",
    nationality: "Argentina",
    age: 23,
    ca: 142,
    pa: 158
  },
  {
    name: "Exequiel Zeballos",
    clubShort: "BOC",
    position: "AMR",
    nationality: "Argentina",
    age: 23,
    ca: 138,
    pa: 155,
    photo: "https://cdn.soccerwiki.org/images/player/103290.png"
  },
  {
    name: "Aaron Anselmino",
    clubShort: "BOC",
    position: "DC",
    nationality: "Argentina",
    age: 21,
    ca: 145,
    pa: 170
  },
  {
    name: "Agustín Sández",
    clubShort: "BOC",
    position: "DL",
    nationality: "Argentina",
    age: 23,
    ca: 132,
    pa: 145
  },
  {
    name: "Ezequiel Fernández",
    clubShort: "BOC",
    position: "MC",
    nationality: "Argentina",
    age: 24,
    ca: 140,
    pa: 148,
    photo: "https://cdn.soccerwiki.org/images/player/103289.png"
  },
  {
    name: "Miguel Merentiel",
    clubShort: "BOC",
    position: "ST",
    nationality: "Uruguay",
    age: 30,
    ca: 138,
    pa: 140,
    photo: "https://cdn.soccerwiki.org/images/player/89662.png"
  },
  {
    name: "Nicolás Figal",
    clubShort: "BOC",
    position: "DC",
    nationality: "Argentina",
    age: 33,
    ca: 128,
    pa: 130
  },
  {
    name: "Luis Advíncula",
    clubShort: "BOC",
    position: "DR",
    nationality: "Peru",
    age: 35,
    ca: 125,
    pa: 125,
    photo: "https://cdn.soccerwiki.org/images/player/23019.png"
  },

  // === RIVER PLATE (RIV) - Plantel 2026 ===
  {
    name: "Franco Armani",
    clubShort: "RIV",
    position: "GK",
    nationality: "Argentina",
    age: 39,
    ca: 138,
    pa: 138,
    photo: "https://cdn.soccerwiki.org/images/player/16304.png"
  },
  {
    name: "Miguel Borja",
    clubShort: "RIV",
    position: "ST",
    nationality: "Colombia",
    age: 33,
    ca: 138,
    pa: 140,
    photo: "https://cdn.soccerwiki.org/images/player/52566.png"
  },
  {
    name: "Nicolás De la Cruz",
    clubShort: "RIV",
    position: "MC",
    nationality: "Uruguay",
    age: 29,
    ca: 158,
    pa: 160,
    photo: "https://cdn.soccerwiki.org/images/player/84232.png"
  },
  {
    name: "Enzo Díaz",
    clubShort: "RIV",
    position: "DL",
    nationality: "Argentina",
    age: 27,
    ca: 140,
    pa: 145,
    photo: "https://cdn.soccerwiki.org/images/player/94179.png"
  },
  {
    name: "Pablo Solari",
    clubShort: "RIV",
    position: "AMR",
    nationality: "Argentina",
    age: 26,
    ca: 142,
    pa: 148,
    photo: "https://cdn.soccerwiki.org/images/player/117967.png"
  },
  {
    name: "Andrés Herrera",
    clubShort: "RIV",
    position: "DR",
    nationality: "Colombia",
    age: 25,
    ca: 135,
    pa: 145
  },
  {
    name: "Damián Fernández",
    clubShort: "RIV",
    position: "DC",
    nationality: "Argentina",
    age: 25,
    ca: 138,
    pa: 145
  },
  {
    name: "Ezequiel Barco",
    clubShort: "RIV",
    position: "AML",
    nationality: "Argentina",
    age: 26,
    ca: 140,
    pa: 145,
    photo: "https://cdn.soccerwiki.org/images/player/89531.png"
  },
  {
    name: "Mateo Retegui",
    clubShort: "RIV",
    position: "ST",
    nationality: "Italia",
    age: 26,
    ca: 152,
    pa: 158,
    photo: "https://cdn.soccerwiki.org/images/player/98555.png"
  },
  {
    name: "Leandro Díaz",
    clubShort: "RIV",
    position: "ST",
    nationality: "Argentina",
    age: 26,
    ca: 134,
    pa: 140
  },
  {
    name: "Santiago Simón",
    clubShort: "RIV",
    position: "MR",
    nationality: "Argentina",
    age: 26,
    ca: 136,
    pa: 142
  },

  // === ROSARIO CENTRAL (CEN) - Plantel 2026 ===
  {
    name: "Javier Taborda",
    clubShort: "CEN",
    position: "GK",
    nationality: "Argentina",
    age: 32,
    ca: 138,
    pa: 140
  },
  {
    name: "Tobías Cervera",
    clubShort: "CEN",
    position: "MC",
    nationality: "Argentina",
    age: 25,
    ca: 142,
    pa: 155
  },
  {
    name: "Cristian 'Caco' González",
    clubShort: "CEN",
    position: "DC",
    nationality: "Paraguay",
    age: 34,
    ca: 130,
    pa: 130
  },
  {
    name: "Juan Komar",
    clubShort: "CEN",
    position: "DC",
    nationality: "Argentina",
    age: 33,
    ca: 128,
    pa: 128
  },
  {
    name: "Giovanni Lo Celso",
    clubShort: "CEN",
    position: "MC",
    nationality: "Argentina",
    age: 30,
    ca: 158,
    pa: 160,
    photo: "https://cdn.soccerwiki.org/images/player/82337.png"
  },
  {
    name: "Jaminton Campaz",
    clubShort: "CEN",
    position: "AML",
    nationality: "Colombia",
    age: 28,
    ca: 138,
    pa: 140,
    photo: "https://cdn.soccerwiki.org/images/player/91398.png"
  },
  {
    name: "Ignacio Malcorra",
    clubShort: "CEN",
    position: "ML",
    nationality: "Argentina",
    age: 36,
    ca: 125,
    pa: 125,
    photo: "https://cdn.soccerwiki.org/images/player/34522.png"
  },
  {
    name: "Aldo Quevedo",
    clubShort: "CEN",
    position: "AMR",
    nationality: "Argentina",
    age: 28,
    ca: 135,
    pa: 138
  },
  {
    name: "Facundo Mallo",
    clubShort: "CEN",
    position: "DC",
    nationality: "Argentina",
    age: 33,
    ca: 128,
    pa: 130
  },
  {
    name: "Maximiliano Lovera",
    clubShort: "CEN",
    position: "ST",
    nationality: "Argentina",
    age: 27,
    ca: 135,
    pa: 138,
    photo: "https://cdn.soccerwiki.org/images/player/94186.png"
  },
  {
    name: "Kilian Virviescas",
    clubShort: "CEN",
    position: "DL",
    nationality: "Colombia",
    age: 24,
    ca: 125,
    pa: 138
  },

  // === NEWELL'S OLD BOYS (NOB) - Plantel 2026 ===
  {
    name: "Julián Fernández",
    clubShort: "NOB",
    position: "ST",
    nationality: "Argentina",
    age: 22,
    ca: 155,
    pa: 175
  },
  {
    name: "Braian Aguirre",
    clubShort: "NOB",
    position: "AMR",
    nationality: "Argentina",
    age: 25,
    ca: 142,
    pa: 150,
    photo: "https://cdn.soccerwiki.org/images/player/117942.png"
  },
  {
    name: "Juan Sforza",
    clubShort: "NOB",
    position: "DM",
    nationality: "Argentina",
    age: 24,
    ca: 148,
    pa: 160,
    photo: "https://cdn.soccerwiki.org/images/player/113337.png"
  },
  {
    name: "Francisco González",
    clubShort: "NOB",
    position: "AML",
    nationality: "Argentina",
    age: 22,
    ca: 138,
    pa: 155,
    photo: "https://cdn.soccerwiki.org/images/player/103282.png"
  },
  {
    name: "Iván Leguizamón",
    clubShort: "NOB",
    position: "MC",
    nationality: "Paraguay",
    age: 27,
    ca: 138,
    pa: 142
  },
  {
    name: "Pablo Pérez",
    clubShort: "NOB",
    position: "MC",
    nationality: "Argentina",
    age: 40,
    ca: 120,
    pa: 120,
    photo: "https://cdn.soccerwiki.org/images/player/12185.png"
  },
  {
    name: "Ezequiel Ponce",
    clubShort: "NOB",
    position: "ST",
    nationality: "Argentina",
    age: 28,
    ca: 145,
    pa: 148,
    photo: "https://cdn.soccerwiki.org/images/player/77189.png"
  },
  {
    name: "Leonardo Sánchez",
    clubShort: "NOB",
    position: "DC",
    nationality: "Argentina",
    age: 30,
    ca: 135,
    pa: 135
  },
  {
    name: "Joaquín García",
    clubShort: "NOB",
    position: "AMR",
    nationality: "Argentina",
    age: 19,
    ca: 130,
    pa: 165
  },
  {
    name: "Adrián Martínez",
    clubShort: "NOB",
    position: "DR",
    nationality: "Argentina",
    age: 29,
    ca: 132,
    pa: 134,
    photo: "https://cdn.soccerwiki.org/images/player/102927.png"
  },
  {
    name: "Cristian Lema",
    clubShort: "NOB",
    position: "DC",
    nationality: "Argentina",
    age: 31,
    ca: 136,
    pa: 138,
    photo: "https://cdn.soccerwiki.org/images/player/34524.png"
  },

  // === QUILMES (QUI) - Plantel 2026 ===
  {
    name: "Tomás Silva",
    clubShort: "QUI",
    position: "GK",
    nationality: "Argentina",
    age: 29,
    ca: 128,
    pa: 130
  },
  {
    name: "Brian Calderón",
    clubShort: "QUI",
    position: "MC",
    nationality: "Argentina",
    age: 31,
    ca: 132,
    pa: 132
  },
  {
    name: "Claudio Spinelli",
    clubShort: "QUI",
    position: "ST",
    nationality: "Argentina",
    age: 30,
    ca: 135,
    pa: 135,
    photo: "https://cdn.soccerwiki.org/images/player/94182.png"
  },
  {
    name: "Lucas Gamba",
    clubShort: "QUI",
    position: "ST",
    nationality: "Argentina",
    age: 33,
    ca: 128,
    pa: 128,
    photo: "https://cdn.soccerwiki.org/images/player/73919.png"
  },
  {
    name: "Gustavo Canto",
    clubShort: "QUI",
    position: "DC",
    nationality: "Argentina",
    age: 30,
    ca: 125,
    pa: 125,
    photo: "https://cdn.soccerwiki.org/images/player/89539.png"
  },
  {
    name: "Joaquín Ibañez",
    clubShort: "QUI",
    position: "DR",
    nationality: "Argentina",
    age: 26,
    ca: 128,
    pa: 132
  },
  {
    name: "Nicolás Zalazar",
    clubShort: "QUI",
    position: "MC",
    nationality: "Argentina",
    age: 29,
    ca: 130,
    pa: 132,
    photo: "https://cdn.soccerwiki.org/images/player/94178.png"
  },
  {
    name: "Tomás Belmonte",
    clubShort: "QUI",
    position: "MC",
    nationality: "Argentina",
    age: 31,
    ca: 134,
    pa: 135,
    photo: "https://cdn.soccerwiki.org/images/player/103284.png"
  },
  {
    name: "Lautaro Montoya",
    clubShort: "QUI",
    position: "AML",
    nationality: "Argentina",
    age: 24,
    ca: 122,
    pa: 140,
    photo: "https://cdn.soccerwiki.org/images/player/89523.png"
  },
  {
    name: "Gastón Sauro",
    clubShort: "QUI",
    position: "DC",
    nationality: "Argentina",
    age: 34,
    ca: 120,
    pa: 120,
    photo: "https://cdn.soccerwiki.org/images/player/12554.png"
  },
  {
    name: "Agustín Ale",
    clubShort: "QUI",
    position: "DL",
    nationality: "Argentina",
    age: 25,
    ca: 118,
    pa: 130,
    photo: "https://cdn.soccerwiki.org/images/player/90367.png"
  }
];
