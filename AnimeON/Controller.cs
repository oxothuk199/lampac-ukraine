using System.Text.Json;
using Shared.Engine;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Web;
using System.Linq;
using Shared;
using Shared.Models.Templates;
using AnimeON.Models;
using System.Text.RegularExpressions;
using Shared.Models.Online.Settings;
using Shared.Models;
using HtmlAgilityPack;

namespace AnimeON.Controllers
{
    public class Controller : BaseOnlineController
    {
        ProxyManager proxyManager;

        public Controller()
        {
            proxyManager = new ProxyManager(ModInit.AnimeON);
        }
        
        [HttpGet]
        [Route("animeon")]
        async public Task<ActionResult> Index(long id, string imdb_id, long kinopoisk_id, string title, string original_title, string original_language, int year, string source, int serial, string account_email, string t, int s = -1, bool rjson = false)
        {
            var init = await loadKit(ModInit.AnimeON);
            if (!init.enable)
                return Forbid();

            var seasons = await search(init, imdb_id, kinopoisk_id, title, original_title, year);
            if (seasons == null || seasons.Count == 0)
                return Content("AnimeON", "text/html; charset=utf-8");

            var allOptions = new List<(SearchModel season, FundubModel fundub, Player player)>();
            foreach (var season in seasons)
            {
                var fundubs = await GetFundubs(init, season.Id);
                if (fundubs != null)
                {
                    foreach (var fundub in fundubs)
                    {
                        foreach (var player in fundub.Player)
                        {
                            allOptions.Add((season, fundub, player));
                        }
                    }
                }
            }

            if (allOptions.Count == 0)
                return Content("AnimeON", "text/html; charset=utf-8");

            if (serial == 1)
            {
                if (s == -1) // Выбор сезона/озвучки
                {
                    var season_tpl = new SeasonTpl(allOptions.Count);
                    for (int i = 0; i < allOptions.Count; i++)
                    {
                        var item = allOptions[i];
                        string translationName = $"[{item.player.Name}|S{item.season.Season}] {item.fundub.Fundub.Name}";
                        string link = $"{host}/animeon?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&serial=1&s={i}";
                        season_tpl.Append(translationName, link, $"{i}");
                    }
                    return rjson ? Content(season_tpl.ToJson(), "application/json; charset=utf-8") : Content(season_tpl.ToHtml(), "text/html; charset=utf-8");
                }
                else // Вывод эпизодов
                {
                    if (s >= allOptions.Count)
                        return Content("AnimeON", "text/html; charset=utf-8");

                    var selected = allOptions[s];
                    var episodesData = await GetEpisodes(init, selected.season.Id, selected.player.Id, selected.fundub.Fundub.Id);
                    if (episodesData == null || episodesData.Episodes == null)
                        return Content("AnimeON", "text/html; charset=utf-8");

                    var movie_tpl = new MovieTpl(title, original_title, episodesData.Episodes.Count);
                    foreach (var ep in episodesData.Episodes.OrderBy(e => e.EpisodeNum))
                    {
                        var streamquality = new StreamQualityTpl();
                        string streamLink = !string.IsNullOrEmpty(ep.Hls) ? ep.Hls : ep.VideoUrl;
                        streamquality.Append(HostStreamProxy(init, streamLink), "hls");
                        movie_tpl.Append(string.IsNullOrEmpty(ep.Name) ? $"Серія {ep.EpisodeNum}" : ep.Name, streamquality.Firts().link, streamquality: streamquality);
                    }
                    return rjson ? Content(movie_tpl.ToJson(), "application/json; charset=utf-8") : Content(movie_tpl.ToHtml(), "text/html; charset=utf-8");
                }
            }
            else // Фильм
            {
                 var tpl = new MovieTpl(title, original_title, allOptions.Count);
                 foreach (var item in allOptions)
                 {
                     var episodesData = await GetEpisodes(init, item.season.Id, item.player.Id, item.fundub.Fundub.Id);
                     if (episodesData == null || episodesData.Episodes == null || episodesData.Episodes.Count == 0)
                         continue;
                    
                     string translationName = $"[{item.player.Name}] {item.fundub.Fundub.Name}";
                     var streamquality = new StreamQualityTpl();
                     var firstEp = episodesData.Episodes.First();
                     string streamLink = !string.IsNullOrEmpty(firstEp.Hls) ? firstEp.Hls : firstEp.VideoUrl;
                     streamquality.Append(HostStreamProxy(init, streamLink), "hls");
                     tpl.Append(translationName, streamquality.Firts().link, streamquality: streamquality);
                 }
                 return rjson ? Content(tpl.ToJson(), "application/json; charset=utf-8") : Content(tpl.ToHtml(), "text/html; charset=utf-8");
            }
        }

        async Task<List<FundubModel>> GetFundubs(OnlinesSettings init, int animeId)
        {
            string fundubsUrl = $"{init.host}/api/player/fundubs/{animeId}";
            string fundubsJson = await Http.Get(fundubsUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", init.host) });
            if (string.IsNullOrEmpty(fundubsJson))
                return null;

            var fundubsResponse = JsonSerializer.Deserialize<FundubsResponseModel>(fundubsJson);
            return fundubsResponse?.FunDubs;
        }

        async Task<EpisodeModel> GetEpisodes(OnlinesSettings init, int animeId, int playerId, int fundubId)
        {
            string episodesUrl = $"{init.host}/api/player/episodes/{animeId}?take=100&skip=-1&playerId={playerId}&fundubId={fundubId}";
            string episodesJson = await Http.Get(episodesUrl, headers: new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", init.host) });
            if (string.IsNullOrEmpty(episodesJson))
                return null;

            return JsonSerializer.Deserialize<EpisodeModel>(episodesJson);
        }

        async ValueTask<List<SearchModel>> search(OnlinesSettings init, string imdb_id, long kinopoisk_id, string title, string original_title, int year)
        {
            string memKey = $"AnimeON:search:{kinopoisk_id}:{imdb_id}";
            if (hybridCache.TryGetValue(memKey, out List<SearchModel> res))
                return res;

            try
            {
                var headers = new List<HeadersModel>() { new HeadersModel("User-Agent", "Mozilla/5.0"), new HeadersModel("Referer", init.host) };
                
                async Task<List<SearchModel>> FindAnime(string query)
                {
                    if (string.IsNullOrEmpty(query))
                        return null;

                    string searchUrl = $"{init.host}/api/anime/search?text={HttpUtility.UrlEncode(query)}";
                    string searchJson = await Http.Get(searchUrl, headers: headers);
                    if (string.IsNullOrEmpty(searchJson))
                        return null;

                    var searchResponse = JsonSerializer.Deserialize<SearchResponseModel>(searchJson);
                    return searchResponse?.Result;
                }

                var searchResults = await FindAnime(title) ?? await FindAnime(original_title);
                if (searchResults == null)
                    return null;
                
                if (!string.IsNullOrEmpty(imdb_id))
                {
                    var seasons = searchResults.Where(a => a.ImdbId == imdb_id).ToList();
                    if (seasons.Count > 0)
                    {
                        hybridCache.Set(memKey, seasons, cacheTime(5));
                        return seasons;
                    }
                }
                
                // Fallback to first result if no imdb match
                var firstResult = searchResults.FirstOrDefault();
                if (firstResult != null)
                {
                    var list = new List<SearchModel> { firstResult };
                    hybridCache.Set(memKey, list, cacheTime(5));
                    return list;
                }

                return null;
            }
            catch (Exception ex)
            {
                OnLog($"AnimeON error: {ex.Message}");
            }
            
            return null;
        }
    }
}
