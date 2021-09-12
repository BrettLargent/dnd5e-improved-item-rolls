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
    const damageType = item.data.data.damage.parts[0][1];
    chatTemplateData.damageType = damageType
      ? damageType[0].toUpperCase() + damageType.slice(1) + " "
      : "";

    const promisesArray = [];
    promisesArray.push(
      item.rollDamage({ options: { chatMessage: false, fastForward: true } })
    );

    if (item.isVersatile) {
      // TODO - add versatile damage to chatTemplate output
      promisesArray.push(
        item.rollDamage({
          options: { chatMessage: false, fastForward: true },
          versatile: true,
        })
      );
    }

    [chatTemplateData.dmgRoll, chatTemplateData.versDmgRoll] =
      await Promise.all(promisesArray);
    if (!chatTemplateData.dmgRoll) {
      return;
    }

    if (chatTemplateData.isCrit) {
      chatTemplateData.critDmg = 0;
      chatTemplateData.critDmgStr = "";
      chatTemplateData.critVersDmg = 0;
      chatTemplateData.critVersDmgStr = "";
      const dmgDice = chatTemplateData.dmgRoll.formula.match(_diceRegex);
      dmgDice.forEach((die) => {
        let [num, size] = die.split("d");
        let dmg = num * size;
        chatTemplateData.critDmg += dmg;
        chatTemplateData.critDmgStr += ` + ${dmg}[crit]`;
      });

      if (chatTemplateData.versDmgRoll) {
        const versDmgDice =
          chatTemplateData.versDmgRoll.formula.match(diceRegex);
        versDmgDice.forEach((die) => {
          [num, size] = die.split("d");
          dmg = num * size;
          chatTemplateData.critVersDamage += dmg;
          chatTemplateData.critVersDamageStr += ` + ${dmg}[crit]`;
        });
      }
    }

    [chatTemplateData.dmgRollTooltip, chatTemplateData.versDmgRollTooltip] =
      await Promise.all([
        chatTemplateData.dmgRoll.getTooltip(),
        chatTemplateData.versDmgRoll?.getTooltip(),
      ]);

    chatTemplateData.totalDamage =
      chatTemplateData.dmgRoll.total + (chatTemplateData.critDmg ?? 0);

    const chatTemplate = await renderTemplate(
      "modules/dnd5e-improved-item-rolls/templates/chatTemplate.html",
      chatTemplateData
    );

    const totalRoll = new Roll(chatTemplateData.totalDamage.toString()).roll();
    totalRoll.toMessage({
      speaker: {
        alias: item.actor.data.name,
      },
      content: chatTemplate,
    });
  }
}
