import axios from "axios";
import moment from "moment";
import bluebird from "bluebird";
import "moment/locale/pt-br";
import TelegramBot from "node-telegram-bot-api";
import { pokemonList } from "./pokemon-list";
const TOKEN = process.env.TELEGRAM_TOKEN!;
const options = {
  webHook: {
    port: parseInt(process.env.PORT!),
  },
};
const url = process.env.APP_URL!;
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${url}/bot${TOKEN}`);

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  doSearch(chatId);
  bot.sendMessage(chatId, `Aguarde um instante ${msg.from!.first_name}...`);
});

const doSearch = async (chatId: number) => {
  try {
    const resp = await axios({
      method: "GET",
      url: "https://nycpokemap.com/query2.php",
      params: {
        mons: allMons().join(","),
        minIV: 100,
        time: new Date().getTime(),
        since: 0,
      },
      headers: {
        referer: "https://nycpokemap.com/",
      },
    });
    console.log(resp.data);
    const pokeResults: PokemonResult[] = resp.data.pokemons;
    const messages: string[] = [];
    pokeResults.forEach((i) => {
      const msg = `${
        pokemonList.find((j) => j.id === parseInt(i.pokemon_id))!.name.english
      } encontrado com 100 IV, ${i.cp} CP e level ${
        i.level
      }! Sumirá em aproximadamente ${moment(parseInt(i.despawn) * 1000).fromNow(
        true
      )}`;
      messages.push(msg);
      messages.push(`${i.lat},${i.lng}`);
    });
    bluebird.mapSeries(messages, (m) => {
      return bot.sendMessage(chatId, m);
    });
  } catch (error) {
    console.error(error);
  }
};

const allMons = (): string[] => {
  const all = [];
  for (let i = 1; i < 722; i++) {
    all.push(i.toString());
  }
  return all;
};

interface PokemonResult {
  pokemon_id: string;
  lat: string;
  lng: string;
  despawn: string;
  disguise: string;
  attack: string;
  defence: string;
  stamina: string;
  move1: string;
  move2: string;
  costume: string;
  gender: string;
  shiny: string;
  form: string;
  cp: string;
  level: string;
  weather: string;
}
