using Shared.Engine;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Web;
using System.Linq;
using System.Net.Http;
using HtmlAgilityPack;
using Shared;
using Shared.Models.Templates;
using Uaflix.Models;
using System.Text.RegularExpressions;
 
namespace Uaflix.Controllers
{
    public class Controller : BaseOnlineController
    {
        ProxyManager proxyManager = new ProxyManager(ModInit.UaFlix);
        static HttpClient httpClient = new HttpClient();

        [HttpGet]
        [Route("uaflix")]
        async public Task<ActionResult> Index(long id, string imdb_id, long kinopoisk_id, string title, string original_title, string original_language, int year, string source, int serial, string account_email, string t, int s = -1, bool rjson = false)
        {
            var init = ModInit.UaFlix;
            if (!init.enable)
                return Forbid();

            var proxy = proxyManager.Get();
            var result = await search(imdb_id, kinopoisk_id, title, original_title, year, serial);

            if (result == null)
            {
                proxyManager.Refresh();
                return Content("Uaflix", "text/html; charset=utf-8");
            }

            if (serial == 1)
            {
                var seasons = result.movie.GroupBy(e => e.season).ToDictionary(k => k.Key, v => v.ToList());
                OnLog($"Знайдено сезонів: {seasons.Count}");
                foreach (var season in seasons)
                {
                    OnLog($"Сезон {season.Key}: {season.Value.Count} епізодів");
                }

                if (s == -1)
                {
                    var season_tpl = new SeasonTpl(seasons.Count);
                    foreach (var season in seasons.OrderBy(i => i.Key))
                    {
                        string link = $"{host}/uaflix?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&serial=1&s={season.Key}";
                        season_tpl.Append(season.Key.ToString(), link, $"{season.Key}");
                    }

                    return rjson ? Content(season_tpl.ToJson(), "application/json; charset=utf-8") : Content(season_tpl.ToHtml(), "text/html; charset=utf-8");
                }

                var episodes = seasons.GetValueOrDefault(s, null);
                OnLog($"Вибраний сезон: {s}, кількість епізодів: {episodes?.Count ?? 0}");
                if (episodes == null)
                    return Content("Uaflix", "text/html; charset=utf-8");

                var movie_tpl = new MovieTpl(title, original_title, episodes.Count);

                foreach (var episode in episodes.OrderBy(e => e.episode))
                {
                    var streamquality = new StreamQualityTpl();
                    if (episode.links != null)
                    {
                        foreach (var item in episode.links)
                            streamquality.Append(HostStreamProxy(init, item.link), item.quality);
                    }

                    var firstStream = streamquality.Firts();
                    string videoLink = firstStream.link;

                    string episodeName = episode.translation ?? $"Серія {episode.episode}";
                    if (episode.translation?.StartsWith("Вийде:") == true)
                    {
                        episodeName = episode.translation;
                    }
                    
                    movie_tpl.Append(episodeName, videoLink, streamquality: streamquality, subtitles: episode.subtitles);
                }

                return rjson ? Content(movie_tpl.ToJson(), "application/json; charset=utf-8") : Content(movie_tpl.ToHtml(), "text/html; charset=utf-8");
            }
            
            if (result.movie != null)
            {
                var tpl = new MovieTpl(title, original_title, result.movie.Count);

                foreach (var movie in result.movie)
                {
                    var streamquality = new StreamQualityTpl();
                    foreach (var item in movie.links)
                        streamquality.Append(HostStreamProxy(ModInit.UaFlix, item.link), item.quality);
                    
                    var firstStream = streamquality.Firts();
                    if (string.IsNullOrEmpty(firstStream.link))
                        continue;

                    tpl.Append(
                        movie.translation,
                        firstStream.link,
                        streamquality: streamquality,
                        subtitles: movie.subtitles
                    );
                }

                return rjson
                    ? Content(tpl.ToJson(), "application/json; charset=utf-8")
                    : Content(tpl.ToHtml(), "text/html; charset=utf-8");
            }

            return Content("Uaflix", "text/html; charset=utf-8");
        }

