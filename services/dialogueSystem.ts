
import { Player, DialogueType, DialogueResult } from "../types";
import { randomInt } from "./utils";
import { world } from "./worldManager";

export class DialogueSystem {
  static getPlayerReaction(player: Player, type: DialogueType, currentDate?: Date): DialogueResult {
    const { mental } = player.stats;
    
    // Default response
    let result: DialogueResult = {
      text: "El jugador parece no inmutarse.",
      moraleChange: 0,
      reactionType: 'NEUTRAL'
    };

    switch (type) {
      case 'PRAISE_FORM':
        if (player.morale > 80) {
          result = {
            text: `${player.name} agradece tus palabras, pero sabe que puede dar más. (Ambicioso)`,
            moraleChange: 2,
            reactionType: 'NEUTRAL'
          };
        } else if (mental.determination > 15) {
          result = {
            text: "Parece decidido a mantener este nivel de forma.",
            moraleChange: 10,
            reactionType: 'POSITIVE'
          };
        } else {
          result = {
            text: "Se muestra encantado con tus elogios.",
            moraleChange: 15,
            reactionType: 'POSITIVE'
          };
        }
        break;

      case 'CRITICIZE_FORM':
        if (mental.aggression > 16 && mental.workRate < 10) {
          result = {
            text: `${player.name} reacciona furiosamente. Cree que está siendo tratado injustamente.`,
            moraleChange: -20,
            reactionType: 'NEGATIVE'
          };
        } else if (mental.determination > 16 && mental.workRate > 14) {
          result = {
            text: "Acepta la crítica y parece decidido a demostrar que te equivocas.",
            moraleChange: 5,
            reactionType: 'POSITIVE'
          };
        } else if (mental.composure < 8) {
          result = {
            text: "Se le ve visiblemente afectado y nervioso por tus comentarios.",
            moraleChange: -15,
            reactionType: 'NEGATIVE'
          };
        } else {
          result = {
            text: "Escucha tus críticas con la mirada baja.",
            moraleChange: -5,
            reactionType: 'NEUTRAL'
          };
        }
        break;

      case 'PRAISE_TRAINING':
        if (mental.workRate > 15) {
          result = {
            text: "Siente que su esfuerzo es reconocido.",
            moraleChange: 10,
            reactionType: 'POSITIVE'
          };
        } else {
          result = {
            text: "Parece sorprendido, quizás sabe que no se ha esforzado tanto.",
            moraleChange: 5,
            reactionType: 'NEUTRAL'
          };
        }
        break;

      case 'WARN_CONDUCT':
        if (mental.aggression > 15) {
           result = {
              text: "Te mira desafiante. No parece aceptar tu autoridad.",
              moraleChange: -10,
              reactionType: 'NEGATIVE'
           }
        } else {
           result = {
              text: "Acepta la advertencia y promete mejorar su comportamiento.",
              moraleChange: 0,
              reactionType: 'POSITIVE'
           }
        }
        break;
        
      case 'DEMAND_MORE':
         if (mental.determination > 14 || mental.workRate > 14) {
            result = {
               text: "Se motiva ante el reto.",
               moraleChange: 10,
               reactionType: 'POSITIVE'
            }
         } else {
            result = {
               text: "Se siente presionado y abrumado por tus exigencias.",
               moraleChange: -10,
               reactionType: 'NEGATIVE'
            }
         }
         break;
    }

    // Apply randomness
    if (Math.random() > 0.9) {
       result.text = "No parece haberte escuchado.";
       result.moraleChange = 0;
       result.reactionType = 'NEUTRAL';
    }

    if (currentDate) {
       world.addInboxMessage('STATEMENTS', `Reacción de ${player.name}`, `${player.name} ha reaccionado a tu charla técnica: "${result.text}"`, currentDate, player.id);
    }

    return result;
  }
}
