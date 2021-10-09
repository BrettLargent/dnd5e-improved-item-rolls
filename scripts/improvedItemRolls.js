import rollAtkAndDmg from "./rollAtkAndDmg.js";

export default function UseImprovedItemRolls() {
  const Item5eDisplayCardFn = game.dnd5e.entities.Item5e.prototype.displayCard;
  const overriddenTypes = { spell: 1, weapon: 1 }; // TODO - Add cantrip support

  return function (useImprovedItemRolls) {
    if (useImprovedItemRolls) {
      game.dnd5e.entities.Item5e.prototype.displayCard = async function (
        ...args
      ) {
        if (
          this.type === "weapon" ||
          (this.type === "spell" && this.data.data.level === 0)
        ) {
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
