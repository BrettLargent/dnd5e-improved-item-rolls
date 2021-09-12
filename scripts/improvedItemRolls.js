import rollAtkAndDmg from "./rollAtkAndDmg.js";

export default function UseImprovedItemRolls() {
  const Item5eDisplayCardFn = game.dnd5e.entities.Item5e.prototype.displayCard;
  const overriddenTypes = { weapon: 1 };

  return function (useImprovedItemRolls) {
    if (useImprovedItemRolls) {
      game.dnd5e.entities.Item5e.prototype.displayCard = async function (
        ...args
      ) {
        if (overriddenTypes[this.type]) {
          await rollAtkAndDmg(this);
          return;
        }
        await Item5eDisplayCardFn.call(this, ...args);
      };
      return;
    }
    game.dnd5e.entities.Item5e.prototype.displayCard = Item5eDisplayCardFn;
  };
}
