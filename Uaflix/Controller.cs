using Shared.Engine;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Web;
using System.Linq;
using HtmlAgilityPack;
using Shared;
using Shared.Models.Templates;
using System.Text.RegularExpressions;
using Shared.Models.Online.Settings;
using Shared.Models;

namespace Uaflix.Controllers
{
    #region Models
    public class EpisodeLinkInfo
    {
        public string url { get; set; }
        public string title { get; set; }
        public int season { get; set; }
        public int episode { get; set; }
    }

    public class PlayResult
    {
        public string ashdi_url { get; set; }
        public List<(string link, string quality)> streams { get; set; }
        public SubtitleTpl? subtitles { get; set; }
    }
    #endregion

    public class Controller : BaseOnlineController
    {
        ProxyManager proxyManager;

        public Controller()
        {
            proxyManager = new ProxyManager(ModInit.UaFlix);
        }
        
        [HttpGet]
        [Route("uaflix")]
        async public Task<ActionResult> Index(long id, string imdb_id, long kinopoisk_id, string title, string original_title, string original_language, int year, string source, int serial, string account_email, string t, int s = -1, int e = -1, bool play = false, bool rjson = false)
        {
            var init = await loadKit(ModInit.UaFlix);
            if (!init.enable)
                return Forbid();

            var episodesInfo = await search(init, imdb_id, kinopoisk_id, title, original_title, year, serial == 0);
            if (episodesInfo == null)
                return Content("Uaflix", "text/html; charset=utf-8");

            if (play)
            {
                var episode = episodesInfo.FirstOrDefault(ep => ep.season == s && ep.episode == e);
                if (serial == 0) // для фильма берем первый
                    episode = episodesInfo.FirstOrDefault();

                if (episode == null)
                    return Content("Uaflix", "text/html; charset=utf-8");
                
                var playResult = await ParseEpisode(init, episode.url);
                
                if (!string.IsNullOrEmpty(playResult.ashdi_url))
                {
                    string ashdi_kp = Regex.Match(playResult.ashdi_url, "/serial/([0-9]+)").Groups[1].Value;
                    if (!string.IsNullOrEmpty(ashdi_kp))
                        return Redirect($"/ashdi?kinopoisk_id={ashdi_kp}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&s={s}&e={e}");
                }

                if (playResult.streams != null && playResult.streams.Count > 0)
                    return Redirect(HostStreamProxy(init, playResult.streams.First().link));
                
                return Content("Uaflix", "text/html; charset=utf-8");
            }

            if (serial == 1)
            {
                if (s == -1) // Выбор сезона
                {
                    var seasons = episodesInfo.GroupBy(ep => ep.season).ToDictionary(k => k.Key, v => v.ToList());
                    var season_tpl = new SeasonTpl(seasons.Count);
                    foreach (var season in seasons.OrderBy(i => i.Key))
                    {
                        string link = $"{host}/uaflix?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&serial=1&s={season.Key}";
                        season_tpl.Append($"Сезон {season.Key}", link, $"{season.Key}");
                    }
                    return rjson ? Content(season_tpl.ToJson(), "application/json; charset=utf-8") : Content(season_tpl.ToHtml(), "text/html; charset=utf-8");
                }
                
                // Выбор эпизода
                var episodes = episodesInfo.Where(ep => ep.season == s).OrderBy(ep => ep.episode).ToList();
                var movie_tpl = new MovieTpl(title, original_title, episodes.Count);
                foreach(var ep in episodes)
                {
                    string link = $"{host}/uaflix?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&serial=1&s={s}&e={ep.episode}&play=true";
                    movie_tpl.Append(ep.title, link);
                }
                return rjson ? Content(movie_tpl.ToJson(), "application/json; charset=utf-8") : Content(movie_tpl.ToHtml(), "text/html; charset=utf-8");
            }
            else // Фильм
            {
                string link = $"{host}/uaflix?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&play=true";
                var tpl = new MovieTpl(title, original_title, 1);
                tpl.Append(title, link);
                return rjson ? Content(tpl.ToJson(), "application/json; charset=utf-8") : Content(tpl.ToHtml(), "text/html; charset=utf-8");
            }
        }

