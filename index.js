Hooks.on("init", () => {
  game.dnd5e.entities.Item5e.prototype.roll = function () {
    const item = this;
    const roll = new Roll("1d20");
    roll.toMessage({
      speaker: { alias: "DM" },
      flavor: `
        <h1>${item.data.name}</h1>
        <p>${item.data.data.description.value}</p>`,
    });
  };
});