        async ValueTask<Result> search(string imdb_id, long kinopoisk_id, string title, string original_title, int year, int serial)
        {
            string memKey = $"UaFlix:view:{kinopoisk_id}:{imdb_id}";
            if (!hybridCache.TryGetValue(memKey, out Result res))
            {
                try
                {
                    string filmTitle = !string.IsNullOrEmpty(title) ? title : original_title;
                    string searchUrl = $"https://uafix.net/index.php?do=search&subaction=search&story={HttpUtility.UrlEncode(filmTitle)}";

                    httpClient.DefaultRequestHeaders.Clear();
                    httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
                    httpClient.DefaultRequestHeaders.Add("Referer", "https://uafix.net/");

                    var searchHtml = await httpClient.GetStringAsync(searchUrl);
                    var doc = new HtmlDocument();
                    doc.LoadHtml(searchHtml);

                    string filmUrl = null;

                    if (serial == 1)
                    {
                        var filmNode = doc.DocumentNode.SelectSingleNode("//a[contains(@class, 'sres-wrap')]");
                        if (filmNode == null)
                        {
                            OnLog("filmNode is null");
                            return null;
                        }
                        filmUrl = filmNode.GetAttributeValue("href", "");
                    }
                    else
                    {
                        var filmNodes = doc.DocumentNode.SelectNodes("//a[contains(@class, 'sres-wrap')]");
                        if (filmNodes == null)
                        {
                            OnLog("No search results found");
                            return null;
                        }

                        // First try to find with year
                        string selectedFilmUrl = null;
                        HtmlNode selectedFilmNode = null;
                        foreach (var filmNode in filmNodes)
                        {
                            var h2Node = filmNode.SelectSingleNode(".//h2");
                            if (h2Node == null) continue;

                            string nodeTitle = h2Node.InnerText.Trim().ToLower();
                            if (!nodeTitle.Contains(filmTitle.ToLower())) continue;

                            var descNode = filmNode.SelectSingleNode(".//div[contains(@class, 'sres-desc')]");
                            string desc = (descNode?.InnerText ?? "") + " " + nodeTitle;
                            if (year > 0 && desc.Contains(year.ToString()))
                            {
                                selectedFilmUrl = filmNode.GetAttributeValue("href", "");
                                selectedFilmNode = filmNode;
                                OnLog($"Selected film URL with year in description: {selectedFilmUrl} for title '{filmTitle}' year {year}");
                                break;
                            }
                        }

                        // If no match with year in description, check year on film page or pick first title match
                        if (string.IsNullOrEmpty(selectedFilmUrl))
                        {
                            foreach (var filmNode in filmNodes)
                            {
                                var h2Node = filmNode.SelectSingleNode(".//h2");
                                if (h2Node == null) continue;

                                string nodeTitle = h2Node.InnerText.Trim().ToLower();
                                if (!nodeTitle.Contains(filmTitle.ToLower())) continue;

                                string href = filmNode.GetAttributeValue("href", "");
                                if (!href.StartsWith("http"))
                                    href = "https://uafix.net" + href;

                                // Get film page and check year
                                try
                                {
                                    var filmPageHtml = await httpClient.GetStringAsync(href);
                                    var filmDoc = new HtmlDocument();
                                    filmDoc.LoadHtml(filmPageHtml);

                                    var yearNode = filmDoc.DocumentNode.SelectSingleNode("//span[@itemprop='dateCreated' and @class='year']");
                                    int filmYear = 0;
                                    if (yearNode != null)
                                    {
                                        if (int.TryParse(yearNode.InnerText, out int parsedYear))
                                        {
                                            filmYear = parsedYear;
                                        }
                                    }

                                    if (year == 0 || filmYear == 0 || filmYear == year)
                                    {
                                        selectedFilmUrl = href;
                                        selectedFilmNode = filmNode;
                                        OnLog($"Selected film URL with year from page: {selectedFilmUrl} for title '{filmTitle}' year {year} (page year: {filmYear})");
                                        break;
                                    }
                                    else
                                    {
                                        OnLog($"Film year mismatch: requested {year}, page {filmYear}. Skipping film.");
                                    }
                                }
                                catch (Exception ex)
                                {
                                    OnLog($"Error fetching film page {href}: {ex.Message}. Trying next film.");
                                    // If error fetching page, try next film
                                    continue;
                                }
                            }

                            // If still no match, pick first title match
                            if (string.IsNullOrEmpty(selectedFilmUrl))
                            {
                                foreach (var filmNode in filmNodes)
                                {
                                    var h2Node = filmNode.SelectSingleNode(".//h2");
                                    if (h2Node == null) continue;

                                    string nodeTitle = h2Node.InnerText.Trim().ToLower();
                                    if (nodeTitle.Contains(filmTitle.ToLower()))
                                    {
                                        selectedFilmUrl = filmNode.GetAttributeValue("href", "");
                                        selectedFilmNode = filmNode;
                                        OnLog($"Selected first matching film URL: {selectedFilmUrl} for title '{filmTitle}' (no year match)");
                                        break;
                                    }
                                }
                            }
                        }

                        if (string.IsNullOrEmpty(selectedFilmUrl))
                        {
                            OnLog($"No matching film found for '{filmTitle}'");
                            return null;
                        }

                        filmUrl = selectedFilmUrl;
                    }

                    if (!filmUrl.StartsWith("http"))
                        filmUrl = "https://uafix.net" + filmUrl;

                    var filmHtml = await httpClient.GetStringAsync(filmUrl);
                    doc.LoadHtml(filmHtml);

                    var movies = new List<Movie>();

                    if (serial == 1)
                    {
                        var episodeNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'frels2')]//a[contains(@class, 'vi-img')]");
                        if (episodeNodes != null)
                        {
                            OnLog($"Знайдено {episodeNodes.Count} епізодів");
                            var uniqueEpisodes = new HashSet<string>();
                            foreach (var episodeNode in episodeNodes.Reverse())
                            {
                                string episodeUrl = episodeNode.GetAttributeValue("href", "");
                                if (!episodeUrl.StartsWith("http"))
                                    episodeUrl = "https://uafix.net" + episodeUrl;

                                if (uniqueEpisodes.Add(episodeUrl))
                                {
                                    string episodeTitle = episodeNode.SelectSingleNode(".//div[@class='vi-rate']")?.InnerText.Trim();
                                    
                                    var match = System.Text.RegularExpressions.Regex.Match(episodeUrl, @"season-(\d+).*?episode-(\d+)");
                                    if (match.Success && match.Groups.Count > 2)
                                    {
                                        if (int.TryParse(match.Groups[1].Value, out int seasonNumber) && int.TryParse(match.Groups[2].Value, out int episodeNumber))
                                        {
                                            var episodeMovies = await ParseEpisode(episodeUrl, filmTitle, episodeTitle, seasonNumber, episodeNumber);
                                            if (episodeMovies != null)
                                            {
                                                movies.AddRange(episodeMovies);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        var episodeMovies = await ParseEpisode(filmUrl, filmTitle, null, 1, 1);
                        if (episodeMovies != null)
                            movies.AddRange(episodeMovies);
                    }

                    if (movies.Count > 0)
                    {
                        res = new Result()
                        {
                            movie = movies
                        };
                        hybridCache.Set(memKey, res, cacheTime(5));
                        proxyManager.Success();
                    }
                }
                catch (Exception ex)
                {
                    OnLog($"UaFlix error: {ex.Message}");
                }
            }
            return res;
        }

        async Task<List<Movie>> ParseEpisode(string url, string filmTitle, string episodeTitle = null, int seasonNumber = 0, int episodeNumber = 0)
        {
            var movies = new List<Movie>();
            try
            {
                string html = await httpClient.GetStringAsync(url);
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                string cleanTranslation = episodeTitle ?? filmTitle;
                if (!string.IsNullOrEmpty(episodeTitle))
                {
                    cleanTranslation = Regex.Replace(episodeTitle, @"^\d+\s+", "").Trim();
                }

                var movie = new Movie()
                {
                    translation = cleanTranslation,
                    links = new List<(string, string)>(),
                    subtitles = null,
                    season = seasonNumber,
                    episode = episodeNumber
                };

                var iframe = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'video-box')]//iframe");
                if (iframe != null)
                {
                    string iframeUrl = iframe.GetAttributeValue("src", "");
                    if (!string.IsNullOrEmpty(iframeUrl))
                    {
                        if (iframeUrl.Contains("zetvideo.net"))
                        {
                            movie.links = await ParseAllZetvideoSources(iframeUrl);
                        }
                        else if (iframeUrl.Contains("ashdi.vip"))
                        {
                            movie.links = await ParseAllAshdiSources(iframeUrl);
                            string? ashdiId = null;
                            var idMatch = Regex.Match(iframeUrl, @"_(\d+)");
                            if (idMatch.Success)
                                ashdiId = idMatch.Groups[1].Value;
                            else
                            {
                                idMatch = Regex.Match(iframeUrl, @"vod/(\d+)");
                                if (idMatch.Success)
                                    ashdiId = idMatch.Groups[1].Value;
                            }

                            if (!string.IsNullOrEmpty(ashdiId))
                                movie.subtitles = await GetAshdiSubtitles(ashdiId);
                        }
                    }
                }
                
                if (movie.links.Count == 0)
                {
                    var soonNode = doc.DocumentNode.SelectSingleNode("//div[@class='soon-day']");
                    if (soonNode != null)
                    {
                        movie.translation = $"Вийде: {soonNode.InnerText.Trim()}";
                    }
                }

                movies.Add(movie);
            }
            catch (Exception ex)
            {
                OnLog($"ParseEpisode error: {ex.Message}");
            }
            return movies;
        }

        async Task<List<(string link, string quality)>> ParseAllZetvideoSources(string iframeUrl)
        {
            var result = new List<(string link, string quality)>();
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, iframeUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0");
                var response = await httpClient.SendAsync(request);
                var html = await response.Content.ReadAsStringAsync();
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                var sourceNodes = doc.DocumentNode.SelectNodes("//source[contains(@src, '.m3u8')]");
                if (sourceNodes != null)
                {
                    foreach (var node in sourceNodes)
                    {
                        var url = node.GetAttributeValue("src", null);
                        var label = node.GetAttributeValue("label", null) ?? node.GetAttributeValue("res", null) ?? "1080p";
                        if (!string.IsNullOrEmpty(url))
                            result.Add((url, label));
                    }
                }

                if (result.Count == 0)
                {
                    var scriptNodes = doc.DocumentNode.SelectNodes("//script");
                    if (scriptNodes != null)
                    {
                        foreach (var script in scriptNodes)
                        {
                            var text = script.InnerText;
                            var urls = Regex.Matches(text, @"https?:\/\/[^\s'""]+\.m3u8")
                                .Cast<Match>()
                                .Select(m => m.Value)
                                .Distinct();
                            foreach (var url in urls)
                                result.Add((url, "1080p"));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                OnLog($"Zetvideo parse error: {ex.Message}");
            }
            return result;
        }

        async Task<List<(string link, string quality)>> ParseAllAshdiSources(string iframeUrl)
        {
            var result = new List<(string link, string quality)>();
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, iframeUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0");
                request.Headers.Add("Referer", "https://ashdi.vip/");
                var response = await httpClient.SendAsync(request);
                var html = await response.Content.ReadAsStringAsync();
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                var sourceNodes = doc.DocumentNode.SelectNodes("//source[contains(@src, '.m3u8')]");
                if (sourceNodes != null)
                {
                    foreach (var node in sourceNodes)
                    {
                        var url = node.GetAttributeValue("src", null);
                        var label = node.GetAttributeValue("label", null) ?? node.GetAttributeValue("res", null) ?? "1080p";
                        if (!string.IsNullOrEmpty(url))
                            result.Add((url, label));
                    }
                }

                if (result.Count == 0)
                {
                    var scriptNodes = doc.DocumentNode.SelectNodes("//script");
                    if (scriptNodes != null)
                    {
                        foreach (var script in scriptNodes)
                        {
                            var text = script.InnerText;
                            var urls = Regex.Matches(text, @"https?:\/\/[^\s'""]+\.m3u8")
                                .Cast<Match>()
                                .Select(m => m.Value)
                                .Distinct();
                            foreach (var url in urls)
                                result.Add((url, "1080p"));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                OnLog($"Ashdi parse error: {ex.Message}");
            }
            return result;
        }

        async Task<SubtitleTpl?> GetAshdiSubtitles(string id)
        {
            try
            {
                string url = $"https://ashdi.vip/vod/{id}";
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
                httpClient.DefaultRequestHeaders.Add("Referer", "https://ashdi.vip/");
                var html = await httpClient.GetStringAsync(url);

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
            }
            catch (Exception ex)
            {
                OnLog("Ashdi subtitle parse error: " + ex.Message);
            }
            return null;
        }

        public class Movie
        {
            public string translation { get; set; }
            public List<(string link, string quality)> links { get; set; }
            public SubtitleTpl? subtitles { get; set; }
            public int season { get; set; }
            public int episode { get; set; }
        }

        public class Result
        {
            public List<Movie> movie { get; set; }
        }
    }
}