        async ValueTask<List<EpisodeLinkInfo>> search(OnlinesSettings init, string imdb_id, long kinopoisk_id, string title, string original_title, int year, bool isfilm = false)
        {
            string memKey = $"UaFlix:search:{kinopoisk_id}:{imdb_id}";
            if (hybridCache.TryGetValue(memKey, out List<EpisodeLinkInfo> res))
                return res;

            try
            {
                string filmTitle = !string.IsNullOrEmpty(title) ? title : original_title;
                string searchUrl = $"{init.host}/index.php?do=search&subaction=search&story={HttpUtility.UrlEncode(filmTitle)}";
                var headers = new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", init.host) };

                var searchHtml = await Http.Get(searchUrl, headers: headers);
                var doc = new HtmlDocument();
                doc.LoadHtml(searchHtml);

                var filmNodes = doc.DocumentNode.SelectNodes("//a[contains(@class, 'sres-wrap')]");
                if (filmNodes == null) return null;

                string filmUrl = null;
                foreach (var filmNode in filmNodes)
                {
                    var h2Node = filmNode.SelectSingleNode(".//h2");
                    if (h2Node == null || !h2Node.InnerText.Trim().ToLower().Contains(filmTitle.ToLower())) continue;
                    
                    var descNode = filmNode.SelectSingleNode(".//div[contains(@class, 'sres-desc')]");
                    if (year > 0 && (descNode?.InnerText ?? "").Contains(year.ToString()))
                    {
                        filmUrl = filmNode.GetAttributeValue("href", "");
                        break;
                    }
                }

                if (filmUrl == null)
                    filmUrl = filmNodes.First().GetAttributeValue("href", "");

                if (!filmUrl.StartsWith("http"))
                    filmUrl = init.host + filmUrl;

                if (isfilm)
                {
                    res = new List<EpisodeLinkInfo>() { new EpisodeLinkInfo() { url = filmUrl } };
                    hybridCache.Set(memKey, res, cacheTime(20));
                    return res;
                }

                var filmHtml = await Http.Get(filmUrl, headers: headers);
                doc.LoadHtml(filmHtml);

                res = new List<EpisodeLinkInfo>();
                var episodeNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'frels2')]//a[contains(@class, 'vi-img')]");
                if (episodeNodes != null)
                {
                    foreach (var episodeNode in episodeNodes.Reverse())
                    {
                        string episodeUrl = episodeNode.GetAttributeValue("href", "");
                        if (!episodeUrl.StartsWith("http"))
                            episodeUrl = init.host + episodeUrl;
                        
                        var match = Regex.Match(episodeUrl, @"season-(\d+).*?episode-(\d+)");
                        if (match.Success)
                        {
                            res.Add(new EpisodeLinkInfo
                            {
                                url = episodeUrl,
                                title = episodeNode.SelectSingleNode(".//div[@class='vi-rate']")?.InnerText.Trim() ?? $"Епізод {match.Groups[2].Value}",
                                season = int.Parse(match.Groups[1].Value),
                                episode = int.Parse(match.Groups[2].Value)
                            });
                        }
                    }
                }
                
