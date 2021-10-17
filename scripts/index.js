import UseImprovedItemRolls from "./improvedItemRolls.js";
import injectCriticalThresholdWeaponField from "./injectCriticalThresholdWeaponField.js";
import injectChatControlIconContextMenu from "./injectChatControlIconContextMenu.js";

Hooks.once("init", () => {
  // Adding Critical Threshold field in weapon details menu
  injectCriticalThresholdWeaponField();

  // Adding context menu to quickly toggle module state
  injectChatControlIconContextMenu();

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
