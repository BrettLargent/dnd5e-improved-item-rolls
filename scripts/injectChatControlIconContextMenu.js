export default function () {
  const moduleIsEnabled = () => {
    return game.settings.get(
      "dnd5e-improved-item-rolls",
      "useImprovedItemRolls"
    );
  };
  Hooks.once("renderChatLog", (app, html, data) => {
    new ContextMenu(
      html,
      ".chat-control-icon",
      [
        {
          name: "Disable Item Rolls",
          icon: "<i class='fas fa-toggle-off'></i>",
          condition: moduleIsEnabled,
          callback: async () => {
            await game.settings.set(
              "dnd5e-improved-item-rolls",
              "useImprovedItemRolls",
              false
            );
          },
        },
        {
          name: "Enable Item Rolls",
          icon: "<i class='fas fa-toggle-on'></i>",
          condition: () => !moduleIsEnabled(),
          callback: async () => {
            await game.settings.set(
              "dnd5e-improved-item-rolls",
              "useImprovedItemRolls",
              true
            );
          },
        },
      ],
      "contextmenu"
    );
  });
}
