const _diceRegex = /[1-9][0-9]*d[1-9][0-9]?/g;

export default async function (item) {
  const itemData = item.data.data;
  const actor = item.actor;
  const chatTemplateData = { itemName: item.data.name };
  let versatileSelected = false;

  if (item.hasAttack) {
    if (item.isVersatile) {
      Hooks.once("renderDialog", (app, html, data) => {
        html.find(".form-group:last-of-type").after(`
        <div class="form-group">
          <label>Use Versatile Damage?</label>
          <div class="versatile-cb-wrapper">
            <input type="checkbox" />
          </div>
        </div>`);
        const height = Number.parseInt(html.css("height"), 10) + 32;
        html.find(".versatile-cb input").on("change", ({ target }) => {
          versatileSelected = target.checked;
        });
        html.css("height", `${height}px`);
      });
    }
    chatTemplateData.atkRoll = await item.rollAttack({ chatMessage: false });
    if (!chatTemplateData.atkRoll) {
      return;
    }
    chatTemplateData.atkRollTooltip =
      await chatTemplateData.atkRoll.getTooltip();
    const dieRoll = chatTemplateData.atkRoll.dice[0].total;
    const critThreshold = Math.min(
      actor.data.flags.dnd5e?.weaponCriticalThreshold || 20,
      itemData.critThreshold || 20
    );
    chatTemplateData.isCrit = dieRoll >= critThreshold;
    if (chatTemplateData.isCrit) {
      chatTemplateData.critClass = "crit-success";
    } else if (dieRoll === 1) {
      chatTemplateData.critClass = "crit-failure";
    }
    const {
      consume: { type, target },
    } = itemData;
    if (type === "ammo" && target) {
      chatTemplateData.ammo = actor.items.get(target);
    }
  }

  if (item.hasDamage) {
    chatTemplateData.dmgRows = [];
    const { mod } = item.getRollData();
    let isFirst = true;

    for (const itemDamagePart of itemData.damage.parts) {
      const dmgRow = {};
      const dmgType = itemDamagePart[1];
      dmgRow.dmgType = dmgType
        ? dmgType[0].toUpperCase() + dmgType.slice(1) + " "
        : "";

      if (isFirst) {
        isFirst = false;
        const promisesArray = [];
        const rollStr = versatileSelected
          ? itemData.damage.versatile
          : itemDamagePart[0];
        dmgRow.dmgRoll = await new Roll(rollStr, { mod }).roll();
      } else {
        dmgRow.dmgRoll = await new Roll(itemDamagePart[0]).roll();
      }

      if (chatTemplateData.isCrit) {
        dmgRow.critDmg = 0;
        dmgRow.critDmgStr = "";
        dmgRow.critVersDmg = 0;
        dmgRow.critVersDmgStr = "";
        const dmgDice = dmgRow.dmgRoll.formula.match(_diceRegex);
        dmgDice.forEach((die) => {
          let [num, size] = die.split("d");
          let dmg = num * size;
          dmgRow.critDmg += dmg;
          dmgRow.critDmgStr += ` + ${dmg}[crit]`;
        });
      }

      dmgRow.dmgRollTooltip = await dmgRow.dmgRoll.getTooltip();

      dmgRow.totalDamage = dmgRow.dmgRoll.total + (dmgRow.critDmg ?? 0);

      chatTemplateData.dmgRows.push(dmgRow);
    }

    chatTemplateData.totalDamage = chatTemplateData.dmgRows.reduce(
      (accumulator, currentValue) => {
        accumulator += currentValue.totalDamage;
        return accumulator;
      },
      0
    );

    const chatTemplate = await renderTemplate(
      "modules/dnd5e-improved-item-rolls/templates/chatTemplate.html",
      chatTemplateData
    );

    const totalRoll = new Roll(
      chatTemplateData.dmgRows[0].totalDamage.toString()
    ).roll();
    totalRoll.toMessage({
      speaker: {
        alias: item.actor.data.name,
      },
      content: chatTemplate,
    });
  }
}
