import UseImprovedItemRolls from "./improvedItemRolls.js";
import injectCriticalThresholdWeaponField from "./injectCriticalThresholdWeaponField.js";

Hooks.once("init", () => {
  // Adding Critical Threshold field in weapon details menu
  injectCriticalThresholdWeaponField();

  // Adding context menu to quickly toggle module state
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

  // Implementing ImprovedItemRolls and Configuring settings
  const useImprovedItemRolls = UseImprovedItemRolls();
  game.settings.register("dnd5e-improved-item-rolls", "useImprovedItemRolls", {
    name: "Use Improved Item Rolls",
    hint: "Choose whether to use improved item rolls",
    scope: "client", // This specifies a client-stored setting
    config: true, // This specifies that the setting appears in the configuration view
    type: Boolean,
    choices: {
      // If choices are defined, the resulting setting will be a select menu
      true: "Yes",
      false: "No",
    },
    default: false, // The default value for the setting
    onChange: (value) => {
      useImprovedItemRolls(value);
    },
  });
  useImprovedItemRolls(
    game.settings.get("dnd5e-improved-item-rolls", "useImprovedItemRolls")
  );
});