                if (res.Count == 0) 
                {
                     var iframe = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'video-box')]//iframe[contains(@src, 'ashdi.vip/serial/')]");
                     if (iframe != null)
                     {
                         res.Add(new EpisodeLinkInfo() { url = filmUrl, season = 1, episode = 1 });
                     }
                }

                if (res.Count > 0)
                    hybridCache.Set(memKey, res, cacheTime(20));

                return res;
            }
            catch (Exception ex)
            {
                OnLog($"UaFlix search error: {ex.Message}");
            }
            return null;
        }

        async Task<PlayResult> ParseEpisode(OnlinesSettings init, string url)
        {
            var result = new PlayResult() { streams = new List<(string, string)>() };
            try
            {
                string html = await Http.Get(url, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", init.host) });
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                var iframe = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'video-box')]//iframe");
                if (iframe != null)
                {
                    string iframeUrl = iframe.GetAttributeValue("src", "").Replace("&", "&");
                    if (iframeUrl.StartsWith("//"))
                        iframeUrl = "https:" + iframeUrl;

                    if (iframeUrl.Contains("ashdi.vip/serial/"))
                    {
                        result.ashdi_url = iframeUrl;
                        return result;
                    }
                    
                    if (iframeUrl.Contains("zetvideo.net"))
                        result.streams = await ParseAllZetvideoSources(iframeUrl);
                    else if (iframeUrl.Contains("ashdi.vip"))
                    {
                        result.streams = await ParseAllAshdiSources(iframeUrl);
                        var idMatch = Regex.Match(iframeUrl, @"_(\d+)|vod/(\d+)");
                        if (idMatch.Success)
                        {
                            string ashdiId = idMatch.Groups[1].Success ? idMatch.Groups[1].Value : idMatch.Groups[2].Value;
                            result.subtitles = await GetAshdiSubtitles(ashdiId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                OnLog($"ParseEpisode error: {ex.Message}");
            }
            return result;
        }

        #region Parsers
        async Task<List<(string link, string quality)>> ParseAllZetvideoSources(string iframeUrl)
        {
            var result = new List<(string link, string quality)>();
            var html = await Http.Get(iframeUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://zetvideo.net/") });
            if (string.IsNullOrEmpty(html)) return result;

            var doc = new HtmlDocument();
            doc.LoadHtml(html);
            
            var script = doc.DocumentNode.SelectSingleNode("//script[contains(text(), 'file:')]");
            if (script != null)
            {
                var match = Regex.Match(script.InnerText, @"file:\s*""([^""]+\.m3u8)");
                if (match.Success)
                {
                    result.Add((match.Groups[1].Value, "1080p"));
                    return result;
                }
            }

            var sourceNodes = doc.DocumentNode.SelectNodes("//source[contains(@src, '.m3u8')]");
            if (sourceNodes != null)
            {
                foreach (var node in sourceNodes)
                {
                    result.Add((node.GetAttributeValue("src", null), node.GetAttributeValue("label", null) ?? node.GetAttributeValue("res", null) ?? "1080p"));
                }
            }
            return result;
        }

        async Task<List<(string link, string quality)>> ParseAllAshdiSources(string iframeUrl)
        {
            var result = new List<(string link, string quality)>();
            var html = await Http.Get(iframeUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://ashdi.vip/") });
             if (string.IsNullOrEmpty(html)) return result;
             
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var sourceNodes = doc.DocumentNode.SelectNodes("//source[contains(@src, '.m3u8')]");
            if (sourceNodes != null)
            {
                foreach (var node in sourceNodes)
                {
                    result.Add((node.GetAttributeValue("src", null), node.GetAttributeValue("label", null) ?? node.GetAttributeValue("res", null) ?? "1080p"));
                }
            }
            return result;
        }

        async Task<SubtitleTpl?> GetAshdiSubtitles(string id)
        {
            var html = await Http.Get($"https://ashdi.vip/vod/{id}", headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://ashdi.vip/") });
            string subtitle = new Regex("subtitle(\")?:\"([^\"]+)\"").Match(html).Groups[2].Value;
            if (!string.IsNullOrEmpty(subtitle))
            {
                var match = new Regex("\\[([^\\]]+)\\](https?://[^\\,]+)").Match(subtitle);
                var st = new SubtitleTpl();
                while (match.Success)
                {
                    st.Append(match.Groups[1].Value, match.Groups[2].Value);
                    match = match.NextMatch();
                }
                if (!st.IsEmpty())
                    return st;
            }
            return null;
        }
        #endregion
    }
}
