using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Shared;
using Shared.Models.Online.Settings;
using Shared.Models;
using System.Text.RegularExpressions;
using HtmlAgilityPack;
using Uaflix.Controllers;
using Shared.Engine;
using Uaflix.Models;
using System.Linq;
using Shared.Models.Templates;

namespace Uaflix
{
    public class UaflixInvoke
    {
        private OnlinesSettings _init;
        private HybridCache _hybridCache;
        private Action<string> _onLog;
        private ProxyManager _proxyManager;

        public UaflixInvoke(OnlinesSettings init, HybridCache hybridCache, Action<string> onLog, ProxyManager proxyManager)
        {
            _init = init;
            _hybridCache = hybridCache;
            _onLog = onLog;
            _proxyManager = proxyManager;
        }

        public async Task<List<Uaflix.Models.EpisodeLinkInfo>> Search(string imdb_id, long kinopoisk_id, string title, string original_title, int year, bool isfilm = false)
        {
            string memKey = $"UaFlix:search:{kinopoisk_id}:{imdb_id}";
            if (_hybridCache.TryGetValue(memKey, out List<Uaflix.Models.EpisodeLinkInfo> res))
                return res;

            try
            {
                string filmTitle = !string.IsNullOrEmpty(title) ? title : original_title;
                string searchUrl = $"{_init.host}/index.php?do=search&subaction=search&story={System.Web.HttpUtility.UrlEncode(filmTitle)}";
                var headers = new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", _init.host) };

                var searchHtml = await Http.Get(searchUrl, headers: headers, proxy: _proxyManager.Get());
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
                    filmUrl = filmNodes.FirstOrDefault()?.GetAttributeValue("href", "");

                if (!filmUrl.StartsWith("http"))
                    filmUrl = _init.host + filmUrl;

                if (isfilm)
                {
                    res = new List<Uaflix.Models.EpisodeLinkInfo>() { new Uaflix.Models.EpisodeLinkInfo() { url = filmUrl } };
                    _hybridCache.Set(memKey, res, cacheTime(20));
                    return res;
                }

                var filmHtml = await Http.Get(filmUrl, headers: headers, proxy: _proxyManager.Get());
                doc.LoadHtml(filmHtml);

                res = new List<Uaflix.Models.EpisodeLinkInfo>();
                var episodeNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'frels2')]//a[contains(@class, 'vi-img')]");
                if (episodeNodes != null)
                {
                    foreach (var episodeNode in episodeNodes.Reverse().ToList())
                    {
                        string episodeUrl = episodeNode.GetAttributeValue("href", "");
                        if (!episodeUrl.StartsWith("http"))
                            episodeUrl = _init.host + episodeUrl;
                        
                        var match = Regex.Match(episodeUrl, @"season-(\d+).*?episode-(\d+)");
                        if (match.Success)
                        {
                            res.Add(new Uaflix.Models.EpisodeLinkInfo
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
                         res.Add(new Uaflix.Models.EpisodeLinkInfo() { url = filmUrl, season = 1, episode = 1 });
                     }
                }

                if (res.Count > 0)
                    _hybridCache.Set(memKey, res, cacheTime(20));

                return res;
            }
            catch (Exception ex)
            {
                _onLog($"UaFlix search error: {ex.Message}");
            }
            return null;
        }

        public async Task<Uaflix.Models.PlayResult> ParseEpisode(string url)
        {
            var result = new Uaflix.Models.PlayResult() { streams = new List<(string, string)>() };
            try
            {
                string html = await Http.Get(url, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", _init.host) }, proxy: _proxyManager.Get());
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
                _onLog($"ParseEpisode error: {ex.Message}");
            }
            return result;
        }

        async Task<List<(string link, string quality)>> ParseAllZetvideoSources(string iframeUrl)
        {
            var result = new List<(string link, string quality)>();
            var html = await Http.Get(iframeUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://zetvideo.net/") }, proxy: _proxyManager.Get());
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
            var html = await Http.Get(iframeUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://ashdi.vip/") }, proxy: _proxyManager.Get());
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
            var html = await Http.Get($"https://ashdi.vip/vod/{id}", headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", "https://ashdi.vip/") }, proxy: _proxyManager.Get());
            string subtitle = new Regex("subtitle(\")?:\"([^\"]+)\"").Match(html).Groups[2].Value;
            if (!string.IsNullOrEmpty(subtitle))
            {
                var match = new Regex("\\[([^\\]]+)\\](https?://[^\\,]+)").Match(subtitle);
                var st = new Shared.Models.Templates.SubtitleTpl();
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
        public static TimeSpan cacheTime(int multiaccess, int home = 5, int mikrotik = 2, OnlinesSettings init = null, int rhub = -1)
        {
            if (init != null && init.rhub && rhub != -1)
                return TimeSpan.FromMinutes(rhub);

            int ctime = AppInit.conf.mikrotik ? mikrotik : AppInit.conf.multiaccess ? init != null && init.cache_time > 0 ? init.cache_time : multiaccess : home;
            if (ctime > multiaccess)
                ctime = multiaccess;

            return TimeSpan.FromMinutes(ctime);
        }
    }
}