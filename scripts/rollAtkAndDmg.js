const _diceRegex = /[1-9][0-9]*d[1-9][0-9]?/g;

export default async function (item) {
  const itemData = item.data.data;
  const actor = item.actor;
  const actorData = actor.data.data;
  const chatTemplateData = { actor, item, itemName: item.data.name };
  let rollMode = "roll";
  // TODO - Add support to detect diff between use of Blessed Strikes, Divine Strike, Potent Spellcasting
  const canBlessedStrikes =
    actorData.classes.cleric?.levels >= 8 &&
    (item.data.type === "weapon" ||
      (item.data.type === "spell" && itemData.level === 0));
  let useBlessedStrikes = canBlessedStrikes;
  const canSneakAttack =
    actorData.classes.rogue &&
    (itemData.weaponType.endsWith("R") || itemData.properties.fin);
  let useSneakAttack = canSneakAttack;
  let useVersatileDmg = false;

  if (item.hasAttack) {
    if (canBlessedStrikes || canSneakAttack || item.isVersatile) {
      Hooks.once("renderDialog", (app, html, data) => {
        if (canBlessedStrikes) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label>Use Blessed Strikes?</label>
              <div class="cb-wrapper">
                <input name="blessed-strikes-cb" type="checkbox" checked />
              </div>
            </div>`);
          const height = Number.parseInt(html.css("height"), 10) + 32;
          html
            .find(".cb-wrapper input[name='blessed-strikes-cb']")
            .on("change", ({ target }) => {
              useBlessedStrikes = target.checked;
            });
          html.css("height", `${height}px`);
        }
        if (canSneakAttack) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label>Use Sneak Attack?</label>
              <div class="cb-wrapper">
                <input name="sneak-attack-cb" type="checkbox" checked />
              </div>
            </div>`);
          const height = Number.parseInt(html.css("height"), 10) + 32;
          html
            .find(".cb-wrapper input[name='sneak-attack-cb']")
            .on("change", ({ target }) => {
              useSneakAttack = target.checked;
            });
          html.css("height", `${height}px`);
        }
        if (item.isVersatile) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label>Use Versatile Damage?</label>
              <div class="cb-wrapper">
                <input name="versatile-cb" type="checkbox" />
              </div>
            </div>`);
          const height = Number.parseInt(html.css("height"), 10) + 32;
          html
            .find(".cb-wrapper input[name='versatile-cb']")
            .on("change", ({ target }) => {
              useVersatileDmg = target.checked;
            });
          html.css("height", `${height}px`);
        }
      });
    }
    chatTemplateData.atkRoll = await item.rollAttack({ chatMessage: false });
    if (!chatTemplateData.atkRoll) {
      return;
    }
    rollMode = chatTemplateData.atkRoll.options.rollMode;
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
  } else if (item.hasSave) {
    if (canBlessedStrikes || item.isVersatile) {
      Hooks.once("renderDialog", (app, html, data) => {
        html.find(".form-group").each(function (idx) {
          if (idx > 1) {
            return false;
          }
          $(this).addClass("d-none");
        });
        let height = Number.parseInt(html.css("height"), 10) - 59;
        html.css("height", `${height}px`);

        html.find("select[name='rollMode']").on("change", ({ target }) => {
          rollMode = target.value || "roll";
        });

        if (canBlessedStrikes) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label>Use Blessed Strikes?</label>
              <div class="cb-wrapper">
                <input name="blessed-strikes-cb" type="checkbox" checked />
              </div>
            </div>`);
          const height = Number.parseInt(html.css("height"), 10) + 32;
          html
            .find(".cb-wrapper input[name='blessed-strikes-cb']")
            .on("change", ({ target }) => {
              useBlessedStrikes = target.checked;
            });
          html.css("height", `${height}px`);
        }
        if (item.isVersatile) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label>Use Versatile Damage?</label>
              <div class="cb-wrapper">
                <input name="versatile-cb" type="checkbox" />
              </div>
            </div>`);
          height = Number.parseInt(html.css("height"), 10) + 32;
          html
            .find(".cb-wrapper input[name='versatile-cb']")
            .on("change", ({ target }) => {
              useVersatileDmg = target.checked;
            });
          html.css("height", `${height}px`);
        }
      });
      const content = await renderTemplate(
        "systems/dnd5e/templates/chat/roll-dialog.html",
        {
          defaultRollMode: game.settings.get("core", "rollMode"),
          rollModes: CONFIG.Dice.rollModes,
          chooseModifier: false,
          abilities: CONFIG.DND5E.abilities,
        }
      );
      let resolved = false;
      await new Promise((resolve) => {
        new Dialog({
          title: "Cantrip Options",
          content,
          buttons: {
            cast: {
              label: "Cast",
              callback: () => {
                resolved = true;
              },
            },
          },
          default: "cast",
          close: () => resolve(null),
        }).render(true);
      });
      if (!resolved) {
        return;
      }
    }
    chatTemplateData.save = {
      ability: itemData.save.ability,
      abilityUpperCase:
        itemData.save.ability[0].toUpperCase() + itemData.save.ability.slice(1),
      dc: actorData.attributes.spelldc,
    };
  }

  console.log(chatTemplateData.atkRoll);

  if (item.hasDamage) {
    chatTemplateData.dmgRows = [];
    const rollData = item.getRollData();
    const itemDamageParts = [...itemData.damage.parts];
    let isFirst = true;

    if (useBlessedStrikes) {
      itemDamageParts.push(["1d8", "[Radiant] Blessed Strikes"]);
    }
    if (useSneakAttack) {
      itemDamageParts.push([
        `${Math.ceil(actorData.classes.rogue.levels / 2)}d6`,
        "Sneak Attack",
      ]);
    }

    for (const itemDamagePart of itemDamageParts) {
      const dmgRow = {};
      const dmgType = itemDamagePart.splice(1, 1)[0];
      dmgRow.dmgType = dmgType
        ? dmgType[0].toUpperCase() + dmgType.slice(1) + " "
        : "";

      if (isFirst) {
        isFirst = false;

        if (useVersatileDmg) {
          itemDamagePart[0] = itemData.damage.versatile;
        }
        item._scaleCantripDamage(
          itemDamagePart,
          itemData.scaling.formula,
          actorData.details.level,
          rollData
        );
        dmgRow.dmgRoll = await new Roll(itemDamagePart[0], {
          mod: rollData.mod,
        }).roll();
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
    totalRoll.toMessage(
      {
        speaker: {
          alias: item.actor.data.name,
        },
        content: chatTemplate,
      },
      { rollMode }
    );
  }
}
