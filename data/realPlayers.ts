
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
    "name": "Michael Hoyos",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 34,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/43574.png"
  },
  {
    "name": "Víctor Cuesta",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Argentina",
    "age": 37,
    "ca": 166,
    "pa": 166,
    "photo": "https://cdn.soccerwiki.org/images/player/58396.png"
  },
  {
    "name": "Fabián Noguera",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Argentina",
    "age": 32,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/68982.png"
  },
  {
    "name": "Gabriel Arias",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Chile",
    "age": 38,
    "ca": 170,
    "pa": 170,
    "photo": "https://cdn.soccerwiki.org/images/player/72690.png"
  },
  {
    "name": "Saúl Salcedo",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Paraguay",
    "age": 28,
    "ca": 166,
    "pa": 166,
    "photo": "https://cdn.soccerwiki.org/images/player/81465.png"
  },
  {
    "name": "Ignacio Ramírez",
    "clubShort": "NOB",
    "position": "ST",
    "nationality": "Uruguay",
    "age": 28,
    "ca": 166,
    "pa": 166,
    "photo": "https://cdn.soccerwiki.org/images/player/85755.png"
  },
  {
    "name": "Matías Cóccaro",
    "clubShort": "NOB",
    "position": "ST",
    "nationality": "Uruguay",
    "age": 28,
    "ca": 166,
    "pa": 166,
    "photo": "https://cdn.soccerwiki.org/images/player/89602.png"
  },
  {
    "name": "Gabriel Risso Patrón",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 30,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/95220.png"
  },
  {
    "name": "Juan Espínola",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Paraguay",
    "age": 31,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/96696.png"
  },
  {
    "name": "Juan Ignacio Méndez",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 28,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/99683.png"
  },
  {
    "name": "Armando Méndez",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Uruguay",
    "age": 29,
    "ca": 166,
    "pa": 166,
    "photo": "https://cdn.soccerwiki.org/images/player/100259.png"
  },
  {
    "name": "Oscar Salomón",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Argentina",
    "age": 26,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/104562.png"
  },
  {
    "name": "Martín Fernández",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Uruguay",
    "age": 24,
    "ca": 156,
    "pa": 156,
    "photo": "https://cdn.soccerwiki.org/images/player/107531.png"
  },
  {
    "name": "Rodrigo Herrera",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 25,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/109509.png"
  },
  {
    "name": "Williams Barlasina",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 27,
    "ca": 146,
    "pa": 146,
    "photo": "https://cdn.soccerwiki.org/images/player/115301.png"
  },
  {
    "name": "Jherson Mosquera",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Colombia",
    "age": 26,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/115829.png"
  },
  {
    "name": "Bruno Cabrera",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 28,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/119200.png"
  },
  {
    "name": "Martin Luciano",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/121040.png"
  },
  {
    "name": "Marcelo Esponda",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 23,
    "ca": 154,
    "pa": 154,
    "photo": "https://cdn.soccerwiki.org/images/player/127620.png"
  },
  {
    "name": "Franco García",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 28,
    "ca": 156,
    "pa": 156,
    "photo": "https://cdn.soccerwiki.org/images/player/131870.png"
  },
  {
    "name": "Jeremías Pérez Tica",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 152,
    "pa": 152,
    "photo": "https://cdn.soccerwiki.org/images/player/132886.png"
  },
  {
    "name": "David Sotelo",
    "clubShort": "NOB",
    "position": "AMC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 152,
    "pa": 152,
    "photo": "https://cdn.soccerwiki.org/images/player/137288.png"
  },
  {
    "name": "Julián Contrera",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 154,
    "pa": 154,
    "photo": "https://cdn.soccerwiki.org/images/player/140232.png"
  },
  {
    "name": "Luciano Herrera",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 29,
    "ca": 164,
    "pa": 164,
    "photo": "https://cdn.soccerwiki.org/images/player/142857.png"
  },
  {
    "name": "Ian Glavinovich",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Argentina",
    "age": 24,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/143700.png"
  },
  {
    "name": "Alejo Montero",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 27,
    "ca": 160,
    "pa": 160,
    "photo": "https://cdn.soccerwiki.org/images/player/144530.png"
  },
  {
    "name": "Valentino Acuña",
    "clubShort": "NOB",
    "position": "AMC",
    "nationality": "Argentina",
    "age": 20,
    "ca": 152,
    "pa": 152,
    "photo": "https://cdn.soccerwiki.org/images/player/144634.png"
  },
  {
    "name": "Giovani Chiaverano",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 20,
    "ca": 150,
    "pa": 150,
    "photo": "https://cdn.soccerwiki.org/images/player/145569.png"
  },
  {
    "name": "Thiago Gigena",
    "clubShort": "NOB",
    "position": "ST",
    "nationality": "Argentina",
    "age": 20,
    "ca": 130,
    "pa": 130,
    "photo": "https://cdn.soccerwiki.org/images/player/148699.png"
  },
  {
    "name": "Josué Reinatti",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/151406.png"
  },
  {
    "name": "Lucas Baños",
    "clubShort": "NOB",
    "position": "DC",
    "nationality": "Argentina",
    "age": 20,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/151407.png"
  },
  {
    "name": "Pablo Altamirano",
    "clubShort": "NOB",
    "position": "AMC",
    "nationality": "Argentina",
    "age": 21,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/155418.png"
  },
  {
    "name": "Agustín Juarez",
    "clubShort": "NOB",
    "position": "ST",
    "nationality": "Argentina",
    "age": 20,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/155420.png"
  },
  {
    "name": "Faustino Piotti",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 22,
    "ca": 136,
    "pa": 136,
    "photo": "https://cdn.soccerwiki.org/images/player/160294.png"
  },
  {
    "name": "Luca Regiardo",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 19,
    "ca": 156,
    "pa": 156,
    "photo": "https://cdn.soccerwiki.org/images/player/160296.png"
  },
  {
    "name": "Facundo Guch",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 19,
    "ca": 146,
    "pa": 146,
    "photo": "https://cdn.soccerwiki.org/images/player/160297.png"
  },
  {
    "name": "Agustín Melgarejo",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 19,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/162157.png"
  },
  {
    "name": "Julián Aquino",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 21,
    "ca": 134,
    "pa": 134,
    "photo": "https://cdn.soccerwiki.org/images/player/163896.png"
  },
  {
    "name": "Jerónimo Gómez Mattar",
    "clubShort": "NOB",
    "position": "AMC",
    "nationality": "Argentina",
    "age": 17,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/164976.png"
  },
  {
    "name": "Andrew Pereira",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Venezuela",
    "age": 19,
    "ca": 134,
    "pa": 134,
    "photo": "https://cdn.soccerwiki.org/images/player/165655.png"
  },
  {
    "name": "Jeronimo Russo",
    "clubShort": "NOB",
    "position": "MC",
    "nationality": "Argentina",
    "age": 20,
    "ca": 146,
    "pa": 146,
    "photo": "https://cdn.soccerwiki.org/images/player/168999.png"
  },
  {
    "name": "Francisco Scarpeccio",
    "clubShort": "NOB",
    "position": "ST",
    "nationality": "Argentina",
    "age": 20,
    "ca": 140,
    "pa": 140,
    "photo": "https://cdn.soccerwiki.org/images/player/169000.png"
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
