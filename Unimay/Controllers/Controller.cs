using Shared.Engine;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json.Linq;
using Shared.Models.Templates;
using Shared.Models.Online.Settings;
using Shared;

namespace Unimay.Controllers
{
    public class Controller : BaseOnlineController
    {
        ProxyManager proxyManager;

        public Controller()
        {
            proxyManager = new ProxyManager(ModInit.Unimay);
        }

        [HttpGet]
        [Route("unimay")]
        async public ValueTask<ActionResult> Index(string title, string original_title, string code, int serial = -1, int s = -1, int e = -1, bool play = false, bool rjson = false)
        {
            var init = await loadKit(ModInit.Unimay);
            if (await IsBadInitialization(init, rch: false))
                return badInitMsg;

            var proxy = proxyManager.Get();

            if (!string.IsNullOrEmpty(code))
            {
                // Fetch release details
                return await Release(init, proxy, code, title, original_title, serial, s, e, play, rjson);
            }
            else
            {
                // Search
                return await Search(init, proxy, title, original_title, serial, rjson);
            }
        }

        async ValueTask<ActionResult> Search(OnlinesSettings init, System.Net.WebProxy proxy, string title, string original_title, int serial, bool rjson)
        {
            string memKey = $"unimay:search:{title}:{original_title}:{serial}";

            return await InvkSemaphore(init, memKey, async () =>
            {
                if (!hybridCache.TryGetValue(memKey, out JArray searchResults))
                {
                    string searchQuery = HttpUtility.UrlEncode(title ?? original_title ?? "");
                    string searchUrl = $"{init.host}/release/search?page=0&page_size=10&title={searchQuery}";

                    var headers = httpHeaders(init);
                    JObject root = await Http.Get<JObject>(searchUrl, timeoutSeconds: 8, proxy: proxy, headers: headers);

                    if (root == null || !root.ContainsKey("content") || ((JArray)root["content"]).Count == 0)
                    {
                        proxyManager.Refresh();
                        return OnError("search failed");
                    }

                    searchResults = (JArray)root["content"];
                    hybridCache.Set(memKey, searchResults, cacheTime(30, init: init));
                }

                if (searchResults == null || searchResults.Count == 0)
                    return OnError("no results");

                var stpl = new SimilarTpl(searchResults.Count);

                foreach (JObject item in searchResults)
                {
                    string itemCode = item.Value<string>("code");
                    string itemTitle = item["names"]?["ukr"]?.Value<string>() ?? item.Value<string>("title");
                    string itemYear = item.Value<string>("year");
                    string itemType = item.Value<string>("type"); // "Телесеріал" or "Фільм"

                    // Filter by serial if specified (0: movie "Фільм", 1: serial "Телесеріал")
                    if (serial != -1)
                    {
                        bool isMovie = itemType == "Фільм";
                        if ((serial == 0 && !isMovie) || (serial == 1 && isMovie))
                            continue;
                    }

                    string releaseUrl = $"{host}/unimay?code={itemCode}&title={HttpUtility.UrlEncode(itemTitle)}&original_title={HttpUtility.UrlEncode(original_title ?? "")}&serial={serial}";
                    stpl.Append(itemTitle, itemYear, itemType, releaseUrl);
                }

                return ContentTo(rjson ? stpl.ToJson() : stpl.ToHtml());
            });
        }

        async ValueTask<ActionResult> Release(OnlinesSettings init, System.Net.WebProxy proxy, string code, string title, string original_title, int serial, int s, int e, bool play, bool rjson)
        {
            string memKey = $"unimay:release:{code}";

            return await InvkSemaphore(init, memKey, async () =>
            {
                if (!hybridCache.TryGetValue(memKey, out JObject releaseDetail))
                {
                    string releaseUrl = $"{init.host}/release?code={code}";

                    var headers = httpHeaders(init);
                    JObject root = await Http.Get<JObject>(releaseUrl, timeoutSeconds: 8, proxy: proxy, headers: headers);

                    if (root == null)
                    {
                        proxyManager.Refresh();
                        return OnError("release failed");
                    }

                    releaseDetail = root;
                    hybridCache.Set(memKey, releaseDetail, cacheTime(60, init: init));
                }

                if (releaseDetail == null)
                    return OnError("no release detail");

                string itemType = releaseDetail.Value<string>("type");
                JArray playlist = (JArray)releaseDetail["playlist"];

                if (playlist == null || playlist.Count == 0)
                    return OnError("no playlist");

                if (play)
                {
                    // Get specific episode
                    JObject episode = null;
                    if (itemType == "Телесеріал")
                    {
                        if (s <= 0 || e <= 0) return OnError("invalid episode");
                        episode = playlist.FirstOrDefault(ep => (int?)ep["number"] == e) as JObject;
                    }
                    else // Movie
                    {
                        episode = playlist[0] as JObject;
                    }

                    if (episode == null)
                        return OnError("episode not found");

                    string masterUrl = episode["hls"]?["master"]?.Value<string>();
                    if (string.IsNullOrEmpty(masterUrl))
                        return OnError("no stream");

                    return Redirect(HostStreamProxy(init, masterUrl, proxy: proxy));
                }

                if (itemType == "Фільм")
                {
                    JObject movieEpisode = playlist[0] as JObject;
                    string movieLink = $"{host}/unimay?code={code}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&serial=0&play=true";
                    var mtpl = new MovieTpl(title, original_title, 1);
                    mtpl.Append(movieEpisode["title"]?.Value<string>() ?? title, movieLink);
                    return ContentTo(rjson ? mtpl.ToJson() : mtpl.ToHtml());
                }
                else if (itemType == "Телесеріал")
                {
                    if (s == -1)
                    {
                        // Assume single season
                        var stpl = new SeasonTpl();
                        stpl.Append("Сезон 1", $"{host}/unimay?code={code}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&serial=1&s=1", "1");
                        return ContentTo(rjson ? stpl.ToJson() : stpl.ToHtml());
                    }
                    else
                    {
                        // Episodes for season 1
                        var episodes = new List<JObject>();
                        foreach (JObject ep in playlist)
                        {
                            int epNum = (int)ep["number"];
                            if (epNum >= 1 && epNum <= 24) // Assume season 1
                                episodes.Add(ep);
                        }

                        var mtpl = new MovieTpl(title, original_title, episodes.Count);
                        foreach (JObject ep in episodes.OrderBy(ep => (int)ep["number"]))
                        {
                            int epNum = (int)ep["number"];
                            string epTitle = ep["title"]?.Value<string>() ?? $"Епізод {epNum}";
                            string epLink = $"{host}/unimay?code={code}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&serial=1&s=1&e={epNum}&play=true";
                            mtpl.Append(epTitle, epLink);
                        }
                        return ContentTo(rjson ? mtpl.ToJson() : mtpl.ToHtml());
                    }
                }

                return OnError("unsupported type");
            });
        }
    }
}