/**
 * Coding service by Sleepy4k <sarahpalastring@gmail.com>
 *
 * Reselling this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by:
 * Apri Pandu Wicaksono
 *
 * Link: https://github.com/sleepy4k
 *
 * March 12, 2023
 */
import config from "@config";
import { print } from "@utils";
import { Player } from "discord-player";
import CharacterAI from "node_characterai";
import CatchError from "@classes/CatchError";
import { ELogStatus, EPrintType } from "@enums";
import { ICommandFile, IEmbedData, IEmbedBuilder } from "@interfaces";
import {
  Client,
  Message,
  Partials,
  Collection,
  EmbedBuilder,
  GatewayIntentBits,
  CommandInteraction,
  EmbedFooterOptions,
  InteractionResponse
} from "discord.js";

export class Bot extends Client {
  constructor() {
    super({
      shards: "auto",
      closeTimeout: 60000,
      failIfNotExists: false,
      allowedMentions: {
        users: [],
        roles: [],
        repliedUser: true,
        parse: ["users", "roles"],
      },
      intents: [
        GatewayIntentBits.Guilds, // for guild related things
        GatewayIntentBits.GuildMembers, // for guild members related things
        GatewayIntentBits.GuildInvites, // for guild invite managing
        GatewayIntentBits.GuildMessages, // for guild messages things
        GatewayIntentBits.GuildWebhooks, // for discord webhooks
        GatewayIntentBits.MessageContent, // enable if you need message content things
        GatewayIntentBits.DirectMessages, // for dm messages
        GatewayIntentBits.GuildPresences, // for user presence things
        GatewayIntentBits.GuildVoiceStates, // for voice related things
        GatewayIntentBits.GuildIntegrations, // for discord Integrations
        GatewayIntentBits.GuildMessageTyping, // for message typing things
        GatewayIntentBits.DirectMessageTyping, // for dm message typinh
        GatewayIntentBits.GuildMessageReactions, // for message reactions things
        GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
        GatewayIntentBits.DirectMessageReactions, // for dm message reaction
      ],
      partials: [
        Partials.User, // for discord user
        Partials.Message, // for message
        Partials.Channel, // for text channel
        Partials.Reaction, // for message reaction
        Partials.GuildMember, // for guild member
        Partials.ThreadMember, // for thread member
        Partials.GuildScheduledEvent, // for guild events
      ]
    });

    this.config = config;
    this.events = new Collection();
    this.scommands = new Collection();
    this.mcommands = new Collection();
    this.cooldowns = new Collection();
    this.prefix = config.bot.prefix;
    this.chatbot = {
      AIChat: null,
      isAIAuthenticated: false,
      isPuppeteerInitialized: false,
      characterAI: new CharacterAI(),
    };

    this.player = new Player(this, {
      ytdlOptions: {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 27,
      },
    });
  }

  /**
   * Build the bot with token
   *
   * @param {string} token
   *
   * @returns {Promise<void>}
   */
  async build(token: string): Promise<void> {
    try {
      const { list } = config.handler;

      list.forEach(async (file) => {
        const handler = await import(`../handlers/${file}.handler`).then((handler) => handler.default);
        this.logStatus(handler.name, "Handler", ELogStatus.LOADING);
        await handler.run(this).catch(() => this.logStatus(handler.name, "Handler", ELogStatus.ERROR));
        this.logStatus(handler.name, "Handler", ELogStatus.SUCCESS);
      });

      await this.player.extractors.loadDefault();

      this.login(token);
    } catch (error: unknown) {
      CatchError.print(error);
    }
  }

  /**
   * Send embed to interaction
   *
   * @param {CommandInteraction | Message<boolean>} interaction
   * @param {IEmbedData} data
   * @param {boolean} ephemeral
   * @param {boolean} fetchReply
   *
   * @returns {Promise<Message | InteractionResponse<boolean>>}
   */
  async sendEmbed(interaction: CommandInteraction | Message<boolean>, data: IEmbedBuilder, ephemeral: boolean = false, fetchReply: boolean = false): Promise<Message | InteractionResponse<boolean>> {
    try {
      const embed = new EmbedBuilder();

      if (data.url) embed.setURL(data.url);
      if (data.title) embed.setTitle(data.title);
      if (data.color) embed.setColor(data.color);
      if (data.image) embed.setImage(data.image);
      if (data.footer) embed.setFooter(data.footer);
      if (data.author) embed.setAuthor(data.author);
      if (data.thumbnail) embed.setThumbnail(data.thumbnail);
      if (data.description) embed.setDescription(data.description);

      embed.setTimestamp();

      return await this.send(interaction, {
        embeds: [embed],
        ephemeral: ephemeral,
        fetchReply: fetchReply
      });
    } catch (error: unknown) {
      CatchError.print(error);

      return await this.send(interaction, {
        content: "Something went wrong",
        ephemeral: ephemeral,
        fetchReply: fetchReply
      });
    }
  }

