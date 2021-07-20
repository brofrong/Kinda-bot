import {PREFIX} from '../../constants';

export async function cleaner(client, channel, data) {
  const messages = await channel.messages.fetch();

  if (data.prefix) {
    const prefixMsg = messages.filter((msg) =>
      msg.content.startsWith(PREFIX)
    );
    prefixMsg.forEach((msg) => {
      if (msg.deletable) msg.delete();
    });
  }
  if (data.bot) {
    const botMsg = messages.filter((msg) => msg.author.id == client.user.id);
    botMsg.forEach((msg) => {
      if (msg.deletable) msg.delete();
    });
  }
}

