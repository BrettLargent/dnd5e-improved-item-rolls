import UseQuickItemRolls from "./quickItemRolls.js";

Hooks.once("init", () => {
  // Implementing QuickItemRolls and Configuring settings
  const useQuickItemRolls = UseQuickItemRolls();
  game.settings.register("dnd5e-quick-item-rolls", "useQuickItemRolls", {
    name: "Use Quick Item Rolls",
    hint: "Choose whether to use quick item rolls",
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
      useQuickItemRolls(value);
    },
  });
  useQuickItemRolls(
    game.settings.get("dnd5e-quick-item-rolls", "useQuickItemRolls")
  );
});
