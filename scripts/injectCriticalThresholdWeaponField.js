export default function () {
  const attackActionTypes = { mwak: 1, rwak: 1, msak: 1, rsak: 1 };
  Hooks.on("renderItemSheet5e", async (itemSheet5e, html, item) => {
    if (item.itemType === "Weapon" && attackActionTypes[item.data.actionType]) {
      const template = await renderTemplate(
        "modules/dnd5e-improved-item-rolls/templates/criticalThreshold.html",
        { data: item.data }
      );
      html
        .find(".form-group .form-fields [name='data.attackBonus']")
        .parents(".form-group")
        .after(template);
    }
  });
}
