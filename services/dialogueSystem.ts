

import { Player, DialogueType, DialogueResult, DialogueTone } from "../types";
import { randomInt } from "./utils";
import { world } from "./worldManager";

export class DialogueSystem {
  static getTopicOptions(type: DialogueType): Record<DialogueTone, string> {
    switch (type) {
      case 'PRAISE_FORM':
        return {
          MILD: "Estoy muy contento con tu nivel últimamente, sigue así.",
          MODERATE: "Has estado jugando muy bien, eres una pieza clave.",
          AGGRESSIVE: "¡Increíble nivel! Sigue aplastando rivales de esta forma."
        };
      case 'CRITICIZE_FORM':
        return {
          MILD: "Siento que tu nivel ha bajado un poco, sé que puedes dar más.",
          MODERATE: "Tu rendimiento no es el adecuado para este club, debes mejorar.",
          AGGRESSIVE: "¡Tu forma es vergonzosa! O mejoras ya o te vas al banco."
        };
      case 'PRAISE_TRAINING':
        return {
          MILD: "Me gusta cómo te estás esforzando en los entrenos.",
          MODERATE: "Estás entrenando de maravilla, eso se nota en el campo.",
          AGGRESSIVE: "¡Nadie entrena con tu intensidad! Eres un ejemplo absoluto."
        };
      case 'WARN_CONDUCT':
        return {
          MILD: "Me gustaría que cuidaras un poco más tu disciplina fuera del campo.",
          MODERATE: "No toleraré más faltas de disciplina, compórtate.",
          AGGRESSIVE: "¡Tu comportamiento es inaceptable! Un desplante más y estarás fuera."
        };
      case 'DEMAND_MORE':
        return {
          MILD: "Confío en ti, pero necesito ver algo más de esfuerzo.",
          MODERATE: "Tienes talento de sobra, exígete más a ti mismo.",
          AGGRESSIVE: "¡Basta de caminar! Necesito que dejes la vida en cada pelota."
        };
    }
  }

  static getPlayerReaction(player: Player, type: DialogueType, tone: DialogueTone, currentDate?: Date): DialogueResult {
    const { mental } = player.stats;
    
    let moraleChange = 0;
    let text = "";
    let reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    let canReplica = false;

    // Logic for Tones + Personality
    if (type === 'PRAISE_FORM') {
      if (tone === 'AGGRESSIVE') {
        if (mental.professionalism >= 15) {
          text = "Agradece el cumplido pero prefiere mantener los pies en la tierra.";
          moraleChange = 5;
          reactionType = 'POSITIVE';
        } else {
          text = "¡Se siente el rey del mundo! Tu elogio le ha dado una confianza ciega.";
          moraleChange = 15;
          reactionType = 'POSITIVE';
        }
      } else {
        text = `${player.name} agradece tus palabras y dice que seguirá trabajando duro.`;
        moraleChange = 8;
        reactionType = 'POSITIVE';
      }
    } else if (type === 'CRITICIZE_FORM') {
      if (tone === 'AGGRESSIVE') {
        if (mental.temperament <= 6) {
          text = "¡Estalla de furia! Te dice que no tienes ni idea de fútbol y se siente insultado.";
          moraleChange = -25;
          reactionType = 'NEGATIVE';
          canReplica = true; // High temperament creates a replica turn
        } else if (mental.determination >= 17) {
          text = "Te mira con rabia contenida, pero asiente. Parece que lo has pinchado en el orgullo.";
          moraleChange = 5;
          reactionType = 'POSITIVE';
        } else {
          text = "Se hunde por completo. Tu agresividad lo ha dejado sin confianza.";
          moraleChange = -15;
          reactionType = 'NEGATIVE';
        }
      } else if (tone === 'MILD') {
        if (mental.professionalism >= 12) {
          text = "Reconoce que no está en su mejor momento y promete esforzarse más.";
          moraleChange = 5;
          reactionType = 'POSITIVE';
        } else {
          text = "Te ignora con indiferencia. No cree que sus problemas sean tan graves.";
          moraleChange = 0;
          reactionType = 'NEUTRAL';
        }
      } else {
        text = "Acepta la crítica profesionalmente, aunque se le nota algo dolido.";
        moraleChange = -5;
        reactionType = 'NEUTRAL';
      }
    } else if (type === 'DEMAND_MORE') {
      if (tone === 'AGGRESSIVE') {
        if (mental.pressure >= 15) {
          text = "Acepta el desafío con una mirada desafiante. Está listo para la guerra.";
          moraleChange = 12;
          reactionType = 'POSITIVE';
        } else {
          text = "La presión extrema le está afectando negativamente. Se le ve muy tenso.";
          moraleChange = -12;
          reactionType = 'NEGATIVE';
        }
      } else {
        text = "Asiente ante tu petición, aunque no parece haber un cambio radical en su actitud.";
        moraleChange = 2;
        reactionType = 'NEUTRAL';
      }
    } else {
       // Generic defaults for other cases
       text = "El jugador escucha tus palabras y reacciona de forma medida.";
       moraleChange = 2;
       reactionType = 'NEUTRAL';
    }

    if (currentDate) {
       world.addInboxMessage('STATEMENTS', `Reacción de ${player.name}`, `${player.name} ha reaccionado a tu charla: "${text}"`, currentDate, player.id);
    }

    return { text, moraleChange, reactionType, canReplica };
  }

  static getReplicaResponse(player: Player, tone: DialogueTone): DialogueResult {
    // Logic for when a player replies to the coach's reply
    return {
      text: "Después de un breve intercambio, el jugador da por terminada la charla con un gesto de desaprobación.",
      moraleChange: -5,
      reactionType: 'NEGATIVE'
    };
  }

  static checkPlayerMotives(player: Player, currentDate: Date): string | null {
     if (player.lastMotiveInteraction) {
        const lastInteraction = player.lastMotiveInteraction instanceof Date ? player.lastMotiveInteraction : new Date(player.lastMotiveInteraction);
        const diffTime = currentDate.getTime() - lastInteraction.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays < 30) return null;
     }

     const { mental } = player.stats;
     if (player.morale < 30) return "Siento que el ambiente en el club no es el ideal para mí ahora mismo.";
     if (player.isUnhappyWithContract && mental.ambition > 15) return "Me gustaría hablar sobre mi contrato, siento que mi valor no se refleja en mi sueldo.";
     
     // REFINEMENT: Wait at least 30 days after the start of the simulation to complain about lack of minutes
     // Default start date is 2008, 7, 16 (August 16th). Complaints should start mid-September at earliest.
     const seasonStart = new Date(currentDate.getFullYear(), 7, 16);
     const daysPassed = (currentDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24);
     
     if (daysPassed > 30 && player.seasonStats.appearances < 2 && player.age > 22 && player.currentAbility > 115) {
        return "No estoy teniendo los minutos que esperaba. Necesito jugar para sentirme parte del equipo.";
     }
     
     if (player.transferStatus === 'TRANSFERABLE' && mental.loyalty > 14) return "Me duele estar en la lista de transferibles después de todo lo que he dado por este club.";
     return null;
  }

  static resolveInitiatedMotive(player: Player, action: 'PROMISE' | 'IGNORE', currentDate: Date): DialogueResult {
    if (action === 'PROMISE') {
        return {
            text: "El jugador se siente escuchado y agradece tu disposición a buscar una solución.",
            moraleChange: 10,
            reactionType: 'POSITIVE'
        };
    } else {
        return {
            text: "El jugador se marcha visiblemente molesto por tu falta de empatía y desinterés.",
            moraleChange: -15,
            reactionType: 'NEGATIVE'
        };
    }
  }
}
