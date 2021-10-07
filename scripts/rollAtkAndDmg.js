const _diceRegex = /[1-9][0-9]*d[1-9][0-9]?/g;

export default async function (item) {
  const itemData = item.data.data;
  const actor = item.actor;
  const chatTemplateData = { itemName: item.data.name };

  if (item.hasAttack) {
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
        promisesArray.push(new Roll(itemDamagePart[0], { mod }).roll());

        if (item.isVersatile) {
          // TODO - add versatile damage to chatTemplate output
          promisesArray.push(
            new Roll(itemData.damage.versatile, { mod }).roll()
          );
        }

        [dmgRow.dmgRoll, dmgRow.versDmgRoll] = await Promise.all(promisesArray);
        if (!dmgRow.dmgRoll) {
          return;
        }
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

        if (dmgRow.versDmgRoll) {
          const versDmgDice = dmgRow.versDmgRoll.formula.match(diceRegex);
          versDmgDice.forEach((die) => {
            [num, size] = die.split("d");
            dmg = num * size;
            dmgRow.critVersDamage += dmg;
            dmgRow.critVersDamageStr += ` + ${dmg}[crit]`;
          });
        }
      }

      [dmgRow.dmgRollTooltip, dmgRow.versDmgRollTooltip] = await Promise.all([
        dmgRow.dmgRoll.getTooltip(),
        dmgRow.versDmgRoll?.getTooltip(),
      ]);

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
