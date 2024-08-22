import Cheerio from "cheerio";
import fetch from "isomorphic-fetch";

export type Entry = {
  id: number;
  name: string;
  artist: string;
  tags: string[];
};

export type SearchResult = {
  entries: Entry[];
  lastPage: number;
};

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0"
};

export default class DoujinStyleApi {
  async search(query?: string, page: number = 0): Promise<SearchResult> {
    const url = query
      ? `https://doujinstyle.com/?p=search&source=1&type=blanket${
          query ? `&result=${encodeURI(query)}` : ""
        }?page=${page}`
      : `https://doujinstyle.com/?p=home&page=${page}`;

    const result = await fetch(url, { headers }).then((x) => x.text());
    const $ = Cheerio.load(result);
    const rentries = $(".gridBox");
    const entries = [];
    rentries.each(function () {
      const llines = $(this).find("span.limitLine");
      const name = llines.eq(0).text();
      const artist = llines.eq(1).text();
      const tags = [];
      $(this)
        .find("span.limitLine > a")
        .each(function () {
          tags.push($(this).text());
        });
      const rid = $(this).find("a.gridColumn").attr("href");
      const id = parseInt(rid.match(/(\d+)$/)[0], 10);
      entries.push({ id, name, artist, tags });
    });

    const rlastPage = $(".pageScroll gap:last").text();
    const lastPage = parseInt(rlastPage.match(/(\d+)$/)[0], 10);

    return {
      entries,
      lastPage,
    };
  }

  async downloadUrl(id: number): Promise<string> {
    const url = "https://doujinstyle.com/";
    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
      redirect: "manual",
      body: `type=1&id=${id}&source=0&download_link=`,
    });

    const location = result.headers.get("Location");
    if (!location)
      throw new Error("No location in the headers.");
    return location; 
  }
}
