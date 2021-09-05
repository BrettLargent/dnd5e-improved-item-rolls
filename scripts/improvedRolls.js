function improvedItemRollFn({
  configureDialog = true,
  rollMode,
  createMessage = true,
} = {}) {
  const item = this;
  const roll = new Roll("1d20");
  roll.toMessage({
    speaker: { alias: "DM" },
    flavor: `
        <h1>${item.data.name}</h1>
        <p>${item.data.data.description.value}</p>`,
  });

  //   let item = this;
  //   const id = this.data.data; // Item system data
  //   const actor = this.actor;
  //   const ad = actor.data.data; // Actor system data

  //   // Reference aspects of the item data necessary for usage
  //   const hasArea = this.hasAreaTarget; // Is the ability usage an AoE?
  //   const resource = id.consume || {}; // Resource consumption
  //   const recharge = id.recharge || {}; // Recharge mechanic
  //   const uses = id?.uses ?? {}; // Limited uses
  //   const isSpell = this.type === "spell"; // Does the item require a spell slot?
  //   const requireSpellSlot =
  //     isSpell &&
  //     id.level > 0 &&
  //     CONFIG.DND5E.spellUpcastModes.includes(id.preparation.mode);

  //   // Define follow-up actions resulting from the item usage
  //   let createMeasuredTemplate = hasArea; // Trigger a template creation
  //   let consumeRecharge = !!recharge.value; // Consume recharge
  //   let consumeResource = !!resource.target && resource.type !== "ammo"; // Consume a linked (non-ammo) resource
  //   let consumeSpellSlot = requireSpellSlot; // Consume a spell slot
  //   let consumeUsage = !!uses.per; // Consume limited uses
  //   let consumeQuantity = uses.autoDestroy; // Consume quantity of the item in lieu of uses
  //   let consumeSpellLevel = null; // Consume a specific category of spell slot
  //   if (requireSpellSlot)
  //     consumeSpellLevel =
  //       id.preparation.mode === "pact" ? "pact" : `spell${id.level}`;

  //   // Display a configuration dialog to customize the usage
  //   const needsConfiguration =
  //     createMeasuredTemplate ||
  //     consumeRecharge ||
  //     consumeResource ||
  //     consumeSpellSlot ||
  //     consumeUsage;
  //   if (configureDialog && needsConfiguration) {
  //     const configuration = await AbilityUseDialog.create(this);
  //     if (!configuration) return;

  //     // Determine consumption preferences
  //     createMeasuredTemplate = Boolean(configuration.placeTemplate);
  //     consumeUsage = Boolean(configuration.consumeUse);
  //     consumeRecharge = Boolean(configuration.consumeRecharge);
  //     consumeResource = Boolean(configuration.consumeResource);
  //     consumeSpellSlot = Boolean(configuration.consumeSlot);

  //     // Handle spell upcasting
  //     if (requireSpellSlot) {
  //       consumeSpellLevel =
  //         configuration.level === "pact" ? "pact" : `spell${configuration.level}`;
  //       if (consumeSpellSlot === false) consumeSpellLevel = null;
  //       const upcastLevel =
  //         configuration.level === "pact"
  //           ? ad.spells.pact.level
  //           : parseInt(configuration.level);
  //       if (upcastLevel !== id.level) {
  //         item = this.clone({ "data.level": upcastLevel }, { keepId: true });
  //         item.data.update({ _id: this.id }); // Retain the original ID (needed until 0.8.2+)
  //         item.prepareFinalAttributes(); // Spell save DC, etc...
  //       }
  //     }
  //   }

  //   // Determine whether the item can be used by testing for resource consumption
  //   const usage = item._getUsageUpdates({
  //     consumeRecharge,
  //     consumeResource,
  //     consumeSpellLevel,
  //     consumeUsage,
  //     consumeQuantity,
  //   });
  //   if (!usage) return;
  //   const { actorUpdates, itemUpdates, resourceUpdates } = usage;

  //   // Commit pending data updates
  //   if (!foundry.utils.isObjectEmpty(itemUpdates)) await item.update(itemUpdates);
  //   if (consumeQuantity && item.data.data.quantity === 0) await item.delete();
  //   if (!foundry.utils.isObjectEmpty(actorUpdates))
  //     await actor.update(actorUpdates);
  //   if (!foundry.utils.isObjectEmpty(resourceUpdates)) {
  //     const resource = actor.items.get(id.consume?.target);
  //     if (resource) await resource.update(resourceUpdates);
  //   }

  //   // Initiate measured template creation
  //   if (createMeasuredTemplate) {
  //     const template = game.dnd5e.canvas.AbilityTemplate.fromItem(item);
  //     if (template) template.drawPreview();
  //   }

  //   // Create or return the Chat Message data
  //   return item.displayCard({ rollMode, createMessage });
}

export default function UseImprovedItemRolls() {
  const Item5eRollFn = game.dnd5e.entities.Item5e.prototype.roll;

  return function (bool) {
    game.dnd5e.entities.Item5e.prototype.roll = bool
      ? improvedItemRollFn
      : Item5eRollFn;
  };
}