  /**
   * Get footer for embed
   *
   * @param {CommandInteraction | Message<boolean>} client
   * @param {string | undefined} type
   *
   * @returns {object}
   */
  getFooter(client: CommandInteraction | Message<boolean>, type?: string): EmbedFooterOptions {
    try {
      if (!client || type) return {
        text: `${config.bot.name} | Bot by ${config.bot.author}`,
        iconURL: config.bot.icon,
      };

      if (client instanceof Message) return {
        text: `Requested by ${client.author.username} | Bot by ${config.bot.author}`,
        iconURL: client.author.displayAvatarURL({ forceStatic: false, size: 512 })
      };

      return {
        text: `Requested by ${client.user.username} | Bot by ${config.bot.author}`,
        iconURL: client.user.displayAvatarURL({ forceStatic: false, size: 512 })
      };
    } catch (error: unknown) {
      CatchError.print(error);

      return {
        text: `${config.bot.name} | Bot by ${config.bot.author}`,
        iconURL: config.bot.icon,
      };
    }
  }

  /**
   * Send message to interaction
   *
   * @param {CommandInteraction | Message<boolean>} interaction
   * @param {IEmbedData} data
   *
   * @returns {Promise<Message | InteractionResponse<boolean>>}
   */
  async send(interaction: CommandInteraction | Message<boolean>, data: IEmbedData): Promise<Message | InteractionResponse<boolean>> {
    try {
      if (interaction instanceof Message) {
        if (interaction.channel.send) return await interaction.channel.send({ embeds: data.embeds });
        else return await interaction.reply({ embeds: data.embeds });
      }

      if (interaction.deferred) return await interaction.editReply({ embeds: data.embeds });
      else if (interaction.replied) return await interaction.deferReply({ ephemeral: data.ephemeral });
      else return await interaction.reply({
        embeds: data.embeds,
        ephemeral: data.ephemeral,
        fetchReply: data.fetchReply
      });
    } catch (error: unknown) {
      CatchError.print(error);

      return await interaction.reply({
        content: "Something went wrong",
        ephemeral: data.ephemeral,
        fetchReply: data.fetchReply
      });
    }
  }

  /**
   * Handle cooldown for commands
   *
   * @param {CommandInteraction | Message<boolean>} interaction
   * @param {ICommandFile} command
   *
   * @returns {Boolean|Number}
   */
  cooldown(interaction: CommandInteraction | Message<boolean>, command: ICommandFile): boolean | number {
    if (!interaction || !command) return false;
    if (!command.cooldown || command.cooldown < 1) command.cooldown = 3;

    let { client, member } = interaction;
    if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = command.cooldown * 1000;

    if (timestamps.has(member?.user.id)) {
      const expirationTime = timestamps.get(member?.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return timeLeft;
      }

      timestamps.set(member?.user.id, now);
      setTimeout(() => timestamps.delete(member?.user.id), cooldownAmount);
      return false;
    }

    timestamps.set(member?.user.id, now);
    setTimeout(() => timestamps.delete(member?.user.id), cooldownAmount);
    return false;
  }

  /**
   * Set log status for console log
   *
   * @param {String} name
   * @param {Boolean} isLoaded
   * @param {String} type
   *
   * @returns {void}
   */
  logStatus(name: string, category: string, type: ELogStatus): void {
    let icon, text;

    switch (type) {
      case ELogStatus.SUCCESS:
        icon = this.config.emoji.success;
        text = "Loaded";
        break;
      case ELogStatus.LOADING:
        icon = this.config.emoji.loading;
        text = "Loading";
        break;
      case ELogStatus.ERROR:
        icon = this.config.emoji.error;
        text = "Error";
        break;
      default:
        icon = "";
        text = "";
        break;
    }

    print(`${category} : ${name} | Status: ${icon} ${text}`, EPrintType.INFO);
  }

  /**
   * Init chatbot
   *
   * @returns {Promise<void>}
   */
  async initChatbot(): Promise<void> {
    const { characterAI, isAIAuthenticated } = this.chatbot;
    const charConfig = config.chatbot;

    if (isAIAuthenticated || !charConfig.charId) return;

    try {
      if (charConfig.token) await characterAI.authenticateWithToken(charConfig.token);
      else await characterAI.authenticateAsGuest();

      this.chatbot.isPuppeteerInitialized = true;
      this.chatbot.AIChat = await characterAI.createOrContinueChat(charConfig.charId);
      this.chatbot.isAIAuthenticated = true;
    } catch (error: unknown) {
      CatchError.print(error);
    }
  }
}
