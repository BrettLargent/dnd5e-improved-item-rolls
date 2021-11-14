const _diceRegex = /[1-9][0-9]*d[1-9][0-9]?/g;

const doubleDamageDice = (itemDamagePart) => {
  const dmgDice = [...itemDamagePart[0].matchAll(_diceRegex)];
  dmgDice.forEach((match) => {
    let die = match[0];
    const length = die.length;
    let [num, size] = die.split("d");
    die = `${num * 2}d${size}`;
    itemDamagePart[0] =
      itemDamagePart[0].slice(0, match.index) +
      die +
      itemDamagePart[0].slice(match.index + length);
  });
};

export default async function (item) {
  const itemData = item.data.data;
  const actor = item.actor;
  const actorData = actor.data.data;
  const isCantrip = item.data.type === "spell" && itemData.level === 0;
  const chatTemplateData = {
    actor,
    description: itemData.description.value,
    item,
    itemName: item.data.name,
  };
  let rollMode = "roll";
  // TODO - Add support to detect diff between use of Blessed Strikes, Divine Strike, Potent Spellcasting
  const canBlessedStrikes =
    actorData.classes.cleric?.levels >= 8 &&
    (item.data.type === "weapon" || isCantrip);
  let useBlessedStrikes = canBlessedStrikes;
  const canSneakAttack =
    actorData.classes.rogue &&
    (itemData.weaponType.endsWith("R") || itemData.properties.fin);
  let useSneakAttack = canSneakAttack;
  let useVersatileDmg = false;

  if (item.hasAttack) {
    if (canBlessedStrikes || canSneakAttack || item.isVersatile) {
      Hooks.once("renderDialog", (app, html, data) => {
        html.addClass("dnd5e");
        html.css("height", "auto");
        if (canBlessedStrikes) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label class="checkbox">
                <input name="blessed-strikes-cb" type="checkbox" checked />
                Use Blessed Strikes?
              </label>
            </div>`);
          html
            .find("label.checkbox input[name='blessed-strikes-cb']")
            .on("change", ({ target }) => {
              useBlessedStrikes = target.checked;
            });
        }
        if (canSneakAttack) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label class="checkbox">
                Use Sneak Attack?
                <input name="sneak-attack-cb" type="checkbox" checked />
              </label>
            </div>`);
          html
            .find("label.checkbox input[name='sneak-attack-cb']")
            .on("change", ({ target }) => {
              useSneakAttack = target.checked;
            });
        }
        if (item.isVersatile) {
          html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label class="checkbox">
                Use Versatile Damage?
                <input name="versatile-cb" type="checkbox" />
              </label>
            </div>`);
          html
            .find("label.checkbox input[name='versatile-cb']")
            .on("change", ({ target }) => {
              useVersatileDmg = target.checked;
            });
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
      itemData.critical.threshold || 20
    );
    chatTemplateData.usePerfectCrits = game.settings.get(
      "dnd5e-perfect-crits",
      "usePerfectCrits"
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
  } else if (canBlessedStrikes || item.isVersatile) {
    Hooks.once("renderDialog", (app, html, data) => {
      html.addClass("dnd5e");
      html.css("height", `auto`);
      html.find(".form-group").each(function (idx) {
        if (idx > 1) {
          return false;
        }
        $(this).addClass("d-none");
      });

      html.find("select[name='rollMode']").on("change", ({ target }) => {
        rollMode = target.value || "roll";
      });

      if (canBlessedStrikes) {
        html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label class="checkbox">
                <input name="blessed-strikes-cb" type="checkbox" checked />
                Use Blessed Strikes?
              </label>
            </div>`);
        html
          .find("label.checkbox input[name='blessed-strikes-cb']")
          .on("change", ({ target }) => {
            useBlessedStrikes = target.checked;
          });
      }
      if (item.isVersatile) {
        html.find(".form-group:last-of-type").after(`
            <div class="form-group">
              <label class="checkbox">
                <input name="versatile-cb" type="checkbox" />
                Use Versatile Damage?
              </label>
            </div>`);
        html
          .find("label.checkbox input[name='versatile-cb']")
          .on("change", ({ target }) => {
            useVersatileDmg = target.checked;
          });
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
        title: `${item.data.name}: Usage Configuration`,
        content,
        buttons: {
          cast: {
            icon: "<i class='fas fa-magic'></i>",
            label: "Cast Spell",
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

  if (item.hasSave) {
    chatTemplateData.save = {
      ability: itemData.save.ability,
      abilityUpperCase:
        itemData.save.ability[0].toUpperCase() + itemData.save.ability.slice(1),
      dc: actorData.attributes.spelldc,
    };
  }

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

    for (let itemDamagePart of itemDamageParts) {
      itemDamagePart = [...itemDamagePart];
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
        if (isCantrip) {
          item._scaleCantripDamage(
            itemDamagePart,
            itemData.scaling.formula,
            actorData.details.level,
            rollData
          );
        }
        if (chatTemplateData.isCrit && !chatTemplateData.usePerfectCrits) {
          doubleDamageDice(itemDamagePart);
        }
        dmgRow.dmgRoll = await new Roll(itemDamagePart[0], {
          mod: rollData.mod,
        }).roll();
      } else {
        if (chatTemplateData.isCrit && !chatTemplateData.usePerfectCrits) {
          doubleDamageDice(itemDamagePart);
        }
        dmgRow.dmgRoll = await new Roll(itemDamagePart[0]).roll();
      }

      if (chatTemplateData.isCrit && chatTemplateData.usePerfectCrits) {
        dmgRow.critDmg = 0;
        dmgRow.critDmgStr = "";
        dmgRow.critVersDmg = 0;
        dmgRow.critVersDmgStr = "";
        const dmgDice = dmgRow.dmgRoll.formula.match(_diceRegex);
        dmgDice.forEach((die) => {
          let [num, size] = die.split("d");
          let dmg = num * size;
          dmgRow.critDmg += dmg;
        });
        dmgRow.critDmgStr += ` + ${dmgRow.critDmg}[crit]`;
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

    // TODO - Add cantrip description collapsible
    const chatTemplate = await renderTemplate(
      "modules/dnd5e-quick-item-rolls/templates/chatTemplate.html",
      chatTemplateData
    );

    const totalRoll = new Roll(
      chatTemplateData.dmgRows
        .reduce((accumulator, currentValue) => {
          accumulator += currentValue.totalDamage;
          return accumulator;
        }, 0)
        .toString()
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
